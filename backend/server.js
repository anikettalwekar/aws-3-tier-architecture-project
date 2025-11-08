// ------------------------------
// Dream Cricket Club Backend API
// ------------------------------

const express = require("express");
const bodyParser = require("body-parser");
const mysql = require("mysql2");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(bodyParser.json());

// ✅ RDS Database connection
const db = mysql.createConnection({
  host: "aws3tier-db.c9qu6gs06l19.ap-south-1.rds.amazonaws.com",
  user: "admin",
  password: "admin123",
  database: "aws3tierdb"
});

// ✅ Test DB connection
db.connect(err => {
  if (err) {
    console.error("❌ DB connection failed:", err);
    return;
  }
  console.log("✅ Connected to RDS MySQL");
});

// ---------- HEALTH CHECK ----------
app.get("/health", (req, res) => res.send("OK"));

// ---------- REGISTER ----------
app.post("/register", (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password)
    return res
      .status(400)
      .json({ success: false, message: "All fields required" });

  const sql = "INSERT INTO users (name,email,password) VALUES (?,?,?)";
  db.query(sql, [name, email, password], err => {
    if (err) {
      console.error("DB Error during registration:", err);
      return res
        .status(500)
        .json({ success: false, message: "DB Error - Unable to register" });
    }

    console.log(`✅ Registered user: ${email}`);
    return res.json({
      success: true,
      message: "Registered successfully!"
    });
  });
});

// ---------- LOGIN ----------
app.post("/login", (req, res) => {
  const { email, password } = req.body;

  if (!email || !password)
    return res
      .status(400)
      .json({ success: false, message: "Email and password required" });

  const sql = "SELECT * FROM users WHERE email=? AND password=?";
  db.query(sql, [email, password], (err, result) => {
    if (err) {
      console.error("DB Error during login:", err);
      return res.status(500).json({ success: false, message: "DB Error" });
    }

    if (result.length === 0) {
      console.warn(`❌ Invalid login attempt for email: ${email}`);
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials" });
    }

    console.log(`✅ ${email} logged in successfully`);
    return res.json({
      success: true,
      message: "Login successful",
      name: result[0].name
    });
  });
});

// ---------- START SERVER ----------
const PORT = 3000;
app.listen(PORT, "0.0.0.0", () =>
  console.log(`🚀 Backend running and listening on port ${PORT}`)
);
