import readline from "node:readline/promises";
import { ChatGroq } from "@langchain/groq";
import { Command, MemorySaver } from "@langchain/langgraph";
import { createAgent, humanInTheLoopMiddleware, tool } from "langchain";
import { z } from "zod";

/**
 * Define a model
 */
export const llm = new ChatGroq({
  model: "openai/gpt-oss-120b",
});

/**
 * Define a tools
 */
const createCalendarEvent = tool(
  async ({ title, startTime, endTime, attendees, location }) => {
    // Stub: In practice, this would call Google Calendar API, Outlook API, etc.
    return `Event created: ${title} from ${startTime} to ${endTime} with ${attendees.length} attendees`;
  },
  {
    name: "create_calendar_event",
    description: "Create a calendar event. Requires exact ISO datetime format.",
    schema: z.object({
      title: z.string(),
      startTime: z.string().describe("ISO format: '2024-01-15T14:00:00'"),
      endTime: z.string().describe("ISO format: '2024-01-15T15:00:00'"),
      attendees: z.array(z.string()).describe("email addresses"),
      location: z.string().optional(),
    }),
  }
);

const sendEmail = tool(
  async ({ to, subject, body, cc }) => {
    // Stub: In practice, this would call SendGrid, Gmail API, etc.
    return `Email sent to ${to.join(", ")} - Subject: ${subject}`;
  },
  {
    name: "send_email",
    description:
      "Send an email via email API. Requires properly formatted addresses.",
    schema: z.object({
      to: z.array(z.string()).describe("email addresses"),
      subject: z.string(),
      body: z.string(),
      cc: z.array(z.string()).optional(),
    }),
  }
);

const getAvailableTimeSlots = tool(
  async ({ attendees, date, durationMinutes }) => {
    // Stub: In practice, this would query calendar APIs
    return ["09:00", "14:00", "16:00"];
  },
  {
    name: "get_available_time_slots",
    description:
      "Check calendar availability for given attendees on a specific date.",
    schema: z.object({
      attendees: z.array(z.string()),
      date: z.string().describe("ISO format: '2024-01-15'"),
      durationMinutes: z.number(),
    }),
  }
);

const getContacts = tool(
  async ({ search }) => {
    // Stub: In practice, this would call contact database
    return JSON.stringify([
      {
        id: 1,
        team: "development",
        name: "Mohit Gupta",
        email: "mohitgupta1630.mg@gmail.com",
      },
      { id: 2, team: "design", name: "John", email: "john@codersgyan.com" },
      {
        id: 2,
        team: "development",
        name: "Kevin",
        email: "kevin@codersgyan.com",
      },
    ]);
  },
  {
    name: "get_contacts",
    description: "Get contact lists.",
    schema: z.object({
      search: z
        .string()
        .describe("search query for the contact. e.g: design or mohit gupta"),
    }),
  }
);

/**
 * Define a specialized sub-agents
 */

// 👉 Calendar Agent

const CALENDAR_AGENT_PROMPT = `
You are a calendar scheduling assistant.
Parse natural language scheduling requests (e.g., 'next Tuesday at 2pm')
into proper ISO datetime formats.
Use get_available_time_slots to check availability when needed.
Use create_calendar_event to schedule events.
Always confirm what was scheduled in your final response.
`.trim();

const calendarAgent = createAgent({
  model: llm,
  tools: [createCalendarEvent, getAvailableTimeSlots],
  systemPrompt: CALENDAR_AGENT_PROMPT,
});

// 👉 Email Agent

const EMAIL_AGENT_PROMPT = `
You are an email assistant.
Compose professional emails based on natural language requests.
Extract recipient information and craft appropriate subject lines and body text.
Use send_email to send the message.
Always confirm what was sent in your final response.
`.trim();

const emailAgent = createAgent({
  model: llm,
  tools: [sendEmail],
  systemPrompt: EMAIL_AGENT_PROMPT,
  middleware: [
    humanInTheLoopMiddleware({
      interruptOn: { send_email: true },
      descriptionPrefix: "Outbound email pending approval",
    }),
  ],
});

// 👉 Contact Agent

const CONTACT_AGENT_PROMPT = `
You are an contact assistant.
Find or create contact records as per requirement.
Use get_contacts to get the contact list.
`.trim();

const contactAgent = createAgent({
  model: llm,
  tools: [getContacts],
  systemPrompt: CONTACT_AGENT_PROMPT,
});

/**
 * 👉 Wrap sub-agents as tools
 */

