import { useState, useEffect } from 'react';
import React from 'react';
import './App.css';

// HỆ THỐNG ÂM THANH ĐỘC LẬP (Không cần file mp3)
const getAudioCtx = () => {
  if (!window.audioCtxInstance) {
    window.audioCtxInstance = new (window.AudioContext || window.webkitAudioContext)();
  }
  return window.audioCtxInstance;
};

const playTone = (freq, type, duration, vol = 0.1) => {
  try {
    const ctx = getAudioCtx();
    if(ctx.state === 'suspended') ctx.resume();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    gain.gain.setValueAtTime(vol, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch(e){}
};

export const sounds = {
  correct: () => {
    playTone(880, 'sine', 0.5, 0.15); 
    setTimeout(() => playTone(1108.73, 'sine', 0.8, 0.15), 100);
  },
  wrong: () => {
    playTone(200, 'sawtooth', 0.3, 0.15);
    setTimeout(() => playTone(150, 'sawtooth', 0.4, 0.15), 150);
  },
  explosion: () => {
    try {
      const ctx = getAudioCtx();
      if(ctx.state === 'suspended') ctx.resume();
      const bufferSize = ctx.sampleRate * 1.5;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      const gain = ctx.createGain();
      
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 800;

      gain.gain.setValueAtTime(0.6, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1.2);
      
      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      noise.start();
    } catch(e){}
  },
  suspense: () => {
    try {
      const ctx = getAudioCtx();
      if(ctx.state === 'suspended') ctx.resume();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(150, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 1.8);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 1.8);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 1.8);
    } catch(e){}
  },
  tick: () => {
    playTone(800, 'square', 0.05, 0.03);
  },
  flip: () => {
    playTone(300, 'sine', 0.1, 0.05);
  }
};

const bombConfig = [
  { text: '💥 BOM NỔ -1', desc: 'Trừ ngay 1 điểm. Qua lượt.', type: 'bomb-bad', count: 3, sound: 'explosion' },
  { text: '💣 BOM NỔ -2', desc: 'Trừ ngay 2 điểm. Qua lượt.', type: 'bomb-bad', count: 2, sound: 'explosion' },
  { text: '🪚 CƯA ĐÔI', desc: 'Lập tức chia đôi số điểm hiện tại của đội bốc (làm tròn xuống).', type: 'bomb-bad', count: 1, sound: 'explosion' },
  { text: '☠️ RESET', desc: 'Bay sạch điểm, đưa về số 0 tròn trĩnh.', type: 'bomb-bad', count: 1, sound: 'explosion' },
  { text: '🎁 QUÀ TẶNG +1', desc: 'Lập tức cộng 1 điểm miễn phí.', type: 'bomb-good', count: 2, sound: 'correct' },
  { text: '💎 QUÀ TẶNG +2', desc: 'Lập tức cộng 2 điểm miễn phí.', type: 'bomb-good', count: 2, sound: 'correct' },
  { text: '🎲 ROULETTE NGA', desc: 'Hên xui 50/50: Hãy chọn 1 trong 2 lá bài để định đoạt số phận!', type: 'bomb-action', count: 1, sound: 'suspense' },
  { text: '🥷 ĂN CƯỚP', desc: 'Chỉ định lấy 1 điểm từ 1 đội bất kỳ.', type: 'bomb-action', count: 2, sound: 'explosion' },
  { text: '🔄 ĐỔI VẬN', desc: 'Tráo đổi toàn bộ điểm số hiện tại với 1 đội bất kỳ.', type: 'bomb-action', count: 1, sound: 'correct' },
  { text: '🤝 CỘNG SINH', desc: 'Đội bốc trúng được +2 điểm, và có quyền kéo thêm 1 đội khác cùng được +2 điểm.', type: 'bomb-action', count: 2, sound: 'correct' },
  { text: '🧤 BÀN TAY THANOS', desc: 'Giáng điểm của đội đang dẫn đầu xuống bằng mức điểm của đội đang bét bảng.', type: 'bomb-action', count: 1, sound: 'explosion' }
];

