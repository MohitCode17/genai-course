import { ChatGroq } from "@langchain/groq";
import {
  MemorySaver,
  MessagesAnnotation,
  StateGraph,
} from "@langchain/langgraph";
import { initDB } from "./db";
import { initTools } from "./tools";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import type { AIMessage, ToolMessage } from "langchain";

/**
 * Initialize Database
 */
const database = initDB("./expenses.db");
const tools = initTools(database);

/**
 * INITIALIZE THE LLM
 */
const llm = new ChatGroq({
  model: "openai/gpt-oss-120b",
  temperature: 0,
});

/**
 * Tool Node
 */

const toolNode = new ToolNode(tools);

/**
 * Call Model Node
 */
async function callModel(state: typeof MessagesAnnotation.State) {
  const llmWithTools = llm.bindTools(tools);

  const response = await llmWithTools.invoke([
    {
      role: "system",
      content: `You are a helpful expense tracking assistant.
      Rules:
      - Call add_expense tool to add an expense to database
      - NEVER add data on your own
      - Call get_expenses tool to get the list of expenses for a given date range
      - Call generate_expense_chart tool only when user needs to visualize the expenses

      Current datetime: ${new Date().toISOString()}`,
    },
    ...state.messages,
  ]);

  return { messages: [response] };
}

/**
 * Build Graph
 */

function shouldContinue(state: typeof MessagesAnnotation.State) {
  const messages = state.messages;
  const lastMessage = messages.at(-1) as AIMessage;

  if (lastMessage.tool_calls?.length) {
    return "tools";
  }

  return "__end__";
}

function shouldCallModel(state: typeof MessagesAnnotation.State) {
  const messages = state.messages;
  const lastMessage = messages.at(-1) as ToolMessage;

  const message = JSON.parse(lastMessage.content as string);

  if (message.type === "chart") {
    return "__end__";
  }

  return "callModel";
}

const graph = new StateGraph(MessagesAnnotation)
  .addNode("callModel", callModel)
  .addNode("tools", toolNode)
  .addEdge("__start__", "callModel")
  .addConditionalEdges("callModel", shouldContinue, {
    tools: "tools",
    __end__: "__end__",
  })
  .addConditionalEdges("tools", shouldCallModel, {
    callModel: "callModel",
    __end__: "__end__",
  });

/**
 * Complete Graph
 */

const agent = graph.compile({ checkpointer: new MemorySaver() });

async function main() {
  const response = await agent.invoke(
    {
      messages: [
        {
          role: "human",
          content:
            "Can you visualize how much I spent this year group by month?",
        },
      ],
    },
    { configurable: { thread_id: crypto.randomUUID() } }
  );

  console.log(JSON.stringify(response, null, 2));
  // console.log(response.messages[response.messages.length - 1]?.content);
}

main();
