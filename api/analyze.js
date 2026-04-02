export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { profile, products } = req.body;
    
    if (!profile || !products || products.length === 0) {
      return res.status(400).json({ error: "Missing required data" });
    }

    let productContext = "";
    if (products.length === 1) {
      productContext = `SẢN PHẨM KHÁCH VỪA QUÉT:\n${products[0]}`;
    } else {
      productContext = `SẢN PHẨM 1:\n${products[0]}\n\nSẢN PHẨM 2:\n${products[1]}`;
    }

    const prompt = `
Bạn là chuyên gia da liễu AI cao cấp.
HỒ SƠ DA KHÁCH HÀNG:
- Loại da: ${profile.skinType}
- Vấn đề: ${profile.issues.join(', ')}
- Ngân sách: ${profile.budget}

${productContext}

NHIỆM VỤ: Phân tích các sản phẩm này. Nếu có 2 sản phẩm, yêu cầu ĐÁNH GIÁ XUNG ĐỘT xem dùng chung có bị kích ứng không (ví dụ: AHA + Retinol). 
TRẢ VỀ STRICT JSON FORMAT:
{
"product_name": "Tên sản phẩm (Trường hợp 2 sản phẩm ghi: 'SP 1 + SP 2')",
"verdict": "An toàn" hoặc "Rủi ro" hoặc "Xung đột cao",
"reason": "Giải thích ngắn gọn mấu chốt",
"ingredients": [
  { "name": "Tên chất đáng chú ý (ghi rõ thuộc SP nào nếu có 2 SP)", "effect": "tác dụng/tác hại", "safety": "green|yellow|red" }
],
"cross_check_alert": "Nếu có 2 SP, hãy viết 1 đoạn đánh giá sự kết hợp (đá nhau hay hợp nhau). Nếu chỉ 1 SP thì ghi null.",
"recommendation": "Tư vấn cuối cùng: Nếu rủi ro hoặc vượt ngân sách, gợi ý sản phẩm thay thế (Dupe Finder) rẻ và tốt hơn."
}`;

    const response = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.DEEPSEEK_API_KEY}`
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" }
      })
    });

    if (!response.ok) {
      const errBody = await response.text();
      console.error("Deepseek error:", errBody);
      return res.status(500).json({ error: "Lỗi kết nối tới AI" });
    }

    const data = await response.json();
    let resText = data.choices[0].message.content;
  
    if (resText.includes('\`\`\`json')) {
      resText = resText.split('\`\`\`json')[1].split('\`\`\`')[0].trim();
    } else if (resText.startsWith('\`\`\`')) {
      resText = resText.substring(3, resText.length - 3).trim();
    }

    const jsonResult = JSON.parse(resText);
    res.status(200).json(jsonResult);

  } catch (err) {
    console.error("Server API Error:", err);
    res.status(500).json({ error: "Lỗi máy chủ" });
  }
}
