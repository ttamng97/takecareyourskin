export const config = {
  runtime: 'edge',
};

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  }

  try {
    const { profile, products } = await req.json();
    
    if (!profile || !products || products.length === 0) {
      return new Response(JSON.stringify({ error: "Thừa hoặc thiếu dữ liệu đầu vào." }), { status: 400 });
    }

    const rawKeys = process.env.DEEPSEEK_API_KEY;
    if (!rawKeys) {
      return new Response(JSON.stringify({ error: "Lỗi cấu hình: Chưa nhập DEEPSEEK_API_KEY trên Vercel!" }), { status: 500 });
    }
    const keys = rawKeys.split(',').filter(k => k.trim() !== '');
    const apiKey = keys[Math.floor(Math.random() * keys.length)].trim();

    let productContext = "";
    if (products.length === 1) {
      productContext = `SẢN PHẨM KHÁCH VỪA QUÉT:\n${products[0]}`;
    } else {
      productContext = `SẢN PHẨM 1:\n${products[0]}\n\nSẢN PHẨM 2:\n${products[1]}`;
    }

    const prompt = `Bạn là chuyên gia da liễu AI cao cấp.
HỒ SƠ DA KHÁCH HÀNG:
- Loại da: ${profile.skinType}
- Vấn đề: ${profile.issues.join(', ')}
- Ngân sách: ${profile.budget}

${productContext}

NHIỆM VỤ: 
1. Nếu đầu vào là một dãy số hoặc mã vạch (Serial), hãy sử dụng tệp dữ liệu kiến thức của bạn để truy xuất ra đúng Tên sản phẩm và Thành phần chính của mã vạch đó (hoặc phỏng đoán mỹ phẩm sát nhất).
2. Phân tích các sản phẩm này. Nếu có 2 sản phẩm, yêu cầu ĐÁNH GIÁ XUNG ĐỘT xem dùng chung có bị kích ứng không (ví dụ: AHA + Retinol).

TRẢ VỀ STRICT JSON FORMAT:
{
"product_name": "Tên sản phẩm (NẾU LÀ MÃ VẠCH, XIN HÃY GHI TÊN NHẬN DIỆN ĐƯỢC CHỨ KHÔNG GHI LẠI SỐ. Kèm '+ SP 2')",
"verdict": "An toàn" hoặc "Rủi ro" hoặc "Xung đột cao",
"reason": "Giải thích ngắn gọn mấu chốt",
"ingredients": [
  { "name": "Tên chất (ghi SP nào nếu 2 SP)", "effect": "tác dụng/hại", "safety": "green|yellow|red" }
],
"cross_check_alert": "Đoạn đánh giá kết hợp nếu 2 SP. 1 SP ghi null.",
"recommendation": "Gợi ý Dupe rẻ mà tốt hơn (nếu rủi ro/vượt ngân sách)."
}`;

    const response = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" }
      })
    });

    if (!response.ok) {
      const errBody = await response.text();
      return new Response(JSON.stringify({ error: `Lỗi DeepSeek API: ${errBody}` }), { status: 500 });
    }

    const data = await response.json();
    let resText = data.choices[0].message.content;
  
    if (resText.includes('\`\`\`json')) {
      resText = resText.split('\`\`\`json')[1].split('\`\`\`')[0].trim();
    } else if (resText.startsWith('\`\`\`')) {
      resText = resText.substring(3, resText.length - 3).trim();
    }

    const jsonResult = JSON.parse(resText);
    return new Response(JSON.stringify(jsonResult), { 
      status: 200, 
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message || "Lỗi máy chủ nội bộ" }), { status: 500 });
  }
}
