import datetime
import json
from langchain.chains import ConversationChain
from langchain.llms import OpenAI
from langchain.prompts import PromptTemplate
from langchain.chains.conversation.memory import ConversationSummaryBufferMemory
from langchain.callbacks.base import CallbackManager
from langchain.callbacks.base import BaseCallbackHandler
import sys
from typing import Any, Dict, List, Union
from langchain.schema import AgentAction, AgentFinish, LLMResult


class StreamingStdOutCallbackHandler(BaseCallbackHandler):
    """Callback handler for streaming. Only works with LLMs that support streaming."""

    def on_llm_start(
        self, serialized: Dict[str, Any], prompts: List[str], **kwargs: Any
    ) -> None:
        """Run when LLM starts running."""
        sys.stdout.write('\x02')  # Start of token stream
        sys.stdout.flush()

    def on_llm_new_token(self, token: str, **kwargs: Any) -> None:
        """Run on new LLM token. Only available when streaming is enabled."""
        sys.stdout.write(token)
        sys.stdout.write('\x1F')  # Unit (token) separator
        sys.stdout.flush()

    def on_llm_end(self, response: LLMResult, **kwargs: Any) -> None:
        """Run when LLM ends running."""
        sys.stdout.write('\x03')  # End of token stream
        sys.stdout.flush()

    def on_llm_error(
        self, error: Union[Exception, KeyboardInterrupt], **kwargs: Any
    ) -> None:
        """Run when LLM errors."""

    def on_chain_start(
        self, serialized: Dict[str, Any], inputs: Dict[str, Any], **kwargs: Any
    ) -> None:
        """Run when chain starts running."""

    def on_chain_end(self, outputs: Dict[str, Any], **kwargs: Any) -> None:
        """Run when chain ends running."""

    def on_chain_error(
        self, error: Union[Exception, KeyboardInterrupt], **kwargs: Any
    ) -> None:
        """Run when chain errors."""

    def on_tool_start(
        self, serialized: Dict[str, Any], action: AgentAction, **kwargs: Any
    ) -> None:
        """Run when tool starts running."""

    def on_tool_end(self, output: str, **kwargs: Any) -> None:
        """Run when tool ends running."""

    def on_tool_error(
        self, error: Union[Exception, KeyboardInterrupt], **kwargs: Any
    ) -> None:
        """Run when tool errors."""

    def on_text(self, text: str, **kwargs: Any) -> None:
        """Run on arbitrary text."""

    def on_agent_finish(self, finish: AgentFinish, **kwargs: Any) -> None:
        """Run on agent end."""


args = json.loads(sys.argv[1])

DEFAULT_TEMPLATE = """The following is a conversation between a Human and an AI.

The AI is playing a specific character in a story, dictated by SYNOPSIS.
The AI MAY NOT overcome the boundaries of the character it is playing.

The AI MAY NOT use formatting or other features of the chat interface, with the following exceptions: `<>` to denote a narration in third-person view, and `()` to denote thoughts in first-person view.

EXAMPLE:
AI: I have something special for you! <Pixie smiles mischievously.> I made it just for you, so I hope you like it! (I hope I can get an extra tip for this one.) <She puts the cake on the table.> Here you go!

The AI has ATTENTION aligned with the traits of the character it is playing.

The AI has MEMORY composed of short-term MEMORY, which is merely a copy of the latest lines of the conversation, and long-term MEMORY, which is an ATTENTION-aligned summary of the entire conversation.

SYNOPSIS:
{synopsis}

MEMORY:
{history}

LATEST TWO LINES OF CONVERSATION:
Human{input}
AI:""".format(
    synopsis=args["synopsis"],
    history="{history}",
    # timestamp="{timestamp}", # TODO: Human ({timestamp}): {input}
    input="{input}")

