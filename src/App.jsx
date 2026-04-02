import { useState, useRef, useEffect } from 'react';
import './App.css';

function App() {
  const [step, setStep] = useState('onboarding-1'); 
  const [profile, setProfile] = useState({ skinType: '', issues: [], budget: '' });
  
  // Cross check state
  const [scannedProducts, setScannedProducts] = useState([]);
  const [currentInput, setCurrentInput] = useState('');
  
  // Camera state
  const videoRef = useRef(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);

  const toggleIssue = (issue) => {
    setProfile(prev => ({
      ...prev,
      issues: prev.issues.includes(issue) 
        ? prev.issues.filter(i => i !== issue)
        : [...prev.issues, issue]
    }));
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsCameraActive(true);
      }
    } catch (err) {
      console.warn("Camera not available or permission denied", err);
      alert("Không thể mở Camera. Vui lòng thử nhập chữ thay thế.");
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(track => track.stop());
      setIsCameraActive(false);
    }
  };

  const handleCapture = () => {
    // Simulate OCR text extraction from frozen frame
    stopCamera();
    setCurrentInput("Nước hoa hồng, Alcohol Denat, Salicylic Acid, Fragrance, Water...");
    alert("AI đã bóc tách chữ từ ảnh thành công! Bạn có thể chỉnh sửa lại chữ nếu cần.");
  };

  useEffect(() => {
    if (step === 'scanner') {
      // Start camera automatically when visiting scanner step if it's the first time
      setAnalysisResult(null);
    } else {
      stopCamera();
    }
    return stopCamera;
  }, [step]);

  const addProductToCart = () => {
    if (!currentInput.trim()) return;
    setScannedProducts([...scannedProducts, currentInput]);
    setCurrentInput('');
  };

  const analyzeWithDeepSeek = async (productsToProcess) => {
    setStep('analyzing');
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          profile: profile,
          products: productsToProcess
        })
      });

      if (!res.ok) {
        throw new Error("Server error");
      }

      const data = await res.json();
      setAnalysisResult(data);
      setStep('result');

    } catch (err) {
      console.error(err);
      alert("Lỗi server. Vui lòng thử lại!");
      setStep('scanner');
    }
  };

  const handleStartAnalysis = () => {
    // Determine what to process
    let toProcess = [...scannedProducts];
    if (currentInput.trim()) {
      toProcess.push(currentInput);
    }
    
    if (toProcess.length === 0) {
      alert("Vui lòng nhập ít nhất 1 sản phẩm");
      return;
    }
    
    // We only process up to 2 products for now
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

  return (
    <div className="app-container">
      
      {step === 'onboarding-1' && (
        <div className="glass-panel">
          <h1>Hồ sơ Da</h1>
          <p>Trợ lý AI cần biết làn da của bạn để mang đến tư vấn chuẩn xác nhất.</p>
          <br/>
          <h3>✨ Bạn thuộc loại da nào?</h3>
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
            Tiếp tục
          </button>
        </div>
      )}

      {step === 'onboarding-2' && (
        <div className="glass-panel">
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
          <h3>✨ Ngân sách mỹ phẩm</h3>
          <p>Để AI gợi ý hàng thay thế (Dupe) vừa túi tiền cho bạn.</p>
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
            Vào Không Gian Quét
          </button>
        </div>
      )}

      {step === 'scanner' && (
        <div className="glass-panel">
          <h2>Quét Mỹ Phẩm</h2>
          <p style={{fontSize: '13px', marginBottom: '16px'}}>
            Hồ sơ: {profile.skinType} | Ngân sách: {profile.budget}
          </p>
          
          {scannedProducts.map((prod, idx) => (
             <div className="product-pill" key={idx}>
               <span>🛍️ Sản phẩm {idx + 1} đã lưu</span>
             </div>
          ))}

          {scannedProducts.length < 2 ? (
            <>
              <div className={`scanner-frame ${isCameraActive ? 'active' : ''}`} style={{background: isCameraActive ? '#000' : 'rgba(0,0,0,0.3)', borderStyle: isCameraActive ? 'solid' : 'dashed'}}>
                <video 
                   ref={videoRef} 
                   className="scanner-video" 
                   autoPlay playsInline 
                   style={{ display: isCameraActive ? 'block' : 'none' }}
                ></video>
                {isCameraActive && <div className="scan-line"></div>}
                
                {!isCameraActive && (
                   <button className="btn secondary" style={{width: 'auto'}} onClick={startCamera}>
                     📸 Mở Camera
                   </button>
                )}
              </div>

              {isCameraActive && (
                 <button className="btn primary" onClick={handleCapture} style={{marginBottom: '16px'}}>
                   📸 Chụp & Bóc tách Text
                 </button>
              )}

              <p style={{fontSize: '14px', marginBottom: '8px'}}>Ouặc nhập Tên / INCI List:</p>
              <textarea 
                rows="3" 
                placeholder="Ví dụ: Retinol 1%, Water, Glycerin..."
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
                  ➕ Xác nhận Cả 2 Sản phẩm
                </button>
              ) : (
                <button 
                  className="btn secondary" 
                  onClick={addProductToCart}
                  disabled={!currentInput.trim()}
                >
                  ➕ Thêm vào giỏ để đối chiếu chéo
                </button>
              )}
            </>
          ) : (
             <p style={{color: 'var(--accent)', textAlign: 'center', margin: '20px 0'}}>
               Đã đủ 2 sản phẩm để thực hiện Hội chuẩn Chéo!
             </p>
          )}

          <hr style={{border: 'none', borderTop: '1px solid var(--glass-border)', margin: '20px 0'}}/>

          <button 
            className="btn primary"
            onClick={handleStartAnalysis}
            disabled={scannedProducts.length === 0 && !currentInput.trim()}
          >
            {scannedProducts.length > 0 ? "Bác Sĩ AI Mở Hồ Sơ Đối Chiếu" : "Phân Tích Đơn Lẻ Bằng AI"}
          </button>
        </div>
      )}

      {step === 'analyzing' && (
        <div className="glass-panel" style={{textAlign: 'center', padding: '60px 20px'}}>
          <div className="loader" style={{marginBottom: '24px'}}></div>
          <h2>Bác sĩ AI đang phân tích<span className="typing-dot"></span></h2>
          <p>Đang bóc tách thành phần tầng sâu...</p>
          <p>Đang tìm kiếm rủi ro kích ứng...</p>
          <p>Đang lùng sục kho Dupe thay thế...</p>
        </div>
      )}

      {step === 'result' && analysisResult && (
        <div className="glass-panel" style={{padding: '24px 20px'}}>
          
          <h2 style={{fontSize: '24px', lineHeight: '1.3'}}>{analysisResult.product_name}</h2>
          
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
              <h3 style={{color: 'var(--warning)', fontSize: '16px'}}>⚡ Báo Cáo Xung Đột Hệ Thống</h3>
              <p style={{fontSize: '14px', color: 'rgba(255,255,255,0.9)'}}>{analysisResult.cross_check_alert}</p>
            </div>
          )}

          <h3 style={{marginTop: '20px'}}>Ma trận Bóc tách</h3>
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

          <div style={{marginTop: '28px', padding: '20px', background: 'rgba(232, 166, 178, 0.1)', borderRadius: '16px', border: '1px solid var(--glass-border)'}}>
            <h3 style={{color: 'var(--accent)', display: 'flex', alignItems: 'center'}}>
              <span style={{marginRight: '8px', fontSize: '20px'}}>💡</span> Gợi ý thay thế (Dupe Finder)
            </h3>
            <p style={{fontSize: '15px'}}>{analysisResult.recommendation}</p>
          </div>

          <button className="btn primary" onClick={resetAll} style={{marginTop: '32px'}}>
            Bắt đầu Hồ sơ mới
          </button>
        </div>
      )}

    </div>
  );
}

export default App;
