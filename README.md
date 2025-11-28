# 🔧 Minimalist ReAct Framework

This project implements a lightweight ReAct agent framework that interacts with Anthropic’s Claude models using a thought/action/observation/final-answer workflow without using any existing framework.
The agent parses structured responses from Claude, executes tools, feeds observations back, and continues the loop until a final answer is reached.


## 📁 Project Structure
```
.
├── main_func.py               # Main agent executor (this file)
├── promptTemplates.py     # Contains system prompts
├── tools.py               # Defines executable tools
├── .env                   # Contains API_KEY
└── README.md
```
## 🚀 Getting Started
1. Install Dependencies
```pip install -r requirements.txt```
Also ensure your tools.py and promptTemplates.py modules are in the same directory.

2. Set Up Environment Variables

Create a .env file containing:

```API_KEY=your_anthropic_api_key```

3. Run the Agent
```python main_func.py```



## 🔨 Adding Tools

Tools are discovered via:

```self.tool_list = agent_tool().get_tool_list()```

A tool must be a callable like:
```
def add(a, b):
    return int(a) + int(b)
```

and registered in tools.py.

The model can request it via:
```<Action>add(a=1, b=2)</Action>```

# 🧪 Example Output
```
Current state: thinking
Thinking: This problem contains...
Current state: action
Action: calculate(a=5, b=10)
Do you want to execute the Action? (Y/N):
```

🤝 Contributing

Pull requests and suggestions are welcome!
If you want to extend the agent (e.g., add logging, streaming, multi-tool workflows), feel free to ask.

