const input = document.querySelector("#prompt-input");
const chatContainer = document.querySelector("#chat-container");
const askBtn = document.querySelector("#ask-btn");

input.addEventListener("keyup", handleEnter);
askBtn.addEventListener("click", handleAsk);

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
