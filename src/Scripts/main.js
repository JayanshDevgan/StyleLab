const chat   = document.getElementById("chat");
const prompt = document.getElementById("prompt");
let   history = [];

prompt.addEventListener("keydown", async e => {
  if (e.key !== "Enter") return;
  const q = prompt.value.trim();
  if (!q) return;
  prompt.value = "";
  push("user", q);
  history.push({ role:"user", content:q });

  const resp = await fetch("/api/chat", {
    method:"POST",
    headers:{ "Content-Type":"application/json" },
    body: JSON.stringify({ messages: history })
  });

  let assistantMsg = { role:"assistant", content:"" };
  history.push(assistantMsg);
  push("assistant", "");                 // placeholder

  const reader  = resp.body.getReader();
  const decoder = new TextDecoder("utf-8");

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    decoder.decode(value).trim().split("\n\n").forEach(line => {
      if (!line) return;
      const json   = JSON.parse(line);
      const token  = json.choices?.[0]?.delta?.content;
      if (token) {
        assistantMsg.content += token;
        updateLast(token);
      }
    });
  }
});

function push(role, text) {
  const div = document.createElement("div");
  div.className = role;
  div.textContent = (role === "user" ? "You: " : "GPT: ") + text;
  chat.appendChild(div);
  window.scrollTo(0, document.body.scrollHeight);
}

function updateLast(extra) {
  const nodes = chat.getElementsByClassName("assistant");
  const last  = nodes[nodes.length - 1];
  last.textContent += extra;
  window.scrollTo(0, document.body.scrollHeight);
}