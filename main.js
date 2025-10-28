import { initAuthModal } from "./components/authModal.js";
import { initUserMenu } from "./components/userMenu.js";
import { checkAuthOnLoad } from "./services/authService.js";

// Xử lý bật/tắt mật khẩu (global)
document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".toggle-password").forEach((btn) => {
    btn.addEventListener("click", () => {
      const input = btn.previousElementSibling;
      const icon = btn.querySelector("i");

      if (input.type === "password") {
        input.type = "text";
        icon.classList.remove("fa-eye");
        icon.classList.add("fa-eye-slash");
      } else {
        input.type = "password";
        icon.classList.remove("fa-eye-slash");
        icon.classList.add("fa-eye");
      }
    });
  });
});

// Khởi tạo các component
document.addEventListener("DOMContentLoaded", () => {
  initAuthModal();
  initUserMenu();
});

// Kiểm tra auth khi load trang
document.addEventListener("DOMContentLoaded", checkAuthOnLoad);
