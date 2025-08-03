// ===== LAVA INVADERS MAIN GAME FILE =====

// Increased screen size by 30%
const GAME_WIDTH = 1040; // 800 * 1.3 = 1040
const GAME_HEIGHT = 1000;
// Make player image bigger: increase PLAYER_SIZE (e.g. 68 → 84)
const PLAYER_SIZE = 84; // was 68, made a bit bigger per request
// Slow down player speed by 30%
const PLAYER_SPEED = 6 * 0.7; // was 6, reduced by 30%
const BULLET_WIDTH = 6;
const BULLET_HEIGHT = 14;
const BULLET_SPEED = 10;
const ENEMY_SIZE = 34;
// === ENEMY SPEED SLOWED DOWN ===
const ENEMY_SPEED = 1.1; // was 2, now slower
// === ENEMY SPAWN RATE INCREASED ===
const ENEMY_SPAWN_INTERVAL = 500; // ms (was 900, now higher spawn rate)
const ENEMY_BULLET_SPEED = 4;
const ENEMY_FIRE_INTERVAL = 1600; // ms

let canvas, ctx;

// --- Background image setup ---
const BG_IMAGE_URL = "https://dcnmwoxzefwqmvvkpqap.supabase.co/storage/v1/object/public/sprite-studio-exports/a45debfa-3375-4943-95c0-bba87672928d/library/Lava_final_1753845381470.png";
const bgImage = new window.Image();
bgImage.src = BG_IMAGE_URL;
let bgImageLoaded = false;
bgImage.onload = () => { bgImageLoaded = true; };

// --- Player image setup ---
const PLAYER_IMAGE_URL = "https://dcnmwoxzefwqmvvkpqap.supabase.co/storage/v1/object/public/sprite-studio-exports/620dfb9b-13c8-4733-a462-aea820328b33/library/Ice_ship_1754196895988.png";
const playerImg = new window.Image();
playerImg.src = PLAYER_IMAGE_URL;
let playerImgLoaded = false;
playerImg.onload = () => { playerImgLoaded = true; };

function initGame() {
    const container = document.getElementById('gameContainer');
    canvas = document.createElement('canvas');
    canvas.width = GAME_WIDTH;
    canvas.height = GAME_HEIGHT;
    canvas.tabIndex = 1;
    ctx = canvas.getContext('2d');
    container.innerHTML = '';
    container.appendChild(canvas);

    new Game().render(); // Game constructor calls render or gameLoop
}

window.addEventListener('DOMContentLoaded', initGame);

