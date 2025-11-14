// ------------------- Backend URL (proxied via Apache) -------------------
const BACKEND_URL = "/api";

// ------------------- Dynamic Content Handling -------------------
const contentDiv = document.getElementById('content');

function showSection(section) {

  if (section === "history") {
    contentDiv.innerHTML = `
      <h3>Cricket History</h3>
      <p>Cricket originated in England in the 16th century and grew into an international sport uniting nations worldwide. The first Test match was played between England and Australia in 1877. Today, it continues to inspire millions globally.</p>`;
  }

  else if (section === "photos") {
    let html = '<h3>Cricket Photos</h3><div class="gallery">';
    const photos = ['c1.jpg','c2.jpg','c3.jpg','c4.jpg','c5.jpg','c6.jpg','c7.jpg','c8.jpg','c9.jpg','c10.jpg'];
    photos.forEach(img => {
      html += `<img src="images/${img}" alt="${img}" onclick="openModal('images/${img}')">`;
    });
    html += '</div>';
    contentDiv.innerHTML = html;
  }

  else if (section === "memories") {
    contentDiv.innerHTML = `
      <h3>Cricket Memories</h3>
      <p>Sachin’s 2011 World World Cup victory, Rohit Sharma’s double centuries, and Dhoni’s helicopter shot moments are unforgettable memories that define Indian cricket.</p>`;
  }

  else if (section === "legend") {
    contentDiv.innerHTML = `
      <h3>Legend Stories</h3>
      <p>Rohit Sharma, the 'Hitman', is one of India's greatest batsmen, known for effortless strokeplay and multiple ODI double hundreds.</p>`;
  }

  else if (section === "register") {
    contentDiv.innerHTML = `
      <h3>Register</h3>
      <form id="registerForm">
        <input type="text" name="name" placeholder="Name" required><br>
        <input type="email" name="email" placeholder="Email" required><br>
        <input type="password" name="password" placeholder="Password" required><br>
        <button type="submit">Register</button>
        <div id="formMsg" class="msg"></div>
      </form>`;
    document.getElementById('registerForm').addEventListener('submit', handleRegister);
  }

  else if (section === "login") {
    contentDiv.innerHTML = `
      <h3>Login</h3>
      <form id="loginForm">
        <input type="email" name="email" placeholder="Email" required><br>
        <input type="password" name="password" placeholder="Password" required><br>
        <button type="submit">Login</button>
        <div id="loginMsg" class="msg"></div>
      </form>`;
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
  }
}

// ------------------- Modal for Image Preview -------------------
function openModal(src) {
  const m = document.createElement('div');
  m.className = 'modal';
  m.innerHTML = `<img src='${src}' alt='${src}' />`;
  m.onclick = () => document.body.removeChild(m);
  document.body.appendChild(m);
}

// ------------------- REGISTER USER -------------------
async function handleRegister(e) {
  e.preventDefault();
  const form = e.target;
  const msg = document.getElementById('formMsg');

  const payload = {
    name: form.name.value,
    email: form.email.value,
    password: form.password.value
  };

  try {
    const res = await fetch(`${BACKEND_URL}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    msg.textContent = data.message || "Registered successfully!";
    msg.style.color = "limegreen";
  } catch (err) {
    msg.textContent = "Error: " + err.message;
    msg.style.color = "red";
  }
}

// ------------------- LOGIN USER -------------------
async function handleLogin(e) {
  e.preventDefault();
  const form = e.target;
  const msg = document.getElementById('loginMsg');

  const payload = {
    email: form.email.value,
    password: form.password.value
  };

  try {
    const res = await fetch(`${BACKEND_URL}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const data = await res.json();

    if (res.ok) {
      // SUCCESS → Redirect to welcome page
      window.location.href = "welcome.html";
    } else {
      msg.textContent = data.message || "Invalid credentials";
      msg.style.color = "red";
    }
  } catch (err) {
    msg.textContent = "Error: " + err.message;
    msg.style.color = "red";
  }
}

// Show default page content
showSection('history');
