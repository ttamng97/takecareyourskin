export const config = {
  runtime: 'edge',
};

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  }

  try {
    const { imageBase64 } = await req.json();
    
    if (!imageBase64) {
      return new Response(JSON.stringify({ error: "Không tìm thấy dữ liệu ảnh." }), { status: 400 });
    }

    // Support comma-separated keys like what the user provided
    const rawKeys = process.env.GEMINI_API_KEY;
    if (!rawKeys) {
      return new Response(JSON.stringify({ error: "Lỗi cấu hình: Chưa trỏ chìa khóa GEMINI_API_KEY trên máy chủ Vercel!" }), { status: 500 });
    }
    
    // Pick the first key if there are multiple
    const apiKey = rawKeys.split(',')[0].trim();

    // Remove data:image/jpeg;base64, prefix if present
    const cleanBase64 = imageBase64.replace(/^data:image\/(png|jpeg|jpg);base64,/, "");

    const prompt = `Trích xuất tất cả tên và Danh sách THÀNH PHẦN (Ingredients/INCI list) có trong bức ảnh này. Ghi ra dưới dạng chữ thẳng hàng phân cách bằng dấu phẩy. TUYỆT ĐỐI không phân tích hay giải thích, CHỈ trả lại tên cụm từ tìm thấy. Nếu không thấy bảng thành phần nào, hãy ưu tiên trích xuất tên sản phẩm hoặc các dòng chữ mô tả chính.`;

    const requestBody = {
      contents: [
        {
          parts: [
            { text: prompt },
            {
              inline_data: {
                mime_type: "image/jpeg",
                data: cleanBase64
              }
            }
          ]
        }
      ],
      generationConfig: {
        maxOutputTokens: 500,
        temperature: 0.2
      }
    };

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errBody = await response.text();
      return new Response(JSON.stringify({ error: `Lỗi Google Vision API: ${errBody}` }), { status: 500 });
    }

    const data = await response.json();
    
    let extractedText = "";
    if (data.candidates && data.candidates[0].content.parts.length > 0) {
      extractedText = data.candidates[0].content.parts[0].text;
    }

    if (!extractedText.trim()) {
       extractedText = "Không nhận diện được dòng chữ nào. Hãy chụp rõ ràng hơn hoặc nhập bằng tay.";
    }

    return new Response(JSON.stringify({ text: extractedText.trim() }), { 
      status: 200, 
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message || "Lỗi máy chủ nội bộ Scanner" }), { status: 500 });
  }
}
