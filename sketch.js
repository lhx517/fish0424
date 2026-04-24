// 全域變數宣告
let shapes = []; // 儲存多邊形物件
let bubbles = []; // 儲存水泡泡物件
let song; // 音樂檔案
let amplitude; // 音量分析器
let points = [
  [-3, 5], [3, 7], [1, 5], [2, 4], [4, 3], [5, 2], [6, 2], [8, 4], [8, -1], [6, 0], [0, -3], [2, -6], [-2, -3], [-4, -2], [-5, -1], [-6, 1], [-6, 2]
]; // 多邊形基礎頂點座標

function preload() {
  // 預載入音樂檔案
  // 請確保檔案路徑正確，例如放在專案根目錄下
  song = loadSound('midnight-quirk-255361.mp3');
}

function setup() {
  // 建立符合視窗大小的畫布
  createCanvas(windowWidth, windowHeight);

  // 初始化音量分析器
  amplitude = new p5.Amplitude();

  // 循環播放音樂
  if (song) {
    song.loop();
  }

  // 隨機產生 10 個形狀物件
  for (let i = 0; i < 10; i++) {
    // 為每個形狀產生獨立的變形倍率 (10 到 30)
    let rScale = random(10, 30);
    
    let shapeObj = {
      x: random(windowWidth),
      y: random(windowHeight),
      dx: random(-3, 3),
      dy: random(-3, 3),
      scale: random(1, 10),
      color: color(random(255), random(255), random(255)),
      // 將基礎頂點乘上隨機倍率產生變形後的頂點
      points: points.map(p => ({
        x: p[0] * rScale,
        y: p[1] * rScale
      }))
    };
    shapes.push(shapeObj);
  }
}

function draw() {
  // 設定背景顏色
  background('#ffcdb2');
  strokeWeight(2);

  // 取得當前音量 (0.0 到 1.0)
  let level = amplitude.getLevel();
  // 將音量映射到縮放倍率 (0.5 到 2.0)
  let sizeFactor = map(level, 0, 1, 0.5, 2);

  // 走訪並繪製每個形狀
  for (let shape of shapes) {
    // 位置更新
    shape.x += shape.dx;
    shape.y += shape.dy;

    // 邊緣反彈檢查
    if (shape.x < 0 || shape.x > windowWidth) {
      shape.dx *= -1;
    }
    if (shape.y < 0 || shape.y > windowHeight) {
      shape.dy *= -1;
    }

    // 設定外觀顏色
    fill(shape.color);
    stroke(shape.color);

    // 座標轉換與繪製
    push();
    translate(shape.x, shape.y);
    // 判斷移動方向：向右移動 (dx > 0) 時水平翻轉，其餘維持原狀
    let scaleX = shape.dx > 0 ? -1 : 1;
    scale(scaleX * sizeFactor, sizeFactor); // 結合音量縮放與方向翻轉

    beginShape();
    for (let p of shape.points) {
      vertex(p.x, p.y);
    }
    endShape(CLOSE);
    pop();
  }

  // 管理水泡泡：僅在音樂播放時產生
  if (song && song.isPlaying()) {
    // 10% 的機率產生新泡泡
    if (random(1) < 0.1) {
      bubbles.push(new Bubble());
    }
  }

  // 更新並顯示所有泡泡，過濾掉已經破掉的
  bubbles = bubbles.filter(b => {
    b.move();
    b.show();
    return !b.burst(); // 如果沒破就保留
  });

  // 如果音樂沒在播放，顯示提醒文字
  if (!song || !song.isPlaying()) {
    drawOverlay();
  }
}

// 繪製畫面中央的提醒遮罩
function drawOverlay() {
  push();
  fill(0, 100); // 半透明黑色背景
  noStroke();
  rectMode(CENTER);
  rect(width / 2, height / 2, 250, 60, 10); // 畫一個圓角矩形
  
  fill(255); // 白色文字
  textSize(24);
  textAlign(CENTER, CENTER);
  text("點擊一下開始", width / 2, height / 2);
  pop();
}

// 當視窗大小改變時，自動調整畫布
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

// 瀏覽器安全性規定音訊必須由使用者互動觸發啟動。
// 加入 mousePressed 函式，當使用者點擊畫面時，音訊環境就會被啟動。
function mousePressed() {
  // 確保音訊環境已啟動
  userStartAudio();

  if (song && song.isPlaying()) {
    // 如果正在播放，就暫停
    song.pause();
  } else if (song) {
    // 如果暫停中，就繼續循環播放
    song.loop();
  }
}

// 水泡泡類別
class Bubble {
  constructor() {
    this.x = random(width);
    this.y = height + 20; // 從畫面下方出現
    this.r = random(5, 15); // 隨機大小
    this.speed = random(1, 3); // 上升速度
    // 設定泡泡在哪個高度破掉（例如畫面中段到頂部之間）
    this.burstY = random(0, height * 0.6);
    this.wobble = random(1000); // 用於左右晃動的隨機偏移
  }

  move() {
    this.y -= this.speed;
    // 使用正弦函數產生左右晃動的效果
    this.x += sin(frameCount * 0.05 + this.wobble) * 0.5;
  }

  show() {
    push();
    stroke(255, 150); // 半透明白色邊框
    strokeWeight(1);
    fill(255, 50); // 極透明的白色填充
    circle(this.x, this.y, this.r * 2);
    // 加入一個小反光點，增加立體感
    noStroke();
    fill(255, 120);
    circle(this.x - this.r * 0.3, this.y - this.r * 0.3, this.r * 0.4);
    pop();
  }

  burst() {
    // 當超過設定高度或超出畫面頂部時判定為破掉
    return this.y < this.burstY || this.y < -this.r;
  }
}
