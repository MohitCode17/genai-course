import express from "express";
import cors from "cors";
import { agent } from "./agent";
import type { StreamMessage } from "./types";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ message: "ok" });
});

app.post("/chat", async (req, res) => {
  // SSE (SERVER SENT EVENTS)
  // 1. ADD SPECIAL HEADER
  // 2. SEND DATA IN SPECIAL FORMAT

  const { query } = req.body;

  res.writeHead(200, {
    "Content-Type": "text/event-stream",
  });

  const response = await agent.stream(
    {
      messages: [
        {
          role: "human",
          content: query,
        },
      ],
    },
    {
      streamMode: ["messages", "custom"],
      // TODO: GENERATE DYNAMICALLY
      configurable: { thread_id: crypto.randomUUID() },
    }
  );

  for await (const [eventType, chunk] of response) {
    console.log("eventtype: ", eventType);
    let message: StreamMessage = {} as StreamMessage;

    if (eventType === "custom") {
      console.log("chunk", chunk);
      message = chunk;
    } else if (eventType === "messages") {
      if (chunk[0].content === "") continue;

      const messageType = chunk[0].type;
      if (messageType === "ai") {
        message = {
          type: "ai",
          payload: { text: chunk[0].content as string },
        };
      } else if (messageType === "tool") {
        message = {
          type: "tool",
          payload: {
            name: chunk[0].name!,
            result: JSON.parse(chunk[0].content as string),
          },
        };
      }
    }

    res.write(`event: ${eventType}\n`);
    res.write(`data: ${JSON.stringify(message)}\n\n`);
  }

  res.end();
});

const PORT = process.env.PORT || 4100;

app.listen(PORT, () =>
  console.log(`Server is running on http://localhost:${PORT}`)
);
