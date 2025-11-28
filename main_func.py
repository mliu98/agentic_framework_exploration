
import anthropic
from promptTemplates import prompTemplate
import dotenv, re
from tools import agent_tool


dotenv.load_dotenv()
api_key = dotenv.get_key(dotenv.find_dotenv(), "API_KEY")

class agent:
    def __init__(self, ):
        self.client = anthropic.Anthropic(api_key = api_key)
        self.prompts = prompTemplate().templates
        self.messages = []
        self.tool_list = agent_tool().get_tool_list()

    def _parse_response(self, response_str: str) -> dict:
        Thinkings = re.findall(r"<Thinking>(.*?)</Thinking>", response_str, re.DOTALL)
        Actions =  re.findall(r"<Action>(.*?)</Action>", response_str, re.DOTALL)
        Observations = re.findall(r"<Observation>(.*?)</Observation>", response_str, re.DOTALL) 
        Final_Answers = re.findall(r"<Final Answer>(.*?)</Final Answer>", response_str, re.DOTALL)

        return {
            "Thinkings": Thinkings,
            "Actions": Actions,
            "Observations": Observations,
            "Final Answers": Final_Answers
        }
    
    def _print_response_parsed(self, parsed_response: dict) -> None:
        for key, values in parsed_response.items():
            for i, value in enumerate(values):
                print(f"{key}: {value.strip()}")

    def _check_state(self, response_str: str) -> str: 
        # The state sequence is important, it determines which tag to prioritize when multiple tags are present.
        if "<Final Answer>" in response_str:
            return "final_answer"
        elif "<Action>" in response_str:
            return "action"
        elif "<Thinking>" in response_str:
            return "thinking"
        elif "<Observation>" in response_str:
            return "observation"
    
    def _parse_action(self, action_str: str) -> dict:
        action = re.findall(r"<Action>(.*?)</Action>", action_str, re.DOTALL)[-1]
        tool_name, params_str = re.match(r"(\w+)\((.*)\)", action.strip()).groups()
        params = [param.strip() for param in params_str.split(",")]
        params_dict = {}
        for param in params:
            if "=" in param:
                key, value = param.split("=")
                params_dict[key] = value
        return tool_name, params_dict

    def run(self, query: str) -> None:

        while True: 
            
            if self.messages == []:
                self.messages.append({"role": "user", "content": query})
                response = self.client.messages.create(
                    model="claude-sonnet-4-20250514", 
                    max_tokens=1000,
                    system=self.prompts["executer_prompt"],
                    messages=self.messages   
                )

                self.messages.append({"role": "assistant", "content": response.content[0].text})
            
            # check current state
            last_message = self.messages[-1]["content"]
            state = self._check_state(response_str=last_message) 
            print(f"Current state: {state}")

            if state == "thinking":
                self._print_response_parsed(self._parse_response(last_message))
                self.messages.append({"role": "user", "content": "Please provide an action or continue thinking based on your current Thinking. "})
                response = self.client.messages.create(
                    model="claude-sonnet-4-20250514", 
                    max_tokens=1000,
                    system=self.prompts["executer_prompt"],
                    messages=self.messages   
                )
                # print(response, self.messages)
                self.messages.append({"role": "assistant", "content": response.content[0].text})

            elif state == "action":
                self._print_response_parsed(self._parse_response(last_message))
                
                is_execution = input("Do you want to execute the Action? (Y/N):")
                if is_execution.lower() == 'n':
                    print("Action execution aborted by user.")
                    break
                elif is_execution.lower() == 'y':
                    tool_name, params_dict = self._parse_action(last_message)

                    if tool_name not in self.tool_list:
                        print(f"Tool {tool_name} not found in tool list.")
                        self.messages.append({"role": "user", "content": f"<Observation> Tool {tool_name} not found. Let's try again </Observation>"})
                    else:
                        print(f"Executing tool: {tool_name} with params: {params_dict}")
                        observation = self.tool_list[tool_name](**params_dict)
                        observation_message = f"<Observation> {observation} </Observation>"
                        self.messages.append({"role": "user", "content": observation_message})
                else:
                    print("User input not recognized. Please enter 'Y' or 'N")

            elif state == "observation":
                self._print_response_parsed(self._parse_response(last_message))
                response = self.client.messages.create(
                    model="claude-sonnet-4-20250514", 
                    max_tokens=1000,
                    system=self.prompts["executer_prompt"],
                    messages=self.messages   
                )

                self.messages.append({"role": "assistant", "content": response.content[0].text})

            elif state == "final_answer":
                self._print_response_parsed(self._parse_response(last_message))
                print("Task completed.")
                break
                
                                    
if __name__ == "__main__": 
    test_agent = agent()
    test_agent.run("小明有一个五层高的书架，每一层可以放13本书，小明最多可以放几本书？如果小明有两个这样的书架，他最多可以放几本书？")