const scheduleEvent = tool(
  async ({ request }) => {
    const result = await calendarAgent.invoke({
      messages: [{ role: "user", content: request }],
    });
    const lastMessage = result.messages[result.messages.length - 1];
    return lastMessage?.text;
  },
  {
    name: "schedule_event",
    description: `
Schedule calendar events using natural language.

Use this when the user wants to create, modify, or check calendar appointments.
Handles date/time parsing, availability checking, and event creation.

Input: Natural language scheduling request (e.g., 'meeting with design team next Tuesday at 2pm')
    `.trim(),
    schema: z.object({
      request: z.string().describe("Natural language scheduling request"),
    }),
  }
);

const manageEmail = tool(
  async ({ request }) => {
    const result = await emailAgent.invoke({
      messages: [{ role: "user", content: request }],
    });
    const lastMessage = result.messages[result.messages.length - 1];
    return lastMessage?.text;
  },
  {
    name: "manage_email",
    description: `
Send emails using natural language.

Use this when the user wants to send notifications, reminders, or any email communication.
Handles recipient extraction, subject generation, and email composition.

Input: Natural language email request (e.g., 'send them a reminder about the meeting')
    `.trim(),
    schema: z.object({
      request: z.string().describe("Natural language email request"),
    }),
  }
);

const manageContacts = tool(
  async ({ request }) => {
    const result = await contactAgent.invoke({
      messages: [{ role: "user", content: request }],
    });
    const lastMessage = result.messages[result.messages.length - 1];
    return lastMessage?.text;
  },
  {
    name: "manage_contacts",
    description: `
Get contacts using natural language.

Use this when the user wants to get list of contacts or even single contact.

Input: Natural language contact request (e.g., 'give me all contacts for design team.')
    `.trim(),
    schema: z.object({
      request: z.string().describe("Natural language contact list request"),
    }),
  }
);

/**
 * Create a Supervisor Agent
 */
const SUPERVISOR_PROMPT = `
You are a helpful personal assistant.
You can schedule calendar events and send emails.
To send emails/notifications, first call the manage_contacts tool to get email addresses.
Break down user requests into appropriate tool calls and coordinate the results.
When a request involves multiple actions, use multiple tools in sequence. Make sure to call the tools in correct order.
IMPORTANT: If the user rejects an email or action DO NOT recreate or retry. Simply acknowledge the rejection and the user what they would like to do instead. Do not attempt to send a modified version unless explicitly asked.
`.trim();

const supervisorAgent = createAgent({
  model: llm,
  tools: [scheduleEvent, manageEmail, manageContacts],
  systemPrompt: SUPERVISOR_PROMPT,
  checkpointer: new MemorySaver(),
});

/**
 * Main - Calling the llm
 */

type Interruptvalue = {
  actionRequests: {
    description: string;
  }[];

  reviewConfigs: {
    allowedDecisions: string[];
  }[];
};

async function main() {
  let interrupts: any[] = [];

  const config = { configurable: { thread_id: "1" } };

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  while (true) {
    const query = await rl.question("You: ");

    if (query === "/bye") break;

    /*
    if (actionRequest.name === "send_email") {
      // Edit email
      const editedAction = { ...actionRequest };
      editedAction.arguments.subject = "Mockups reminder";
      resume[interrupt.id] = {
        decisions: [{ type: "edit", editedAction }],
      };
    } else {
      resume[interrupt.id] = { decisions: [{ type: "approve" }] };
    }
    */
    let resume: Record<string, any> = {};

    if (interrupts.length) {
      const interrupt = interrupts[0];

      if (query === "2") {
        // TODO: Handle Edit Logic
        // SHOW USER THE PROMPT - ALL FIELDS
        // WHAT TO EDIT
      } else {
        resume[interrupt.id] = {
          decisions: [
            { type: query === "1" ? "approve" : query === "3" ? "reject" : "" },
          ],
        };
      }
    }

    const result = await supervisorAgent.invoke(
      interrupts.length
        ? new Command({ resume })
        : {
            messages: [{ role: "user", content: query }],
          },
      config
    );

    interrupts = [];

    let output = "";

    if (result?.__interrupt__) {
      interrupts.push(result.__interrupt__[0]);
      // show the approval
      output +=
        (result.__interrupt__[0]?.value as Interruptvalue).actionRequests[0]
          ?.description + "\n\n";

      output += "Choose one option:\n\n";

      output += (
        result.__interrupt__[0]?.value as Interruptvalue
      ).reviewConfigs[0]?.allowedDecisions
        .map((decision, index) => `${index + 1}. ${decision}`)
        .join("\n");

      console.log(output);
    } else {
      console.log(
        "Assistant: ",
        result.messages[result.messages.length - 1]?.content
      );
    }

    // for await (const step of stream) {
    //   for (const update of Object.values(step)) {
    //     if (update && typeof update === "object" && "messages" in update) {
    //       for (const message of update.messages) {
    //         console.log(message.toFormattedString());
    //       }
    //     }
    //   }
    // }
  }

  rl.close();
}

main();
