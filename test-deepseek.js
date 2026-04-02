fetch("https://api.deepseek.com/chat/completions", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Authorization": "Bearer sk-0a2a3a2ffb7640e2a6d00dd6124b2d05"
  },
  body: JSON.stringify({
    model: "deepseek-chat",
    messages: [{ role: "user", content: "Kể tên chính xác các thành phần hóa học INCI của sản phẩm 'Sữa Rửa Mặt Nivea Men Kiểm Soát Nhờn Ngăn Ngừa Mụn'. Trả lời ngắn gọn." }]
  })
}).then(r=>r.json()).then(console.log);
