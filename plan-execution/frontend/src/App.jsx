import { useState, useRef } from 'react'
import Chat from './components/Chat'

export default function App() {
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      type: 'bot',
      text: "Hi! I'm your support assistant. Please describe your issue and I'll get it sorted for you.",
    },
  ])
  const [phase, setPhase] = useState('waiting_issue')
  const [pendingIssue, setPendingIssue] = useState('')
  const [threadId, setThreadId] = useState(null)
  const esRef = useRef(null)
  const blockIdRef = useRef(null)  // tracks the current processing-block message

  // Append a new message
  function addMsg(msg) {
    setMessages(prev => [...prev, { id: `${Date.now()}-${Math.random()}`, ...msg }])
  }

  // Update the active processing block in-place
  function addStepToBlock(node, data) {
    setMessages(prev =>
      prev.map(m =>
        m.id === blockIdRef.current
          ? { ...m, steps: [...m.steps, { node, data }] }
          : m,
      ),
    )
  }

  function finalizeBlock(status) {
    setMessages(prev =>
      prev.map(m =>
        m.id === blockIdRef.current ? { ...m, status } : m,
      ),
    )
  }

  function handleSend(text) {
    if (phase === 'waiting_issue') {
      addMsg({ type: 'user', text })
      setPendingIssue(text)
      setPhase('waiting_email')
      setTimeout(
        () => addMsg({ type: 'bot', text: "Thanks! What's your email address so I can look up your account?" }),
        350,
      )
      return
    }

    if (phase === 'waiting_email') {
      addMsg({ type: 'user', text })
      setPhase('processing')
      startAgent(pendingIssue, text)
    }
  }

  async function startAgent(issue, email) {
    try {
      const res = await fetch('/api/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email_content: issue, sender_email: email }),
      })
      const { thread_id } = await res.json()
      setThreadId(thread_id)
      openStream(thread_id, `/api/stream/${thread_id}`)
    } catch (err) {
      addMsg({ type: 'error', text: `Failed to start agent: ${err.message}` })
      setPhase('error')
    }
  }

  function openStream(tid, endpoint) {
    if (esRef.current) esRef.current.close()

    // Create a processing block to accumulate steps
    const blockId = `pb-${Date.now()}`
    blockIdRef.current = blockId
    setMessages(prev => [
      ...prev,
      { id: blockId, type: 'processing-block', steps: [], status: 'running' },
    ])

    const es = new EventSource(endpoint)
    esRef.current = es

    es.onmessage = (event) => {
      const msg = JSON.parse(event.data)

      if (msg.type === 'node_complete') {
        addStepToBlock(msg.node, msg.data)
      }

      if (msg.type === 'interrupt') {
        finalizeBlock('done')
        setMessages(prev => [
          ...prev,
          { id: `review-${Date.now()}`, type: 'review', data: msg.data },
        ])
        setPhase('review')
        es.close()
      }

      if (msg.type === 'done') {
        finalizeBlock('done')
        setMessages(prev => [
          ...prev,
          { id: `done-${Date.now()}`, type: 'bot', text: '✓ Done! A response has been sent to the customer.' },
        ])
        setPhase('done')
        es.close()
      }

      if (msg.type === 'error') {
        finalizeBlock('error')
        setMessages(prev => [
          ...prev,
          { id: `err-${Date.now()}`, type: 'error', text: msg.message },
        ])
        setPhase('error')
        es.close()
      }
    }

    es.onerror = () => {
      finalizeBlock('error')
      setMessages(prev => [
        ...prev,
        { id: `err-${Date.now()}`, type: 'error', text: 'Lost connection to the server.' },
      ])
      setPhase('error')
      es.close()
    }
  }

  async function handleReviewDecision(decision) {
    setPhase('resuming')
    try {
      await fetch(`/api/review/${threadId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(decision),
      })

      if (!decision.approved) {
        addMsg({ type: 'bot', text: 'Understood — a human agent will handle this case directly.' })
        setPhase('done')
        return
      }

      openStream(threadId, `/api/resume-stream/${threadId}`)
    } catch (err) {
      addMsg({ type: 'error', text: err.message })
      setPhase('error')
    }
  }

  function handleReset() {
    if (esRef.current) esRef.current.close()
    setMessages([
      {
        id: 'welcome',
        type: 'bot',
        text: "Hi! I'm your support assistant. Please describe your issue and I'll get it sorted for you.",
      },
    ])
    setPhase('waiting_issue')
    setPendingIssue('')
    setThreadId(null)
    blockIdRef.current = null
  }

  return (
    <Chat
      messages={messages}
      phase={phase}
      onSend={handleSend}
      onReviewDecision={handleReviewDecision}
      onReset={handleReset}
    />
  )
}
