const express = require("express");
const mysql = require("mysql2");
const bodyParser = require("body-parser");
const cors = require("cors");
const bcrypt = require("bcryptjs");

const app = express();
app.use(cors());
app.use(bodyParser.json());

// --------------------------------------
// RDS MySQL Connection
// --------------------------------------
const db = mysql.createConnection({
  host: "aws3tier-db.c9qu6gs06l19.ap-south-1.rds.amazonaws.com",    // REPLACE
  user: "admin",
  password: "admin123",    // REPLACE
  database: "aws3tierdb"
});

// Connect & log status
db.connect((err) => {
  if (err) {
    console.error("❌ DB connection failed:", err);
  } else {
    console.log("✅ Connected to RDS MySQL");
  }
});

// --------------------------------------
// Health Check
// --------------------------------------
app.get("/health", (req, res) => {
  res.status(200).send("OK");
});

// --------------------------------------
// REGISTER USER
// --------------------------------------
app.post("/register", (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password)
    return res.status(400).json({ message: "All fields are required" });

  const hashedPassword = bcrypt.hashSync(password, 10);

  const sql = "INSERT INTO users (name, email, password) VALUES (?, ?, ?)";
  db.query(sql, [name, email, hashedPassword], (err) => {
    if (err) {
      console.error("DB Error:", err);
      return res.status(500).json({ message: "DB Error" });
    }
    res.json({ message: "Registered successfully!" });
  });
});

// --------------------------------------
// LOGIN USER
// --------------------------------------
app.post("/login", (req, res) => {
  const { email, password } = req.body;

  const sql = "SELECT * FROM users WHERE email = ?";
  db.query(sql, [email], (err, results) => {
    if (err) return res.status(500).json({ message: "DB Error" });
    if (results.length === 0)
      return res.status(401).json({ message: "Invalid email or password" });

    const user = results[0];

    const isMatch = bcrypt.compareSync(password, user.password);
    if (!isMatch)
      return res.status(401).json({ message: "Invalid email or password" });

    res.json({ message: "Login successful!" });
  });
});

// --------------------------------------
// START SERVER
// --------------------------------------
const PORT = 3000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Backend running on port ${PORT}`);
});
