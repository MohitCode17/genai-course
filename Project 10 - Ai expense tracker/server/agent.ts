import { ChatGroq } from "@langchain/groq";
/**
 * INITIALIZE THE LLM
 */
const llm = new ChatGroq({
  model: "llama-3.1-8b-instant",
  temperature: 0,
});
