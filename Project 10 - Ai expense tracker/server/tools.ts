import { tool } from "langchain";
import { Database } from "bun:sqlite";
import z from "zod";

export function initTools(database: Database) {
  /**
   * Add Expense Tool
   */
  const addExpense = tool(
    ({ title, amount }) => {
      // TODO: Do Proper args validations
      const date = new Date().toISOString().split("T")[0]!;

      // TODO: Add Error Handling
      const stmt = database.prepare(
        `INSERT INTO expenses (title, amount, date) VALUES (?, ?, ?)`
      );

      stmt.run(title, amount, date);
      return JSON.stringify({ status: "Success!" });
    },
    {
      name: "add_expense",
      description: "Add the given expense to database.",
      schema: z.object({
        title: z.string().describe("The expense title"),
        amount: z.number().describe("The amount spent"),
      }),
    }
  );

  return [addExpense];
}
