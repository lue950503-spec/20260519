let capture;
let hands;
let camera;
let detections = {};

function setup() {
  createCanvas(windowWidth, windowHeight);
  capture = createCapture(VIDEO);
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
  camera.start();
}

function draw() {
  background('#e7c6ff');

  // 在畫布上方置中加上文字
  fill(0);                     // 文字顏色設為黑色
  noStroke();                  // 確保文字沒有邊框
  textSize(32);                // 設定文字大小
  textAlign(CENTER, CENTER);   // 設定文字對齊方式為中心
  text("414730936 陸柏安", width / 2, height * 0.1);

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
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
