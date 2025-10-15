import NodeCache from "node-cache";
import Groq from "groq-sdk/index.mjs";
import { tavily } from "@tavily/core";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const tvly = tavily({ apiKey: process.env.TAVILY_API_KEY });

const cache = new NodeCache({ stdTTL: 60 * 60 * 24 }); // 24 hours

export async function generate(userMessage, threadId) {
  const baseMessages = [
    {
      role: "system",
      content: `You are Askly a smart personal assistant.
                  If you know answers to a question, answer it directly in plain English.
                  It the answer required real-time, local, or up-to-date information, or if you don't know the answer, use the available tools to find it.
                  You have access to following tools:
                  webSearch(query: string): Use this to search the internet for current or unknown information.
                  Decide when to use your own knowledge and when to use the tool.
                  Do not mention the tool unless needed.

                  Examples:
                  Q: What is the capital of India?
                  A: The capital of India is Delhi.

                  Q: What's the weather in Delhi right now?
                  A: (use the search tool to find the latest weather)

                  Q: Who is the Prime Minister of India?
                  A: (use the search tool to find the current Prime Minister)

                  Q: Tell me latest IT news.
                  A: (use the search tool to get the latest news)

                  current date and time: ${new Date().toUTCString()}`,
    },
  ];

  // RETRIEVE CONVERSATION MEMORY FOR GIVE THREAD
  const messages = cache.get(threadId) ?? baseMessages;

  messages.push({
    role: "user",
    content: userMessage,
  });

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
      cache.set(threadId, messages); // STORE CONVERSATION IN MEMORY
      return completion.choices[0].message.content;
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

async function webSearch({ query }) {
  console.log("Calling a web search...");

  const response = await tvly.search(query);

  const finalResult = response.results
    .map((result) => result.content)
    .join("\n\n");

  return finalResult;
}
