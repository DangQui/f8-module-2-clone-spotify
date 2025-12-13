// Component
import { initAuthModal } from "./components/authModal.js";
import { renderTrendingTracks } from "./components/renderTracks.js";
import { renderPopularArtists } from "./components/renderArtists.js";
import { initUserMenu } from "./components/userMenu.js";
import { initCarousel } from "./components/carousel.js";
import musicPlayer from "./components/musicPlayer.js";

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
    // NEW: Lưu trạng thái track hiện tại trước khi re-render
    const currentPlaybackState = musicPlayer.getPlaybackState();
    const hadTrackBefore = !!currentPlaybackState.track;

    await renderTrendingTracks(20, "#hits-track");
    await renderPopularArtists(15, 0);

    // NEW: Chỉ khôi phục nếu có track trước đó, tránh load track mới
    if (hadTrackBefore) {
      musicPlayer.restorePlaybackState();
    }
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
      // NEW: Lưu trạng thái trước khi navigate
      const playbackState = musicPlayer.getPlaybackState();
      console.log("Navigating to home, current playback:", playbackState);

      resetToHomePage();
    });
  }

  if (homeBtn) {
    homeBtn.addEventListener("click", (e) => {
      e.preventDefault();
      // NEW: Lưu trạng thái trước khi navigate
      const playbackState = musicPlayer.getPlaybackState();
      console.log("Navigating to home, current playback:", playbackState);

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
    // NEW: Lưu trạng thái track hiện tại trước khi render
    const currentPlaybackState = musicPlayer.getPlaybackState();
    const hadTrackBefore = !!currentPlaybackState.track;

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

    // NEW: Chỉ khôi phục playback nếu đã có track trước đó
    // Không cho renderTrendingTracks ghi đè lên track hiện tại
    if (hadTrackBefore) {
      setTimeout(() => {
        musicPlayer.restorePlaybackState();
      }, 500);
    }
  } catch (error) {
    console.error("Render error:", error);
  } finally {
    document.body.classList.remove("loading");
  }
});

// NEW: Lưu trạng thái trước khi rời khỏi trang
window.addEventListener("beforeunload", () => {
  const playbackState = musicPlayer.getPlaybackState();
  console.log("Page unloading, saving playback state:", playbackState);
});
