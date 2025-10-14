import Groq from "groq-sdk/index.mjs";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

async function main() {
  const completion = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    temperature: 0,
    messages: [
      {
        role: "system",
        content: `You are a smart personal assistant who answers the asked questions.
                  You have access to following tools:
                  1. webSearch({query}: {query: string}) //Search the latest information and realtime data on the internet.`,
      },
      {
        role: "user",
        content: `Who is the Current Indian Test Cricket Team Captain?`,
      },
    ],
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

  let toolCalls = completion.choices[0].message.tool_calls;

  if (!toolCalls) {
    console.log(`Assistant: ${completion.choices[0].message.content}`);
    return;
  }

  for (const tool of toolCalls) {
    const functionName = tool.function.name;
    const functionArgs = tool.function.arguments;

    if (functionName === "webSearch") {
      const toolResult = await webSearch(JSON.parse(functionArgs));
      console.log("Tool Result: ", toolResult);
    }
  }
}

main();

async function webSearch({ query }) {
  console.log("Calling a web search...");
  // Here we call api for getting real time updates
  return `The current Captain of Indian Text Cricket Team is Shubman Gill.`;
}
