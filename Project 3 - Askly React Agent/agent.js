import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { ChatGroq } from "@langchain/groq";
import { TavilySearch } from "@langchain/tavily";
import { tool } from "@langchain/core/tools";
import { json, z } from "zod";

async function main() {
  const model = new ChatGroq({
    model: "openai/gpt-oss-120b",
    temperature: 0,
  });

  const search = new TavilySearch({
    maxResults: 3,
    topic: "general",
  });

  const calendarEvents = tool(
    async ({ query }) => {
      // GOOGLE CALENDAR LOGIC GOES HERE...
      return JSON.stringify([
        { title: "Meeting with Ritkit Shah", date: "28th Oct 2025", time: "2 PM", location: "Gmeet" },
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

  const agent = createReactAgent({
    llm: model,
    tools: [search, calendarEvents],
  });

  const result = await agent.invoke({
    messages: [
      {
        role: "system",
        content: `You are a personal assistant. Use provided tools to get the information if you don't have it. Current date and time: ${new Date().toUTCString()}`,
      },
      {
        role: "user",
        content: "Do I have any meeting for tommorow?",
      },
    ],
  });

  // console.log(result);
  console.log(
    "Assistant:",
    result.messages[result.messages.length - 1].content
  );
}

main();
