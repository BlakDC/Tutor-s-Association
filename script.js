// ==================== USER REGISTRATION ====================
const registerForm = document.getElementById("register-form");
if(registerForm){
  registerForm.addEventListener("submit", e => {
    e.preventDefault();
    const firstName = document.getElementById("reg-first-name").value.trim();
    const lastName = document.getElementById("reg-last-name").value.trim();
    const email = document.getElementById("reg-email").value.trim().toLowerCase();
    const confirmEmail = document.getElementById("reg-confirm-email").value.trim().toLowerCase();
    const password = document.getElementById("reg-password").value;
    const confirmPassword = document.getElementById("reg-confirm-password").value;

    if(email !== confirmEmail) return alert("Emails do not match");
    if(password !== confirmPassword) return alert("Passwords do not match");

    let users = JSON.parse(localStorage.getItem("users")||"[]");
    if(users.some(u=>u.email===email)) return alert("Email already registered");

    users.push({firstName,lastName,email,password});
    localStorage.setItem("users",JSON.stringify(users));
    alert("Registration successful! Please log in.");
    window.location.href="login.html";
  });
}

// ==================== USER LOGIN ====================
const loginForm = document.getElementById("login-form");
if(loginForm){
  loginForm.addEventListener("submit", e=>{
    e.preventDefault();
    const email = document.getElementById("login-email").value.trim().toLowerCase();
    const password = document.getElementById("login-password").value;
    let users = JSON.parse(localStorage.getItem("users")||"[]");
    const user = users.find(u=>u.email===email && u.password===password);
    if(user){
      localStorage.setItem("loggedInUser",JSON.stringify(user));
      alert("Login successful!");
      window.location.href="nominees.html";
    } else alert("Invalid credentials!");
  });
}

// ==================== SEND EMAIL NOTIFICATION ====================
function sendEmailNotification(nominee){
  const subject = encodeURIComponent(`New Nominee Submitted: ${nominee.firstName} ${nominee.lastName}`);
  const body = encodeURIComponent(
    `Nominee Details:\n\n` +
    `Name: ${nominee.firstName} ${nominee.lastName}\n` +
    `Subjects: ${nominee.subjects}\n` +
    `Phone: ${nominee.phone}\n` +
    `Reason: ${nominee.reason}\n`
  );
  window.location.href = `mailto:nukermicrosfot@gmail.com?subject=${subject}&body=${body}`;
}

// ==================== USER-SUBMITTED NOMINEES ====================
const nomineeForm = document.getElementById("nominee-form");
if(nomineeForm){
  nomineeForm.addEventListener("submit", e=>{
    e.preventDefault();
    const firstName = document.getElementById("nom-first-name").value.trim();
    const lastName = document.getElementById("nom-last-name").value.trim();
    const subjects = document.getElementById("nom-subjects").value.trim();
    const phone = document.getElementById("nom-phone").value.trim();
    const reason = document.getElementById("nom-reason").value.trim();

    let pending = JSON.parse(localStorage.getItem("pendingNominees")||"[]");
    let approved = JSON.parse(localStorage.getItem("nominees")||"[]");

    if(approved.some(n=>n.phone===phone) || pending.some(n=>n.phone===phone))
      return alert("Phone number already used for another nominee");

    const nominee = {firstName,lastName,subjects,phone,reason};
    pending.push(nominee);
    localStorage.setItem("pendingNominees",JSON.stringify(pending));

    sendEmailNotification(nominee);

    alert("Nominee submitted! Awaiting admin approval.");
    nomineeForm.reset();
  });
}

// ==================== DISPLAY APPROVED NOMINEES FOR VOTING ====================
const nomineesList = document.getElementById("nominees-list");
if(nomineesList){
  const nominees = JSON.parse(localStorage.getItem("nominees")||"[]");
  nomineesList.innerHTML = nominees.map(n=>`
    <div class="nominee-card">
      <h3>${n.firstName} ${n.lastName}</h3>
      <p><b>Subjects:</b> ${n.subjects}</p>
      <button onclick="vote('${n.phone}')">Vote</button>
    </div>
  `).join("");

  // Hide voting buttons if admin is logged in
  if(localStorage.getItem("adminLoggedIn") === "true"){
    document.querySelectorAll("#nominees-list button").forEach(btn => btn.style.display = "none");
  }
}

