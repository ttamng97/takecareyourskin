const body = {
  model: "deepseek-chat",
  messages: [
    {
      role: "user",
      content: [
        { type: "text", text: "What is this?" },
        { type: "image_url", image_url: { url: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=" } }
      ]
    }
  ]
};

fetch("https://api.deepseek.com/chat/completions", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Authorization": "Bearer sk-0a2a3a2ffb7640e2a6d00dd6124b2d05"
  },
  body: JSON.stringify(body)
})
.then(r => r.json())
.then(console.log)
.catch(console.error);
