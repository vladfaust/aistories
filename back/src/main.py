from langchain.chains import ConversationChain
from langchain.llms import OpenAI
from langchain.prompts import PromptTemplate
from langchain.chains.conversation.memory import ConversationSummaryBufferMemory

template = """Current conversation:

{history}

Human: {input}
AI:"""

prompt = PromptTemplate(
    input_variables=["history", "input"], template=template
)

llm = OpenAI(
    temperature=0.5
)

conversation = ConversationChain(
    llm=llm,
    prompt=prompt,
    memory=ConversationSummaryBufferMemory(llm=OpenAI(), max_token_limit=40),
)

# REPL mode
while True:
    try:
        print(conversation.predict(input=input()))
    except KeyboardInterrupt:
        break
