const chat = document.getElementById("chat");
const form = document.getElementById("ask");
const promptEl = document.getElementById("prompt");
const sendBtn = form.querySelector("button");

let history = [];

form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const q = promptEl.value.trim();
    if (!q) return;
    promptEl.value = "";
    push("user", q);
    history.push({ role: "user", content: q });
    sendBtn.disabled = true;

    const resp = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages: history }),
    });

    let assistantMsg = { role: "assistant", content: "" };
    history.push(assistantMsg);
    const placeholder = push("assistant", "");

    const reader = resp.body.getReader();
    const decoder = new TextDecoder("utf-8");

    while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const chunk = decoder.decode(value);
    chunk.trim().split("\n\n").forEach((line) => {
        if (!line.startsWith("data:")) return;
        const json = JSON.parse(line.replace(/^data:\s*/, ""));
        const token = json.token;
        if (token) {
        assistantMsg.content += token;
        placeholder.textContent = assistantMsg.content;
        scrollBottom();
        }
    });
    }
    sendBtn.disabled = false;
    scrollBottom();
});

function push(role, text) {
    const div = document.createElement("div");
    div.className = `bubble ${role}`;
    div.textContent = text;
    chat.appendChild(div);
    scrollBottom();
    return div;
}

function scrollBottom() {
    chat.scrollTo({ top: chat.scrollHeight, behavior: "smooth" });
}