// ==================== VOTING FUNCTION ====================
function vote(phone){
  const user = JSON.parse(localStorage.getItem("loggedInUser"));
  const isAdmin = localStorage.getItem("adminLoggedIn") === "true";

  if(isAdmin){
    alert("Admins cannot vote.");
    return;
  }

  if(!user){
    alert("Please log in to vote.");
    window.location.href = "login.html";
    return;
  }

  let votes = JSON.parse(localStorage.getItem("votes") || "{}");
  let userVotes = JSON.parse(localStorage.getItem("userVotes") || "{}");

  // Restrict one vote per nominee per user
  if (userVotes[user.email] && userVotes[user.email].includes(phone)) {
    alert("You have already voted for this nominee.");
    return;
  }

  // Add vote
  votes[phone] = (votes[phone] || 0) + 1;
  localStorage.setItem("votes", JSON.stringify(votes));

  // Record user vote
  if (!userVotes[user.email]) userVotes[user.email] = [];
  userVotes[user.email].push(phone);
  localStorage.setItem("userVotes", JSON.stringify(userVotes));

  alert("Your vote has been recorded successfully!");
}

// ==================== ADMIN LOGIN & DASHBOARD ====================
const ADMIN_NAME = "Blak";
const ADMIN_PASS = "513246789";

function loginAdmin(){
  const name = document.getElementById("adminName")?.value.trim();
  const pass = document.getElementById("adminPassword")?.value.trim();
  const msg = document.getElementById("loginMessage");

  if(name===ADMIN_NAME && pass===ADMIN_PASS){
    localStorage.setItem("adminLoggedIn","true");
    document.getElementById("login-section").style.display="none";
    document.getElementById("dashboard").style.display="block";
    loadPendingNominees();
    loadApprovedNominees();
    loadUsers();
  } else if(msg) msg.textContent="Invalid admin credentials!";
}

function logout(){
  localStorage.removeItem("adminLoggedIn");
  window.location.reload();
}

// ==================== ADMIN: PENDING NOMINEES ====================
function loadPendingNominees(){
  const tbody = document.querySelector("#pendingNomineesTable tbody");
  if(!tbody) return;
  const pending = JSON.parse(localStorage.getItem("pendingNominees")||"[]");
  tbody.innerHTML = "";
  if(pending.length===0) {
    tbody.innerHTML="<tr><td colspan='5' style='text-align:center'>No pending nominees</td></tr>";
    return;
  }
  pending.forEach((n,index)=>{
    const tr=document.createElement("tr");
    tr.innerHTML=`
      <td>${n.firstName} ${n.lastName}</td>
      <td>${n.subjects}</td>
      <td>${n.phone}</td>
      <td>${n.reason}</td>
      <td>
        <button onclick="approveNominee(${index})">Approve</button>
        <button onclick="rejectNominee(${index})">Reject</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function approveNominee(index){
  let pending = JSON.parse(localStorage.getItem("pendingNominees")||"[]");
  let approved = JSON.parse(localStorage.getItem("nominees")||"[]");
  const nominee = pending[index];
  nominee.id = Date.now();
  approved.push(nominee);
  localStorage.setItem("nominees",JSON.stringify(approved));
  pending.splice(index,1);
  localStorage.setItem("pendingNominees",JSON.stringify(pending));
  loadPendingNominees();
  loadApprovedNominees();
  alert("Nominee approved!");
}

function rejectNominee(index){
  let pending = JSON.parse(localStorage.getItem("pendingNominees")||"[]");
  pending.splice(index,1);
  localStorage.setItem("pendingNominees",JSON.stringify(pending));
  loadPendingNominees();
}

// ==================== ADMIN: APPROVED NOMINEES (SORTED BY VOTES) ====================
function loadApprovedNominees(){
  const tbody = document.querySelector("#nomineeTable tbody");
  if(!tbody) return;
  let approved = JSON.parse(localStorage.getItem("nominees") || "[]");
  const votes = JSON.parse(localStorage.getItem("votes") || "{}");

  approved = approved.map(n => ({ ...n, voteCount: votes[n.phone] || 0 }))
                     .sort((a, b) => b.voteCount - a.voteCount);

  tbody.innerHTML = "";
  if(approved.length === 0){
    tbody.innerHTML = "<tr><td colspan='7' style='text-align:center'>No approved nominees</td></tr>";
    return;
  }

  approved.forEach((n, index) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${n.id}</td>
      <td>${n.firstName} ${n.lastName}</td>
      <td>${n.subjects}</td>
      <td>${n.phone}</td>
      <td>${n.reason}</td>
      <td>${n.voteCount}</td>
      <td><button onclick="removeApprovedNominee(${index})">Remove</button></td>
    `;
    tbody.appendChild(tr);
  });
}

