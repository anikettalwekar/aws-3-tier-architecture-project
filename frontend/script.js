// ==================== REGISTER (updated) ====================
document.getElementById("registerForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const name = document.getElementById("name").value.trim();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();

  const msgEl = document.getElementById("registerMsg");
  msgEl.textContent = "";

  if (!name || !email || !password) {
    msgEl.style.color = "#ff4d4d";
    msgEl.textContent = "⚠️ Please fill all fields";
    return;
  }

  try {
    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });

    const data = await res.json();
    console.log("Register response:", data);

    if (data.success === true) {
      msgEl.style.color = "#32cd32"; // green
      msgEl.textContent = "✅ Registered successfully!";
      e.target.reset(); // clear fields
    } else {
      msgEl.style.color = "#ff4d4d"; // red
      msgEl.textContent = "❌ " + (data.message || "Registration failed");
    }
  } catch (err) {
    console.error("Register error:", err);
    msgEl.style.color = "#ff4d4d";
    msgEl.textContent = "❌ Server unreachable";
  }
});

// ==================== LOGIN (redirect + popup) ====================
document.getElementById("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = document.getElementById("loginEmail").value.trim();
  const password = document.getElementById("loginPassword").value.trim();

  try {
    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();
    console.log("Login response:", data);

    if (data.success === true) {
      // Redirect to welcome.html page
      window.location.href = "welcome.html";
    } else {
      document.getElementById("loginMsg").style.color = "#ff4d4d";
      document.getElementById("loginMsg").textContent =
        "❌ " + (data.message || "Invalid credentials");
    }
  } catch (err) {
    console.error("Login error:", err);
    document.getElementById("loginMsg").style.color = "#ff4d4d";
    document.getElementById("loginMsg").textContent = "❌ Server unreachable";
  }
});

// ==================== EXPLORE SECTION ====================
const infoBox = document.getElementById("info-content");

document.querySelectorAll(".explore-menu li").forEach((btn) => {
  btn.addEventListener("click", () => {
    const section = btn.getAttribute("data-section");

    if (section === "pictures") {
      infoBox.innerHTML = "";
      for (let i = 1; i <= 10; i++) {
        const img = document.createElement("img");
        img.src = `images/c${i}.jpg`;
        img.alt = `Cricketer ${i}`;
        infoBox.appendChild(img);
      }
    } else if (section === "legend") {
      infoBox.innerHTML = `
        <h3>Rohit Sharma — The Legend</h3>
        <p>Rohit Sharma, one of the greatest modern-day cricketing icons, has carved an extraordinary legacy built on consistency, calm leadership, and unmatched batting brilliance.</p>
        <p>Known as the “Hitman,” he’s the only cricketer with three ODI double centuries and led India to the 2024 T20 World Cup and 2025 Champions Trophy victories.</p>
        <p>Under his leadership, India became the No.1 ODI team in 2025, and Rohit retired as one of cricket’s most respected and complete leaders.</p>
      `;
    } else if (section === "history") {
      infoBox.innerHTML = `
        <h3>The History of Cricket</h3>
        <p>Cricket originated in England during the 16th century and gradually evolved from a rural pastime into an international sport.</p>
        <p>The first official Test match was played between England and Australia in 1877, marking the beginning of international cricket.</p>
        <p>Over time, cricket spread worldwide, leading to iconic tournaments like the ICC World Cup and T20 World Cup that unite billions of fans.</p>
      `;
    }
  });
});
