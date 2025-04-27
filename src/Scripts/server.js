import express from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";
import * as dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

console.log("ChatGPT proxy ready");
dotenv.config();
// require("dotenv").config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

// ---------- Gemini proxy (streaming) ----------
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
  
app.post("/api/chat", async (req, res) => {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");

    const { messages } = req.body;

    // Gemini expects plain strings, so join prior messages:
    const convo = messages.map(m => `${m.role === "user" ? "User" : "AI"}: ${m.content}`).join("\n")        
    
    // Stream tokens:
    const stream = await model.generateContentStream({ contents: [{ parts: [{ text: convo }] }] })      
    for await (const chunk of stream.stream) {
        const token = chunk.text();           // returns the incremental text
        if (token) {
        res.write(`data: ${JSON.stringify({ token })}\n\n`);
        }
    }
    
    res.end();
});




// ---------- Static front-end ----------
app.use(express.static(path.join(__dirname, "..")));

// ---------- Start ----------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`⚡  Chat server at http://localhost:${PORT}`)
);