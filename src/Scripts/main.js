/* Scripts/main.js  —  Style questionnaire front-end
   1. Collect dropdown answers.
   2. Stream Gemini response (with [IMG: …] tokens).
   3. Replace tokens with real Unsplash photos.
   4. Remove any broken images. */

   const form = document.getElementById("ask");
   const resultBox = document.getElementById("result") || createResultBox();
   const UNSPLASH_KEY = "KO-iAzyQW_GmHvs0TP150r6F2oggGGMnHLg4Zd_3N4c";      //  >>> put your key here <<<
   
   function createResultBox() {
       const div = document.createElement("div");
       div.id = "result";
       document.body.appendChild(div);
       return div;
   }
   
   function qs(name) {
       const sel = form.querySelector(`select[name="${name}"]`);
       return sel ? sel.value || null : null;
   }
   
   
   form.addEventListener("submit", async (e) => {
       e.preventDefault();
   
       const answers = {
           hair_texture: qs("hair_texture"),
           face_shape: qs("face_shape"),
           lifestyle: qs("lifestyle"),
           beard: qs("beard_style"),
           accessory_style: qs("accessories"),
       };
   
       if (Object.values(answers).includes(null)) {
           alert("Please choose an option for every question.");
           return;
       }
   
       // --- Prompt: ask Gemini for HTML with [IMG: keyword] tokens ------------
       const prompt = `
      You are an expert men's stylist AI.
   
   Return ONLY an HTML fragment (no markdown, no code fences).  
   Allowed tags: <h3>, <ul>, <li>, <b>, <a>.  
   ★ For the illustration, output **exactly one token** in this form:  [IMG: keyword phrase]  
       • The keyword phrase should be concise (4-8 words) and describe a MALE model who simultaneously shows:  
           Gender: male
          Hair texture: ${answers.hair_texture}  
          Face shape: ${answers.face_shape}  
          Lifestyle / profession style: ${answers.lifestyle}  
          Beard style / maintenance: ${answers.beard}  
          Accessory style: ${answers.accessory_style}  
       • Do NOT output any <img> tags or URLs. My script will fetch the image using that keyword.
       • Also add a warning the image not be perfect, but it should be close.
       • And always give image of a man. so add first keyword man
   
   Output structure:
   
   <h3>Style Summary: …</h3>
   <ul>
     <li><b>Hair:</b> …</li>
     <li><b>Beard:</b> …</li>
     <li><b>Outfit:</b> …</li>
     <li><b>Accessory:</b> …</li>
   </ul>
   
   [IMG: keyword that covers all above traits]
   
   <h3>Inspiration Link</h3>
   <ul>
     <li><a href="https://example.com/gallery" target="_blank">More ideas</a></li>
   </ul>
      `;
   
       resultBox.innerHTML = "<em>Loading…</em>";
   
       // --- Stream Gemini -----------------------------------------------------
       const resp = await fetch("/api/chat", {
           method: "POST",
           headers: { "Content-Type": "application/json" },
           body: JSON.stringify({ messages: [{ role: "user", content: prompt }] })
       });
   
       const reader = resp.body.getReader();
       const dec = new TextDecoder();
       let html = "";
   
       while (true) {
           const { done, value } = await reader.read();
           if (done) break;
           dec.decode(value).trim().split("\n\n").forEach(line => {
               if (!line.startsWith("data:")) return;
               const tok = JSON.parse(line.replace(/^data:\s*/, "")).token;
               if (tok) {
                   html += tok;
                   resultBox.innerHTML = html;         // live preview (tokens still present)
               }
           });
       }
       // --- Replace [IMG: keyword] tokens with real Unsplash URLs ------------
       await replaceTokensWithUnsplash(resultBox);
       // --- Hide any <img> that still fails ----------------------------------
       resultBox.querySelectorAll("img").forEach(img => {
           img.onerror = () => img.remove();
       });
   });
   
   /* ---------------------------------------------------------------------- */
   
   async function replaceTokensWithUnsplash(container) {
       const tokenRegex = /\[IMG:\s*([^\]]+)]/i;
       let match;
       // loop until no more tokens
       while ((match = container.innerHTML.match(tokenRegex))) {
           const keyword = match[1].trim();
           const url = await fetchUnsplash(keyword);
           const imgTag = url
               ? `<img src="${url}" alt="${keyword}" width="280">`
               : "";                                       // if fetch failed, omit image
           container.innerHTML = container.innerHTML.replace(match[0], imgTag);
           console.log("Replaced token:", match[0], "with URL:", url);
       }
   }
   
   async function fetchUnsplash(query) {
       try {
           const r = await fetch(
               `https://api.unsplash.com/photos/random?query=${encodeURIComponent(query)}&orientation=portrait&client_id=${UNSPLASH_KEY}`
           );
           if (!r.ok) return null;
           const { urls } = await r.json();
           return urls && urls.small;
       } catch {
           return null;
       }
   }