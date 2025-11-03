/* script.js */

// Your Cloudflare Worker endpoint:
const API_URL = "https://withered-king-c68b.wwardhana.workers.dev/";

/* DOM */
const chatForm = document.getElementById("chatForm");
const userInput = document.getElementById("userInput");
const chatWindow = document.getElementById("chatWindow");
const lastQuestion = document.getElementById("lastQuestion");

/* Conversation state (preserved in memory; optionally persist with localStorage) */
let messages = [
  // The worker will prepend its own system prompt; keeping client-side clean.
];

function appendMsg(text, who = "ai") {
  const div = document.createElement("div");
  div.className = `msg ${who}`;
  div.textContent = text;
  chatWindow.appendChild(div);
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

function appendMeta(text) {
  const div = document.createElement("div");
  div.className = "msg meta";
  div.textContent = text;
  chatWindow.appendChild(div);
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

// Greet
appendMsg(
  "Bonjour! I can help with L’Oréal products, routines, and shade matching. Ask away ✨",
  "ai"
);

/* Submit handler */
chatForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const question = userInput.value.trim();
  if (!question) return;

  // Show latest question banner (resets each ask)
  lastQuestion.textContent = `Your question: “${question}”`;

  // Render user bubble immediately
  appendMsg(question, "user");

  // Push into conversation history
  messages.push({ role: "user", content: question });

  // Typing indicator
  const typing = document.createElement("div");
  typing.className = "msg ai";
  typing.textContent = "…thinking";
  chatWindow.appendChild(typing);
  chatWindow.scrollTop = chatWindow.scrollHeight;

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ messages }),
    });

    const data = await res.json();
    const reply =
      data?.choices?.[0]?.message?.content ??
      data?.error ??
      "Sorry—no response.";

    // replace typing with final text
    typing.remove();
    appendMsg(reply, "ai");

    // Add assistant message to history
    messages.push({ role: "assistant", content: reply });
  } catch (err) {
    typing.remove();
    appendMsg(`Error: ${String(err)}`, "ai");
  } finally {
    userInput.value = "";
    userInput.focus();
  }
});