function removeApprovedNominee(index){
  let approved = JSON.parse(localStorage.getItem("nominees")||"[]");
  if(confirm(`Remove ${approved[index].firstName}?`)){
    approved.splice(index,1);
    localStorage.setItem("nominees",JSON.stringify(approved));
    loadApprovedNominees();
  }
}

// ==================== ADMIN: USERS ====================
function loadUsers(){
  const tbody = document.querySelector("#userTable tbody");
  if(!tbody) return;
  const users = JSON.parse(localStorage.getItem("users")||"[]");
  tbody.innerHTML="";
  if(users.length===0){
    tbody.innerHTML="<tr><td colspan='3' style='text-align:center'>No users</td></tr>";
    return;
  }
  users.forEach((u,index)=>{
    const tr=document.createElement("tr");
    tr.innerHTML=`
      <td>${u.firstName} ${u.lastName}</td>
      <td>${u.email}</td>
      <td><button onclick="removeUser(${index})">Remove</button></td>
    `;
    tbody.appendChild(tr);
  });
}

function removeUser(index){
  let users = JSON.parse(localStorage.getItem("users")||"[]");
  if(confirm(`Remove ${users[index].firstName}?`)){
    users.splice(index,1);
    localStorage.setItem("users",JSON.stringify(users));
    loadUsers();
  }
}

// ==================== EXPORT TO EXCEL ====================
function exportUsers() {
  const users = JSON.parse(localStorage.getItem("users") || "[]");
  if (users.length === 0) {
    alert("No users to export!");
    return;
  }
  const worksheet = XLSX.utils.json_to_sheet(users);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Users");
  XLSX.writeFile(workbook, "Registered_Users.xlsx");
}

function exportNominees() {
  const nominees = JSON.parse(localStorage.getItem("nominees") || "[]");
  if (nominees.length === 0) {
    alert("No approved nominees to export!");
    return;
  }
  const votes = JSON.parse(localStorage.getItem("votes") || "{}");
  const data = nominees.map(n => ({
    ID: n.id,
    "First Name": n.firstName,
    "Last Name": n.lastName,
    Subjects: n.subjects,
    Phone: n.phone,
    Reason: n.reason,
    Votes: votes[n.phone] || 0
  }));
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Nominees");
  XLSX.writeFile(workbook, "Approved_Nominees.xlsx");
}
// Handle showing logged-in user's name
  document.addEventListener("DOMContentLoaded", () => {
    const nav = document.getElementById("user-nav");
    const user = JSON.parse(localStorage.getItem("loggedInUser"));
    const admin = localStorage.getItem("adminLoggedIn") === "true";

    if (admin) {
      nav.innerHTML = `<span>👑 Admin</span> <a href="#" onclick="logout()">Logout</a>`;
    } else if (user) {
      nav.innerHTML = `<span>👤 ${user.firstName} ${user.lastName}</span> <a href="#" onclick="logoutUser()">Logout</a>`;
    }
  });

  function logoutUser() {
    localStorage.removeItem("loggedInUser");
    window.location.href = "index.html";
  }

// ==================== AUTO ADMIN SESSION ====================
window.onload=function(){
  if(localStorage.getItem("adminLoggedIn")==="true"){
    document.getElementById("login-section")?.setAttribute("style","display:none");
    document.getElementById("dashboard")?.setAttribute("style","display:block");
    loadPendingNominees();
    loadApprovedNominees();
    loadUsers();
  }
};
