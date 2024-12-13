const MAP_WIDTH = 2000;
const MAP_HEIGHT = 2000;

class Player {
  constructor(x, y, maxSpeed) {
    this.x = x;
    this.y = y;
    this.height = 65;
    this.width = 39;
    this.angle = 0;
    this.targetAngle = 0;
    this.angularSpeed = 0.1;
    this.speed = 0;
    this.maxSpeed = maxSpeed;
    this.acceleration = 0.1;
    this.friction = 0.98;

    this.img = new Image();
    this.img.src = '../public/car_black.png';
  }

  update(keys, isCarOnTrack) {
    if (keys['w'] || keys['ц'] || keys['arrowup']) {
      const maxSpeed = isCarOnTrack ? this.maxSpeed : this.maxSpeed / 4;
      this.speed = Math.min(this.speed + this.acceleration, maxSpeed);
    }
    if (keys['s'] || keys['ы'] || keys['arrowdown']) {
      const maxSpeed = isCarOnTrack ? -this.maxSpeed / 3 : -this.maxSpeed / 5;
      this.speed = Math.max(this.speed - this.acceleration * 2, maxSpeed);
    }

    this.speed *= this.friction;
    this.x += Math.cos(this.angle) * this.speed;
    this.y += Math.sin(this.angle) * this.speed;

    this.x = Math.max(-MAP_WIDTH, Math.min(this.x, MAP_WIDTH));
    this.y = Math.max(-MAP_HEIGHT, Math.min(this.y, MAP_HEIGHT));

    const normalizeAngleDifference = (angle) => Math.atan2(Math.sin(angle), Math.cos(angle));
    const angleDifference = normalizeAngleDifference(this.targetAngle - this.angle);

    if (Math.abs(angleDifference) > 0.01) {
      this.angle += angleDifference * this.angularSpeed;
    }
  }

  draw(ctx, cameraX, cameraY) {
    ctx.save();
    ctx.translate(this.x - cameraX, this.y - cameraY);
    ctx.rotate(this.angle);
    ctx.drawImage(this.img, -this.height / 2, -this.width / 2, this.height, this.width);
    ctx.restore();
  }

  getFrontEdgePoints() {
    const frontCenterX = this.x + Math.cos(this.angle) * (this.height / 2);
    const frontCenterY = this.y + Math.sin(this.angle) * (this.height / 2);

    const offsetX = Math.sin(this.angle) * (this.width / 2);
    const offsetY = -Math.cos(this.angle) * (this.width / 2);

    const leftPoint = {
      x: frontCenterX - offsetX,
      y: frontCenterY - offsetY
    };
    const rightPoint = {
      x: frontCenterX + offsetX,
      y: frontCenterY + offsetY
    };

    return { leftPoint, rightPoint };
  }
}

class Opponent {
  constructor(startX, startY, maxSpeed) {
    this.x = startX;
    this.y = startY;
    this.speed = 0;
    this.maxSpeed = maxSpeed;
    this.direction = 0;
    this.currentCheckpointIndex = 0;
    this.acceleration = 0.05;
    this.directionSmoothing = 0.05;
    this.randomnessSpeedFactor = 0.1;
    this.image = new Image();
    this.image.src = '../public/car_red.png';
    this.width = 65;
    this.height = 39;
  }

  update(track) {
    const checkpoint = track.points[this.currentCheckpointIndex];
    const angleToCheckpoint = Math.atan2(checkpoint.y - this.y, checkpoint.x - this.x);

    const normalizeAngleDifference = (angle) => Math.atan2(Math.sin(angle), Math.cos(angle));
    const angleDifference = normalizeAngleDifference(angleToCheckpoint - this.direction);
    this.direction += angleDifference * this.directionSmoothing;

    if (Math.random() < this.randomnessSpeedFactor) {
      this.speed = Math.max(this.speed - this.acceleration, 0);
    } else {
      this.speed = Math.min(this.speed + this.acceleration, this.maxSpeed);
    }

    this.x += Math.cos(this.direction) * this.speed;
    this.y += Math.sin(this.direction) * this.speed;

    const distanceToCheckpoint = Math.hypot(this.x - checkpoint.x, this.y - checkpoint.y);
    if (distanceToCheckpoint < 100) {
      this.currentCheckpointIndex = (this.currentCheckpointIndex + 1) % track.points.length;
    }
  }

