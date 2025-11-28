class agent_tool:
    def __init__(self, ):
        self.tool_list = {"multiplication_tool": self.multiplication_tool}

    def get_tool_list(self) -> list:
        return self.tool_list

    def multiplication_tool(self, a: str, b: str) -> str:
        return str(int(a) * int(b))