import { tool } from "@langchain/core/tools";
import { vectorStore } from "./indexDocs";
import z from "zod";

export const getOffers = tool(
  () => {
    // codersgyan platform (backend) -> api -> get offers

    return JSON.stringify([
      {
        code: "LAUNCH",
        discount_percent: 30,
      },
      {
        code: "FIRST_20",
        discount_percent: 20,
      },
    ]);
  },
  {
    name: "offers_query_tool",
    description: "Call this tool to get the available discounts and offers",
  }
);

const retriever = vectorStore.asRetriever();

export const kbRetrieverTool = retriever.asTool({
  name: "retrieve_learning_knowledge_base",
  description:
    "Search and return information about syllabus, courses, FAQs, career doubts.",
  schema: z.string().describe("The user query to search in the knowledge base"),
});
