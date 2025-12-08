import { AIMessage } from "@langchain/core/messages";
import { llm } from "./model";
import { graphState, questionAnswerSchema } from "./state";
import { StateGraph } from "@langchain/langgraph";

async function responder(state: typeof graphState.State) {
  // Responder Logic
  const currentDateTime = new Date().toLocaleString("sv-SE");

  const SYSTEM_PROMPT = `You are an expert researcher.
Current time: ${currentDateTime}

1. Provide a detailed ~250 word answer.
2. Reflect and critique your answer. Be severe to maximize improvement.
3. Recommend max 3 search queries to research information and improve your answer.`;

  /**
   * Getting Structured Output
   * 1. Using tool-calling
   * 2. withStructuredOutput() method
   */
  const llmWithStructure = llm.withStructuredOutput(questionAnswerSchema);

  const response = await llmWithStructure.invoke([
    {
      role: "system",
      content: SYSTEM_PROMPT,
    },
    ...state.messages,
    {
      role: "system",
      content: `Reflect on the user's original question and the actions taken thus far. Respond using structured output.`,
    },
  ]);

  return {
    messages: [new AIMessage(JSON.stringify(response))],
  };
}

const graph = new StateGraph(graphState).addNode("responder", responder);
