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
  { text: '💥 BOM NỔ -1', desc: 'Trừ ngay 1 điểm. Qua lượt.', type: 'bomb-bad', count: 3, sound: 'explosion', effect: 'minus_1' },
  { text: '💣 BOM NỔ -2', desc: 'Trừ ngay 2 điểm. Qua lượt.', type: 'bomb-bad', count: 2, sound: 'explosion', effect: 'minus_2' },
  { text: '🪚 CƯA ĐÔI', desc: 'Lập tức chia đôi số điểm hiện tại của đội bốc (làm tròn xuống).', type: 'bomb-bad', count: 1, sound: 'explosion', effect: 'divide_2' },
  { text: '☠️ RESET', desc: 'Bay sạch điểm, đưa về số 0 tròn trĩnh.', type: 'bomb-bad', count: 1, sound: 'explosion', effect: 'reset' },
  { text: '🎁 QUÀ TẶNG +1', desc: 'Lập tức cộng 1 điểm miễn phí.', type: 'bomb-good', count: 2, sound: 'correct', effect: 'plus_1' },
  { text: '💎 QUÀ TẶNG +2', desc: 'Lập tức cộng 2 điểm miễn phí.', type: 'bomb-good', count: 2, sound: 'correct', effect: 'plus_2' },
  { text: '🎲 ROULETTE NGA', desc: 'Hên xui 50/50: Hãy chọn 1 trong 2 lá bài để định đoạt số phận!', type: 'bomb-action', count: 1, sound: 'suspense', effect: 'roulette' },
  { text: '🥷 ĂN CƯỚP', desc: 'Chỉ định lấy 1 điểm từ 1 đội bất kỳ.', type: 'bomb-action', count: 2, sound: 'explosion', effect: 'steal_1' },
  { text: '🔄 ĐỔI VẬN', desc: 'Tráo đổi toàn bộ điểm số hiện tại với 1 đội bất kỳ.', type: 'bomb-action', count: 1, sound: 'correct', effect: 'swap' },
  { text: '🤝 CỘNG SINH', desc: 'Đội bốc trúng được +2 điểm, và có quyền kéo thêm 1 đội khác cùng được +2 điểm.', type: 'bomb-action', count: 2, sound: 'correct', effect: 'symbiosis' },
  { text: '🧤 BÀN TAY THANOS', desc: 'Giáng điểm của đội đang dẫn đầu xuống bằng mức điểm của đội đang bét bảng.', type: 'bomb-action', count: 1, sound: 'explosion', effect: 'thanos' }
];

