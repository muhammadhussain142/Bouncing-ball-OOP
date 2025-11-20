// script.js — Responsive + devicePixelRatio aware + clamp on resize

class Ball {
    constructor(canvas, x = null, y = null) {
        this.canvas = canvas;
        this.ctx = canvas.getContext("2d");
        this.isGameOver = false; // 🔥 freeze balls when true

        this.radius = Math.random() * 15 + 10;

        const cw = this.canvas.clientWidth;
        const ch = this.canvas.clientHeight;

        this.x = (x !== null) ? x : Math.random() * (cw - this.radius * 2) + this.radius;
        this.y = (y !== null) ? y : Math.random() * (ch - this.radius * 2) + this.radius;

        this.speedX = (Math.random() * 2 + 1) * (Math.random() < 0.5 ? -1 : 1);
        this.speedY = (Math.random() * 2 + 1) * (Math.random() < 0.5 ? -1 : 1);

        this.color = `hsl(${Math.random() * 360}, 80%, 60%)`;
    }

    draw() {
        this.ctx.beginPath();
        this.ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        this.ctx.fillStyle = this.color;
        this.ctx.shadowBlur = 20;
        this.ctx.shadowColor = this.color;
        this.ctx.fill();
        this.ctx.shadowBlur = 0;
    }

    update() {
        this.x += this.speedX;
        this.y += this.speedY;

        const cw = this.canvas.clientWidth;
        const ch = this.canvas.clientHeight;

        if (this.x + this.radius > cw) {
            this.x = cw - this.radius;
            this.speedX *= -1;
        } else if (this.x - this.radius < 0) {
            this.x = this.radius;
            this.speedX *= -1;
        }

        if (this.y + this.radius > ch) {
            this.y = ch - this.radius;
            this.speedY *= -1;
        } else if (this.y - this.radius < 0) {
            this.y = this.radius;
            this.speedY *= -1;
        }
    }

    clampToBounds() {
        const cw = this.canvas.clientWidth;
        const ch = this.canvas.clientHeight;

        this.x = Math.max(this.radius, Math.min(this.x, cw - this.radius));
        this.y = Math.max(this.radius, Math.min(this.y, ch - this.radius));
    }
}

class MovingBall extends Ball {
    constructor(canvas, x = null, y = null) {
        super(canvas, x, y);
        this.ax = (Math.random() - 0.5) * 0.02;
        this.ay = (Math.random() - 0.5) * 0.02;
    }

    update() {
        this.speedX += this.ax;
        this.speedY += this.ay;
        super.update();
    }
}

class Game {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext("2d");

        this.balls = [];

        this.addBtn = document.getElementById("addBallBtn");
        this.clearBtn = document.getElementById("clearBtn");
        this.gameOverBox = document.getElementById("gameOverBox");
        this.restartBtn = document.getElementById("restartBtn");

        this.resizeCanvas();

        let rTO;
        window.addEventListener("resize", () => {
            clearTimeout(rTO);
            rTO = setTimeout(() => {
                this.resizeCanvas();
                this.balls.forEach(b => b.clampToBounds());
            }, 80);
        });

        this.addBtn.addEventListener("click", () => this.addRandomBall());
        this.clearBtn.addEventListener("click", () => this.clearBalls());
        this.restartBtn.addEventListener("click", () => this.restartGame());

        this.canvas.addEventListener("click", (e) => this.addBallOnClick(e));
        this.canvas.addEventListener("touchstart", (e) => {
            if (e.touches && e.touches[0]) {
                this.addBallOnTouch(e.touches[0]);
            }
        }, { passive: true });

        // 💥 add default 20 balls
        for (let i = 0; i < 20; i++) this.addRandomBall();

        this.loop();
    }

    resizeCanvas() {
        const dpr = Math.max(window.devicePixelRatio || 1, 1);
        const cssWidth = this.canvas.clientWidth;
        const cssHeight = this.canvas.clientHeight;

        this.canvas.width = Math.floor(cssWidth * dpr);
        this.canvas.height = Math.floor(cssHeight * dpr);

        this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    // 🔥 GAME OVER CHECK
 checkGameOver() {
    if (this.balls.length >= 100 && !this.isGameOver) {
        this.isGameOver = true; // freeze balls
        this.disableButtons();
        this.gameOverBox.classList.remove("hidden");
        return true;
    }
    return false;
}


    disableButtons() {
        this.addBtn.disabled = true;
        this.clearBtn.disabled = true;

        this.addBtn.style.opacity = "0.4";
        this.clearBtn.style.opacity = "0.4";
        this.addBtn.style.cursor = "not-allowed";
        this.clearBtn.style.cursor = "not-allowed";
    }

    enableButtons() {
        this.addBtn.disabled = false;
        this.clearBtn.disabled = false;

        this.addBtn.style.opacity = "1";
        this.clearBtn.style.opacity = "1";
        this.addBtn.style.cursor = "pointer";
        this.clearBtn.style.cursor = "pointer";
    }

    addRandomBall() {
        if (this.checkGameOver()) return;

        const ball = Math.random() < 0.5
            ? new Ball(this.canvas)
            : new MovingBall(this.canvas);

        ball.clampToBounds();
        this.balls.push(ball);
        this.updateBallCount();
    }

    addBallOnClick(e) {
        if (this.checkGameOver()) return;

        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const ball = Math.random() < 0.5
            ? new Ball(this.canvas, x, y)
            : new MovingBall(this.canvas, x, y);

        ball.clampToBounds();
        this.balls.push(ball);
        this.updateBallCount();
    }

    addBallOnTouch(touch) {
        if (this.checkGameOver()) return;

        const rect = this.canvas.getBoundingClientRect();
        const x = touch.clientX - rect.left;
        const y = touch.clientY - rect.top;

        const ball = new MovingBall(this.canvas, x, y);

        ball.clampToBounds();
        this.balls.push(ball);
        this.updateBallCount();
    }

    clearBalls() {
        if (this.clearBtn.disabled) return; // prevent clearing at 200

        this.balls = [];
        this.updateBallCount();
    }

    restartGame() {
        this.isGameOver = false; // allow balls to move again

        this.balls = [];
        this.enableButtons();
        this.gameOverBox.classList.add("hidden");
        this.isGameOver = false; // allow balls to move again

        for (let i = 0; i < 20; i++) this.addRandomBall();

        this.updateBallCount();
    }

    updateBallCount() {
        document.getElementById("ballCount").textContent =
            `Balls: ${this.balls.length}`;
    }

    clear() {
        this.ctx.clearRect(0, 0, this.canvas.clientWidth, this.canvas.clientHeight);
    }

    loop = () => {
        this.clear();

      for (let i = 0; i < this.balls.length; i++) {
    const ball = this.balls[i];

    if (!this.isGameOver) ball.update(); // only move if game not over
    ball.draw();
}


        requestAnimationFrame(this.loop);
    }
}

new Game("gameCanvas");