class Player {
    constructor() {
        this.x = GAME_WIDTH / 2 - PLAYER_SIZE / 2;
        this.y = GAME_HEIGHT - PLAYER_SIZE - 10;
        this.w = PLAYER_SIZE;
        this.h = PLAYER_SIZE;
        this.color = "#aefaff"; // icy blue
        this.isAlive = true;
        this.cooldown = 0;
        this.lives = 3;

        // Dash ability
        this.dashCooldown = 0; // frames remaining on cooldown
        this.dashCooldownFrames = 180; // 3 seconds at 60fps
        this.dashDistance = 180; // pixels to dash
        this.dashActive = false; // for visual feedback if desired
        this.dashKeyDown = false; // track Shift key edge
    }
    move(dx, dy) {
        // Allow free movement: both x and y, clamp to screen boundaries
        this.x = Math.max(0, Math.min(GAME_WIDTH - this.w, this.x + dx));
        this.y = Math.max(0, Math.min(GAME_HEIGHT - this.h, this.y + dy));
    }
    dash(dx, dy) {
        // Only dash if not cooling down and direction provided
        if (this.dashCooldown <= 0 && (dx !== 0 || dy !== 0)) {
            this.x = Math.max(0, Math.min(GAME_WIDTH - this.w, this.x + dx * this.dashDistance));
            this.y = Math.max(0, Math.min(GAME_HEIGHT - this.h, this.y + dy * this.dashDistance));
            this.dashCooldown = this.dashCooldownFrames;
            this.dashActive = true;
            setTimeout(() => { this.dashActive = false; }, 120); // short visual indicator if needed
        }
    }
    shoot(bullets) {
        if (this.cooldown <= 0) {
            // Duo gun system: two guns, one on either side of the spaceship
            // We'll place them slightly in from the edges, and both fire straight up

            const leftGunOffsetX = this.w * 0.22;
            const rightGunOffsetX = this.w * 0.78 - BULLET_WIDTH;
            const gunOffsetY = this.h * 0.09; // slightly down from very top for realism

            // Left gun (fires straight up)
            bullets.push(
                new Bullet(
                    this.x + leftGunOffsetX,
                    this.y + gunOffsetY,
                    0,
                    -1
                )
            );
            // Right gun (fires straight up)
            bullets.push(
                new Bullet(
                    this.x + rightGunOffsetX,
                    this.y + gunOffsetY,
                    0,
                    -1
                )
            );
            this.cooldown = 10;
        }
    }
    update() {
        if (this.cooldown > 0) this.cooldown--;
        if (this.dashCooldown > 0) this.dashCooldown--;
    }
    draw(ctx) {
        if (playerImgLoaded) {
            ctx.save();
            if (this.dashActive) {
                ctx.globalAlpha = 0.55;
                ctx.shadowColor = "#aefaff";
                ctx.shadowBlur = 50;
            }
            ctx.drawImage(playerImg, this.x, this.y, this.w, this.h);
            ctx.restore();
        } else {
            // Fallback: draw original vector ship if image not loaded yet
            ctx.save();
            if (this.dashActive) {
                ctx.globalAlpha = 0.55;
                ctx.shadowColor = "#aefaff";
                ctx.shadowBlur = 50;
            }
            ctx.shadowColor = "#aefaff";
            ctx.shadowBlur = 18;
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.moveTo(this.x + this.w / 2, this.y); // nose
            ctx.lineTo(this.x + this.w * 0.18, this.y + this.h * 0.85); // left lower
            ctx.lineTo(this.x + this.w * 0.35, this.y + this.h * 0.68); // left facet
            ctx.lineTo(this.x + this.w / 2, this.y + this.h); // bottom tip
            ctx.lineTo(this.x + this.w * 0.65, this.y + this.h * 0.68); // right facet
            ctx.lineTo(this.x + this.w * 0.82, this.y + this.h * 0.85); // right lower
            ctx.closePath();
            ctx.fill();

            // Icy shine overlay
            ctx.globalAlpha = 0.5;
            ctx.fillStyle = "#fff";
            ctx.beginPath();
            ctx.moveTo(this.x + this.w / 2, this.y + this.h * 0.08);
            ctx.lineTo(this.x + this.w * 0.34, this.y + this.h * 0.7);
            ctx.lineTo(this.x + this.w * 0.66, this.y + this.h * 0.7);
            ctx.closePath();
            ctx.fill();
            ctx.globalAlpha = 1;

            ctx.restore();

            // Ship "window" - frosty effect
            ctx.save();
            ctx.fillStyle = "#e0faffcc";
            ctx.beginPath();
            ctx.arc(this.x + this.w / 2, this.y + this.h * 0.65, this.w * 0.13, 0, 2 * Math.PI);
            ctx.fill();
            ctx.restore();
        }
    }
}

class Bullet {
    // Add dx, dy for arrow formation (default to straight up)
    constructor(x, y, dx = 0, dy = -1) {
        this.x = x;
        this.y = y;
        this.w = BULLET_WIDTH;
        this.h = BULLET_HEIGHT;
        this.color = "#aefaff"; // icy blue
        this.active = true;
        // Bullet direction as a unit vector (dx, dy)
        // Normalize for consistent speed
        const len = Math.sqrt(dx * dx + dy * dy);
        if (len > 0.01) {
            this.dx = dx / len;
            this.dy = dy / len;
        } else {
            this.dx = 0;
            this.dy = -1;
        }
    }
    update() {
        this.x += this.dx * BULLET_SPEED;
        this.y += this.dy * BULLET_SPEED;
        // Remove bullet if out of bounds
        if (
            this.y < -this.h ||
            this.x < -this.w ||
            this.x > GAME_WIDTH + this.w ||
            this.y > GAME_HEIGHT + this.h
        ) {
            this.active = false;
        }
    }
    draw(ctx) {
        ctx.save();
        // Icy bullet with glow
        ctx.shadowColor = "#aefaff";
        ctx.shadowBlur = 10;
        ctx.fillStyle = this.color;

        // Draw as a rectangle (since both guns fire straight up)
        ctx.fillRect(this.x, this.y, this.w, this.h);
        ctx.restore();
    }
}

