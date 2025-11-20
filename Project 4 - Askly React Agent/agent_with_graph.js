/**
 * 1. Bring the LLM
 * 2. Build the Graph
 * 3. Invoke the Agent
 * 4. Add the Memory
 */
import { ToolNode } from "@langchain/langgraph/prebuilt";
import { ChatGroq } from "@langchain/groq";
import { TavilySearch } from "@langchain/tavily";
import { tool } from "@langchain/core/tools";
import {
  END,
  MemorySaver,
  MessagesAnnotation,
  StateGraph,
} from "@langchain/langgraph";
import { z } from "zod";
import readline from "node:readline";

// Search Tool
const search = new TavilySearch({
  maxResults: 3,
  topic: "general",
});

// Calendar Tool
const calendarEvents = tool(
  async ({ query }) => {
    // GOOGLE CALENDAR LOGIC GOES HERE...
    return JSON.stringify([
      {
        title: "Meeting with Ritkit Shah",
        date: "28th Oct 2025",
        time: "2 PM",
        location: "Gmeet",
      },
    ]);
  },
  // INFORMATION OF TOOL
  {
    name: "get-calendar-events",
    description: "Call to get the calendar events.",

    // SCHEMA TO VALIDATE THE QUERY
    schema: z.object({
      query: z
        .string()
        .describe("The query to use in your calendar event search."),
    }),
  }
);

const tools = [search, calendarEvents];

// BUILD THE NODE(TOOL)
const toolNode = new ToolNode(tools);

// INITIALIZE THE LLM
const llm = new ChatGroq({
  model: "openai/gpt-oss-120b",
  temperature: 0,
}).bindTools(tools);

// BUILD THE NODE(Node)
async function callModel(state) {
  // Call the LLM
  console.log("Calling the llm...");
  const response = await llm.invoke(state.messages);
  // Whatever you return from here added to state
  return { messages: [response] };
}

// CONDITIONAL EDGE
function whereToGo(state) {
  /**
   * Check the previous ai message if tool call, return "tools"
   * else return "__end__"
   */
  const lastMessage = state.messages[state.messages.length - 1];

  if (lastMessage.tool_calls?.length) {
    return "tools";
  } else {
    return "__end__";
  }
}

// BUILD THE GRAPH
const graph = new StateGraph(MessagesAnnotation)
  .addNode("llm", callModel)
  .addNode("tools", toolNode)
  .addEdge("__start__", "llm")
  .addEdge("tools", "llm")
  .addConditionalEdges("llm", whereToGo);

// TO MAKE GRAPH RUNNABLE
const app = graph.compile();

async function main() {
  // Pass the Initial Message and Invoke the App
  const result = await app.invoke({
    messages: [
      { role: "human", content: "Who is the Current Chief Minister of Bihar?" },
    ],
  });

  const messages = result.messages;
  // console.log("AI Result:", messages);
  const final = messages[messages.length - 1];

  console.log("Agent:", final.content);
}

main();