const questionsData = [
  {
    text: "Theo tư tưởng Hồ Chí Minh, đại đoàn kết toàn dân tộc có vai trò như thế nào đối với cách mạng Việt Nam?",
    options: ["A. Là phương pháp vận động quần chúng trong từng giai đoạn", "B. Là vấn đề có ý nghĩa chiến lược, quyết định thành công của cách mạng", "C. Là nhiệm vụ riêng của Mặt trận dân tộc thống nhất", "D. Là mục tiêu chỉ đặt ra trong cách mạng dân tộc dân chủ"],
    answer: "B"
  },
  {
    text: "Đại đoàn kết toàn dân tộc theo Hồ Chí Minh được xác định là:",
    options: ["A. Một khẩu hiệu tuyên truyền", "B. Một biện pháp tình thế", "C. Một mục tiêu, nhiệm vụ hàng đầu của cách mạng Việt Nam", "D. Một nhiệm vụ chủ yếu trong lĩnh vực kinh tế"],
    answer: "C"
  },
  {
    text: "Chủ thể của khối đại đoàn kết toàn dân tộc theo tư tưởng Hồ Chí Minh là:",
    options: ["A. Giai cấp công nhân và nông dân", "B. Đảng Cộng sản Việt Nam", "C. Các tầng lớp trí thức và thanh niên", "D. Toàn thể nhân dân Việt Nam"],
    answer: "D"
  },
  {
    text: "Lực lượng nào là nền tảng của khối đại đoàn kết toàn dân tộc?",
    options: ["A. Công nhân, nông dân và trí thức", "B. Công nhân, nông dân và doanh nhân", "C. Nông dân, trí thức và thanh niên", "D. Công nhân, trí thức và các tôn giáo"],
    answer: "A"
  },
  {
    text: "Yếu tố “hạt nhân” trong khối đại đoàn kết toàn dân tộc là:",
    options: ["A. Sự đoàn kết giữa các tầng lớp nhân dân", "B. Sự đoàn kết và thống nhất trong Đảng", "C. Sự đoàn kết giữa các dân tộc", "D. Sự đoàn kết giữa các tôn giáo"],
    answer: "B"
  },
  {
    text: "Theo Hồ Chí Minh, để xây dựng khối đại đoàn kết toàn dân tộc cần:",
    options: ["A. Xóa bỏ hoàn toàn mọi khác biệt về lợi ích", "B. Chỉ quan tâm đến lợi ích của một giai cấp", "C. Lấy lợi ích chung làm điểm quy tụ, đồng thời tôn trọng lợi ích khác biệt chính đáng", "D. Đặt lợi ích cá nhân lên trên lợi ích dân tộc"],
    answer: "C"
  },
  {
    text: "Truyền thống nào cần được kế thừa để xây dựng khối đại đoàn kết toàn dân tộc?",
    options: ["A. Yêu nước, nhân nghĩa, đoàn kết", "B. Cạnh tranh, cá nhân, tự chủ", "C. Đổi mới, sáng tạo, hội nhập", "D. Kỷ luật, cạnh tranh, phát triển"],
    answer: "A"
  },
  {
    text: "Vì sao Hồ Chí Minh đề cao lòng khoan dung, độ lượng trong xây dựng đại đoàn kết?",
    options: ["A. Vì mọi người đều có quan điểm giống nhau", "B. Vì mỗi người đều có ưu điểm và khuyết điểm, cần biết trân trọng mặt tốt và quy tụ lực lượng", "C. Vì đoàn kết không cần dựa trên mục tiêu chung", "D. Vì không cần phân biệt đúng và sai"],
    answer: "B"
  },
  {
    text: "Theo Hồ Chí Minh, yếu tố nào là nguồn sức mạnh và chỗ dựa vững chắc của khối đại đoàn kết toàn dân tộc?",
    options: ["A. Nhà nước", "B. Đảng", "C. Nhân dân", "D. Kinh tế"],
    answer: "C"
  },
  {
    text: "Câu nói nào thể hiện rõ nhất tư tưởng của Hồ Chí Minh về sức mạnh của đoàn kết?",
    options: ["A. “Không có gì quý hơn độc lập, tự do.”", "B. “Đoàn kết, đoàn kết, đại đoàn kết – Thành công, thành công, đại thành công.”", "C. “Nước lấy dân làm gốc.”", "D. “Dĩ bất biến, ứng vạn biến.”"],
    answer: "B"
  },
  {
    text: "Đúng hay Sai? Chính sách và phương pháp tập hợp lực lượng có thể thay đổi theo từng giai đoạn cách mạng, nhưng chủ trương đại đoàn kết toàn dân tộc là nhất quán.",
    options: ["A. Đúng", "B. Sai"],
    answer: "A"
  },
  {
    text: "Đúng hay Sai? Theo Hồ Chí Minh, chỉ những người thuộc giai cấp công nhân và nông dân mới là chủ thể của khối đại đoàn kết toàn dân tộc.",
    options: ["A. Đúng", "B. Sai"],
    answer: "B"
  },
  {
    text: "Đúng hay Sai? Theo Hồ Chí Minh, muốn xây dựng đại đoàn kết phải loại bỏ những người từng mắc sai lầm hoặc có khuyết điểm.",
    options: ["A. Đúng", "B. Sai"],
    answer: "B"
  },
  {
    text: "Đúng hay Sai? Niềm tin vào nhân dân là một trong những điều kiện quan trọng để thực hiện đại đoàn kết toàn dân tộc.",
    options: ["A. Đúng", "B. Sai"],
    answer: "A"
  },
  {
    text: "Hoàn thành câu nói nổi tiếng của Hồ Chí Minh: “Đoàn kết, đoàn kết, ________; Thành công, thành công, ________.”",
    options: ["A. đại đoàn kết – đại thành công", "B. đại thành công – đại đoàn kết", "C. toàn dân tộc – đại đoàn kết", "D. sức mạnh – vững bền"],
    answer: "A"
  },
  {
    text: "Theo nội dung đã học, khối đại đoàn kết toàn dân tộc lấy ________, ________ và ________ làm nền tảng.",
    options: ["A. công nhân – nông dân – thanh niên", "B. công nhân – nông dân – trí thức", "C. nông dân – trí thức – doanh nhân", "D. công nhân – trí thức – quân đội"],
    answer: "B"
  },
  {
    text: "Một nhóm người có lợi ích riêng khác với nhóm khác nhưng những lợi ích đó không trái với lợi ích chung của dân tộc. Theo tư tưởng Hồ Chí Minh, cách xử lý phù hợp là:",
    options: ["A. Loại bỏ nhóm có lợi ích khác biệt", "B. Buộc tất cả phải có lợi ích hoàn toàn giống nhau", "C. Tôn trọng lợi ích khác biệt chính đáng và tìm điểm tương đồng để đoàn kết", "D. Không quan tâm đến lợi ích của các nhóm"],
    answer: "C"
  },
  {
    text: "Một người từng mắc sai lầm nhưng hiện nay có thiện chí đóng góp cho cộng đồng. Vận dụng tư tưởng Hồ Chí Minh về đại đoàn kết, cách ứng xử phù hợp là:",
    options: ["A. Không cho người đó tham gia vì sai lầm trong quá khứ", "B. Chỉ nhìn vào khuyết điểm của người đó", "C. Khoan dung, trân trọng mặt tốt và tạo điều kiện để họ sửa chữa, đóng góp", "D. Bỏ qua hoàn toàn mọi sai lầm của người đó"],
    answer: "C"
  }
];

