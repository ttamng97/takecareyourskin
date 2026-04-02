import { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [step, setStep] = useState('onboarding-1'); 
  const [profile, setProfile] = useState({ skinType: '', issues: [], budget: '' });
  
  // Cross check state
  const [scannedProducts, setScannedProducts] = useState([]);
  const [currentInput, setCurrentInput] = useState('');
  
  // Closet state (Persistent)
  const [closet, setCloset] = useState(() => {
    try {
      const saved = localStorage.getItem('skincare_closet');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  useEffect(() => {
    localStorage.setItem('skincare_closet', JSON.stringify(closet));
  }, [closet]);
  
  const [analysisResult, setAnalysisResult] = useState(null);

  const toggleIssue = (issue) => {
    setProfile(prev => ({
      ...prev,
      issues: prev.issues.includes(issue) 
        ? prev.issues.filter(i => i !== issue)
        : [...prev.issues, issue]
    }));
  };

  useEffect(() => {
    if (step === 'scanner') {
      setAnalysisResult(null);
    }
  }, [step]);

  const addProductToCart = () => {
    if (!currentInput.trim()) return;
    setScannedProducts([...scannedProducts, currentInput]);
    setCurrentInput('');
  };

  const addFromClosetToCart = (item) => {
    if (scannedProducts.includes(item)) {
       alert("Sản phẩm này đã ở trong giỏ đối chiếu rồi.");
       return;
    }
    setScannedProducts([...scannedProducts, item]);
  };

  const saveToCloset = () => {
    if (analysisResult && analysisResult.product_name) {
      const name = analysisResult.product_name;
      if (!closet.includes(name) && name !== 'Sản phẩm chưa rõ' && !name.includes('+')) {
        setCloset([...closet, name]);
        alert("Đã cất vào Tủ Đồ Ảo thành công! 💖");
      } else {
        alert("Sản phẩm đã có trong tủ hoặc tên không hợp lệ.");
      }
    }
  };

  const analyzeWithDeepSeek = async (productsToProcess) => {
    setStep('analyzing');
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profile: profile,
          products: productsToProcess
        })
      });

      if (!res.ok) {
        let errStr = "Lỗi server";
        try {
          const errObj = await res.json();
          errStr = errObj.error || errStr;
        } catch(e) {}
        throw new Error(errStr);
      }

      const data = await res.json();
      setAnalysisResult(data);
      setStep('result');

    } catch (err) {
      console.error(err);
      alert("Lỗi: " + err.message);
      setStep('scanner');
    }
  };

  const handleStartAnalysis = () => {
    let toProcess = [...scannedProducts];
    if (currentInput.trim()) {
      toProcess.push(currentInput);
    }
    
    if (toProcess.length === 0) {
      alert("Vui lòng nhập ít nhất 1 sản phẩm");
      return;
    }
    
    if (toProcess.length > 2) {
      toProcess = [toProcess[0], toProcess[1]];
    }

    analyzeWithDeepSeek(toProcess);
  };

  const resetAll = () => {
    setScannedProducts([]);
    setCurrentInput('');
    setAnalysisResult(null);
    setStep('scanner');
  };

  // Remove Logo usage

  return (
    <div className="app-container">
      
      {step === 'onboarding-1' && (
        <div className="glass-panel text-center">
          <div style={{fontSize: '22px', fontWeight: '700', letterSpacing: '1px', background: 'linear-gradient(to right, #fff, #e8a6b2)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: '24px'}}>AI SKINCARE</div>
          <p style={{marginBottom:'24px'}}>Bác sĩ da liễu cá nhân bỏ túi của bạn. Cá nhân hóa phân tích thành phần dựa trên hệ gen da.</p>
          
          <h3 style={{textAlign:'left'}}>✨ Bạn thuộc loại da nào?</h3>
          <div className="ingredient-list">
            {['Da khô', 'Da thường', 'Da dầu', 'Da hỗn hợp'].map(type => (
              <button 
                key={type}
                className={`btn ${profile.skinType === type ? 'selected' : ''}`}
                onClick={() => setProfile({...profile, skinType: type})}
              >
                {type}
              </button>
            ))}
          </div>
          <button className="btn primary" disabled={!profile.skinType} onClick={() => setStep('onboarding-2')}>
            Tạo Hồ Sơ So Sánh
          </button>
        </div>
      )}

      {step === 'onboarding-2' && (
        <div className="glass-panel">
          <div style={{fontSize: '22px', fontWeight: '700', letterSpacing: '1px', background: 'linear-gradient(to right, #fff, #e8a6b2)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: '24px', textAlign: 'center'}}>AI SKINCARE</div>
          <h3>✨ Tình trạng da hiện tại</h3>
          <p style={{marginBottom: '16px'}}>Bạn có thể chọn nhiều vấn đề</p>
          <div className="grid-cols-2">
            {['Mụn ẩn', 'Lão hóa', 'Nhạy cảm', 'Sạm nám', 'Mụn viêm', 'Lỗ chân lông to'].map(issue => (
              <button 
                key={issue}
                className={`btn ${profile.issues.includes(issue) ? 'selected' : ''}`}
                onClick={() => toggleIssue(issue)}
                style={{padding: '12px 10px', fontSize: '15px', marginBottom:'0'}}
              >
                {issue}
              </button>
            ))}
          </div>
          <br/>
          <button className="btn primary" onClick={() => setStep('onboarding-3')}>
            Tiếp tục
          </button>
        </div>
      )}

      {step === 'onboarding-3' && (
        <div className="glass-panel">
          <div style={{fontSize: '22px', fontWeight: '700', letterSpacing: '1px', background: 'linear-gradient(to right, #fff, #e8a6b2)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: '24px', textAlign: 'center'}}>AI SKINCARE</div>
          <h3>✨ Ngân sách mỹ phẩm</h3>
          <p>Để AI hạn chế việc gợi ý hàng vượt quá túi tiền.</p>
          <br/>
          <div className="ingredient-list">
            {['Bình dân (< 300k)', 'Tầm trung (300k - 800k)', 'Cao cấp (> 800k)'].map(budget => (
              <button 
                key={budget}
                className={`btn ${profile.budget === budget ? 'selected' : ''}`}
                onClick={() => setProfile({...profile, budget})}
              >
                {budget}
              </button>
            ))}
          </div>
          <button className="btn primary" disabled={!profile.budget} onClick={() => setStep('scanner')}>
            Khởi Động Bác Sĩ AI
          </button>
        </div>
      )}

      {step === 'scanner' && (
        <div className="glass-panel" style={{padding: '20px 16px', overflowX: 'hidden'}}>
          <div style={{display:'flex', justifyContent:'center', alignItems:'center', marginBottom: '16px'}}>
            <div style={{fontSize: '22px', fontWeight: '700', letterSpacing: '1px', background: 'linear-gradient(to right, #fff, #e8a6b2)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'}}>AI SKINCARE</div>
          </div>

          {/* VIRTUAL CLOSET SECTION */}
          {closet.length > 0 && (
            <div className="closet-section">
              <div style={{display:'flex', alignItems:'center', marginBottom: '12px'}}>
                <span style={{fontSize:'18px', marginRight:'8px'}}>👜</span>
                <h3 style={{margin:0, fontSize:'16px', color:'var(--accent)'}}>Tủ Đồ Ảo Của Tôi</h3>
              </div>
              <div className="closet-scroll">
                {closet.map((item, idx) => (
                  <div className="closet-item" key={idx} onClick={() => addFromClosetToCart(item)}>
                    <div className="closet-item-icon">🧴</div>
                    <div className="closet-item-name">{item}</div>
                    <div className="closet-item-add">+ Lôi ra</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <p style={{fontSize: '13px', marginBottom: '16px', opacity: 0.8}}>
            Hồ sơ: {profile.skinType} | {profile.budget}
          </p>
          
          {scannedProducts.map((prod, idx) => (
             <div className="product-pill" key={idx}>
               <span>✅ Món đồ {idx + 1}: {prod.length > 25 ? prod.substring(0,25) + "..." : prod}</span>
             </div>
          ))}

          {scannedProducts.length < 2 ? (
            <>
              <p style={{fontSize: '14px', marginBottom: '8px'}}>Nhập tên sản phẩm (DeepSeek sẽ tự kiếm thành phần):</p>
              <textarea 
                rows="2" 
                placeholder="VD: Obagi Retinol 1.0..."
                value={currentInput}
                onChange={(e) => setCurrentInput(e.target.value)}
                style={{marginBottom: '10px'}}
              ></textarea>

              {scannedProducts.length === 1 ? (
                <button 
                  className="btn secondary" 
                  onClick={addProductToCart}
                  disabled={!currentInput.trim()}
                >
                  ➕ Mời Bác Sĩ Bắt Đầu Đối Chiếu
                </button>
              ) : (
                <button 
                  className="btn secondary" 
                  onClick={addProductToCart}
                  disabled={!currentInput.trim()}
                >
                  ➕ Đưa vào khay đối chiếu (Cross-check)
                </button>
              )}
            </>
          ) : (
             <p style={{color: 'var(--success)', textAlign: 'center', margin: '20px 0', fontWeight:'600'}}>
               Đã đủ 2 sản phẩm để thực hiện Hội chuẩn Chéo!
             </p>
          )}

          <hr style={{border: 'none', borderTop: '1px solid var(--glass-border)', margin: '20px 0'}}/>

          <button 
            className="btn primary"
            onClick={handleStartAnalysis}
            disabled={scannedProducts.length === 0 && !currentInput.trim()}
          >
            {scannedProducts.length > 0 ? "⚡ Bác Sĩ AI Mở Hồ Sơ Hội Chuẩn" : "Phân Tích Đơn Lẻ Món Này"}
          </button>
        </div>
      )}

      {step === 'analyzing' && (
        <div className="glass-panel" style={{textAlign: 'center', padding: '60px 20px'}}>
          
          <div className="loader" style={{marginBottom: '24px'}}></div>
          <h2>Bác sĩ đang vắt óc<span className="typing-dot"></span></h2>
          <p>Truy xuất kho dữ liệu SkinSort Châu Á...</p>
          <p>Mô phỏng phản ứng sinh hóa học...</p>
          <p>Lùng sục hàng chuẩn Auth giá tốt...</p>
        </div>
      )}

      {step === 'result' && analysisResult && (
        <div className="glass-panel" style={{padding: '24px 20px'}}>
          <div style={{fontSize: '22px', fontWeight: '700', letterSpacing: '1px', background: 'linear-gradient(to right, #fff, #e8a6b2)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: '24px', textAlign: 'center'}}>AI SKINCARE</div>
          
          <h2 style={{fontSize: '22px', lineHeight: '1.3'}}>{analysisResult.product_name}</h2>
          
          {!analysisResult.product_name.includes('+') && (
            <button className="btn secondary" onClick={saveToCloset} style={{padding: '10px 16px', fontSize: '14px', marginBottom: '16px'}}>
              👜 Cất chai này vào Tủ Đồ Ảo
            </button>
          )}

          <div className={`alert-box ${analysisResult.verdict === 'An toàn' ? 'success' : 'danger'}`}>
            <div style={{fontSize: '28px'}}>{analysisResult.verdict === 'An toàn' ? '✨' : '⚠️'}</div>
            <div>
              <h3 style={{marginBottom: '4px', color: analysisResult.verdict === 'An toàn' ? 'var(--success)' : 'var(--danger)'}}>
                {analysisResult.verdict}
              </h3>
              <p style={{fontSize: '15px'}}>{analysisResult.reason}</p>
            </div>
          </div>

          {analysisResult.cross_check_alert && (
            <div style={{background: 'rgba(255, 165, 2, 0.1)', border: '1px solid var(--warning)', padding: '16px', borderRadius: '16px', marginBottom: '20px'}}>
              <h3 style={{color: 'var(--warning)', fontSize: '16px'}}>⚡ KẾT LUẬN XUNG ĐỘT</h3>
              <p style={{fontSize: '14px', color: 'rgba(255,255,255,0.9)'}}>{analysisResult.cross_check_alert}</p>
            </div>
          )}

          <h3 style={{marginTop: '20px'}}>Bóc Tách Chuyên Môn</h3>
          <div className="ingredient-list">
            {analysisResult.ingredients.map((ing, idx) => (
              <div key={idx} className={`ingredient-item ${ing.safety}`}>
                <div>
                  <div style={{fontWeight: '600', fontSize: '15px'}}>{ing.name}</div>
                  <div style={{fontSize: '13px', color: 'var(--text-secondary)'}}>{ing.effect}</div>
                </div>
                <div style={{fontWeight: 'bold', fontSize: '18px'}}>
                  {ing.safety === 'green' ? '✓' : ing.safety === 'red' ? '✗' : '!'}
                </div>
              </div>
            ))}
          </div>

          <div style={{marginTop: '28px', padding: '20px', background: 'rgba(232, 166, 178, 0.1)', borderRadius: '16px', border: '1px solid var(--glass-border)', position:'relative', overflow:'hidden'}}>
            <div style={{position:'absolute', top:'-10px', right:'-10px', fontSize:'80px', opacity:'0.1'}}>🛒</div>
            <h3 style={{color: 'var(--accent)', display: 'flex', alignItems: 'center'}}>
              <span style={{marginRight: '8px', fontSize: '20px'}}>💡</span> Gợi Ý Chuẩn Auth & Rẻ
            </h3>
            <p style={{fontSize: '15px', position:'relative', zIndex:1}}>{analysisResult.recommendation}</p>
            <button className="btn primary" style={{marginTop:'16px'}}>👉 Chốt Đơn Hàng Này (Affiliate Demo)</button>
          </div>

          <button className="btn secondary" onClick={resetAll} style={{marginTop: '32px', border:'none', background:'rgba(255,255,255,0.05)'}}>
            ↺ Thực hiện phiên soi da mới
          </button>
        </div>
      )}

      {/* FOOTER */}
      <div style={{textAlign: 'center', marginTop: '24px', opacity: 0.6, fontSize: '13px', color: 'var(--text-secondary)'}}>
        <p>Phần mềm phi lợi nhuận được thiết kế bởi</p>
        <a href="https://bantaikhoan.vn" target="_blank" rel="noopener noreferrer" style={{color: 'var(--accent)', fontWeight: 'bold', textDecoration: 'none'}}>bantaikhoan.vn</a>
      </div>

    </div>
  );
}

export default App;
