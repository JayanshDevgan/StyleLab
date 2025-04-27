const express = require("express");
const morgan = require("morgan");
const cors = require("cors");
const { GoogleGenAI } = require("@google/genai");
const dotenv = require("dotenv");

dotenv.config();

const app = express();
const PORT = 6969;

// Middleware
app.use(morgan("dev"));
app.use(cors());
app.use(express.json());

// Google Gen AI setup
const ai = new GoogleGenAI({});

// Example route
app.post("/generate", async (req, res) => {
	const { hairTexture, faceShape, lifestyle, beardMaintenance, accessoriesStyle } = req.body;

    // Construct the input text based on user responses
    const inputText = `Suggest me hair, beard, and sunglasses based on the following answers:
    Hair Texture: ${hairTexture}
    Face Shape: ${faceShape}
    Lifestyle: ${lifestyle}
    Beard Maintenance: ${beardMaintenance}
    Accessories Style: ${accessoriesStyle}`;

    const config = {
        responseMimeType: 'text/plain',
    };
    const model = 'gemini-2.0-flash';
    const contents = [
        {
            role: 'user',
            parts: [
                {
                    text: inputText,
                },
            ],
        },
    ];

    try {
        const response = await ai.models.generateContentStream({
            model,
            config,
            contents,
        });

        let resultText = '';
        for await (const chunk of response) {
            resultText += chunk.text;
        }

        res.json({ suggestions: resultText });
    } catch (error) {
        console.error("Error generating content:", error);
        res.status(500).json({ error: "An unexpected error occurred.", details: error.message });
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server Listening on PORT http://localhost:${PORT}`);
});