const questionsData = [

  {
    text: "Khẳng định: “Năm tháng sẽ trôi qua, nhưng thắng lợi của nhân dân ta trong sự nghiệp kháng chiến chống Mỹ, cứu nước mãi mãi được ghi vào lịch sử dân tộc ta như một trong những trang chói lọi nhất...” là của Đại hội nào của Đảng?",
    options: ["A. Đại hội lần thứ VI", "B. Đại hội lần thứ V", "C. Đại hội lần thứ IV", "D. Đại hội lần thứ III"],
    answer: "C"
  },
  {
    text: "Một trong những bài học kinh nghiệm lãnh đạo của Đảng trong thời kỳ 1954 - 1975 là:",
    options: ["A. Giương cao ngọn cờ độc lập dân tộc và chủ nghĩa xã hội nhằm huy động sức mạnh toàn dân đánh Mỹ, cả nước đánh Mỹ", "B. Chỉ tập trung xây dựng chủ nghĩa xã hội ở miền Bắc", "C. Hạn chế sự tham gia của quần chúng nhân dân trong chiến tranh", "D. Không tranh thủ sự đồng tình, ủng hộ của quốc tế"],
    answer: "A"
  },
  {
    text: "Sau năm 1975, đất nước ta bước vào thời kỳ nào?",
    options: ["A. Kinh tế thị trường xã hội chủ nghĩa", "B. Đất nước hòa bình, độc lập thống nhất, cả nước quá độ lên chủ nghĩa xã hội", "C. Hoàn thành công nghiệp hóa, hiện đại hóa", "D. Đổi mới toàn diện và hội nhập quốc tế"],
    answer: "B"
  },
  {
    text: "Nhiệm vụ đầu tiên, bức thiết nhất được Đảng đặt ra sau đại thắng mùa Xuân năm 1975 là gì?",
    options: ["A. Phát triển các quy chế, chuẩn mực về kinh tế", "B. Cải tạo công thương nghiệp tư bản tư doanh", "C. Thống nhất đất nước về mặt nhà nước", "D. Khôi phục hoàn toàn cơ sở hạ tầng thời chiến"],
    answer: "C"
  },
  {
    text: "Đoàn đại biểu miền Nam do ai dẫn đầu tham dự Hội nghị Hiệp thương chính trị với miền Bắc vào tháng 11/1975?",
    options: ["A. Phạm Hùng", "B. Huỳnh Tấn Phát", "C. Trường Chinh", "D. Nguyễn Hữu Thọ"],
    answer: "A"
  },
  {
    text: "Điền từ còn thiếu trong Nghị quyết Hội nghị TW 24 (8/1975): “... đất nước vừa là nguyện vọng thiết tha của nhân dân cả nước, vừa là quy luật khách quan của sự phát triển cách mạng Việt Nam, của lịch sử dân tộc Việt Nam.”",
    options: ["A. Độc lập", "B. Thống nhất", "C. Giải phóng", "D. Đổi mới"],
    answer: "B"
  },
  {
    text: "Hội nghị Hiệp thương chính trị giữa hai đoàn đại biểu miền Bắc và miền Nam (11/1975) đã diễn ra tại đâu?",
    options: ["A. Sài Gòn", "B. Hà Nội", "C. Huế", "D. Đà Nẵng"],
    answer: "A"
  },
  {
    text: "Cuộc Tổng tuyển cử bầu Quốc hội chung trên toàn lãnh thổ (25/4/1976) được tiến hành theo những nguyên tắc nào?",
    options: ["A. Dân chủ, phổ thông, bình đẳng, trực tiếp và bỏ phiếu kín", "B. Hiệp thương dân chủ và chỉ định đại biểu", "C. Bỏ phiếu gián tiếp qua hội đồng nhân dân các cấp", "D. Phổ thông, công khai và trực tiếp"],
    answer: "A"
  },
  {
    text: "Tại kỳ họp thứ nhất Quốc hội khóa VI (6-7/1976), ai được bầu làm Chủ tịch nước đầu tiên của nước Cộng hòa Xã hội chủ nghĩa Việt Nam?",
    options: ["A. Phạm Văn Đồng", "B. Tôn Đức Thắng", "C. Trường Chinh", "D. Lê Duẩn"],
    answer: "B"
  },
  {
    text: "Mặt trận Tổ quốc Việt Nam, Đoàn Thanh niên Lao động Hồ Chí Minh, Tổng Công đoàn Việt Nam... được gọi chung là gì?",
    options: ["A. Cơ quan quyền lực nhà nước", "B. Các tổ chức kinh tế tập thể", "C. Các tổ chức chính trị - xã hội", "D. Cơ quan hành chính trung ương"],
    answer: "C"
  },
  {
    text: "Đại hội đại biểu toàn quốc lần thứ IV của Đảng (12/1976) đã quyết định đổi tên Đảng thành gì?",
    options: ["A. Đảng Lao động Việt Nam", "B. Đảng Cộng sản Đông Dương", "C. Đảng Cộng sản Việt Nam", "D. Hội đồng Cách mạng Việt Nam"],
    answer: "C"
  },
  {
    text: "Đại hội lần thứ IV của Đảng (12/1976) đã xác định đặc điểm nào là lớn nhất của cách mạng Việt Nam trong giai đoạn mới?",
    options: ["A. Cả nước tiến hành cuộc đấu tranh giải phóng dân tộc", "B. Từ một xã hội kinh tế còn phổ biến là sản xuất nhỏ tiến thẳng lên CNXH, bỏ qua giai đoạn phát triển TBCN", "C. Chịu hậu quả nặng nề do sự bao vây cấm vận của chủ nghĩa đế quốc", "D. Đã hoàn thành xong thời kỳ quá độ lên chủ nghĩa xã hội"],
    answer: "B"
  },
  {
    text: "Đại hội IV của Đảng xác định nhiệm vụ trung tâm của cả thời kỳ quá độ lên CNXH ở nước ta là gì?",
    options: ["A. Đẩy mạnh công nghiệp hóa xã hội chủ nghĩa", "B. Phát triển kinh tế nhiều thành phần", "C. Hoàn thành cải cách ruộng đất", "D. Đẩy mạnh kinh tế thị trường"],
    answer: "A"
  },
  {
    text: "Một trong những hạn chế, khuyết điểm chủ quan của Đại hội IV (1976) được Đảng chỉ ra là gì?",
    options: ["A. Đánh giá quá thấp sức mạnh của khối đại đoàn kết dân tộc", "B. Không chú trọng đến nhiệm vụ củng cố an ninh - quốc phòng", "C. Dự kiến hoàn thành đưa nền kinh tế từ sản xuất nhỏ lên sản xuất lớn XHCN trong khoảng 20 năm", "D. Chưa đặt nhiệm vụ thống nhất đất nước lên hàng đầu"],
    answer: "C"
  },
  {
    text: "Hội nghị Trung ương 6 (8/1979) được coi là bước đột phá đầu tiên trong đổi mới kinh tế của Đảng với chủ trương nào?",
    options: ["A. Phát triển kinh tế thị trường định hướng xã hội chủ nghĩa", "B. Phá bỏ những rào cản để cho “sản xuất bung ra”", "C. Tư nhân hóa hoàn toàn các xí nghiệp quốc doanh", "D. Xóa bỏ triệt để các hợp tác xã nông nghiệp"],
    answer: "B"
  },
  {
    text: "Trước hiện tượng \"khoán chui\" trong hợp tác xã nông nghiệp, Ban Bí thư đã ban hành văn kiện nào vào tháng 1/1981?",
    options: ["A. Chỉ thị số 100-CT/TW", "B. Chỉ thị số 228-CT/TW", "C. Quyết định số 25-CP", "D. Quyết định số 26-CP"],
    answer: "A"
  },
  {
    text: "Cuối tháng 12/1978, tập đoàn Pôn Pốt huy động tổng lực tiến công xâm lược trên toàn tuyến biên giới Tây Nam của Việt Nam nhằm mục tiêu gì?",
    options: ["A. Chiếm đảo Thổ Chu và Phú Quốc", "B. Nhanh chóng tiến sâu vào nội địa Việt Nam", "C. Buộc Việt Nam mở cửa biên giới tự do thương mại", "D. Phá hoại quan hệ hữu nghị giữa Việt Nam và Liên Xô"],
    answer: "B"
  },
  {
    text: "Ngày 17/2/1979, diễn ra sự kiện lịch sử quan trọng nào trên tuyến biên giới nước ta?",
    options: ["A. Tập đoàn Pôn Pốt tấn công xâm lấn biên giới Tây Nam", "B. Trung Quốc huy động hơn 60 vạn quân đồng loạt tấn công toàn tuyến biên giới phía Bắc", "C. Lực lượng FULRO chiếm đóng các tỉnh Tây Nguyên", "D. Mỹ đưa hạm đội vào phong tỏa vùng biển miền Trung"],
    answer: "B"
  }
];

