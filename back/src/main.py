import json
from langchain.chains import ConversationChain
from langchain.llms import OpenAI
from langchain.prompts import PromptTemplate
from langchain.chains.conversation.memory import ConversationSummaryBufferMemory
from langchain.chains.conversation.prompt import _DEFAULT_TEMPLATE, _DEFAULT_SUMMARIZER_TEMPLATE
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

prompt = PromptTemplate(
    input_variables=["history", "input"],
    template=args["template"] if "template" in args else _DEFAULT_TEMPLATE
)

callback_manager = CallbackManager(
    [StreamingStdOutCallbackHandler()]
)

llm = OpenAI(
    temperature=0.5,
    streaming=True,

    # FIXME: Remove this. Otherwise, the callback manager doesn't work.
    verbose=True,

    callback_manager=callback_manager
)

memory = ConversationSummaryBufferMemory(
    moving_summary_buffer=args["moving_summary_buffer"] if "moving_summary_buffer" in args else "",
    buffer=args["buffer"] if "buffer" in args else [],
    prompt=PromptTemplate(
        input_variables=[
            "summary",
            "new_lines"
        ],
        template=args["summarizer_template"] if "summarizer_template" in args else _DEFAULT_SUMMARIZER_TEMPLATE
    ),
    llm=OpenAI(temperature=0),
    max_token_limit=40)

conversation = ConversationChain(
    llm=llm,
    prompt=prompt,
    memory=memory,
    callback_manager=callback_manager
)

# REPL mode
while True:
    try:
        conversation.predict(input=input())  # Would stream to stdout
        sys.stdout.write('\x1D')  # End of LLM responses

        sys.stdout.write(memory.moving_summary_buffer)
        sys.stdout.write('\x1E')  # End of memory moving summary buffer

        json.dump(memory.buffer, sys.stdout)  # Print the memory buffer
        sys.stdout.write('\x04')  # End of transmission

    except KeyboardInterrupt:
        break