class Enemy {
    constructor(x, y, type = 0) {
        this.x = x;
        this.y = y;
        this.w = ENEMY_SIZE;
        this.h = ENEMY_SIZE;
        // Lava colors
        this.color = type === 1 ? "#ffad31" : "#ff3733";
        this.type = type;
        this.speed = ENEMY_SPEED + (type * 1.2);
        this.active = true;
        this.cooldown = randomInt(80, 120); // Frames before next shot
        this.isFrozen = false; // For freeze ability
    }
    update(isFrozen) {
        if (!this.isFrozen && !isFrozen) {
            this.y += this.speed;
        }
        if (this.y > GAME_HEIGHT) this.active = false;
        this.cooldown--;
    }
    tryShoot(enemyBullets, isFrozen) {
        if (isFrozen || this.isFrozen) return;
        if (this.cooldown <= 0 && this.type === 1) {
            enemyBullets.push(new EnemyBullet(this.x + this.w / 2 - 4, this.y + this.h));
            this.cooldown = randomInt(80, 120);
        }
    }
    draw(ctx, isFrozen) {
        ctx.save();
        // Lava monster: glowing, molten orb with "cracks"
        // Main body (lava orb)
        const grad = ctx.createRadialGradient(
            this.x + this.w / 2, this.y + this.h / 2, this.w * 0.15,
            this.x + this.w / 2, this.y + this.h / 2, this.w / 2
        );
        grad.addColorStop(0, "#fff3");
        grad.addColorStop(0.22, "#ffe45b");
        grad.addColorStop(0.48, this.color);
        grad.addColorStop(1, "#660a00");
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 24;
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(this.x + this.w / 2, this.y + this.h / 2, this.w / 2, 0, 2 * Math.PI);
        ctx.fill();
        ctx.restore();

        // Cracks - jagged lines simulating lava cracks
        ctx.save();
        ctx.strokeStyle = "#fff9";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(this.x + this.w * 0.28, this.y + this.h * 0.38);
        ctx.lineTo(this.x + this.w * 0.46, this.y + this.h * 0.45);
        ctx.lineTo(this.x + this.w * 0.42, this.y + this.h * 0.66);
        ctx.moveTo(this.x + this.w * 0.65, this.y + this.h * 0.4);
        ctx.lineTo(this.x + this.w * 0.55, this.y + this.h * 0.58);
        ctx.lineTo(this.x + this.w * 0.67, this.y + this.h * 0.7);
        ctx.stroke();
        ctx.restore();

        // "Face" - glowing eyes
        ctx.save();
        ctx.shadowColor = "#fff";
        ctx.shadowBlur = 8;
        ctx.fillStyle = "#fffdbb";
        ctx.beginPath();
        ctx.arc(this.x + this.w / 2 - 8, this.y + this.h / 2 - 6, 3, 0, 2 * Math.PI);
        ctx.arc(this.x + this.w / 2 + 8, this.y + this.h / 2 - 6, 3, 0, 2 * Math.PI);
        ctx.fill();
        ctx.restore();

        // If frozen, draw icy overlay
        if (isFrozen || this.isFrozen) {
            ctx.save();
            ctx.globalAlpha = 0.38;
            ctx.fillStyle = "#aefaff";
            ctx.beginPath();
            ctx.arc(this.x + this.w / 2, this.y + this.h / 2, this.w / 2 + 2, 0, 2 * Math.PI);
            ctx.fill();
            ctx.globalAlpha = 1;
            // White frost lines
            ctx.strokeStyle = "#f4ffff";
            ctx.lineWidth = 2.2;
            ctx.beginPath();
            ctx.moveTo(this.x + this.w * 0.2, this.y + this.h * 0.6);
            ctx.lineTo(this.x + this.w * 0.8, this.y + this.h * 0.3);
            ctx.moveTo(this.x + this.w * 0.7, this.y + this.h * 0.8);
            ctx.lineTo(this.x + this.w * 0.36, this.y + this.h * 0.22);
            ctx.stroke();
            ctx.restore();
        }
    }
}

