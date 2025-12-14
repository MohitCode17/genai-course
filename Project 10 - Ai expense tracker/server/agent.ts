import { ChatGroq } from "@langchain/groq";
import type { MessagesAnnotation } from "@langchain/langgraph";
/**
 * INITIALIZE THE LLM
 */
const llm = new ChatGroq({
  model: "llama-3.1-8b-instant",
  temperature: 0,
});

/**
 * Call Model Node
 */
async function callModel(state: typeof MessagesAnnotation.State) {
  return state;
}
