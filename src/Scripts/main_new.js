/* Scripts/main.js  —  Generate a custom fashion image */

const form = document.getElementById("ask");
const resultBox = makeResultBox();

const imgBox = document.createElement("div");
imgBox.id = "img";
resultBox.appendChild(imgBox);

function makeResultBox() {
    const div = document.createElement("div");
    div.id = "result";
    document.body.appendChild(div);
    return div;
}

const v = (name) => form.querySelector(`select[name="${name}"]`).value;

form.addEventListener("submit", async (e) => {
    e.preventDefault();

    // --- 1. Gather answers -------------------------------------------------
    const answers = {
        hair: v("hair_texture"),
        face: v("face_shape"),
        lifestyle: v("lifestyle"),
        beard: v("beard_style"),
        accessory: v("accessories"),
    };

    if (Object.values(answers).includes("")) {
        alert("Please complete every dropdown before submitting.");
        return;
    }



    const chatPrompt = `
    You are an expert men's stylist AI.  
    Return **ONLY an HTML fragment** (no markdown, no code fences).  
    Allowed tags: <h3>, <ul>, <li>, <b>, <a>.  
    Use short, punchy bullet points.

    User profile
    • Primary hair texture: ${answers.hair_texture}
    • Face shape: ${answers.face_shape}
    • Lifestyle / profession: ${answers.lifestyle}
    • Beard-maintenance preference: ${answers.beard}
    • Accessory style: ${answers.accessory_style}

    Tasks
    1. Summarize the user's overall aesthetic in one short line.  
    2. Recommend a haircut and basic styling routine that matches the hair texture & face shape.  
    3. Give beard-care or clean-shave tips that respect the maintenance level.  
    4. Suggest two everyday outfits suited to the lifestyle (mention colors & layering).  
    5. Highlight one accessory idea that fits “${answers.accessory_style}”.  
    6. End with one Pinterest link for visual inspo.
    `;

    // --- 2. Call your /api/chat endpoint ---------------------------------
    resultBox.innerHTML = "<em>Generating summary…</em>";
    try {
        const r = await fetch("/api/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ messages: [{ role: "user", content: chatPrompt }] })
        });
        const reader = r.body.getReader();
        const decoder = new TextDecoder("utf-8");
        let assistant = "";                    // accumulate full assistant reply
        const lineBuf = [];

        resultBox.innerHTML = "";            // clear previous content
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value);
            // SSE frames separated by double line breaks
            chunk.trim().split("\n\n").forEach(line => {
                if (!line.startsWith("data:")) return;
                const { token } = JSON.parse(line.slice(5));  // remove "data:" prefix
                if (token) {
                    assistant += token;
                    // update the last assistant line or create it once
                    // if (lineBuf.length === 0) {
                        
                    //     resultBox.innerHTML = assistant;
                    //     // lineBuf.push(div);
                    // }
                    // lineBuf[0].textContent = assistant;
                    resultBox.innerHTML += token;
                    resultBox.scrollTop = resultBox.scrollHeight; // scroll to bottom
                }
            });
        }
    } catch (err) {
        console.error(err);
        resultBox.innerHTML = "<p><em>Sorry, summary generation failed.</em></p>";
        return;
    }

    const imgPrompt = `A confident male model with ${answers.hair} hair, \
                    ${answers.face} face, ${answers.beard.toLowerCase()} beard, dressed in a \
                    ${answers.lifestyle.toLowerCase()} outfit, wearing ${answers.accessory.toLowerCase()}, \
                    full-body, studio lighting, high resolution`;

    resultBox.innerHTML += "<br><br><em>Generating image…</em>";


    // --- 3. Call your /api/image endpoint ---------------------------------
    try {
        const r = await fetch("/api/image", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ content: imgPrompt })
        });
        const { url } = await r.json();

        if (!url) throw new Error("No URL returned");

        const img = new Image();
        img.src = url;
        img.alt = "Generated style look";
        img.width = 320;
        img.onload = () => {
            // replace loading text with the image
            resultBox.removeChild(resultBox.querySelector("em"));
            resultBox.appendChild(img);
        };
        img.onerror = () => {
            resultBox.innerHTML = "" +
                "<p><em>Sorry, image loading failed.</em></p>";
        };
    } catch (err) {
        console.error(err);
        resultBox.innerHTML = "" +
            "<p><em>Sorry, image generation failed.</em></p>";
    }
});