class EnemyBullet {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.w = 8;
        this.h = 16;
        this.color = "#ffad31"; // Lava orange
        this.active = true;
    }
    update() {
        this.y += ENEMY_BULLET_SPEED;
        if (this.y > GAME_HEIGHT) this.active = false;
    }
    draw(ctx) {
        ctx.save();
        // Lava "drop" bullet with glow
        ctx.shadowColor = "#ffad31";
        ctx.shadowBlur = 13;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.ellipse(this.x + this.w / 2, this.y + this.h / 2, this.w / 2, this.h / 2, 0, 0, 2 * Math.PI);
        ctx.fill();
        ctx.restore();
    }
}

// Draws a heart icon at (x, y) with given size. Used for lives HUD.
function drawHeart(ctx, x, y, size, options = {}) {
    ctx.save();
    ctx.beginPath();
    // Draw two semi-circles and a triangle
    const topCurveHeight = size * 0.3;
    ctx.moveTo(x + size / 2, y + size / 2 + topCurveHeight);
    ctx.bezierCurveTo(
        x + size / 2, y + size / 2,
        x + size, y + size / 2,
        x + size, y + size / 2 + topCurveHeight
    );
    ctx.bezierCurveTo(
        x + size, y + size,
        x + size / 2, y + size * 1.13,
        x + size / 2, y + size * 1.37
    );
    ctx.bezierCurveTo(
        x + size / 2, y + size * 1.13,
        x, y + size,
        x, y + size / 2 + topCurveHeight
    );
    ctx.bezierCurveTo(
        x, y + size / 2,
        x + size / 2, y + size / 2,
        x + size / 2, y + size / 2 + topCurveHeight
    );
    ctx.closePath();
    ctx.globalAlpha = options.alpha !== undefined ? options.alpha : 1;
    ctx.fillStyle = options.color || "#ff516a"; // pinkish red
    ctx.shadowColor = options.glow || "#fff";
    ctx.shadowBlur = options.glowBlur !== undefined ? options.glowBlur : 5;
    ctx.fill();
    ctx.restore();
}

class Game {
    constructor() {
        this.state = 'menu'; // menu, playing, gameover
        this.score = 0;
        this.player = new Player();
        this.bullets = [];
        this.enemies = [];
        this.enemyBullets = [];
        this.keys = {};
        this.lastEnemySpawn = 0;
        this.lastEnemyType = 0;
        this.enemySpawnInterval = ENEMY_SPAWN_INTERVAL;
        this.frame = 0;

        // Fire tracking: now supports autofire when holding space
        this.isFiring = false;

        // Freeze ability state
        this.freezeCharge = 0; // Number of enemies destroyed toward charge
        this.FREEZE_CHARGE_REQUIRED = 15;
        this.freezeReady = false;
        this.isFreezeActive = false;
        this.FREEZE_DURATION_FRAMES = 180; // 3 seconds at 60fps
        this.freezeFramesLeft = 0;

        this.handleKeydown = this.handleKeydown.bind(this);
        this.handleKeyup = this.handleKeyup.bind(this);
        this.startGame = this.startGame.bind(this);
        this.restartGame = this.restartGame.bind(this);

        this.showMenu();

        // Input listeners
        window.addEventListener('keydown', this.handleKeydown);
        window.addEventListener('keyup', this.handleKeyup);
    }

    startGame() {
        this.state = 'playing';
        this.score = 0;
        this.player = new Player();
        this.bullets = [];
        this.enemies = [];
        this.enemyBullets = [];
        this.frame = 0;
        this.isFiring = false;
        this.freezeCharge = 0;
        this.freezeReady = false;
        this.isFreezeActive = false;
        this.freezeFramesLeft = 0;
        this.hideMenus();
        this.render();
    }

    restartGame() {
        this.startGame();
    }

