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

    def on_llm_new_token(self, token: str, **kwargs: Any) -> None:
        """Run on new LLM token. Only available when streaming is enabled."""
        sys.stdout.write(token)
        sys.stdout.flush()

    def on_llm_end(self, response: LLMResult, **kwargs: Any) -> None:
        """Run when LLM ends running."""
        sys.stdout.write('\0')
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


template = """Current conversation:

{history}

Human: {input}
AI:"""

prompt = PromptTemplate(
    input_variables=["history", "input"], template=template
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

conversation = ConversationChain(
    llm=llm,
    prompt=prompt,
    memory=ConversationSummaryBufferMemory(llm=OpenAI(), max_token_limit=40),
    callback_manager=callback_manager
)

# REPL mode
while True:
    try:
        conversation.predict(input=input())
    except KeyboardInterrupt:
        break
