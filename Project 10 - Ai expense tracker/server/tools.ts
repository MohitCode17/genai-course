import { tool } from "langchain";
import { Database } from "bun:sqlite";
import z from "zod";

export function initTools(database: Database) {
  /**
   * Add Expense Tool
   */
  const addExpense = tool(
    ({ title, amount }) => {
      if (!title || amount <= 0) {
        return JSON.stringify({
          status: "error",
          message: "Invalid expense data",
        });
      }

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

  /**
   * Get Expenses Tool
   */
  const getExpenses = tool(
    ({ from, to }) => {
      // TODO: Do proper args validation
      const stmt = database.prepare(
        `SELECT * FROM expenses WHERE date BETWEEN ? AND ?`
      );

      const rows = stmt.all(from, to);
      return JSON.stringify(rows);
    },
    {
      name: "get_expenses",
      description: "Get the expenses from database for given date range",
      schema: z.object({
        from: z.string().describe("Start date in YYYY-MM-DD format"),
        to: z.string().describe("End date in YYYY-MM-DD format"),
      }),
    }
  );

  return [addExpense, getExpenses];
}
