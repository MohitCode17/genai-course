import { ChatGroq } from "@langchain/groq";
import type { MessagesAnnotation } from "@langchain/langgraph";
import { initDB } from "./db";
import { initTools } from "./tools";
import { ToolNode } from "@langchain/langgraph/prebuilt";

/**
 * Initialize Database
 */
const database = initDB("./expenses.db");
const tools = initTools(database);

/**
 * INITIALIZE THE LLM
 */
const llm = new ChatGroq({
  model: "llama-3.1-8b-instant",
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

  const response = llmWithTools.invoke([
    {
      role: "system",
      content: `You are a helpful expense tracking assistant. Current datetime: ${new Date().toISOString()}.
      Call add_expense tool to add the expense to database.`,
    },
    ...state.messages,
  ]);

  return { messages: [response] };
}