const revIcons = ['★', '☭', '★', '☭'];

function App() {
  const [cells, setCells] = useState([]);
  const [selectedCard, setSelectedCard] = useState(null);

  // States cho Roulette Nga
  const [rouletteCards, setRouletteCards] = useState([]);
  const [rouletteChoiceIndex, setRouletteChoiceIndex] = useState(null); 
  const [bombEffect, setBombEffect] = useState('');

  // States cho Câu hỏi
  const [timeLeft, setTimeLeft] = useState(30);
  const [clickedOptions, setClickedOptions] = useState([]);
  const [isQuestionSolved, setIsQuestionSolved] = useState(false);
  const [isBombRevealed, setIsBombRevealed] = useState(false);

  // Khởi tạo ma trận
  useEffect(() => {
    let initialCells = [];
    for (let i = 1; i <= 18; i++) {
      initialCells.push({ 
        id: `Q${i}`, 
        label: `CÂU SỐ ${i}`,
        content: questionsData[i - 1],
        type: 'question', 
        isOpened: false,
        frontIcon: revIcons[Math.floor(Math.random() * revIcons.length)],
        sound: '/question.mp3'
      });
    }

    bombConfig.forEach((bomb, bIdx) => {
      for (let i = 0; i < bomb.count; i++) {
        initialCells.push({ 
          id: `B_${bIdx}_${i}`, 
          label: bomb.text,
          content: bomb.desc, 
          type: bomb.type, 
          isOpened: false,
          frontIcon: revIcons[Math.floor(Math.random() * revIcons.length)],
          sound: bomb.sound
        });
      }
    });

    for (let i = initialCells.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [initialCells[i], initialCells[j]] = [initialCells[j], initialCells[i]];
    }

    setCells(initialCells);
  }, []);

  // Timer cho câu hỏi
  useEffect(() => {
    let timerId;
    if (selectedCard?.type === 'question' && timeLeft > 0 && !isQuestionSolved) {
      timerId = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 6 && prev > 1) sounds.tick();
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timerId);
  }, [selectedCard, timeLeft, isQuestionSolved]);

  const handleCellClick = (index) => {
    const newCells = [...cells];
    let clickedCell = { ...newCells[index] };
    
    if (clickedCell.isOpened) return; 

    sounds.flip();

    setTimeLeft(30);
    setClickedOptions([]);
    setIsQuestionSolved(false);
    setBombEffect('');

    clickedCell.isOpened = true;
    newCells[index] = clickedCell;
    setCells(newCells);
    setSelectedCard(clickedCell);

    if (clickedCell.type !== 'question') {
      setIsBombRevealed(false);
      sounds.suspense();

      setTimeout(() => {
        setIsBombRevealed(true);
        if (clickedCell.label === '🎲 ROULETTE NGA') {
          const options = [
            { value: 3, msg: 'MAY MẮN! (+3 ĐIỂM)' },
            { value: -3, msg: 'XUI XẺO! (-3 ĐIỂM)' }
          ];
          if (Math.random() > 0.5) options.reverse();
          setRouletteCards(options);
          setRouletteChoiceIndex(null);
          setBombEffect('effect-roulette');
        } else {
          if (sounds[clickedCell.sound]) sounds[clickedCell.sound]();
          
          if (clickedCell.label.includes('THANOS')) setBombEffect('effect-thanos');
          else if (clickedCell.label.includes('CƯA ĐÔI')) setBombEffect('effect-chainsaw');
          else if (clickedCell.label.includes('RESET')) setBombEffect('effect-reset');
          else if (clickedCell.label.includes('ĂN CƯỚP')) setBombEffect('effect-steal');

          if (clickedCell.type === 'bomb-good') {
            setTimeout(() => window.confetti && window.confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 }, zIndex: 10000 }), 300);
          }
        }
      }, 1800); // 1.8s suspense
    } else {
      sounds.flip();
    }
  };

  const handleRouletteChoice = (idx) => {
    if (rouletteChoiceIndex !== null) return; 
    setRouletteChoiceIndex(idx);
    
    const choice = rouletteCards[idx];
    if (choice.value > 0) {
      setTimeout(() => window.confetti && window.confetti({ particleCount: 300, spread: 100, origin: { y: 0.5 }, zIndex: 10000 }), 100);
      sounds.correct();
    } else {
      sounds.explosion();
    }
  };

  const handleOptionClick = (optIndex, isCorrect) => {
    if (timeLeft === 0 || isQuestionSolved) return;
    if (clickedOptions.includes(optIndex)) return;

    const newClicked = [...clickedOptions, optIndex];
    setClickedOptions(newClicked);

    if (isCorrect) {
      setIsQuestionSolved(true);
      sounds.correct();
      setTimeout(() => window.confetti && window.confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 }, colors: ['#ffff00', '#00ff00'], zIndex: 10000 }), 100);
    } else {
      sounds.wrong();
    }
  };

  const closeModal = () => {
    setSelectedCard(null);
    setBombEffect('');
  };

  const colHeaders = ['A', 'B', 'C', 'D', 'E', 'F'];
  const rowHeaders = ['1', '2', '3', '4', '5', '6'];

  const renderGoldenIcon = (icon) => (
    <div className="golden-icon-wrapper">
      <span className="golden-icon-text">{icon}</span>
    </div>
  );

  return (
    <div className="app-container">
      
      <div className="title-container slide-in-top">
        <h1 className="game-title">CHIẾN DỊCH LẬT MỞ</h1>
        <div className="subtitle-badge bounce-anim">TỰ HÀO LỊCH SỬ</div>
      </div>
      
      <div className="board-wrapper fade-in-up">
        <div className="grid-container">
          <div className="header-cell empty"></div>
          {colHeaders.map(h => (
            <div className="header-cell col-header" key={h}>{h}</div>
          ))}

          {rowHeaders.map((r, rIndex) => (
            <React.Fragment key={r}>
              <div className="header-cell row-header">{r}</div>
              
              {cells.slice(rIndex * 6, (rIndex + 1) * 6).map((cell, cIndex) => {
                const index = rIndex * 6 + cIndex;
                return (
                  <div 
                    key={cell.id}
                    className={`cell-wrapper deal-anim hover-jiggle ${cell.isOpened ? 'opened' : ''}`}
                    style={{ animationDelay: `${index * 0.03}s` }}
                    onClick={() => handleCellClick(index)}
                  >
                    <div className="cell-inner">
                      <div className="cell-front">
                        <div className="cell-index">{renderGoldenIcon(cell.frontIcon)}</div>
                      </div>
                      <div className={`cell-back ${cell.type}`}>
                        <div className="card-icon-massive">
                          {cell.type === 'question' ? renderGoldenIcon('★') : renderGoldenIcon('💣')}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* MODAL CẢI TIẾN (NEW UI) */}
      {selectedCard && (
        <div className={`modal-overlay ${bombEffect}`} onClick={closeModal}>
          
          {/* HIỆU ỨNG BOM */}
          {isBombRevealed && bombEffect === 'effect-thanos' && <div className="thanos-dust"></div>}
          {isBombRevealed && bombEffect === 'effect-chainsaw' && <div className="chainsaw-blade"></div>}
          {isBombRevealed && bombEffect === 'effect-reset' && <div className="reset-flash"></div>}
          {isBombRevealed && bombEffect === 'effect-steal' && <div className="ninja-slash"></div>}

          {selectedCard.type === 'question' ? (
            <div className="modal-card-modern fade-in-up" onClick={(e) => e.stopPropagation()}>
              {/* HEADER */}
              <div className="m-header">
                <div className="m-badges">
                  <span className="m-badge-primary">{selectedCard.label}</span>
                  <span className="m-badge-outline">TRẮC NGHIỆM</span>
                </div>
                <button className="m-close-btn" onClick={closeModal}>✕</button>
              </div>

              {/* BODY */}
              <div className="m-body">
                <div className="question-ui-modern">
                  <div className="timer-wrapper">
                    <div className={`timer-circle ${timeLeft <= 10 && !isQuestionSolved && timeLeft > 0 ? 'urgent' : ''} ${timeLeft === 0 && !isQuestionSolved ? 'time-up' : ''}`}>
                      <span className="timer-num">{timeLeft}</span>
                      <span className="timer-unit">GIÂY</span>
                    </div>
                  </div>
                  <h2 className="m-question-text">{selectedCard.content.text}</h2>
                  
                  <div className="m-options-box">
                    <div className="m-options-title">ĐÁP ÁN:</div>
                    <div className="m-options-grid">
                      {selectedCard.content.options.map((opt, i) => {
                        const isCorrect = opt.startsWith(selectedCard.content.answer);
                        const isClicked = clickedOptions.includes(i);
                        const isTimeUp = timeLeft === 0;
                        
                        let optClass = '';
                        if (isClicked) {
                          optClass = isCorrect ? 'correct-answer bounce-anim' : 'wrong-answer shake-anim';
                        } else if ((isQuestionSolved || isTimeUp) && isCorrect) {
                          optClass = 'correct-answer bounce-anim';
                        } else if (isQuestionSolved || isTimeUp) {
                          optClass = 'dimmed';
                        }

                        return (
                          <div 
                            key={i} 
                            className={`m-option-item ${optClass} ${(isQuestionSolved || isTimeUp) ? 'disabled' : ''}`}
                            onClick={() => handleOptionClick(i, isCorrect)}
                          >
                            {opt}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* FOOTER */}
              <div className="m-footer">
                  <button className="m-btn-primary" onClick={closeModal}>
                    ĐÓNG THẺ CÂU HỎI
                  </button>
              </div>
            </div>
          ) : (
            /* 3D BOMB CARD LAYOUT */
            <div className="bomb-card-wrapper" onClick={(e) => e.stopPropagation()}>
               {!isBombRevealed && (
                 <h2 className="suspense-text blink-anim">CÙNG CHỜ XEM...</h2>
               )}
               <div className={`bomb-card-3d ${!isBombRevealed ? 'suspense-intro' : 'is-flipped'}`}>
                  
                  <div className="bomb-card-front">
                     <div className="star-3d">★</div>
                  </div>
                  
                  <div className="bomb-card-back">
                     {selectedCard.label === '🎲 ROULETTE NGA' ? (
                       <div className="roulette-ui-modern">
                         <h2 className="m-title-text">{selectedCard.label}</h2>
                         <p className="m-desc-text" style={{fontSize: '1rem'}}>{selectedCard.content}</p>
                         
                         <div className="roulette-cards-modern" style={{marginTop: '20px'}}>
                           {rouletteCards.map((card, idx) => {
                             const isRevealed = rouletteChoiceIndex === idx;
                             const isUnchosen = rouletteChoiceIndex !== null && rouletteChoiceIndex !== idx;
                             return (
                               <div 
                                 key={idx} 
                                 className={`rc-card ${isRevealed ? 'revealed' : ''} ${isUnchosen ? 'unchosen' : ''}`}
                                 onClick={() => handleRouletteChoice(idx)}
                               >
                                 <div className="rc-inner">
                                   <div className="rc-front">?</div>
                                   <div className={`rc-back ${card.value > 0 ? 'good' : 'bad'}`}>
                                     {card.msg}
                                   </div>
                                 </div>
                               </div>
                             );
                           })}
                         </div>
                       </div>
                     ) : (
                       <div className="bomb-ui-modern" style={{width: '100%'}}>
                         <h1 className="m-bomb-title" style={{fontSize: '2.5rem', marginBottom: '20px'}}>{selectedCard.label}</h1>
                         <div className="m-bomb-desc-box" style={{border: 'none', padding: '0'}}>
                           <p className="m-desc-text" style={{fontSize: '1.2rem'}}>{selectedCard.content}</p>
                         </div>
                       </div>
                     )}
                     
                     {isBombRevealed && (
                       <button className="m-btn-primary" style={{marginTop: '30px'}} onClick={closeModal}>
                         ĐÃ HIỂU & ĐÓNG
                       </button>
                     )}
                  </div>

               </div>
            </div>
          )}

        </div>
      )}
    </div>
  );
}

export default App;