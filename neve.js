let particles = [];
let center;
let phase = "orbit"; // orbit → collapse → explode → formText → message
let phaseTimer = 0;
let fontGraphics;
let textTargets = [];
let font;
let messageTimer = 0;

let messages = [
  "i think you're holding the heart of mine ...",
  "squeeze it to parts, that's fine.",
  "happy birthday Yusraliza :)"
  "love you :p"
];

let backgroundColor = [5, 5, 20];
let starField = [];
let comets = [];

function preload() {
  font = loadFont("https://cdnjs.cloudflare.com/ajax/libs/topcoat/0.8.0/font/SourceCodePro-Regular.otf");
}

function setup() {
  createCanvas(windowWidth, windowHeight); // Use window dimensions for responsive design
  center = createVector(width / 2, height / 2);
  textFont(font);
  textAlign(CENTER, CENTER);
  
  // Add some stars in the background
  for (let i = 0; i < 200; i++) {
    starField.push(createVector(random(width), random(height)));
  }

  // Add comets to the scene with random positions
  for (let i = 0; i < 3; i++) {
    comets.push(createComet());
  }

  for (let i = 0; i < 500; i++) {
    let angle = random(TWO_PI);
    let radius = random(100, 300);
    let pos = p5.Vector.fromAngle(angle).mult(radius).add(center);
    let vel = createVector(-(pos.y - center.y), pos.x - center.x).setMag(1);
    particles.push(new Particle(pos, vel));
  }

  // Create target points for "NEVE"
  fontGraphics = createGraphics(width, height);
  fontGraphics.pixelDensity(1);
  fontGraphics.background(0);
  fontGraphics.textFont(font);
  fontGraphics.textSize(width / 10); // Scale the font size based on screen width
  fontGraphics.fill(255);
  fontGraphics.textAlign(CENTER, CENTER);
  fontGraphics.text("NEVE", width / 2, height / 5);  // Adjusted position higher

  fontGraphics.loadPixels();
  for (let x = 0; x < width; x += 6) {
    for (let y = 0; y < height; y += 6) {
      let index = (x + y * width) * 4;
      let brightness = fontGraphics.pixels[index];
      if (brightness > 128) {
        textTargets.push(createVector(x, y));
      }
    }
  }

  shuffle(textTargets, true);
  phaseTimer = millis();
}

function draw() {
  // Background + Nebula effect
  background(...backgroundColor);
  for (let star of starField) {
    noStroke();
    fill(255, 255, 255, 100);
    ellipse(star.x, star.y, random(1, 3));
  }

  // Gradually shift background color for cosmic transitions
  backgroundColor[0] = map(sin(millis() * 0.0001), -1, 1, 0, 20);
  backgroundColor[1] = map(sin(millis() * 0.0001), -1, 1, 0, 20);
  backgroundColor[2] = map(sin(millis() * 0.0001 + 1), -1, 1, 10, 30);

  // Update and show comets
  for (let comet of comets) {
    comet.update();
    comet.show();
  }

  let elapsed = millis() - phaseTimer;

  if (phase === "orbit" && elapsed > 4000) {
    phase = "collapse";
    phaseTimer = millis();
  } else if (phase === "collapse" && elapsed > 3000) {
    phase = "explode";
    phaseTimer = millis();
  } else if (phase === "explode" && elapsed > 3000) {
    phase = "formText";
    assignTargets();
    phaseTimer = millis();
  } else if (phase === "formText" && elapsed > 5000) {
    phase = "message";
    messageTimer = millis();
  }

  for (let p of particles) {
    p.update(phase);
    p.show();
  }

  if (phase !== "explode") {
    drawGlowingCore();
  }

  if (phase === "message") {
    showTimedMessages();
  }
}

function assignTargets() {
  for (let i = 0; i < particles.length; i++) {
    if (i < textTargets.length) {
      particles[i].target = textTargets[i].copy();
    }
  }
}