DEFAULT_SUMMARIZER_TEMPLATE = """The following is a description of an algorithm for maintaining LONG-TERM MEMORY of a conversation between a Human and an AI.

The AI is playing a specific character in a story, dictated by SYNOPSIS.
The AI has ATTENTION aligned with the traits of the character it is playing.
The AI has LONG-TERM MEMORY, which is an ATTENTION-aligned summary of the entire conversation.

The AI MAY NOT use formatting or other features of the chat interface, with the following exceptions: `<>` to denote a narration in third-person view, and `()` to denote thoughts in first-person view.

Neither character traits nor SYNOPSIS are stored in LONG-TERM MEMORY.
The LONG-TERM MEMORY is only used to determine the current ATTENTION of the AI.
The LONG-TERM MEMORY is kept in the first-person view of the AI, and it is updated with each new line of conversation.

ALGORITHM:
Based on the new lines of conversation provided, update LONG-TERM MEMORY from the AI's first-person perspective in accordance to the aforementioned rules, keeping it concise, compact, and aligned with the character's traits and current interests, taking ATTENTION and TIME into account.
DO NOT store the entire conversation in LONG-TERM MEMORY, DELETE the old memories if they are no longer relevant.
Translate thoughts and narrations into the first-person view of the AI.
IMPORTANT: Keep the LONG-TERM MEMORY size under 1024 tokens.

EXAMPLE:
    LONG-TERM MEMORY:
    I greeted Human and asked them what brought them to the maid cafe. Human requested tea, and I smiled sweetly and asked what kind they would like, while hoping I had it in stock.

    NEW LINES:
    Human (22:41): I think I'd take strawberry tea, if you have it.
    AI: Strawberry tea? <Pixie smiled apologetically.> I'm afraid I don't have any. I do have a strawberry milkshake, though. Would you like that instead? (I'm not sure if I have enough strawberries to make a milkshake.)
    Human (22:42): Sure, that sounds good. I also want a slice of cake.
    AI: <Pixie nodded.> I'll get that for you in a couple of minutes. <Pixie went to the kitchen to prepare the order.>

    NEW LONG-TERM MEMORY:
    Human asked for strawberry tea, but I didn't have any. I offered them a strawberry milkshake instead. The Human agreed to the milkshake, and they also wanted a slice of cake. I went to the kitchen to prepare the order. It should be ready soon.

    NEW LINES:
    Human (22:44): Oh, here you are! Thank you!
    AI: <Pixie came back with the milkshake and the cake.> Here you go. <She handed the Human the milkshake and the cake.> Enjoy! (I hope he likes it.)
    Human: Yummy! Thank you! 😍 <I eat the cake and drink the milkshake.> That was delicious! ❤️
    AI: <Pixie smiled.> I'm glad you enjoyed it! (I'm so happy right now!)

    NEW LONG-TERM MEMORY:
    Human asked for strawberry tea, but I didn't have any. I prepared strawberry milkshake and cake for the Human instead. They liked it! I'm so happy they enjoyed it!

[SYNOPSIS]:
{synopsis}

[PREVOIS LONG-TERM MEMORY]:
{summary}

[NEW LINES]:
{new_lines}

[NEW LONG-TERM MEMORY]:
""".format(
    synopsis=args["synopsis"],
    summary="{summary}",
    new_lines="{new_lines}"
)

prompt = PromptTemplate(
    input_variables=["history", "input"],
    template=args["template"] if "template" in args else DEFAULT_TEMPLATE
)

callback_manager = CallbackManager(
    [StreamingStdOutCallbackHandler()]
)

llm = OpenAI(
    temperature=1.1,
    streaming=True,

    # FIXME: Remove this. Otherwise, the callback manager doesn't work.
    verbose=True,

    callback_manager=callback_manager,
    model_name=args["model"],
)

memory = ConversationSummaryBufferMemory(
    moving_summary_buffer=args["moving_summary_buffer"] if "moving_summary_buffer" in args else "",
    buffer=args["buffer"] if "buffer" in args else [],
    prompt=PromptTemplate(
        input_variables=[
            "summary",
            "new_lines"
        ],
        template=args["summarizer_template"] if "summarizer_template" in args else DEFAULT_SUMMARIZER_TEMPLATE
    ),
    llm=OpenAI(max_tokens=1024, temperature=1.1, model_name=args["model"]),
    max_token_limit=512)

conversation = ConversationChain(
    llm=llm,
    prompt=prompt,
    memory=memory,
    callback_manager=callback_manager
)

# REPL mode
while True:
    try:
        the_input = input()
        timestamp = datetime.datetime.now().isoformat()

        conversation.predict(
            input="({timestamp}): {input}".format(
                timestamp=timestamp, input=the_input),
        )  # Would stream to stdout

        sys.stdout.write('\x1D')  # End of LLM responses

        sys.stdout.write(memory.moving_summary_buffer)
        sys.stdout.write('\x1E')  # End of memory moving summary buffer

        json.dump(memory.buffer, sys.stdout)  # Print the memory buffer
        sys.stdout.write('\x04')  # End of transmission

    except KeyboardInterrupt:
        break
