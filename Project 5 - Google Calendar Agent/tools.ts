import { tool } from "@langchain/core/tools";
import z from "zod";

export const createEventTool = tool(
  async () => {
    // GOOGLE CALENDAR LOGIC GOES HERE...
    return "The meeting has been created";
  },
  // INFORMATION OF TOOL
  {
    name: "create-event",
    description: "Call to create the calendar event.",
    // SCHEMA TO VALIDATE THE QUERY
    schema: z.object({}),
  }
);

export const getEventsTool = tool(
  async () => {
    // GOOGLE CALENDAR LOGIC GOES HERE...
    return JSON.stringify([
      {
        title: "Meeting with Ritkit Shah",
        date: "28th Nov 2025",
        time: "2 PM",
        location: "Gmeet",
      },
    ]);
  },
  // INFORMATION OF TOOL
  {
    name: "get-events",
    description: "Call to get the calendar events.",
    // SCHEMA TO VALIDATE THE QUERY
    schema: z.object({}),
  }
);
