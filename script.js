// script.js — Responsive + devicePixelRatio aware + clamp on resize

class Ball {
    constructor(canvas, x = null, y = null) {
        this.canvas = canvas;
        // we treat ball positions in CSS pixels (clientWidth/clientHeight)
        this.ctx = canvas.getContext("2d");

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
        // drawing in CSS-pixel coordinates works because ctx is transformed in resizeCanvas()
        this.ctx.beginPath();
        this.ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        this.ctx.fillStyle = this.color;
        this.ctx.shadowBlur = 20;
        this.ctx.shadowColor = this.color;
        this.ctx.fill();
        this.ctx.shadowBlur = 0; // reset to be safe
    }

    update() {
        this.x += this.speedX;
        this.y += this.speedY;

        const cw = this.canvas.clientWidth;
        const ch = this.canvas.clientHeight;

        // Bounce Left/Right (CSS pixel bounds)
        if (this.x + this.radius > cw) {
            this.x = cw - this.radius;
            this.speedX *= -1;
        } else if (this.x - this.radius < 0) {
            this.x = this.radius;
            this.speedX *= -1;
        }

        // Bounce Top/Bottom (CSS pixel bounds)
        if (this.y + this.radius > ch) {
            this.y = ch - this.radius;
            this.speedY *= -1;
        } else if (this.y - this.radius < 0) {
            this.y = this.radius;
            this.speedY *= -1;
        }
    }

    // ensure ball inside CSS bounds (used after resize)
    clampToBounds() {
        const cw = this.canvas.clientWidth;
        const ch = this.canvas.clientHeight;

        this.x = Math.max(this.radius, Math.min(this.x, cw - this.radius));
        this.y = Math.max(this.radius, Math.min(this.y, ch - this.radius));
    }
}

// MovingBall with tiny acceleration
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

        // initial setup and resize
        this.resizeCanvas();
        // debounce resize a little to avoid thrash on mobile
        let rTO;
        window.addEventListener("resize", () => {
            clearTimeout(rTO);
            rTO = setTimeout(() => {
                this.resizeCanvas();
                // clamp existing balls so none are off-screen
                this.balls.forEach(b => b.clampToBounds());
            }, 80);
        });

        document.getElementById("addBallBtn").addEventListener("click", () => this.addRandomBall());
        document.getElementById("clearBtn").addEventListener("click", () => this.clearBalls());

        // click to add ball (touch-friendly)
        this.canvas.addEventListener("click", (e) => this.addBallOnClick(e));
        this.canvas.addEventListener("touchstart", (e) => {
            // treat first touch as click
            if (e.touches && e.touches[0]) {
                this.addBallOnTouch(e.touches[0]);
            }
        }, {passive: true});

        this.loop();
    }

    // Make canvas backing store match CSS size * devicePixelRatio
    resizeCanvas() {
        const dpr = Math.max(window.devicePixelRatio || 1, 1);
        const cssWidth = this.canvas.clientWidth;
        const cssHeight = this.canvas.clientHeight;

        // set the canvas internal pixel size to match device pixels
        this.canvas.width = Math.floor(cssWidth * dpr);
        this.canvas.height = Math.floor(cssHeight * dpr);

        // reset transform and scale so we can continue to use CSS pixel coords
        this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        // (optional) improve sharpness on some devices
        // this.ctx.imageSmoothingEnabled = true;
    }

    addRandomBall() {
        const ball = Math.random() < 0.5
            ? new Ball(this.canvas)
            : new MovingBall(this.canvas);

        // ensure inside current CSS bounds (ball constructor already uses clientWidth/Height)
        ball.clampToBounds();

        this.balls.push(ball);
        this.updateBallCount();
    }

    addBallOnClick(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left; // CSS pixels
        const y = e.clientY - rect.top;

        const ball = Math.random() < 0.5
            ? new Ball(this.canvas, x, y)
            : new MovingBall(this.canvas, x, y);

        ball.clampToBounds();
        this.balls.push(ball);
        this.updateBallCount();
    }

    addBallOnTouch(touch) {
        const rect = this.canvas.getBoundingClientRect();
        const x = touch.clientX - rect.left;
        const y = touch.clientY - rect.top;

        const ball = new MovingBall(this.canvas, x, y);
        ball.clampToBounds();
        this.balls.push(ball);
        this.updateBallCount();
    }

    clearBalls() {
        this.balls = [];
        this.updateBallCount();
    }

    updateBallCount() {
        document.getElementById("ballCount").textContent = `Balls: ${this.balls.length}`;
    }

    clear() {
        // clear the CSS-sized area; ctx has been scaled so this works in CSS px
        this.ctx.clearRect(0, 0, this.canvas.clientWidth, this.canvas.clientHeight);
    }

    loop = () => {
        this.clear();

        for (let i = 0; i < this.balls.length; i++) {
            const ball = this.balls[i];
            ball.update();
            ball.draw();
        }

        requestAnimationFrame(this.loop);
    }
}

new Game("gameCanvas");
