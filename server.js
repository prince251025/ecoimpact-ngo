const express = require("express");
const cors = require("cors");
const multer = require("multer");
const bcrypt = require("bcrypt");
const { v4: uuidv4 } = require("uuid");
const fs = require("fs");

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

/* ---------------- DATABASE (File Based Professional System) ---------------- */

const DB_FILE = "db.json";

function readDB() {
  return JSON.parse(fs.readFileSync(DB_FILE));
}

function writeDB(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

/* ---------------- FILE UPLOAD ---------------- */

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    if (!fs.existsSync("./uploads")) {
      fs.mkdirSync("./uploads");
    }
    cb(null, "./uploads");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage });

app.use("/uploads", express.static("uploads"));

/* ---------------- REGISTER ---------------- */

app.post("/register", async (req, res) => {
  const { email, password } = req.body;
  const db = readDB();

  const userExists = db.users.find((u) => u.email === email);
  if (userExists) {
    return res.json({ success: false, message: "User already exists" });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const newUser = {
    id: uuidv4(),
    email,
    password: hashedPassword,
    role: "volunteer",
    points: 0,
    attendance: 0,
    totalHours: 0,
    badge: "Bronze 🥉",
    punchIn: null,
    proofs: [],
  };

  db.users.push(newUser);
  writeDB(db);

  res.json({ success: true, message: "Account created successfully" });
});

/* ---------------- LOGIN ---------------- */

app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const db = readDB();

  const user = db.users.find((u) => u.email === email);
  if (!user) return res.json({ success: false, message: "User not found" });

  const match = await bcrypt.compare(password, user.password);
  if (!match) return res.json({ success: false, message: "Wrong password" });

  res.json({
    success: true,
    user: {
      email: user.email,
      role: user.role,
      points: user.points,
      attendance: user.attendance,
      badge: user.badge,
    },
  });
});

/* ---------------- ATTENDANCE ---------------- */

app.post("/punch-in", (req, res) => {
  const { email } = req.body;
  const db = readDB();
  const user = db.users.find((u) => u.email === email);

  if (!user) return res.json({ message: "User not found" });

  user.punchIn = Date.now();
  writeDB(db);

  res.json({ message: "Punch In recorded" });
});

app.post("/punch-out", (req, res) => {
  const { email } = req.body;
  const db = readDB();
  const user = db.users.find((u) => u.email === email);

  if (!user || !user.punchIn)
    return res.json({ message: "Punch In first" });

  const hoursWorked =
    (Date.now() - user.punchIn) / (1000 * 60 * 60);

  user.attendance += 1;
  user.totalHours += hoursWorked;
  user.points += Math.floor(hoursWorked * 10);

  user.punchIn = null;

  if (user.points > 200) user.badge = "Gold 🥇";
  else if (user.points > 100) user.badge = "Silver 🥈";

  writeDB(db);

  res.json({ message: "Punch Out recorded" });
});

/* ---------------- PHOTO PROOF ---------------- */

app.post("/upload", upload.single("image"), (req, res) => {
  const { email } = req.body;
  const db = readDB();
  const user = db.users.find((u) => u.email === email);

  if (!user) return res.json({ message: "User not found" });

  const proof = {
    id: uuidv4(),
    filename: req.file.filename,
    date: new Date(),
    status: "Pending",
  };

  user.proofs.push(proof);
  writeDB(db);

  res.json({ message: "Proof uploaded successfully" });
});

/* ---------------- ADMIN VIEW ---------------- */

app.get("/users", (req, res) => {
  const db = readDB();
  res.json(db.users);
});

/* ---------------- START SERVER ---------------- */

app.listen(5000, () => {
  console.log("EcoImpact NGO Server Running on http://localhost:5000");
});