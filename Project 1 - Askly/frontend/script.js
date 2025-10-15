const input = document.querySelector("#prompt-input");
const chatContainer = document.querySelector("#chat-container");
const askBtn = document.querySelector("#ask-btn");

const threadId =
  Date.now().toString(36) + Math.random().toString(36).substring(2, 6);

input.addEventListener("keyup", handleEnter);
askBtn.addEventListener("click", handleAsk);

// LOADING INDICATOR
const loading = document.createElement("div");
loading.className = "animate-pulse";
loading.textContent = "Thinking...";

async function callServer(message) {
  try {
    const response = await fetch(`http://localhost:3001/chat`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({ threadId, message }),
    });

    if (!response.ok) {
      throw new Error("Error generating LLM response.");
    }

    const result = await response.json();
    return result.message;
  } catch (error) {
    throw new Error("Something went wrong.");
  }
}

async function generate(text) {
  /**
   * 1. Append message to ui
   * 2. Send it to the LLM
   * 3. Append response to ui
   */

  const msg = document.createElement("div");
  msg.className = `mb-4 bg-neutral-800 max-w-fit ml-auto p-4 rounded-2xl text-sm shadow-md`;
  msg.textContent = text;

  chatContainer?.appendChild(msg);
  input.value = "";

  // SHOW LOADING
  chatContainer.appendChild(loading);

  // CALL API
  const botMessage = await callServer(text);

  const botMessageElem = document.createElement("div");
  botMessageElem.className = `mb-4 bg-neutral-800 max-w-fit p-4 rounded-2xl text-sm shadow-md`;
  botMessageElem.textContent = botMessage;

  // HIDE LOADING
  loading.remove();

  chatContainer?.appendChild(botMessageElem);
}

async function handleAsk(e) {
  const text = input?.value?.trim();

  if (!text) {
    return;
  }

  await generate(text);
}

async function handleEnter(e) {
  if (e.key === "Enter") {
    const text = input?.value?.trim();

    if (!text) {
      return;
    }

    await generate(text);
  }
}
