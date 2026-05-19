let capture;
let hands;
let camera;
let detections = {};
let cameraReady = false;
let cameraError = null;

// 遊戲狀態變數
let gamePhase = "WAITING";
let userGesture = "";
let systemGesture = "";
let gameResult = "";
let holdCounter = 0;
let targetGesture = "";
let winCount = 0;
let lossCount = 0;
let tieCount = 0;
let fireworks = [];

function setup() {
  createCanvas(windowWidth, windowHeight);

  // 改回使用 p5.js 內建的 createCapture 解決攝像頭沒顯示與閃爍的問題
  capture = createCapture(VIDEO);
  capture.size(640, 480);
  capture.hide();

  hands = new Hands({locateFile: (file) => {
    return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
  }});
  hands.setOptions({
    maxNumHands: 2,
    modelComplexity: 1,
    minDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5
  });
  hands.onResults((results) => {
    detections = results;
  });

  camera = new Camera(capture.elt, {
    onFrame: async () => {
      await hands.send({image: capture.elt});
    },
    width: 640,
    height: 480
  });

  camera.start()
    .then(() => { cameraReady = true; })
    .catch((err) => { cameraError = err.message || String(err); });
}

function draw() {
  background('#e7c6ff');

  fill(0);
  noStroke();
  textSize(32);
  textAlign(CENTER, CENTER);
  text("414730936 陸柏安", width / 2, height * 0.1);

  if (cameraError) {
    fill(180, 0, 0);
    textSize(20);
    text("無法開啟相機：" + cameraError, width / 2, height / 2);
    return;
  }

  if (!cameraReady) {
    fill(80);
    textSize(20);
    text("正在啟動相機...", width / 2, height / 2);
    return;
  }

  let imgW = width * 0.5;
  let imgH = height * 0.5;
  let x = width / 2;
  let y = height / 2;

  push();
  translate(x, y);
  scale(-1, 1);
  imageMode(CENTER);
  image(capture, 0, 0, imgW, imgH);

  if (detections && detections.multiHandLandmarks) {
    stroke(255, 0, 0);
    strokeWeight(15);

    for (const landmarks of detections.multiHandLandmarks) {
      for (const connection of HAND_CONNECTIONS) {
        const lm1 = landmarks[connection[0]];
        const lm2 = landmarks[connection[1]];

        let x1 = (lm1.x - 0.5) * imgW;
        let y1 = (lm1.y - 0.5) * imgH;
        let x2 = (lm2.x - 0.5) * imgW;
        let y2 = (lm2.y - 0.5) * imgH;

        line(x1, y1, x2, y2);
      }
    }
  }
  pop();

  // 猜拳遊戲邏輯
  let currentGesture = "未知";
  if (detections && detections.multiHandLandmarks && detections.multiHandLandmarks.length > 0) {
    currentGesture = detectGesture(detections.multiHandLandmarks[0]);
  }

  if (gamePhase === "WAITING") {
    if (currentGesture === "石頭" || currentGesture === "剪刀" || currentGesture === "布") {
      if (currentGesture === targetGesture) {
        holdCounter++;
      } else {
        targetGesture = currentGesture;
        holdCounter = 1;
      }

      // 當穩定辨識某個手勢超過 30 個影格（約 0.5 ~ 1 秒）就判定出拳
      if (holdCounter > 30) {
        userGesture = currentGesture;
        let moves = ['石頭', '剪刀', '布'];
        systemGesture = moves[Math.floor(Math.random() * moves.length)];
        gameResult = checkWinner(userGesture, systemGesture);
        
        // 更新計分板
        if (gameResult === '你贏了！') {
          winCount++;
          triggerFireworks(); // 觸發煙火特效
        } else if (gameResult === '你輸了！') lossCount++;
        else tieCount++;
        
        gamePhase = "RESULT";
        holdCounter = 0;
        targetGesture = "";
      }
    } else {
      holdCounter = 0;
      targetGesture = "";
    }
  } else if (gamePhase === "RESULT") {
    // 等待玩家比出 👍 或 👎
    if (currentGesture === "👍" || currentGesture === "👎") {
      if (currentGesture === targetGesture) {
        holdCounter++;
      } else {
        targetGesture = currentGesture;
        holdCounter = 1;
      }
      
      if (holdCounter > 30) {
        if (currentGesture === "👍") gamePhase = "WAITING";
        else if (currentGesture === "👎") gamePhase = "END";
        holdCounter = 0;
        targetGesture = "";
      }
    } else {
      holdCounter = 0;
      targetGesture = "";
    }
  } else if (gamePhase === "END") {
    if (currentGesture === "👍") {
      if (currentGesture === targetGesture) {
        holdCounter++;
      } else {
        targetGesture = currentGesture;
        holdCounter = 1;
      }
      
      if (holdCounter > 30) {
        winCount = 0;
        lossCount = 0;
        tieCount = 0;
        gamePhase = "WAITING";
        holdCounter = 0;
        targetGesture = "";
      }
    } else {
      holdCounter = 0;
      targetGesture = "";
    }
  }

  // 顯示遊戲 UI
  push();
  fill(0);
  noStroke();
  textAlign(CENTER, CENTER);
  if (gamePhase === "WAITING") {
    textSize(48);
    text("請出拳 (剪刀、石頭、布)", width / 2, height * 0.8);
    textSize(24);
    text("目前手勢: " + currentGesture, width / 2, height * 0.9);
    
    // 顯示即將出拳的累積進度條
    if (holdCounter > 0 && (currentGesture === "石頭" || currentGesture === "剪刀" || currentGesture === "布")) {
      fill(255, 0, 0);
      rectMode(CENTER);
      rect(width / 2, height * 0.85, holdCounter * 5, 10);
    }
  } else if (gamePhase === "RESULT") {
    textSize(48);
    text("你出：" + userGesture + "  系統出：" + systemGesture, width / 2, height * 0.75);
    // 依據輸贏結果改變顏色
    if (gameResult === '你贏了！') fill(0, 150, 0);
    else if (gameResult === '你輸了！') fill(255, 0, 0);
    else fill(0);
    text(gameResult, width / 2, height * 0.85);

    fill(0);
    textSize(24);
    text("👍 再一局 / 👎 結束計分", width / 2, height * 0.95);

    if (holdCounter > 0 && (currentGesture === "👍" || currentGesture === "👎")) {
      fill(255, 0, 0);
      rectMode(CENTER);
      rect(width / 2, height * 0.9, holdCounter * 5, 10);
    }
  } else if (gamePhase === "END") {
    textSize(48);
    text("遊戲結束", width / 2, height * 0.75);
    textSize(32);
    text(`最終成績 - 贏: ${winCount} | 輸: ${lossCount} | 平手: ${tieCount}`, width / 2, height * 0.85);
    
    textSize(24);
    text("👍 重新開始", width / 2, height * 0.95);

    if (holdCounter > 0 && currentGesture === "👍") {
      fill(255, 0, 0);
      rectMode(CENTER);
      rect(width / 2, height * 0.9, holdCounter * 5, 10);
    }
  }
  pop();

  // 顯示計分板
  push();
  fill(0);
  noStroke();
  textSize(24);
  textAlign(LEFT, TOP);
  text(`贏: ${winCount} | 輸: ${lossCount} | 平手: ${tieCount}`, 20, 20);
  pop();

  // 繪製與更新煙火
  for (let i = fireworks.length - 1; i >= 0; i--) {
    fireworks[i].update();
    fireworks[i].show();
    if (fireworks[i].isDead()) {
      fireworks.splice(i, 1);
    }
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

// 判斷手勢的函數
function detectGesture(landmarks) {
  // Y 座標越小代表越高。如果指尖 (tip) 的 Y 小於第二關節 (pip) 的 Y，代表手指伸直
  let isIndexUp = landmarks[8].y < landmarks[6].y;
  let isMiddleUp = landmarks[12].y < landmarks[10].y;
  let isRingUp = landmarks[16].y < landmarks[14].y;
  let isPinkyUp = landmarks[20].y < landmarks[18].y;

  // 計算伸直的手指數量 (true = 1, false = 0)
  let upCount = isIndexUp + isMiddleUp + isRingUp + isPinkyUp;

  if (upCount === 0) {
    if (landmarks[4].y < landmarks[5].y) return '👍'; // 大拇指朝上
    if (landmarks[4].y > landmarks[0].y) return '👎'; // 大拇指朝下
    return '石頭';
  }
  if (upCount === 4) return '布';
  if (isIndexUp && isMiddleUp && !isRingUp && !isPinkyUp) return '剪刀';

  return '未知';
}

// 判斷輸贏的函數
function checkWinner(user, system) {
  if (user === system) return '平手！';
  if (user === '石頭' && system === '剪刀') return '你贏了！';
  if (user === '剪刀' && system === '布') return '你贏了！';
  if (user === '布' && system === '石頭') return '你贏了！';
  return '你輸了！';
}

// --- 煙火特效相關 ---
function triggerFireworks() {
  fireworks = [];
  // 隨機產生 3 朵煙火
  for (let i = 0; i < 3; i++) {
    let cx = random(width * 0.2, width * 0.8);
    let cy = random(height * 0.1, height * 0.4);
    let col = [random(100, 255), random(100, 255), random(100, 255)]; // 隨機亮色系
    for (let j = 0; j < 60; j++) {
      fireworks.push(new Particle(cx, cy, col));
    }
  }
}

class Particle {
  constructor(x, y, col) {
    this.pos = createVector(x, y);
    // 給予隨機的散射角度與力度
    this.vel = p5.Vector.random2D().mult(random(2, 10));
    this.acc = createVector(0, 0.2); // 模擬重力下墜
    this.col = col;
    this.alpha = 255;
  }
  update() {
    this.vel.add(this.acc);
    this.pos.add(this.vel);
    this.alpha -= 4; // 逐漸變透明
  }
  show() {
    noStroke();
    fill(this.col[0], this.col[1], this.col[2], this.alpha);
    circle(this.pos.x, this.pos.y, 8);
  }
  isDead() {
    return this.alpha <= 0;
  }
}
