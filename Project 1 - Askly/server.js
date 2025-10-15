import express from "express";
import cors from "cors";
import { generate } from "./chatbot.js";

const app = express();
const port = process.env.PORT;

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("OK");
});

app.post("/chat", async (req, res) => {
  const { message, threadId } = req.body;

  if (!message)
    return res.status(400).json({ message: "Message field is required" });

  const result = await generate(message, threadId);

  res.status(200).json({ message: result });
});

app.listen(port, () => console.log(`Server running at port: ${port}`));
