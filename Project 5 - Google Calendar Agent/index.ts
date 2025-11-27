import { ChatGroq } from "@langchain/groq";
import { createEventTool, getEventsTool } from "./tools";
import { END, MessagesAnnotation, StateGraph } from "@langchain/langgraph";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import type { AIMessage } from "@langchain/core/messages";

const tools: any = [createEventTool, getEventsTool];

const llm = new ChatGroq({
  model: "openai/gpt-oss-120b",
  temperature: 0,
}).bindTools(tools);

/**
 * Assistant node
 */
async function callModel(state: typeof MessagesAnnotation.State) {
  console.log("Calling the llm...");

  const response = await llm.invoke(state.messages);
  return { messages: [response] };
}

/**
 * Tool node
 */
const toolNode = new ToolNode(tools);

/**
 * Conditional edge
 */
function whereToGo(state: typeof MessagesAnnotation.State) {
  /**
   * Check the previous ai message if tool call, return "tools"
   * else return "__end__"
   */
  const lastMessage = state.messages[state.messages.length - 1] as AIMessage;

  if (lastMessage?.tool_calls?.length) {
    return "tools";
  }

  return "__end__";
}

/**
 * Build the graph
 */
const graph = new StateGraph(MessagesAnnotation)
  .addNode("assistant", callModel)
  .addNode("tools", toolNode)
  .addEdge("__start__", "assistant")
  .addEdge("tools", "assistant")
  .addConditionalEdges("assistant", whereToGo, {
    __end__: END,
    tools: "tools",
  });

// To Make Graph Runnable
const app = graph.compile();

async function main() {
  const result = await app.invoke({
    messages: [
      {
        role: "human",
        content: "Create a meeting with Mohit Gupta Email: mohit.codes17@gmail.com on 28 November 2025 at 9 PM.",
      },
    ],
  });

  const messages = result.messages;
  const final = messages[messages.length - 1];
  console.log("Assistant:", final?.content);
}

main();
