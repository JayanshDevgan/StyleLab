import express from "express";
import { GoogleGenAI, Modality } from "@google/genai";
// import { GoogleGenerativeAI } from "@google/generative-ai";
import * as dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import * as fs from "node:fs";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

// ---------- Gemini proxy (streaming) ----------
const genAI = new GoogleGenAI( {apiKey: process.env.GEMINI_API_KEY_IMG } );

// app.post("/api/chat", async (req, res) => {
//     res.setHeader("Content-Type", "text/event-stream");
//     res.setHeader("Cache-Control", "no-cache");

//     const { messages } = req.body;

//     // Gemini expects plain strings, so join prior messages:
//     const convo = messages.map(m => m.content).join("\n");
//     // Stream tokens:
//     const stream = await model.generateContentStream({ contents: [{ parts: [{ text: convo }] }] });

//     for await (const chunk of stream.stream) {
//         const token = chunk.text();           // returns the incremental text
//         if (token) {
//             res.write(`data: ${JSON.stringify({ token })}\n\n`);
//         }
//     }
    
//     res.end();
//});
  
app.post("/api/image", async (req, res) => {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");

    const { content } = req.body;

    console.log("Request content:", content);
    const response = await genAI.models.generateContent({ 
      model: "gemini-2.0-flash-exp-image-generation",
      contents: content, 
      config: {responseModalities: [Modality.TEXT, Modality.IMAGE]} 
    });

    for (const part of response.candidates[0].content.parts) {
      // Based on the part type, either show the text or save the image
      if (part.text) {
        res.write(`data: ${JSON.stringify({ token: part.text })}\n\n`);
      } else if (part.inlineData) {
        const imageData = part.inlineData.data;
        const buffer = Buffer.from(imageData, "base64");
        const dataURL = `data:image/png;base64,${imageData}`;
        fs.writeFileSync("gemini-native-image.png", buffer);
        res.json({ url: dataURL });   // send to browser
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