function showTimedMessages() {
  let t = (millis() - messageTimer) / 1000;
  let stageDuration = 3;
  let fadeDuration = 1;
  let stage = floor(t / stageDuration);
  let localTime = t % stageDuration;

  if (stage >= messages.length) {
    triggerExplosion();  // Trigger particle explosion at the final message
    return;
  }

  let alpha = 255;
  if (localTime < fadeDuration) {
    alpha = map(localTime, 0, fadeDuration, 0, 255);
  } else if (localTime > stageDuration - fadeDuration) {
    alpha = map(localTime, stageDuration - fadeDuration, stageDuration, 255, 0);
  }

  fill(255, alpha);
  textSize(width / 30);  // Adjust message size based on screen width
  text(messages[stage], width / 2, height - 250);  // Raised position for messages
}

function triggerExplosion() {
  if (particles.length > 0) {
    for (let p of particles) {
      p.vel.add(p5.Vector.random2D().mult(5));
    }
  }
}

class Particle {
  constructor(pos, vel) {
    this.pos = pos.copy();
    this.vel = vel.copy();
    this.acc = createVector(0, 0);
    this.color = color(random(180, 255), random(100, 200), random(200, 255));
    this.size = random(1, 3);
    this.target = null;
  }

  update(phase) {
    this.acc.set(0, 0);
    if (phase === "collapse") {
      let force = p5.Vector.sub(center, this.pos);
      let d = force.mag();
      d = constrain(d, 10, 200);
      force.setMag(5 / (d * d));
      this.acc.add(force);
    } else if (phase === "explode") {
      let force = p5.Vector.sub(this.pos, center);
      let d = force.mag();
      d = constrain(d, 10, 200);
      force.setMag(20 / (d * d));
      this.acc.add(force);
    } else if (phase === "formText" && this.target) {
      let force = p5.Vector.sub(this.target, this.pos);
      force.mult(0.05);
      this.acc.add(force);
      this.vel.mult(0.9);
    }

    this.vel.add(this.acc);
    this.pos.add(this.vel);
  }

  show() {
    fill(this.color);
    circle(this.pos.x, this.pos.y, this.size);
  }
}

function createComet() {
  let x = random(width); // Random start position
  let y = random(height);
  let velocity = createVector(random(0.5, 2), random(0.5, 2));  // Comets move at different speeds
  let size = random(4, 8);
  return new Comet(x, y, velocity, size);
}

class Comet {
  constructor(x, y, velocity, size) {
    this.pos = createVector(x, y);
    this.vel = velocity;
    this.size = size;
    this.tail = [];
  }

  update() {
    this.pos.add(this.vel);
    this.tail.push(this.pos.copy());
    if (this.tail.length > 30) {
      this.tail.shift();
    }

    // Loop comets around screen
    if (this.pos.x > width) this.pos.x = 0;
    if (this.pos.x < 0) this.pos.x = width;
    if (this.pos.y > height) this.pos.y = 0;
    if (this.pos.y < 0) this.pos.y = height;
  }

  show() {
    for (let i = 0; i < this.tail.length; i++) {
      let alpha = map(i, 0, this.tail.length, 0, 255);
      fill(255, 255, 255, alpha);
      noStroke();
      ellipse(this.tail[i].x, this.tail[i].y, this.size);
    }
  }
}

function drawGlowingCore() {
  push();
  translate(center.x, center.y);
  
  // Glowing radial aura
  noStroke();
  for (let r = 100; r > 0; r -= 5) {
    let alpha = map(r, 100, 0, 0, 255);
    fill(80, 120, 255, alpha * 0.2);
    ellipse(0, 0, r * 2);
  }

  // Pulsing core
  let pulse = sin(millis() * 0.005) * 10;
  fill(160, 200, 255, 200);
  ellipse(0, 0, 30 + pulse);

  // Orbiting sparkles
  let t = millis() * 0.002;
  for (let i = 0; i < 10; i++) {
    let angle = t + i * TWO_PI / 10;
    let r = 50 + sin(t * 2 + i) * 5;
    let x = cos(angle) * r;
    let y = sin(angle) * r;
    fill(255, 255, 255, 200);
    ellipse(x, y, 2);
  }

  pop();
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  center.set(width / 2, height / 2);
}
