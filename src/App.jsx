import { useState, useEffect } from 'react';
import html2canvas from 'html2canvas';
import './App.css';

function App() {
  const [profile, setProfile] = useState(() => {
    try {
      const saved = localStorage.getItem('skincare_profile');
      return saved ? JSON.parse(saved) : { gender: '', age: 25, skinType: '', issues: [], budget: '', experience: '' };
    } catch { return { gender: '', age: 25, skinType: '', issues: [], budget: '', experience: '' }; }
  });

  const [step, setStep] = useState(profile.skinType ? 'scanner' : 'welcome'); 
  
  useEffect(() => {
    localStorage.setItem('skincare_profile', JSON.stringify(profile));
  }, [profile]);
  
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
    if (!analysisResult || (!analysisResult.analyzed_products && !analysisResult.product_name)) return;
    
    let itemsToSave = analysisResult.analyzed_products || [analysisResult.product_name];
    let newCloset = [...closet];
    let addedCount = 0;

    itemsToSave.forEach(name => {
      if (!newCloset.includes(name) && name !== 'Sản phẩm chưa rõ') {
        newCloset.push(name);
        addedCount++;
      }
    });

    if (addedCount > 0) {
      setCloset(newCloset);
      alert(`Đã cất ${addedCount} món vào Tủ Đồ Ảo thành công! 💖`);
    } else {
      alert("Tất cả món này đã có rùi!");
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

  const handleStartAnalysis = (directItem = null) => {
    let toProcess = [...scannedProducts];
    if (directItem) {
      toProcess = [directItem];
    } else if (currentInput.trim()) {
      toProcess.push(currentInput);
    }
    
    if (toProcess.length === 0) {
      alert("Vui lòng nhập tên sản phẩm");
      return;
    }
    
    if (toProcess.length > 3) {
      toProcess = [toProcess[0], toProcess[1], toProcess[2]];
    }

    analyzeWithDeepSeek(toProcess);
  };

  const resetAll = () => {
    setScannedProducts([]);
    setCurrentInput('');
    setAnalysisResult(null);
    setStep('scanner');
  };

  const downloadImage = async () => {
    const el = document.getElementById('capture-zone');
    if (!el) return;
    try {
      // Tạm thời tắt backdrop-filter để tránh lỗi mờ màu của html2canvas
      const origFilter = el.style.backdropFilter;
      const origWebkitFilter = el.style.webkitBackdropFilter;
      el.style.backdropFilter = 'none';
      el.style.webkitBackdropFilter = 'none';

      const canvas = await html2canvas(el, { 
        backgroundColor: '#1a1417', // Màu nền gốc của body
        scale: 3,
        useCORS: true
      });

      el.style.backdropFilter = origFilter;
      el.style.webkitBackdropFilter = origWebkitFilter;

      const link = document.createElement('a');
      link.download = `PhanTich_${Date.now()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (e) {
      alert("Lỗi tạo ảnh: " + e.message);
    }
  };

  const openShopeeAffiliate = () => {
    if (!analysisResult) return;
    const keyword = analysisResult.recommendation_keyword || analysisResult.product_name;
    const query = encodeURIComponent(keyword);
    // User's Publisher ID: an_17208190000
    window.open(`https://shopee.vn/search?keyword=${query}&utm_campaign=-&utm_content=BocPhotApp&utm_medium=affiliates&utm_source=an_17208190000`, '_blank');
  };

  const handleShareApp = async () => {
    const shareData = {
      title: 'Bác Sĩ Da Liễu Ảo',
      text: 'Bóc phốt mỹ phẩm độc hại và tránh xung đột! Check ngay mỹ phẩm của bạn ở đây:',
      url: window.location.href
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(shareData.url);
        alert('Đã copy link! Hãy dán để gửi cho bạn bè nhé (Facebook, Zalo...).');
      }
    } catch (e) {
      console.log('Share failed:', e);
    }
  };

  // Remove Logo usage

  return (
    <div className="app-container">
      
      {step === 'welcome' && (
        <div className="glass-panel text-center" style={{padding: '40px 20px'}}>
          <div style={{fontSize: '32px', fontWeight: '800', letterSpacing: '1px', background: 'linear-gradient(to right, #fff, #e8a6b2)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: '16px'}}>AI SKINCARE</div>
          <div style={{fontSize:'60px', marginBottom:'20px'}}>✨</div>
          <h2 style={{fontSize: '18px', color: 'rgba(255,255,255,0.9)', marginBottom: '16px', lineHeight: '1.4'}}>
            Bác sĩ Da Liễu Ảo - Bóc tách sự thật bảng thành phần
          </h2>
          <p style={{marginBottom:'32px', color: 'var(--text-secondary)', fontSize: '14px', lineHeight: '1.6'}}>
            Không còn bị dắt mũi bởi quảng cáo! Phân tích độ an toàn và mức độ tương thích của mọi loại mỹ phẩm dựa trên bộ gen da của chính bạn.
          </p>
          
          <button className="btn primary" onClick={() => setStep('onboarding-1')} style={{padding: '16px', fontSize: '16px'}}>
            🚀 Tạo Hồ Sơ Da Miễn Phí
          </button>
        </div>
      )}

      {step === 'onboarding-1' && (
        <div className="glass-panel" style={{textAlign: 'left', padding: '24px 20px'}}>
          <div style={{fontSize: '22px', fontWeight: '700', letterSpacing: '1px', background: 'linear-gradient(to right, #fff, #e8a6b2)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: '24px', textAlign: 'center'}}>BƯỚC 1/2</div>
          
          <h3 style={{fontSize: '16px', color: 'var(--accent)'}}>1. Giới tính của bạn</h3>
          <div className="grid-cols-2" style={{marginBottom: '20px'}}>
            {['Nam', 'Nữ'].map(g => (
              <button key={g} className={`btn ${profile.gender === g ? 'selected' : ''}`} onClick={() => setProfile({...profile, gender: g})} style={{padding: '10px', fontSize: '15px'}}>{g}</button>
            ))}
          </div>

          <h3 style={{fontSize: '16px', color: 'var(--accent)'}}>2. Độ tuổi: <span style={{color:'#fff', fontWeight:'bold'}}>{profile.age}</span> tuổi</h3>
          <div style={{marginBottom: '20px', padding: '0 8px'}}>
            <input 
              type="range" 
              min="12" 
              max="65" 
              value={profile.age || 25} 
              onChange={e => setProfile({...profile, age: e.target.value})}
              style={{width: '100%', accentColor: 'var(--accent)', cursor: 'pointer'}}
            />
          </div>

          <h3 style={{fontSize: '16px', color: 'var(--accent)'}}>3. Loại da cơ bản</h3>
          <div className="grid-cols-2" style={{marginBottom: '20px'}}>
            {['Da khô', 'Da thường', 'Da dầu', 'Da hỗn hợp'].map(type => (
              <button key={type} className={`btn ${profile.skinType === type ? 'selected' : ''}`} onClick={() => setProfile({...profile, skinType: type})} style={{padding: '10px', fontSize: '15px', marginBottom:'0'}}>{type}</button>
            ))}
          </div>

          <h3 style={{fontSize: '16px', color: 'var(--accent)'}}>4. Vấn đề đang gặp (Chọn nhiều)</h3>
          <div className="grid-cols-2" style={{marginBottom: '28px'}}>
            {['Mụn ẩn', 'Lão hóa', 'Nhạy cảm', 'Sạm nám', 'Mụn viêm', 'Lỗ chân lông to'].map(issue => (
              <button key={issue} className={`btn ${profile.issues.includes(issue) ? 'selected' : ''}`} onClick={() => toggleIssue(issue)} style={{padding: '10px', fontSize: '15px', marginBottom:'0'}}>{issue}</button>
            ))}
          </div>

          <button className="btn primary" disabled={!profile.gender || !profile.skinType} onClick={() => setStep('onboarding-2')}>
            Tiếp Tục 👉
          </button>
        </div>
      )}

      {step === 'onboarding-2' && (
        <div className="glass-panel" style={{textAlign: 'left', padding: '24px 20px'}}>
          <div style={{fontSize: '22px', fontWeight: '700', letterSpacing: '1px', background: 'linear-gradient(to right, #fff, #e8a6b2)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: '24px', textAlign: 'center'}}>BƯỚC 2/2</div>

          <h3 style={{fontSize: '16px', color: 'var(--accent)'}}>5. Kinh nghiệm bôi thoa (Treatment)</h3>
          <p style={{fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '12px'}}>Da bạn đã từng dùng các chất lột tẩy mạnh chưa?</p>
          <div style={{marginBottom: '24px'}}>
            {['Chưa từng (Da nguyên bản)', 'Mới tập tành (AHA/BHA nhẹ)', 'Lão làng (Đã quen Retinol/Tret)'].map(exp => (
              <button key={exp} className={`btn ${profile.experience === exp ? 'selected' : ''}`} onClick={() => setProfile({...profile, experience: exp})} style={{marginBottom:'8px', width:'100%', padding: '10px', fontSize: '15px'}}>{exp}</button>
            ))}
          </div>

          <h3 style={{fontSize: '16px', color: 'var(--accent)'}}>6. Mức giá sản phẩm thường mua</h3>
          <p style={{fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '12px'}}>Để loại trừ các món hàng vượt hầu bao.</p>
          <div style={{marginBottom: '28px', display: 'flex', flexDirection: 'column', gap: '8px'}}>
             {['Bình dân (< 300k)', 'Tầm trung (300k - 1 Triệu)', 'Cao cấp (> 1 Triệu)'].map(budget => (
              <button key={budget} className={`btn ${profile.budget === budget ? 'selected' : ''}`} onClick={() => setProfile({...profile, budget})} style={{padding: '10px', fontSize: '15px', margin: 0}}>{budget}</button>
            ))}
          </div>

          <div style={{display: 'flex', gap: '10px'}}>
            <button className="btn secondary" onClick={() => setStep('onboarding-1')} style={{flex: 1}}>
              🔙 Quay Lại
            </button>
            <button className="btn primary" disabled={!profile.experience || !profile.budget} onClick={() => setStep('scanner')} style={{flex: 2}}>
              Hoàn Tất & Bắt Đầu
            </button>
          </div>
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
                  <div className="closet-item" key={idx} style={{position: 'relative'}}>
                    <div 
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        if(window.confirm(`Xóa '${item}' khỏi Tủ Đồ Ảo?`)) {
                          setCloset(closet.filter(c => c !== item)); 
                        }
                      }} 
                      style={{position: 'absolute', top: '4px', right: '4px', fontSize: '12px', cursor: 'pointer', padding: '4px', opacity: 0.6}}
                    >
                      ❌
                    </div>
                    <div className="closet-item-icon" onClick={() => addFromClosetToCart(item)} style={{marginTop: '4px'}}>🧴</div>
                    <div className="closet-item-name" onClick={() => addFromClosetToCart(item)}>{item}</div>
                    <div className="closet-item-add" onClick={() => addFromClosetToCart(item)}>+ Lôi ra</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px'}}>
            <p style={{fontSize: '13px', opacity: 0.8, margin: 0}}>
              Hồ sơ: {profile.skinType} | {profile.budget}
            </p>
            <span style={{fontSize: '12px', color: 'var(--accent)', cursor: 'pointer', textDecoration: 'underline'}} onClick={() => setStep('onboarding-1')}>
              ✏️ Sửa hồ sơ
            </span>
          </div>
          
          {scannedProducts.map((prod, idx) => (
             <div className="product-pill" key={idx}>
               <span>✅ Món đồ {idx + 1}: {prod.length > 25 ? prod.substring(0,25) + "..." : prod}</span>
             </div>
          ))}

          {scannedProducts.length < 3 ? (
            <>
              <p style={{fontSize: '14px', marginBottom: '8px', color: 'var(--accent)'}}>Nhập chính xác tên Sản phẩm (Không nhập Mã vạch/Số):</p>
              <textarea 
                rows="2" 
                placeholder="VD: Kem chống nắng La Roche Posay..."
                value={currentInput}
                onChange={(e) => setCurrentInput(e.target.value)}
                style={{marginBottom: '10px'}}
              ></textarea>

              {scannedProducts.length === 0 ? (
                <button 
                  className="btn primary" 
                  onClick={() => handleStartAnalysis(currentInput)}
                  disabled={!currentInput.trim()}
                  style={{marginBottom: '10px'}}
                >
                  ⚡ Bác Sĩ Phân Tích Món Này
                </button>
              ) : null}
              
              <button 
                className="btn secondary" 
                onClick={addProductToCart}
                disabled={!currentInput.trim()}
              >
                {scannedProducts.length === 0 ? "➕ Đưa vào rổ để KIỂM TRA XUNG ĐỘT (Tối đa 3 món)" : `➕ Thêm Sản Phẩm Thứ ${scannedProducts.length + 1} Vào Rổ`}
              </button>
            </>
          ) : (
             <p style={{color: 'var(--success)', textAlign: 'center', margin: '20px 0', fontWeight:'600'}}>
               Đã đủ 3 sản phẩm để Hội chuẩn Xung Đột Chéo!
             </p>
          )}

          {scannedProducts.length > 0 && (
             <>
               <hr style={{border: 'none', borderTop: '1px solid var(--glass-border)', margin: '20px 0'}}/>
               <button 
                 className="btn primary"
                 onClick={() => handleStartAnalysis()}
               >
                 ⚡ BẮT ĐẦU PHÂN TÍCH CHÉO {scannedProducts.length} MÓN
               </button>
             </>
          )}

          <div style={{marginTop: '30px', textAlign: 'center'}}>
            <span style={{fontSize: '12px', color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: '8px'}}>Thấy hay thì Lan toả nhé 👇</span>
            <button className="btn" onClick={handleShareApp} style={{background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', padding: '10px', fontSize: '13px'}}>
              🔗 Chia sẻ Web cho bạn bè (Facebook, Threads)
            </button>
          </div>
        </div>
      )}

      {step === 'analyzing' && (
        <div className="glass-panel" style={{textAlign: 'center', padding: '60px 20px'}}>
          
          <div className="loader" style={{marginBottom: '24px'}}></div>
          <h2>Bác sĩ đang vắt óc<span className="typing-dot"></span></h2>
          <p>Truy xuất kho dữ liệu SkinSort Châu Á...</p>
          <p>Tính toán hệ gen dựa trên tuổi {profile.age}...</p>
          <p>Mua sắm ưu đãi từ Shopee Mall...</p>
        </div>
      )}

      {step === 'result' && analysisResult && (
        <div id="capture-zone" className="glass-panel" style={{padding: '24px 20px', position: 'relative'}}>
          <div style={{fontSize: '22px', fontWeight: '700', letterSpacing: '1px', background: 'linear-gradient(to right, #fff, #e8a6b2)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: '8px', textAlign: 'center'}}>AI SKINCARE</div>
          
          <h2 style={{fontSize: '22px', lineHeight: '1.3'}}>{analysisResult.product_name}</h2>
          
          <button data-html2canvas-ignore className="btn secondary" onClick={saveToCloset} style={{padding: '10px 16px', fontSize: '14px', marginBottom: '16px'}}>
            👜 Cất từng chai này vào Tủ Đồ Ảo
          </button>

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
              <span style={{marginRight: '8px', fontSize: '20px'}}>💡</span> Gợi Ý Mua Hàng Chuẩn Auth
            </h3>
            <p style={{fontSize: '15px', position:'relative', zIndex:1}}>{analysisResult.recommendation}</p>
            <button data-html2canvas-ignore className="btn primary" style={{marginTop:'16px'}} onClick={openShopeeAffiliate}>
              👉 Mở Shopee Tìm Hàng Chuẩn (Có KM)
            </button>
          </div>

          <div style={{textAlign: 'center', marginTop: '30px', opacity: 0.3, fontSize: '12px'}}>
            Tài trợ phi lợi nhuận bởi bantaikhoan.vn
          </div>

          <button data-html2canvas-ignore className="btn primary" onClick={downloadImage} style={{marginTop: '24px', background: 'var(--glass-bg)', color: '#fff', border: '1px solid var(--glass-border)'}}>
            📸 Tải Ảnh Kết Quả Này & Chia Sẻ
          </button>

          <button data-html2canvas-ignore className="btn secondary" onClick={resetAll} style={{marginTop: '12px', border:'none', background:'rgba(255,255,255,0.05)'}}>
            ↺ Đóng & Phiên soi da mới
          </button>
        </div>
      )}

      {/* FOOTER */}
      <div style={{textAlign: 'center', marginTop: '24px', opacity: 0.6, fontSize: '13px', color: 'var(--text-secondary)'}}>
        <p>Phần mềm phi lợi nhuận được thiết kế bởi</p>
        <a href="https://bantaikhoan.vn" target="_blank" rel="noopener noreferrer" style={{color: 'var(--accent)', fontWeight: 'bold', textDecoration: 'none'}}>bantaikhoan.vn</a>
        
        <div style={{marginTop: '20px', paddingBottom: '20px'}}>
           <span 
              onClick={() => {
                 if(window.confirm("Cảnh báo: Bạn sẽ xóa sạch Hồ sơ da và Tủ đồ ảo để làm lại từ đầu. Xác nhận?")) {
                    localStorage.removeItem('skincare_profile');
                    localStorage.removeItem('skincare_closet');
                    window.location.reload();
                 }
              }} 
              style={{cursor:'pointer', textDecoration:'underline', fontSize:'11px', color:'var(--danger)'}}
           >
              🗑️ Xóa toàn bộ Cài đặt & Tủ đồ
           </span>
        </div>
      </div>

    </div>
  );
}

export default App;
