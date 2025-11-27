import { tool } from "@langchain/core/tools";
import { google } from "googleapis";
import z from "zod";

import tokens from "./tokens.json";

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URL
);

oauth2Client.setCredentials(tokens);

// Create a new Calendar API client.
const calendar = google.calendar({ version: "v3", auth: oauth2Client });

type Params = {
  q: string;
  timeMin: string;
  timeMax: string;
};

export const getEventsTool = tool(
  async (params) => {
    /**
     * timeMin
     * timeMax
     * q
     */
    const { q, timeMin, timeMax } = params as Params;

    // GOOGLE CALENDAR LOGIC GOES HERE...
    try {
      const response = await calendar.events.list({
        calendarId: "mohitgupta1630.mg@gmail.com",
        q: q,
        timeMin,
        timeMax,
      });
      const result = response.data.items?.map((event) => {
        return {
          id: event.id,
          summary: event.summary,
          status: event.status,
          organiser: event.organizer,
          start: event.start,
          end: event.end,
          attendees: event.attendees,
          meetingLink: event.hangoutLink,
          eventType: event.eventType,
        };
      });
      return JSON.stringify(result);
    } catch (error) {
      console.log("EERRR", error);
    }
    return "Failed to connect to the calendar.";
  },
  {
    name: "get-events",
    description: "Call to get the calendar events.",
    schema: z.object({
      q: z
        .string()
        .describe(
          "The query to be used to get events from google calendar. It can be one of these values: summary, description, location, attendees display name, attendees email, organiser's name, organiser's email"
        ),
      timeMin: z.string().describe("The from datetime to get events."),
      timeMax: z.string().describe("The to datetime to get events."),
    }),
  }
);

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
    schema: z.object({
      query: z
        .string()
        .describe(
          "The query to be used to create events into google calendar."
        ),
    }),
  }
);
