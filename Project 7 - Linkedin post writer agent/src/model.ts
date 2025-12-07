import { ChatGroq } from "@langchain/groq";

/**
 * Initialize the LLM
 */
export const model = new ChatGroq({
  model: "llama-3.3-70b-versatile",
  temperature: 0,
});
