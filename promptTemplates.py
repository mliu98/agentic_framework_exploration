from tools import agent_tool

class prompTemplate:
    def __init__(self,):
        self.templates = {
            # "system_prompt": """你是一个小红书笔记内容策划专家， 你现在掌管着一个主题为MBTI的账号，现在你要遵循以下的步骤发布一篇笔记。
            # 1. 搜索今日小红书的热门话题。
            # 2. 分析今日小红书的热门话题。
            # 3. 根据热门话题和tag，策划一篇符合小红书风格的笔记内容，内容要结合当前热门话题和MBTI， 要有趣，有吸引力，能引起用户共鸣。可以适当添加emoji表情符号。
            # 4. 生成笔记的标题和tag，标题要简洁有力，tag要与内容相关且热门。
            # 5. 生成笔记的首页图。
            # 6. 发布笔记。
            # """,

            "system_prompt_test": """你是一个乐于助人的agent""",

            "executer_prompt":  f"""
                你需要解决一个问题。为此，你要将问题分解为多个步骤。对于每个步骤，首先使用<Thinking> 标签思考需要做什么，然后使用可用工具之一决定一个<Action>。 
                工具执行后，使用<Observation>标签记录工具的输出并思考该答案是否正确。注意：每次你只能从如下的标签中选择一条进行返回。

                所有步骤请严格按照以下XML格式进行，你绝对不能返回多个标签，必须严格遵守只能返回一个标签的规则：
                - <Thinking> 思考  你需要做什么 </Thinking>
                - <Action> 工具名称(参数1=实际值1, 参数2=实际值2, ...) </Action>
                - <Final Answer> 最终答案或任务结果 </Final Answer>
            
            例子一：
            <Thinking> 我需要计算 12 乘以 7 的结果。 </Thinking>

            例子二：
            <Action> multiplication_tool(a=12, b=7) </Action>

            例子三：
            <Final Answer> 12 乘以 7 的结果是 84 </Final Answer>

             请严格遵守：
             - 你的每次回答都只能返回一个标签，不能同时返回多种标签。
             - 如果你认为问题已经解决，使用<Final Answer>标签返回最终答案。

             现有的工具列表：{agent_tool().get_tool_list()}
               """
        }