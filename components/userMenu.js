// Xử lý dropdown menu người dùng (avatar, logout)

export function initUserMenu() {
  const userAvatar = document.getElementById("userAvatar");
  const userDropdown = document.getElementById("userDropdown");
  const logoutBtn = document.getElementById("logoutBtn");

  if (!userAvatar || !userDropdown || !logoutBtn) return;

  // Toggle dropdown khi click avatar
  userAvatar.addEventListener("click", (e) => {
    e.stopPropagation();
    userDropdown.classList.toggle("show");
  });

  // Đóng dropdown khi click ngoài
  document.addEventListener("click", (e) => {
    if (!userAvatar.contains(e.target) && !userDropdown.contains(e.target)) {
      userDropdown.classList.remove("show");
    }
  });

  // Đóng dropdown khi nhấn Escape
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && userDropdown.classList.contains("show")) {
      userDropdown.classList.remove("show");
    }
  });

  // Xử lý logout
  logoutBtn.addEventListener("click", () => {
    userDropdown.classList.remove("show");
    console.log("Đã click logout");
    // TODO: Thêm logic logout (xóa localStorage, chuyển trang)
  });
}
