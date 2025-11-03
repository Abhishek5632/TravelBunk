const form = document.getElementById("chat-form");
const input = document.getElementById("user-input");
const messages = document.getElementById("chat-messages");

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const message = input.value.trim();
  if (!message) return;

  // Show user message
  const userMsg = document.createElement("div");
  userMsg.className = "user-message";
  userMsg.textContent = message;
  messages.appendChild(userMsg);
  input.value = "";

  // Send to backend
  try {
    const res = await fetch("/api/chatbot", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
    });

    const data = await res.json();
    const botMsg = document.createElement("div");
    botMsg.className = "bot-message";
    botMsg.textContent = data.reply || "No response.";
    messages.appendChild(botMsg);
  } catch (err) {
    console.error("Chatbot error:", err);
  }
});
