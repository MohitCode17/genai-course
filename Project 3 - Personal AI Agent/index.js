import Groq from "groq-sdk";
import readline from "node:readline/promises";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const expenseDB = [];
const incomeDB = [];

async function callAgent() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const messages = [
    {
      role: "system",
      content: `You are Josh, a personal finance assistant. Your task is to assist user with their expenses, balances, and financial plannning.
        You have access to following tools:
            1. getTotalExpense({from, to}): string // Get total expense for a time period.
            2. addExpense({name, amount}): string // Add new expense to the expense database.
            3. addIncome({name, amount}): string // Add new income to income database.
            3. getMoneyBalance(): string // Get remaining money balance from database.

        current datetime: ${new Date().toUTCString()}
        `,
    },
  ];

  // This is for User Loop
  while (true) {
    const question = await rl.question(`User: `);

    if (question === "bye") {
      break;
    }

    messages.push({
      role: "user",
      content: question,
    });

    // This is for Agent Loop
    while (true) {
      const completion = await groq.chat.completions.create({
        model: "openai/gpt-oss-120b",
        messages: messages,
        tools: [
          {
            type: "function",
            function: {
              name: "getTotalExpense",
              description: "Get total expenses from date to date.",
              parameters: {
                type: "object",
                properties: {
                  from: {
                    type: "string",
                    description: "From date to get the expense.",
                  },
                  to: {
                    type: "string",
                    description: "To date to get the expense.",
                  },
                },
              },
            },
          },
          {
            type: "function",
            function: {
              name: "addExpense",
              description: "Add new expense entry to the expense database.",
              parameters: {
                type: "object",
                properties: {
                  name: {
                    type: "string",
                    description: "Name of the expense. e.g. Bought an iphone",
                  },
                  amount: {
                    type: "string",
                    description: "Amount of the expense.",
                  },
                },
              },
            },
          },
          {
            type: "function",
            function: {
              name: "addIncome",
              description: "Add new income entry to income database.",
              parameters: {
                type: "object",
                properties: {
                  name: {
                    type: "string",
                    description: "Name of the income. e.g. Got salary",
                  },
                  amount: {
                    type: "string",
                    description: "Amount of the income.",
                  },
                },
              },
            },
          },
          {
            type: "function",
            function: {
              name: "getMoneyBalance",
              description: "Get remaining money balance from database.",
            },
          },
        ],
      });

      messages.push(completion.choices[0].message);

      const toolCalls = completion.choices[0].message.tool_calls;

      if (!toolCalls) {
        console.log(`Josh: ${completion.choices[0].message.content}`);
        break;
      }

      for (const tool of toolCalls) {
        const functionName = tool.function.name;
        const functionArgs = tool.function.arguments;

        let result = "";

        if (functionName === "getTotalExpense") {
          result = getTotalExpense(JSON.parse(functionArgs));
        } else if (functionName === "addExpense") {
          result = addExpense(JSON.parse(functionArgs));
        } else if (functionName === "addIncome") {
          result = addIncome(JSON.parse(functionArgs));
        } else if (functionName === "getMoneyBalance") {
          result = getMoneyBalance(JSON.parse(functionArgs));
        }

        messages.push({
          role: "tool",
          content: result,
          tool_call_id: tool.id,
        });
      }
    }
  }

  rl.close();
}

callAgent();

/**
 * Get Total Expense
 */

function getTotalExpense({ from, to }) {
  console.log(`Calling getTotalExpense tool...`);

  // In Reality -> We call db here.
  const expense = expenseDB.reduce((acc, item) => {
    return acc + item.amount;
  }, 0);

  return `${expense} INR`;
}

/**
 * Add Expense
 */

function addExpense({ name, amount }) {
  console.log("Calling addExpense tool...");
  expenseDB.push({ name, amount });

  return "Added to the expense database.";
}

/**
 * Get Income
 */

function addIncome({ name, amount }) {
  console.log("Calling addIncome tool...");
  incomeDB.push({ name, amount });

  return "Added to the income database.";
}

/**
 * Get Money Balance
 */

function getMoneyBalance() {
  const totalIncome = incomeDB.reduce((acc, item) => acc + item.amount, 0);
  const totalExpense = expenseDB.reduce((acc, item) => acc + item.amount, 0);

  return `${totalIncome - totalExpense} INR`;
}

/**
 * When result of tools comes,
 * Send back to LLM again
 * This cause to make another completion1
 * This happen again when LLM call another tool, we need to make another completion2
 * Solution:
 * We can use looping to get single completion, We call while loop and wrap our completion
 * Make sure to break the loop when Assistant finally gives us a response.
 */
