// Component
import { initAuthModal } from "./components/authModal.js";
import { renderTrendingTracks } from "./components/renderTracks.js";
import { renderPopularArtists } from "./components/renderArtists.js";
import { initUserMenu } from "./components/userMenu.js";
import { initCarousel } from "./components/carousel.js";

// Service
import { checkAuthOnLoad } from "./services/authService.js";

// Hàm reset về trạng thái home page ban đầu (tạo mới để reuse)
async function resetToHomePage() {
  const hitSection = document.querySelector(".hits-section");
  const artistSection = document.querySelector(".artists-section");
  const artistHero = document.querySelector(".artist-hero");
  const artistControls = document.querySelector(".artist-controls");
  const popularSection = document.querySelector(".popular-section");

  document.body.classList.add("loading");

  hitSection.classList.add("show");
  artistSection.classList.add("show");
  artistHero.classList.remove("show");
  artistControls.classList.remove("show");
  popularSection.classList.remove("show");

  window.scrollTo({ top: 0, behavior: "smooth" });

  try {
    await renderTrendingTracks(20, "#hits-track");
    await renderPopularArtists(15, 0);
  } catch (error) {
    console.log("Lỗi khi re-render home page:", error);
  }
}

// Hàm xử lý Navigation
function initHomeNavigation() {
  const logo = document.querySelector(".sidebar .logo");
  const homeBtn = document.querySelector(".home-btn");
  if (logo) {
    logo.addEventListener("click", (e) => {
      e.preventDefault();
      resetToHomePage();
    });
  }

  if (homeBtn) {
    homeBtn.addEventListener("click", (e) => {
      e.preventDefault();
      resetToHomePage();
    });
  }
}

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
  initHomeNavigation();
});

// Kiểm tra auth khi load trang
document.addEventListener("DOMContentLoaded", checkAuthOnLoad);

document.addEventListener("DOMContentLoaded", async () => {
  try {
    // Render trending vào #hits-track (truyền selector để render HTML)
    const trendingData = await renderTrendingTracks(20, "#hits-track");
    const artistsData = await renderPopularArtists(15, 0);

    // Init carousel với total từ data thực (không hardcode 20)
    initCarousel(
      "hits-section",
      "hits-track",
      "hits-pagination",
      trendingData.length,
      5
    );

    initCarousel(
      "artists-section",
      "popular-artists-track",
      "popular-artists-pagination",
      artistsData.length,
      5
    );
  } catch (error) {
    console.error("Render error:", error);
  } finally {
    document.body.classList.remove("loading");
    // initPlayBtnAuthCheck();
  }
});