    handleKeydown(e) {
        if (this.state === 'playing') {
            this.keys[e.code] = true;
            // Start firing when space is held down
            if (e.code === 'Space') {
                e.preventDefault();
                this.isFiring = true;
            }
            // Dash ability (Shift key, edge-triggered)
            if (
                (e.code === 'ShiftLeft' || e.code === 'ShiftRight') &&
                !this.player.dashKeyDown // only on press, not repeat
            ) {
                this.player.dashKeyDown = true;
                // Get dash direction from current movement keys (default up if none)
                let dx = 0, dy = 0;
                if (this.keys['ArrowLeft'] || this.keys['KeyA']) dx = -1;
                if (this.keys['ArrowRight'] || this.keys['KeyD']) dx = 1;
                if (this.keys['ArrowUp'] || this.keys['KeyW']) dy = -1;
                if (this.keys['ArrowDown'] || this.keys['KeyS']) dy = 1;
                // Prefer to dash in the last direction pressed, or up if idle
                if (dx === 0 && dy === 0) {
                    dy = -1;
                }
                this.player.dash(dx, dy);
            }
            // Freeze ability (E key, edge-triggered)
            if (
                (e.code === 'KeyE' || e.key === 'e' || e.key === 'E') &&
                this.freezeReady &&
                !this.isFreezeActive
            ) {
                this.activateFreeze();
            }
        }
    }
    handleKeyup(e) {
        if (this.state === 'playing') {
            this.keys[e.code] = false;
            if (e.code === 'Space') {
                this.isFiring = false;
            }
            if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
                this.player.dashKeyDown = false;
            }
        }
    }

    activateFreeze() {
        this.isFreezeActive = true;
        this.freezeFramesLeft = this.FREEZE_DURATION_FRAMES;
        this.freezeReady = false;
        // Visual: mark all enemies as frozen for duration (for easy drawing)
        // (Optional - we can pass isFreezeActive to draw/update instead)
        // But for consistency, mark per enemy so that new spawns aren't frozen.
        for (let enemy of this.enemies) {
            enemy.isFrozen = true;
        }
    }

    updateFreezeState() {
        if (this.isFreezeActive) {
            this.freezeFramesLeft--;
            if (this.freezeFramesLeft <= 0) {
                this.isFreezeActive = false;
                // Unfreeze all enemies
                for (let enemy of this.enemies) {
                    enemy.isFrozen = false;
                }
            }
        }
    }

    showMenu() {
        this.hideMenus();
        const menu = document.createElement('div');
        menu.id = 'startMenu';
        menu.innerHTML = `
            <h1>🌋 LAVA INVADERS</h1>
            <p>Arrow keys to move, Space to shoot.<br>Survive the lava horde!</p>
            <p><b>SHIFT</b> to Dash (3s cooldown)</p>
            <p><b>E</b> to Freeze All (${this.FREEZE_CHARGE_REQUIRED} kills, 3s duration)</p>
            <button id="startGameBtn">Start Game</button>
        `;
        document.body.appendChild(menu);
        document.getElementById('startGameBtn').onclick = this.startGame;
    }
    showGameOver() {
        this.hideMenus();
        const over = document.createElement('div');
        over.id = 'gameOverScreen';
        over.innerHTML = `
            <h2>Game Over</h2>
            <p>Score: ${this.score}</p>
            <button id="restartBtn">Restart</button>
        `;
        document.body.appendChild(over);
        document.getElementById('restartBtn').onclick = this.restartGame;
    }
    hideMenus() {
        const menu = document.getElementById('startMenu');
        if (menu) menu.remove();
        const over = document.getElementById('gameOverScreen');
        if (over) over.remove();
    }

    render() {
        // Main game loop
        ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

        // Draw background - now using an image
        this.drawBackground();

        if (this.state === 'menu' || this.state === 'gameover') {
            // Draw faded player ship on menu as a "preview"
            this.player.draw(ctx);
            return;
        }

        // --- Game playing ---
        // Handle player movement (now free across the screen)
        let dx = 0, dy = 0;
        if (this.keys['ArrowLeft'] || this.keys['KeyA']) dx -= PLAYER_SPEED;
        if (this.keys['ArrowRight'] || this.keys['KeyD']) dx += PLAYER_SPEED;
        if (this.keys['ArrowUp'] || this.keys['KeyW']) dy -= PLAYER_SPEED;
        if (this.keys['ArrowDown'] || this.keys['KeyS']) dy += PLAYER_SPEED;
        this.player.move(dx, dy);

        // Autofire: shoot automatically while space is held, respecting cooldown
        if (this.isFiring) {
            this.player.shoot(this.bullets);
        }

        this.player.update();

        // Update freeze state
        this.updateFreezeState();

        // Spawn enemies
        if (this.frame - this.lastEnemySpawn > this.enemySpawnInterval / (1 + this.score / 300)) {
            const type = Math.random() < 0.2 ? 1 : 0;
            const x = randomInt(0, GAME_WIDTH - ENEMY_SIZE);
            this.enemies.push(new Enemy(x, -ENEMY_SIZE, type));
            this.lastEnemySpawn = this.frame;
        }

        // Update enemies and bullets
        for (let enemy of this.enemies) {
            enemy.update(this.isFreezeActive || enemy.isFrozen);
            enemy.tryShoot(this.enemyBullets, this.isFreezeActive || enemy.isFrozen);
        }
        for (let bullet of this.bullets) bullet.update();
        for (let eb of this.enemyBullets) eb.update();

        // Handle collisions
        this.handleCollisions();

        // Remove inactive objects
        this.enemies = this.enemies.filter(e => e.active);
        this.bullets = this.bullets.filter(b => b.active);
        this.enemyBullets = this.enemyBullets.filter(b => b.active);

        // Draw entities
        this.player.draw(ctx);
        for (let bullet of this.bullets) bullet.draw(ctx);
        for (let enemy of this.enemies) enemy.draw(ctx, this.isFreezeActive || enemy.isFrozen);
        for (let eb of this.enemyBullets) eb.draw(ctx);

        // Draw UI
        this.drawHUD();

        // End game if player dead
        if (!this.player.isAlive) {
            this.state = 'gameover';
            setTimeout(() => this.showGameOver(), 600);
            return;
        }

        this.frame++;
        requestAnimationFrame(() => this.render());
    }

    drawHUD() {
        ctx.save();
        ctx.font = 'bold 18px Segoe UI, Arial';
        ctx.fillStyle = '#fff';
        ctx.shadowColor = "#aefaff";
        ctx.shadowBlur = 6;
        ctx.fillText(`Score: ${this.score}`, 20, 34);

        // --- Lives: Draw hearts instead of numeric counter ---
        const heartSize = 28;
        const heartGap = 8;
        const livesX = GAME_WIDTH - 20 - (heartSize * 3 + heartGap * 2); // right side, enough space for 3 hearts
        const livesY = 20;

        for (let i = 0; i < 3; i++) {
            if (i < this.player.lives) {
                drawHeart(ctx, livesX + i * (heartSize + heartGap), livesY, heartSize, {
                    color: "#ff516a",
                    glow: "#fff4",
                    glowBlur: 12,
                    alpha: 1
                });
            } else {
                // Draw faded/empty heart for lost life
                drawHeart(ctx, livesX + i * (heartSize + heartGap), livesY, heartSize, {
                    color: "#412030",
                    glow: "#fff2",
                    glowBlur: 3,
                    alpha: 0.33
                });
            }
        }

        // Vertical layout parameters for equidistant placement
        const verticalGap = 32; // vertical gap between HUD items

        // Dash cooldown indicator - now drawn below the hearts, right aligned
        ctx.font = '16px Segoe UI, Arial';
        let ready = this.player.dashCooldown <= 0;
        ctx.save();
        ctx.globalAlpha = 0.82;
        ctx.textAlign = "right";
        ctx.fillStyle = ready ? "#7bfbff" : "#ffad31";
        let dashMsg = ready ? "Dash Ready" : `Dash: ${(this.player.dashCooldown/60).toFixed(1)}s`;
        const dashY = livesY + heartSize + verticalGap; // Place dash below hearts with verticalGap
        ctx.fillText(dashMsg, GAME_WIDTH - 20, dashY);
        ctx.restore();

        // --- Freeze ability progress bar and status ---
        ctx.save();
        // Smaller bar dimensions
        const barWidth = 140;
        const barHeight = 12;
        // Place it further under the dash counter, right-aligned to the lives/dash
        const freezeBarY = dashY + verticalGap; // equidistant below dash

        const barX = GAME_WIDTH - barWidth - 20;

        // Background
        ctx.globalAlpha = 0.18;
        ctx.fillStyle = '#fff';
        ctx.fillRect(barX, freezeBarY, barWidth, barHeight);
        ctx.globalAlpha = 1;
        // Progress
        let pct = Math.min(1, this.freezeCharge / this.FREEZE_CHARGE_REQUIRED);
        ctx.save();
        if (this.isFreezeActive) {
            // Animate blue/white bar when active
            let grad = ctx.createLinearGradient(barX, 0, barX + barWidth, 0);
            grad.addColorStop(0, "#aefaff");
            grad.addColorStop(0.65, "#e0fdff");
            grad.addColorStop(1, "#aefaff");
            ctx.fillStyle = grad;
            ctx.globalAlpha = 0.82 + 0.18 * Math.sin(Date.now()/110);
            ctx.fillRect(barX, freezeBarY, barWidth, barHeight);
        } else {
            // Standard fill
            ctx.fillStyle = "#81e9ff";
            ctx.globalAlpha = 0.89;
            ctx.fillRect(barX, freezeBarY, barWidth * pct, barHeight);
        }
        ctx.restore();
        // Border
        ctx.save();
        ctx.globalAlpha = 0.62;
        ctx.strokeStyle = "#aefaff";
        ctx.lineWidth = 2;
        ctx.strokeRect(barX, freezeBarY, barWidth, barHeight);
        ctx.restore();

        // Label
        ctx.font = '14px Segoe UI, Arial';
        ctx.globalAlpha = 0.99;
        ctx.textAlign = "right";
        let freezeMsg = "";
        if (this.isFreezeActive) {
            freezeMsg = `FREEZE: ${(this.freezeFramesLeft/60).toFixed(1)}s`;
            ctx.fillStyle = "#fff";
            ctx.shadowColor = "#aefaff";
            ctx.shadowBlur = 8;
        } else if (this.freezeReady) {
            freezeMsg = `Press E to FREEZE!`;
            ctx.fillStyle = "#aefaff";
            ctx.shadowColor = "#fff";
            ctx.shadowBlur = 5;
        } else {
            freezeMsg = `Freeze: ${this.freezeCharge} / ${this.FREEZE_CHARGE_REQUIRED}`;
            ctx.fillStyle = "#d0fcff";
            ctx.shadowBlur = 0;
        }
        // Place label just above the bar, right-aligned
        ctx.fillText(freezeMsg, barX + barWidth, freezeBarY - 4);
        ctx.restore();

        ctx.restore();
    }

    drawBackground() {
        // Draw the new background image, scaled to fit canvas
        if (bgImageLoaded) {
            ctx.save();
            ctx.globalAlpha = 1;
            ctx.drawImage(bgImage, 0, 0, GAME_WIDTH, GAME_HEIGHT);
            ctx.restore();
        } else {
            // fallback: fill with a dark color until image loads
            ctx.save();
            ctx.fillStyle = "#1a0602";
            ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
            ctx.restore();
        }
    }

    handleCollisions() {
        // Player bullets vs enemies
        for (let bullet of this.bullets) {
            for (let enemy of this.enemies) {
                if (bullet.active && enemy.active && rectsCollide(bullet, enemy)) {
                    bullet.active = false;
                    enemy.active = false;
                    this.score += 50 + enemy.type * 50;
                    // Freeze charge logic
                    this.freezeCharge++;
                    if (!this.freezeReady && this.freezeCharge >= this.FREEZE_CHARGE_REQUIRED) {
                        this.freezeCharge = this.FREEZE_CHARGE_REQUIRED;
                        this.freezeReady = true;
                    }
                }
            }
        }
        // Enemies vs player
        for (let enemy of this.enemies) {
            if (enemy.active && rectsCollide(enemy, this.player)) {
                enemy.active = false;
                this.player.lives--;
                if (this.player.lives <= 0) this.player.isAlive = false;
            }
        }
        // Enemy bullets vs player
        for (let eb of this.enemyBullets) {
            if (eb.active && rectsCollide(eb, this.player)) {
                eb.active = false;
                this.player.lives--;
                if (this.player.lives <= 0) this.player.isAlive = false;
            }
        }
    }
}

// Utility for collision and random int (if not present in utils.js)
function rectsCollide(a, b) {
    return a.x < b.x + b.w &&
           a.x + a.w > b.x &&
           a.y < b.y + b.h &&
           a.y + a.h > b.y;
}
function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}