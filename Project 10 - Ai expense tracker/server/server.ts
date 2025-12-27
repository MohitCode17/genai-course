import express from "express";
import cors from "cors";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ message: "ok" });
});

app.post("/chat", (req, res) => {
  // SSE (SERVER SENT EVENTS)
  // 1. ADD SPECIAL HEADER
  // 2. SEND DATA IN SPECIAL FORMAT

  const { query } = req.body;

  console.log("Query", query);

  res.writeHead(200, {
    "Content-Type": "text/event-stream",
  });

  setInterval(() => {
    res.write("event: cgPing\n");
    res.write("data: Happy coding\n\n");
  }, 1000);

  //   res.json({});
});

const PORT = process.env.PORT || 4100;

app.listen(PORT, () =>
  console.log(`Server is running on http://localhost:${PORT}`)
);
