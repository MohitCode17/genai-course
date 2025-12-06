import { StateGraph } from "@langchain/langgraph";
import { StateAnnotation } from "./state";

function writer(state: typeof StateAnnotation.State) {
  // Logic for writer agent
  return state;
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
