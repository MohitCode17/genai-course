import readline from "node:readline/promises";
import { graph } from "./src/graph";

async function main() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const app = graph.compile();

  while (true) {
    const query = await rl.question("What you want me to write about?\n");

    if (query === "/bye") break;

    const result = await app.invoke({
      messages: [
        {
          role: "human",
          content: "Write me a linkedin post for SLMs(Small Language Models).",
        },
      ],
    });

    //   console.log("Result: ", result);
    console.log(
      "Generated post: ",
      result.messages[result.messages.length - 1]?.content
    );
  }
  rl.close();
}

main();
