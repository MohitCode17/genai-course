import readline from "node:readline/promises";
import {
  Annotation,
  Command,
  interrupt,
  MemorySaver,
  MessagesAnnotation,
  StateGraph,
} from "@langchain/langgraph";

/**
 * Define the State
 */
const State = Annotation.Root({
  ...MessagesAnnotation.spec,
  firstDraft: Annotation<string>,
  approvedState: Annotation<boolean>,
});

/**
 * Draft Node
 */
async function draft(state: typeof State.State) {
  /**
   * Logic for create a draft
   */
  console.log("Draft is ready.");

  return { firstDraft: "This is our first draft." };
}

/**
 * Approval Node
 */

async function approval(state: typeof State.State) {
  const approved = interrupt("Do you approve this action?");

  if (approved === "true") {
    return { approvedState: true };
  } else {
    return {
      messages: { approvedState: false },
    };
  }
}

/**
 * Send Node
 */
async function send(state: typeof State.State) {
  if (state.approvedState) {
    console.log("sending email: ", state.firstDraft);
    return {
      messages: [{ role: "assistant", content: "Done!" }],
    };
  } else {
    return {
      messages: [
        { role: "assistant", content: "You didn't approved the action." },
      ],
    };
  }
}

const graph = new StateGraph(State)
  .addNode("draft", draft)
  .addNode("send", send)
  .addNode("approval", approval)
  .addEdge("__start__", "draft")
  .addEdge("draft", "approval")
  .addEdge("approval", "send")
  .addEdge("send", "__end__");

const app = graph.compile({ checkpointer: new MemorySaver() });

async function main() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const config = { configurable: { thread_id: "1" } };
  let interrupts = [];

  while (true) {
    const query = await rl.question("You: ");
    if (query === "/bye") break;

    let input = {
      messages: [
        {
          role: "human",
          content: query,
        },
      ],
    };

    if (interrupts.length) {
      input = new Command({ resume: query === "yes" ? "true" : "false" });
    }

    const result = await app.invoke(input, config);

    interrupts = [];

    type StateWithInterrupt = typeof State.State & {
      __interrupt__: { id: string; value: string }[];
    };

    const _result = (result as StateWithInterrupt).__interrupt__;

    if (_result) {
      interrupts.push(_result[0]);
      console.log("Assistant: ", _result[0]?.value);
    } else {
      console.log(
        "Assistant:",
        result.messages[result.messages.length - 1]?.content
      );
    }
  }

  rl.close();
}

main();
