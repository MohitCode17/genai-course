import Groq from "groq-sdk/index.mjs";
import { tavily } from "@tavily/core";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const tvly = tavily({ apiKey: process.env.TAVILY_API_KEY });

async function main() {
  const messages = [
    {
      role: "system",
      content: `You are a smart personal assistant who answers the asked questions.
            You have access to following tools:
            1. webSearch({query}: {query: string}) //Search the latest information and realtime data on the internet.
            Current date and time: ${new Date().toUTCString()}`,
    },
    {
      role: "user",
      content: `When was iphone 17 launched in india?`,
    },
  ];

  while (true) {
    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      temperature: 0,
      messages: messages,
      tools: [
        {
          type: "function",
          function: {
            name: "webSearch",
            description:
              "Search the latest information and realtime data on the internet.",
            parameters: {
              type: "object",
              properties: {
                query: {
                  type: "string",
                  description: "The search query to perform search on.",
                },
              },
              required: ["query"],
            },
          },
        },
      ],
      tool_choice: "auto",
    });

    // WHEN RESULT COMES OF COMPLETION ONE PUSH INTO MESSAGES
    messages.push(completion.choices[0].message);

    let toolCalls = completion.choices[0].message.tool_calls;

    if (!toolCalls) {
      console.log(`Assistant: ${completion.choices[0].message.content}`);
      break;
    }

    for (const tool of toolCalls) {
      const functionName = tool.function.name;
      const functionArgs = tool.function.arguments;

      if (functionName === "webSearch") {
        const toolResult = await webSearch(JSON.parse(functionArgs));

        // PUSH THE TOOL CALL MESSAGE INTO MESSAGES ARRAY
        messages.push({
          tool_call_id: tool.id,
          role: "tool",
          name: functionName,
          content: toolResult,
        });
      }
    }
  }
}

main();

async function webSearch({ query }) {
  console.log("Calling a web search...");

  const response = await tvly.search(query);

  const finalResult = response.results
    .map((result) => result.content)
    .join("\n\n");

  return finalResult;
}