  draw(ctx, cameraX, cameraY) {
    ctx.save();
    ctx.translate(this.x - cameraX, this.y - cameraY);
    ctx.rotate(this.direction);

    ctx.drawImage(
      this.image,
      -this.width / 2,
      -this.height / 2,
      this.width,
      this.height
    );

    ctx.restore();
  }
}


class Track {
  constructor(center, radius, segments, trackWidth, randomFactor) {
    this.center = center;
    this.radius = radius;
    this.segments = segments;
    this.trackWidth = trackWidth;
    this.randomFactor = randomFactor;
    this.points = this.generatePoints();
    this.interpolatedPoints = this.interpolatePoints(0.05);
  }

  generatePoints() {
    const points = [];
    for (let i = 0; i < this.segments; i++) {
      const angle = (2 * Math.PI * i) / this.segments;
      const x = this.center.x + Math.cos(angle) * (this.radius + Math.random() * this.randomFactor - 10);
      const y = this.center.y + Math.sin(angle) * (this.radius + Math.random() * this.randomFactor - 10);
      points.push({ x, y });
    }
    points.push(points[0]);
    return points;
  }

  interpolatePoints(step) {
    const interpolated = [];
    const points = [...this.points, this.points[0]];
    const n = points.length;

    for (let i = 0; i < n - 1; i++) {
      const p0 = points[i === 0 ? n - 2 : i - 1];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = points[i + 2 < n ? i + 2 : 1];

      for (let t = 0; t < 1; t += step) {
        const x =
          0.5 *
          ((-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t ** 3 +
            (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t ** 2 +
            (-p0.x + p2.x) * t +
            2 * p1.x);

        const y =
          0.5 *
          ((-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t ** 3 +
            (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t ** 2 +
            (-p0.y + p2.y) * t +
            2 * p1.y);

        interpolated.push({ x, y });
      }
    }

    return interpolated;
  }

  draw(ctx, cameraX, cameraY) {
    ctx.save();
    ctx.translate(-cameraX, -cameraY);
    ctx.beginPath();
    for (let i = 0; i < this.interpolatedPoints.length; i++) {
      const { x, y } = this.interpolatedPoints[i];
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.strokeStyle = 'darkgray';
    ctx.lineWidth = this.trackWidth;
    ctx.stroke();
    ctx.restore();
  }

  isPointOnTrack(point) {
    let isInside = false;

    for (let i = 0; i < this.interpolatedPoints.length - 1; i++) {
      const p1 = this.interpolatedPoints[i];
      const p2 = this.interpolatedPoints[i + 1];

      const d1 = this.distanceBetweenPoints(point, p1);
      const d2 = this.distanceBetweenPoints(point, p2);

      if (d1 <= this.trackWidth / 2 || d2 <= this.trackWidth / 2) {
        isInside = true;
      }
    }

    return isInside;
  }

  distanceBetweenPoints(p1, p2) {
    return Math.sqrt((p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2);
  }
}

class Game {
  constructor() {
    this.canvas = document.getElementById('canvas');
    this.ctx = this.canvas.getContext('2d');
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;

    this.backgroundTexture = new Image();
    this.backgroundTexture.src = '../public/grass.png';

    this.currentLevel = 0;
    this.levels = [
      {
        playerMaxSpeed: 5,
        opponentMaxSpeed: 3,
        trackWidth: 180,
        scoreMultiplier: 1,
        trackRandomFactor: 120,
        trackSegments: 30
      },
      {
        playerMaxSpeed: 6,
        opponentMaxSpeed: 4,
        trackWidth: 140,
        scoreMultiplier: 1.3,
        trackRandomFactor: 160,
        trackSegments: 40
      },
      {
        playerMaxSpeed: 7,
        opponentMaxSpeed: 4.5,
        trackWidth: 105,
        scoreMultiplier: 1.6,
        trackRandomFactor: 200,
        trackSegments: 40
      }
    ];
    this.keys = {};
    this.countdown = 5;

    this.score = 0;

    this.getCurrentUser();
    this.initLevel();
    this.setupEvents();
  }

  initLevel() {
    const {
      playerMaxSpeed,
      opponentMaxSpeed,
      trackWidth,
      trackRandomFactor,
      trackSegments
    } = this.levels[this.currentLevel];

    this.track = new Track({ x: 500, y: 500 }, 1000, trackSegments, trackWidth, trackRandomFactor);

    const playerStartPoint = this.track.interpolatedPoints[10];
    const opponentStartPoint = this.track.interpolatedPoints[0];

    this.player = new Player(
      playerStartPoint.x,
      playerStartPoint.y,
      playerMaxSpeed
    );
    this.opponent = new Opponent(
      opponentStartPoint.x,
      opponentStartPoint.y,
      opponentMaxSpeed
    );

    this.opponent.maxSpeed = 0;
    this.player.maxSpeed = 0;

    this.cameraX = this.player.x - this.canvas.width / 2;
    this.cameraY = this.player.y - this.canvas.height / 2;

    this.passedPlayerCheckpoints = new Set();
    this.passedOpponentCheckpoints = new Set();

    this.isRideComplete = false;
    this.isGameComplete = false;

    this.startTime = Date.now();
    this.rideTime = null;

    this.isRideStart = false;
    this.isPlayerWin = null;

    setTimeout(() => {
      this.opponent.maxSpeed = opponentMaxSpeed;
      this.player.maxSpeed = playerMaxSpeed;
      this.isRideStart = true;
      this.startTime = Date.now();
    }, this.countdown * 1000);
  }

  setupEvents() {
    window.addEventListener('keydown', (e) => (this.keys[e.key.toLowerCase()] = true));
    window.addEventListener('keyup', (e) => (this.keys[e.key.toLowerCase()] = false));
    window.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      this.player.targetAngle = Math
        .atan2(
          mouseY - this.canvas.height / 2,
          mouseX - this.canvas.width / 2
        );
    });
  }

  getCurrentUser() {
    const username = localStorage.getItem('username');
    if (username) {
      this.username = username;
    } else {
      alert('Имя пользователя не найдено. Возвращаем на страницу авторизации.');
      window.location.href = 'home.html';
    }
  }

  isCarOnTrack() {
    const { leftPoint, rightPoint } = this.player.getFrontEdgePoints();
    const isLeftPointOnTrack = this.track.isPointOnTrack(leftPoint);
    const isRightPointOnTrack = this.track.isPointOnTrack(rightPoint);

    return isLeftPointOnTrack && isRightPointOnTrack;
  }

  checkCheckpoints(car, passedCheckpoints, isPlayer) {
    if (this.isRideComplete) return;

    const { x, y } = car;
    const checkpointRadius = 100;

    this.track.points.forEach((point, index) => {
      const distance = Math.hypot(x - point.x, y - point.y);
      if (distance < checkpointRadius && !passedCheckpoints.has(index)) {
        passedCheckpoints.add(index);

        if (passedCheckpoints.size === this.track.points.length) {
          this.isRideComplete = true;
          this.rideTime = (Date.now() - this.startTime) / 1000;
          this.isPlayerWin = isPlayer;

          this.player.maxSpeed = 0;
          this.opponent.maxSpeed = 0;

          this.score += this.calculateScore();

          this.currentLevel += 1;

          setTimeout(() => {
            if (this.currentLevel < this.levels.length) {
              this.initLevel();
            } else {
              this.isGameComplete = true;
              this.saveResult();
              setTimeout(() => {
                window.location.href = 'statistics.html';
              }, 5000);
            }
          }, 6000);
        }
      }
    });
  }

  calculateScore() {
    const theta1 = Math.atan2(this.player.y - this.track.center.y, this.player.x - this.track.center.x);
    const theta2 = Math.atan2(this.opponent.y - this.track.center.y, this.opponent.x - this.track.center.x);

    let deltaTheta = Math.abs(theta2 - theta1);

    if (deltaTheta > Math.PI) {
      deltaTheta = 2 * Math.PI - deltaTheta;
    }

    const arcLength = this.track.radius * deltaTheta;

    if (this.isPlayerWin) {
      return arcLength / this.rideTime * 10 * 3 * this.levels[this.currentLevel].scoreMultiplier;
    }

    return -1 * arcLength / this.rideTime * 10;
  }

  saveResult() {
    let gameResults = JSON.parse(localStorage.getItem('gameResults')) || [];

    const newResult = { name: this.username, score: Math.round(this.score) };
    gameResults.push(newResult);

    localStorage.setItem('gameResults', JSON.stringify(gameResults));
  }

  update() {
    this.player.update(this.keys, this.isCarOnTrack());
    this.opponent.update(this.track);

    this.checkCheckpoints(this.player, this.passedPlayerCheckpoints, true);
    this.checkCheckpoints(this.opponent, this.passedOpponentCheckpoints, false);

    this.cameraX += (this.player.x - this.cameraX - this.canvas.width / 2) * 0.1;
    this.cameraY += (this.player.y - this.cameraY - this.canvas.height / 2) * 0.1;
  }

  drawBackground() {
    const pattern = this.ctx.createPattern(this.backgroundTexture, 'repeat');
    if (pattern) {
      this.ctx.save();
      this.ctx.translate(
        -this.cameraX % this.backgroundTexture.width,
        -this.cameraY % this.backgroundTexture.height
      );
      this.ctx.fillStyle = pattern;
      this.ctx.fillRect(
        -this.backgroundTexture.width,
        -this.backgroundTexture.height,
        this.canvas.width + this.backgroundTexture.width * 2,
        this.canvas.height + this.backgroundTexture.height * 2
      );
      this.ctx.restore();
    }
  }

  drawText(text, fontSize, x, y) {
    this.ctx.fillStyle = 'white';
    this.ctx.font = `${fontSize}px Balsamiq Sans`;
    this.ctx.fontStyle;
    this.ctx.fillText(text, x, y);
  }

  drawInfo() {
    if (!this.isRideComplete && this.isRideStart) {
      const currentTime = ((Date.now() - this.startTime) / 1000).toFixed(2);

      this.drawText(`Время: ${currentTime}`, 32, 25, 45);
      this.drawText(`Уровень: ${this.currentLevel + 1}/${this.levels.length}`, 32, this.canvas.offsetWidth - 210, 45);
    }

    if (!this.isRideStart) {
      const text = `${this.countdown - ((Date.now() - this.startTime) / 1000).toFixed(0)}`;
      this.drawText(text, 64, this.canvas.offsetWidth / 2, this.canvas.offsetHeight * 0.2);
    } else {
      this.drawText(`Счет: ${Math.round(this.score)}`, 32, 25, this.canvas.offsetHeight - 25);

      const name = `${this.username}`;
      this.drawText(name, 32, this.canvas.offsetWidth - this.ctx.measureText(name).width - 25, this.canvas.offsetHeight - 25);
    }

    if (this.isRideComplete && !this.isGameComplete) {
      const winText = this.isPlayerWin ? 'Вы победили!' : 'Вы проиграли.';
      this.drawText(`${winText}`, 64, this.canvas.offsetWidth / 2 - 200, this.canvas.offsetHeight * 0.2);
    }

    if (this.isGameComplete) {
      const result = `Ваш счет: ${Math.round(this.score)}`;
      this.drawText(result, 32, (this.canvas.offsetWidth - this.ctx.measureText(result).width) / 2, this.canvas.offsetHeight * 0.2);
    }
  }

  draw() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    this.drawBackground();
    this.track.draw(this.ctx, this.cameraX, this.cameraY);
    this.player.draw(this.ctx, this.cameraX, this.cameraY);
    this.opponent.draw(this.ctx, this.cameraX, this.cameraY);

    this.drawInfo();
  }

  run() {
    const gameLoop = () => {
      this.update();
      this.draw();
      requestAnimationFrame(gameLoop);
    };
    gameLoop();
  }
}

const game = new Game();
game.run();