import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { ChatGroq } from "@langchain/groq";
import { TavilySearch } from "@langchain/tavily";

async function main() {
  const model = new ChatGroq({
    model: "openai/gpt-oss-120b",
    temperature: 0,
  });

  const search = new TavilySearch({
    maxResults: 3,
    topic: "general",
  });

  const agent = createReactAgent({
    llm: model,
    tools: [search],
  });

  const result = await agent.invoke({
    messages: [
      {
        role: "user",
        content: "When was officially GPT-5 launched?",
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
