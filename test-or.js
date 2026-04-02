const body = {
  model: "qwen/qwen-2-vl-72b-instruct:free",
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

fetch("https://openrouter.ai/api/v1/chat/completions", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Authorization": "Bearer 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"
  },
  body: JSON.stringify(body)
})
.then(r => r.json())
.then(console.log)
.catch(console.error);
