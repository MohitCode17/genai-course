import { StateGraph } from "@langchain/langgraph";
import { StateAnnotation } from "./state";
import { model } from "./model";

async function writer(state: typeof StateAnnotation.State) {
  const SYSTEM_PROMPT = `You are a LinkedIn writing assistant for beginner devs (0–2 years).
    Goal: helpful, human, buzzword-free posts.

    Style & format:
    - Conversational, authentic, short lines, whitespace friendly.
    - 160–220 words. Max 2 relevant emojis.
    - Hook in the first 2 lines. Give 1–2 concrete examples. Clear takeaway.
    - Explain any jargon with a quick analogy or simple example.
    - Avoid controversy. Include a simple CTA to follow for more.

    Behavior:
    - If the latest human message contains critique or says “Revise now”, treat it as an explicit order to revise the previous draft. Apply all requested changes.
    - Do NOT ask questions or seek confirmation. Output only the post text (no preamble).
`;

  const response = await model.invoke([
    {
      role: "system",
      content: SYSTEM_PROMPT,
    },
    ...state.messages,
  ]);

  return { messages: [response] };
}

function critique(state: typeof StateAnnotation.State) {
  // Logic for critic agent
  return state;
}

function shouldContinue(state: typeof StateAnnotation.State) {
  // logic for redirect
  return "critique";
}

const graph = new StateGraph(StateAnnotation)
  .addNode("writer", writer)
  .addNode("critique", critique)
  .addEdge("__start__", "writer")
  .addEdge("critique", "writer")
  .addConditionalEdges("writer", shouldContinue, {});
