// =======================================
// 🌍 EcoImpact - Clean The City Game
// Professional NGO Gamification Engine
// =======================================

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let plastics = [];
let score = 0;
let lives = 3;
let level = 1;
let gameOver = false;
let timer = 60;

// ============================
// 🗑 Player Bin
// ============================

const bin = {
  width: 120,
  height: 30,
  x: canvas.width / 2 - 60,
  y: canvas.height - 60,
  speed: 8
};


// ============================
// 🎮 Controls
// ============================

document.addEventListener("keydown", (e) => {

  if (e.key === "ArrowLeft" && bin.x > 0) {
    bin.x -= bin.speed;
  }

  if (e.key === "ArrowRight" && bin.x < canvas.width - bin.width) {
    bin.x += bin.speed;
  }

});


// ============================
// ♻ Create Plastic Waste
// ============================

function createPlastic() {

  if (gameOver) return;

  plastics.push({
    x: Math.random() * (canvas.width - 40),
    y: 0,
    size: 35,
    speed: 2 + level
  });

}

setInterval(createPlastic, 1000);


// ============================
// 🎯 Collision Detection
// ============================

function checkCollision(p) {

  return (
    p.x < bin.x + bin.width &&
    p.x + p.size > bin.x &&
    p.y + p.size > bin.y &&
    p.y < bin.y + bin.height
  );

}


// ============================
// 🖌 Draw Game
// ============================

function draw() {

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Background
  ctx.fillStyle = "#e8f5e9";
  ctx.fillRect(0, 0, canvas.width, canvas.height);


  // Draw Plastics

  plastics.forEach((p, index) => {

    p.y += p.speed;

    ctx.font = "30px Arial";
    ctx.fillText("🧴", p.x, p.y);


    // Catch plastic

    if (checkCollision(p)) {

      score += 10;
      plastics.splice(index, 1);

    }


    // Missed plastic

    if (p.y > canvas.height) {

      lives--;
      plastics.splice(index, 1);

    }

  });


  // Draw Bin

  ctx.fillStyle = "#2e7d32";
  ctx.fillRect(bin.x, bin.y, bin.width, bin.height);

  ctx.fillStyle = "white";
  ctx.font = "16px Arial";
  ctx.fillText("Recycle", bin.x + 25, bin.y + 20);


  // HUD

  ctx.fillStyle = "#1b5e20";
  ctx.font = "22px Arial";

  ctx.fillText("Score: " + score, 20, 40);
  ctx.fillText("Lives: " + lives, 20, 70);
  ctx.fillText("Level: " + level, 20, 100);
  ctx.fillText("Time: " + timer, 20, 130);


  if (lives <= 0 || timer <= 0) {
    endGame();
  }

  if (!gameOver) {
    requestAnimationFrame(draw);
  }

}

draw();


// ============================
// ⏱ Timer System
// ============================

const gameTimer = setInterval(() => {

  if (!gameOver) {

    timer--;

    if (score >= level * 100) {
      level++;
    }

  }

}, 1000);


// ============================
// 🏁 End Game
// ============================

function endGame() {

  gameOver = true;
  clearInterval(gameTimer);

  ctx.fillStyle = "rgba(0,0,0,0.7)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "white";
  ctx.font = "40px Arial";
  ctx.fillText("Mission Completed 🌍", canvas.width / 2 - 200, canvas.height / 2 - 40);

  ctx.font = "28px Arial";
  ctx.fillText("Final Score: " + score, canvas.width / 2 - 100, canvas.height / 2 + 10);

  submitScore();

}


// ============================
// 📡 Send Score to Backend
// ============================

function submitScore() {

  const user = JSON.parse(localStorage.getItem("user"));

  if (!user) return;

  fetch("/add-points", {   // ✅ FIXED (removed localhost)

    method: "POST",

    headers: {
      "Content-Type": "application/json"
    },

    body: JSON.stringify({
      email: user.email,
      points: score
    })

  })
  .then(res => res.json())
  .then(data => console.log("Score submitted:", data))
  .catch(err => console.log("Server error:", err));

}