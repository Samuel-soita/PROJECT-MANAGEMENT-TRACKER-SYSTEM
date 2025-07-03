// scripts/session.js
// Include this in every protected page

const currentUser = JSON.parse(localStorage.getItem("currentUser"));

if (!currentUser) {
  alert("You must log in first.");
  window.location.href = "login.html";
}

// Example usage:
// Restrict access to admin-only pages
if (window.location.pathname.includes("admin") && currentUser.role !== "admin") {
  alert("Access Denied. You are not an admin.");
  window.location.href = "login.html";
}

// Optional: Redirect users from admin-only pages
if (window.location.pathname.includes("assign-task") && currentUser.role !== "admin") {
  alert("Access Denied. Redirecting to your dashboard.");
  window.location.href = "user-dashboard.html";
}
