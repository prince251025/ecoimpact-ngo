// ===============================
// 🌍 EcoImpact NGO Dashboard Script
// Professional Controller Layer
// ===============================


// ===============================
// 👤 Get Logged User
// ===============================

const userData = JSON.parse(localStorage.getItem("user"));

if (!userData) {
  window.location.href = "login.html";
}

const email = userData.email;


// ===============================
// 🎯 Load Dashboard Data
// ===============================

async function loadDashboard() {

  try {

    const res = await fetch("/users");   // ✅ FIXED

    const users = await res.json();

    const user = users.find(u => u.email === email);

    if (!user) return;

    updateStats(user);
    updateProgress(user);
    updateBadge(user);

  } catch (error) {

    console.error("Dashboard Load Error:", error);
    showNotification("Failed to load dashboard ❌");

  }

}


// ===============================
// 📊 Update Stats
// ===============================

function updateStats(user) {

  animateCounter("points", user.points || 0);

  document.getElementById("attendance").innerText =
    user.attendance || 0;

}


// ===============================
// 🏆 Badge Logic
// ===============================

function updateBadge(user) {

  let badge = "Bronze 🥉";

  if (user.points >= 100) badge = "Gold 🌟";
  else if (user.points >= 50) badge = "Silver 🥈";

  document.getElementById("badge").innerText = badge;

}


// ===============================
// 📈 Progress Bar
// ===============================

function updateProgress(user) {

  let percent = (user.points / 100) * 100;

  if (percent > 100) percent = 100;

  const progressBar = document.getElementById("progressBar");
  const progressText = document.getElementById("progressText");

  progressBar.style.width = percent + "%";

  progressText.innerText =
    Math.floor(percent) + "% to Gold Level";

}


// ===============================
// 🔢 Animated Counter
// ===============================

function animateCounter(id, target) {

  let count = 0;

  const element = document.getElementById(id);

  const increment = Math.ceil(target / 50);

  const interval = setInterval(() => {

    count += increment;

    if (count >= target) {
      count = target;
      clearInterval(interval);
    }

    element.innerText = count;

  }, 20);

}


// ===============================
// 🌙 Theme Toggle
// ===============================

function toggleTheme() {

  document.body.classList.toggle("dark-mode");

  localStorage.setItem(
    "theme",
    document.body.classList.contains("dark-mode")
  );

}


// Load saved theme

if (localStorage.getItem("theme") === "true") {

  document.body.classList.add("dark-mode");

}


// ===============================
// ⏱ Attendance System
// ===============================

async function punchIn() {

  try {

    const res = await fetch("/punch-in", {   // ✅ FIXED

      method: "POST",

      headers: {
        "Content-Type": "application/json"
      },

      body: JSON.stringify({ email })

    });

    const data = await res.json();

    showNotification(data.message);

  } catch (err) {

    showNotification("Server Error ❌");

  }

}


async function punchOut() {

  try {

    const res = await fetch("/punch-out", {   // ✅ FIXED

      method: "POST",

      headers: {
        "Content-Type": "application/json"
      },

      body: JSON.stringify({ email })

    });

    const data = await res.json();

    showNotification(data.message);

    loadDashboard();

  } catch (err) {

    showNotification("Server Error ❌");

  }

}


// ===============================
// 📍 GPS Verification
// ===============================

function verifyLocation() {

  if (!navigator.geolocation) {

    return showNotification("Geolocation not supported ❌");

  }

  navigator.geolocation.getCurrentPosition(

    async position => {

      const lat = position.coords.latitude;
      const long = position.coords.longitude;

      const res = await fetch("/gps-check", {   // ✅ FIXED

        method: "POST",

        headers: {
          "Content-Type": "application/json"
        },

        body: JSON.stringify({ email, lat, long })

      });

      const data = await res.json();

      showNotification(data.message);

    },

    () => {

      showNotification("Location permission denied ❌");

    }

  );

}


// ===============================
// 🔔 Notification System
// ===============================

function showNotification(message) {

  const notif = document.createElement("div");

  notif.innerText = message;

  notif.style.position = "fixed";
  notif.style.bottom = "20px";
  notif.style.right = "20px";
  notif.style.background = "#2e7d32";
  notif.style.color = "white";
  notif.style.padding = "12px 18px";
  notif.style.borderRadius = "8px";
  notif.style.boxShadow = "0 5px 15px rgba(0,0,0,0.3)";
  notif.style.zIndex = "999";

  document.body.appendChild(notif);

  setTimeout(() => {
    notif.remove();
  }, 3000);

}


// ===============================
// 🔄 Auto Refresh Dashboard
// ===============================

setInterval(loadDashboard, 10000);


// Initial Load

loadDashboard();