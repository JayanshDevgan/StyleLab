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
        hair_texture: v("hair_texture"),
        face_shape: v("face_shape"),
        lifestyle: v("lifestyle"),
        beard: v("beard_style"),
        accessory_style: v("accessories"),
    };

    if (Object.values(answers).includes("")) {
        alert("Please complete every dropdown before submitting.");
        return;
    }



//     const chatPrompt = `
// SYSTEM
// You are a professional men's stylist AI.

// USER
// Rules (follow strictly):

// 1. Output one HTML fragment—no markdown, no \`\`\`html.
// 3. Use <b> for bold text.
// 4. Small answer
// 5. Fill the link and keep target attribute.

// TEMPLATE
// <h3>Style Summary: [[HEADLINE]]</h3>

// In list format, describe the following:
// <b>Face:</b>${answers.face_shape}
// <b>Hair:</b>${answers.hair_texture}
// <b>Beard:</b>${answers.beard}
// <b>lifestyle:</b>${answers.lifestyle}
// <b>Accessory:</b>${answers.accessory_style}

// normal:
// <h3>Inspiration Link</h3>
// <a href="link">More ideas</a>

// <p><b>Note:</b> Image may not match all details perfectly.</p>

// Write it
// `;

    const chatSummary = `
<h3>Selected Style Profile</h3>

<ul>
  <li><b>Hair texture:</b> ${answers.hair_texture}</li>
  <li><b>Face shape:</b> ${answers.face_shape}</li>
  <li><b>Lifestyle / profession:</b> ${answers.lifestyle}</li>
  <li><b>Beard style:</b> ${answers.beard}</li>
  <li><b>Accessory preference:</b> ${answers.accessory_style}</li>
</ul>

<p><b>Note:</b> Image may not match all details perfectly.</p>
`;

    // --- 2. Call your /api/chat endpoint ---------------------------------
    // resultBox.innerHTML = "<em>Generating summary…</em>";
    // try {
    //     const r = await fetch("/api/chat", {
    //         method: "POST",
    //         headers: { "Content-Type": "application/json" },
    //         body: JSON.stringify({ messages: [{ role: "user", content: chatSummary }] })
    //     });
    //     const reader = r.body.getReader();
    //     const decoder = new TextDecoder();

    //     resultBox.innerHTML = "";            // clear previous content
    //     while (true) {
    //         const { done, value } = await reader.read();
    //         if (done) break;

    //         const chunk = decoder.decode(value);
    //         // SSE frames separated by double line breaks
    //         chunk.trim().split("\n\n").forEach(line => {
    //             if (!line.startsWith("data:")) return;
    //             const token = JSON.parse(line.replace(/^data:\s*/, "")).token;
    //             if (token) {
    //                 resultBox.innerHTML += token;
    //                 resultBox.scrollTop = resultBox.scrollHeight; // scroll to bottom
    //             }
    //         });
    //     }
    //     console.log(resultBox.innerHTML)
    // } catch (err) {
    //     console.error(err);
    //     resultBox.innerHTML = "<p><em>Sorry, summary generation failed.</em></p>";
    //     return;
    // }

    const imgPrompt = `A confident male model with ${answers.hair} hair, \
                    ${answers.face} face, ${answers.beard.toLowerCase()} beard, dressed in a \
                    ${answers.lifestyle.toLowerCase()} outfit, wearing ${answers.accessory}, \
                    full-body, studio lighting, high resolution`;

    resultBox.innerHTML += chatSummary;
    resultBox.classList.add("show");

    const ph = document.createElement("div");
    ph.className = "img-placeholder";
    resultBox.appendChild(ph);


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
        img.onload = () => {
            // replace loading text with the image
            resultBox.removeChild(ph);
            // resultBox.removeChild(resultBox.querySelector("em"));
            // resultBox.removeChild(resultBox.querySelector("br"));
            // resultBox.removeChild(resultBox.querySelector("br"));
            resultBox.appendChild(img);
            resultBox.scrollTop = resultBox.scrollHeight; // scroll to bottom
            
        };
        img.onerror = () => {
            resultBox.removeChild(ph);
            resultBox.innerHTML += "<p><em>Sorry, image loading failed.</em></p>";
        };
    } catch (err) {
        console.error(err);
        resultBox.innerHTML +=
            "<p><em>Sorry, image generation failed.</em></p>";
    }
});