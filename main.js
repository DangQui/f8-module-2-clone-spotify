import { initAuthModal } from "./components/authModal.js";
import {
  renderPopularTracks,
  renderTrendingTracks,
} from "./components/renderTracks.js";
import { initUserMenu } from "./components/userMenu.js";
import { initCarousel } from "./components/carousel.js";
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

document.addEventListener("DOMContentLoaded", async () => {
  document.body.classList.add("loading");

  try {
    // Render trending vào #hits-track (truyền selector để render HTML)
    const trendingData = await renderTrendingTracks(20, "#hits-track");
    await renderPopularTracks(3, ".track-list");

    // Init carousel với total từ data thực (không hardcode 20)
    initCarousel(
      "hits-section",
      "hits-track",
      "hits-pagination",
      trendingData.length,
      5
    );
  } catch (error) {
    console.error("Render error:", error);
  } finally {
    document.body.classList.remove("loading");
  }
});