const revIcons = ['★', '☭', '★', '☭'];

function App() {
  const [teams, setTeams] = useState([
    { name: 'ĐỘI A', score: 0 },
    { name: 'ĐỘI B', score: 0 }
  ]);
  const [currentTeam, setCurrentTeam] = useState(null);

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
          sound: bomb.sound,
          effect: bomb.effect
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

  const applyEffect = (effect, teamIndex) => {
    if (teamIndex === null) return;
    setTeams(prev => {
      const newTeams = [...prev];
      const t = { ...newTeams[teamIndex] };
      const otherIdx = teamIndex === 0 ? 1 : 0;
      const otherT = { ...newTeams[otherIdx] };
      
      switch(effect) {
        case 'minus_1': t.score -= 1; break;
        case 'minus_2': t.score -= 2; break;
        case 'divide_2': t.score = Math.floor(t.score / 2); break;
        case 'reset': t.score = 0; break;
        case 'plus_1': t.score += 1; break;
        case 'plus_2': t.score += 2; break;
        case 'steal_1': 
          t.score += 1; 
          otherT.score -= 1; 
          break;
        case 'swap': 
          const temp = t.score;
          t.score = otherT.score;
          otherT.score = temp;
          break;
        case 'symbiosis':
          t.score += 2;
          otherT.score += 2;
          break;
        case 'thanos':
          if (t.score > otherT.score) {
            t.score = otherT.score;
          } else if (otherT.score > t.score) {
            otherT.score = t.score;
          }
          break;
        case 'question_correct':
          t.score += 1;
          break;
      }
      
      if (t.score < 0) t.score = 0;
      if (otherT.score < 0) otherT.score = 0;
      
      newTeams[teamIndex] = t;
      newTeams[otherIdx] = otherT;
      return newTeams;
    });
  };

  const handleCellClick = (index) => {
    if (currentTeam === null) {
      alert("Vui lòng chọn đội trước khi chọn ô!");
      return;
    }

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
          
          if (clickedCell.effect) {
            applyEffect(clickedCell.effect, currentTeam);
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
      setTeams(prev => {
        const newTeams = [...prev];
        newTeams[currentTeam].score += choice.value;
        return newTeams;
      });
    } else {
      sounds.explosion();
      setTeams(prev => {
        const newTeams = [...prev];
        newTeams[currentTeam].score += choice.value; // choice.value is negative
        if (newTeams[currentTeam].score < 0) newTeams[currentTeam].score = 0;
        return newTeams;
      });
    }
  };

  const handleOptionClick = (optIndex, isCorrect) => {
    if (timeLeft === 0 || isQuestionSolved) return;
    if (clickedOptions.includes(optIndex)) return;

    const newClicked = [...clickedOptions, optIndex];
    setClickedOptions(newClicked);

    if (isCorrect) {
      setIsQuestionSolved(true);
      applyEffect('question_correct', currentTeam);
      sounds.correct();
      setTimeout(() => window.confetti && window.confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 }, colors: ['#ffff00', '#00ff00'], zIndex: 10000 }), 100);
    } else {
      sounds.wrong();
      setCurrentTeam(prev => prev === 0 ? 1 : 0);
      setTimeLeft(30);
    }
  };

  const closeModal = () => {
    setSelectedCard(null);
    setBombEffect('');
    setCurrentTeam(null);
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
        <h1 className="game-title">TƯ TƯỞNG HỒ CHÍ MINH</h1>
        <div className="subtitle-badge bounce-anim">ĐẠI ĐOÀN KẾT TOÀN DÂN TỘC</div>
      </div>

      <div className="teams-container">
        {teams.map((team, index) => (
          <div 
            key={index} 
            className={`team-card ${currentTeam === index ? 'active-team' : ''}`}
            onClick={() => setCurrentTeam(index)}
          >
            <h2 className="team-name">{team.name}</h2>
            <div className="team-score">{team.score}</div>
            {currentTeam === index && <div className="team-turn-badge">LƯỢT CHỌN</div>}
          </div>
        ))}
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
                  {currentTeam !== null && (
                    <span className="m-badge-outline" style={{borderColor: '#2e7d32', color: '#2e7d32', backgroundColor: '#e8f5e9'}}>
                      LƯỢT: {teams[currentTeam].name}
                    </span>
                  )}
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