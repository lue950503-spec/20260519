let videoElement;
let hands;
let camera;
let detections = {};
let cameraReady = false;
let cameraError = null;

function setup() {
  createCanvas(windowWidth, windowHeight);

  videoElement = document.createElement('video');
  videoElement.width = 640;
  videoElement.height = 480;

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

  camera = new Camera(videoElement, {
    onFrame: async () => {
      await hands.send({image: videoElement});
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
  image(videoElement, 0, 0, imgW, imgH);

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
