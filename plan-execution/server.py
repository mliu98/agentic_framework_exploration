import asyncio
import json
import queue
import threading
import uuid
from typing import Optional

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, JSONResponse
from pydantic import BaseModel

load_dotenv()

from agent import app as email_agent  # noqa: E402 – must load env before importing agent

# ---------------------------------------------------------------------------
# In-memory store: thread_id -> {"initial_state": ..., "pending_resume": ...}
# ---------------------------------------------------------------------------
thread_store: dict = {}

server = FastAPI(title="Email Agent API")

server.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Pydantic models
# ---------------------------------------------------------------------------
class EmailRequest(BaseModel):
    email_content: str
    sender_email: str
    email_id: Optional[str] = None


class ReviewDecision(BaseModel):
    approved: bool
    edited_response: Optional[str] = None


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def make_serializable(obj):
    """Recursively convert LangGraph / LangChain objects to JSON-safe types."""
    if obj is None or isinstance(obj, (str, int, float, bool)):
        return obj
    if isinstance(obj, dict):
        return {k: make_serializable(v) for k, v in obj.items()}
    if isinstance(obj, (list, tuple)):
        return [make_serializable(i) for i in obj]
    # LangChain message objects expose .content
    if hasattr(obj, "content") and hasattr(obj, "type"):
        return {"role": obj.type, "content": obj.content}
    if hasattr(obj, "__dict__"):
        return make_serializable(vars(obj))
    return str(obj)


def _run_stream(input_data, config, result_queue: queue.Queue):
    """Blocking graph stream executed in a background thread."""
    try:
        for chunk in email_agent.stream(input_data, config, stream_mode="updates"):
            result_queue.put(("chunk", chunk))
        result_queue.put(("done", None))
    except Exception as exc:
        result_queue.put(("error", str(exc)))


async def _sse_generator(input_data, config):
    """Async generator that converts queued graph events to SSE strings."""
    q: queue.Queue = queue.Queue()
    t = threading.Thread(target=_run_stream, args=(input_data, config, q), daemon=True)
    t.start()

    loop = asyncio.get_event_loop()

    while True:
        try:
            event_type, data = await loop.run_in_executor(None, q.get, True, 30.0)
        except queue.Empty:
            yield ": keepalive\n\n"
            continue

        if event_type == "done":
            yield f"data: {json.dumps({'type': 'done'})}\n\n"
            break

        if event_type == "error":
            yield f"data: {json.dumps({'type': 'error', 'message': data})}\n\n"
            break

        if event_type == "chunk":
            if "__interrupt__" in data:
                interrupts = data["__interrupt__"]
                interrupt_value = interrupts[0].value if interrupts else {}
                payload = {"type": "interrupt", "data": make_serializable(interrupt_value)}
                yield f"data: {json.dumps(payload)}\n\n"
                break
            else:
                node_name = next(iter(data))
                node_data = make_serializable(data[node_name])
                payload = {"type": "node_complete", "node": node_name, "data": node_data}
                yield f"data: {json.dumps(payload)}\n\n"

    t.join(timeout=5)


SSE_HEADERS = {"Cache-Control": "no-cache", "X-Accel-Buffering": "no"}


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------
@server.post("/api/start")
async def start_email_processing(req: EmailRequest):
    """Create a thread and store initial state. Returns thread_id."""
    thread_id = str(uuid.uuid4())
    thread_store[thread_id] = {
        "initial_state": {
            "email_content": req.email_content,
            "sender_email": req.sender_email,
            "email_id": req.email_id or f"email_{uuid.uuid4().hex[:8]}",
            "messages": [],
        }
    }
    return {"thread_id": thread_id}


@server.get("/api/stream/{thread_id}")
async def stream_thread(thread_id: str):
    """SSE stream that runs the agent from the beginning."""
    if thread_id not in thread_store:
        return JSONResponse({"error": "Thread not found"}, status_code=404)

    initial_state = thread_store[thread_id]["initial_state"]
    config = {"configurable": {"thread_id": thread_id}}

    return StreamingResponse(
        _sse_generator(initial_state, config),
        media_type="text/event-stream",
        headers=SSE_HEADERS,
    )


@server.post("/api/review/{thread_id}")
async def submit_review(thread_id: str, decision: ReviewDecision):
    """Store human review decision so the resume stream can pick it up."""
    if thread_id not in thread_store:
        return JSONResponse({"error": "Thread not found"}, status_code=404)

    from langgraph.types import Command  # local import to avoid circular issues

    thread_store[thread_id]["pending_resume"] = Command(
        resume={"approved": decision.approved, "edited_response": decision.edited_response}
    )
    return {"status": "ok"}


@server.get("/api/resume-stream/{thread_id}")
async def resume_stream(thread_id: str):
    """SSE stream that resumes the agent after a human-review interrupt."""
    if thread_id not in thread_store:
        return JSONResponse({"error": "Thread not found"}, status_code=404)

    pending = thread_store[thread_id].get("pending_resume")
    if not pending:
        return JSONResponse({"error": "No pending review decision"}, status_code=400)

    config = {"configurable": {"thread_id": thread_id}}

    return StreamingResponse(
        _sse_generator(pending, config),
        media_type="text/event-stream",
        headers=SSE_HEADERS,
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("server:server", host="0.0.0.0", port=8000, reload=True)
