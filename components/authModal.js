// Xử lý modal đăng ký/đăng nhập (sự kiện mở/đóng, chuyển form, validate blur)

import { setupBlurValidation } from "../utils/validation.js";
import httpRequest from "../utils/httpRequest.js";
import { checkAuthOnLoad } from "../services/authService.js";

export function initAuthModal() {
  // Lấy các phần tử DOM
  const signupBtn = document.querySelector(".signup-btn");
  const loginBtn = document.querySelector(".login-btn");
  const authModal = document.getElementById("authModal");
  const modalClose = document.getElementById("modalClose");
  const signupForm = document.getElementById("signupForm");
  const loginForm = document.getElementById("loginForm");
  const showLoginBtn = document.getElementById("showLogin");
  const showSignupBtn = document.getElementById("showSignup");

  // Hàm hiển thị form đăng ký
  function showSignupForm() {
    signupForm.style.display = "block";
    loginForm.style.display = "none";
  }

  // Hàm hiển thị form đăng nhập
  function showLoginForm() {
    signupForm.style.display = "none";
    loginForm.style.display = "block";
  }

  // Hàm mở modal
  function openModal() {
    authModal.classList.add("show");
    document.body.style.overflow = "hidden"; // Ngăn cuộn nền
  }

  // Hàm đóng modal
  function closeModal() {
    authModal.classList.remove("show");
    document.body.style.overflow = "auto"; // Khôi phục cuộn
  }

  // Sự kiện: Mở modal
  signupBtn?.addEventListener("click", () => {
    showSignupForm();
    openModal();
  });

  loginBtn?.addEventListener("click", () => {
    showLoginForm();
    openModal();
  });

  // Sự kiện: Đóng modal
  modalClose?.addEventListener("click", () => closeModal());
  authModal?.addEventListener("click", (e) => {
    if (e.target === authModal) closeModal();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && authModal?.classList.contains("show")) {
      closeModal();
    }
  });

  // Sự kiện: Chuyển form
  showLoginBtn?.addEventListener("click", () => showLoginForm());
  showSignupBtn?.addEventListener("click", () => showSignupForm());

  // Validate blur cho form đăng ký (email/password)
  if (signupForm) {
    const emailInput = signupForm.querySelector("#signupEmail");
    if (emailInput) {
      const group = emailInput.closest(".form-group");
      const span = group.querySelector(".error-message span");
      if (group && span) {
        setupBlurValidation(emailInput, group, span, "Email cannot be blank.");
      }
    }

    const passwordInput = signupForm.querySelector("#signupPassword");
    if (passwordInput) {
      const group = passwordInput.closest(".form-group");
      const span = group.querySelector(".error-message span");
      if (group && span) {
        setupBlurValidation(
          passwordInput,
          group,
          span,
          "Password cannot be blank."
        );
      }
    }
  }

  // Validate blur cho form đăng nhập
  if (loginForm) {
    const emailInput = loginForm.querySelector("#loginEmail");
    if (emailInput) {
      const group = emailInput.closest(".form-group");
      const span = group.querySelector(".error-message span");
      if (group && span) {
        setupBlurValidation(emailInput, group, span, "Email cannot be blank.");
      }
    }

    const passwordInput = loginForm.querySelector("#loginPassword");
    if (passwordInput) {
      const group = passwordInput.closest(".form-group");
      const span = group.querySelector(".error-message span");
      if (group && span) {
        setupBlurValidation(
          passwordInput,
          group,
          span,
          "Password cannot be blank."
        );
      }
    }
  }

  // Xử lý submit form đăng ký
  const signupContent = signupForm?.querySelector(".auth-form-content");
  signupContent?.addEventListener("submit", async (e) => {
    e.preventDefault();

    const emailInput = e.target.querySelector("#signupEmail");
    const passwordInput = e.target.querySelector("#signupPassword");
    const emailGroup = emailInput.closest(".form-group");
    const passwordGroup = passwordInput.closest(".form-group");
    const emailSpan = emailGroup.querySelector(".error-message span");
    const passwordSpan = passwordGroup.querySelector(".error-message span");

    // Reset lỗi
    [emailGroup, passwordGroup].forEach((group) =>
      group.classList.remove("invalid")
    );
    emailSpan.textContent = "";
    passwordSpan.textContent = "";

    const credentials = {
      email: emailInput.value.trim(),
      password: passwordInput.value.trim(),
    };

    try {
      const { user, access_token } = await httpRequest.post(
        "auth/register",
        credentials
      );
      localStorage.setItem("accessToken", access_token);
      localStorage.setItem("currentUser", JSON.stringify(user));
      checkAuthOnLoad(); // Gọi từ authService
      closeModal();
    } catch (error) {
      const err = error?.response?.error || {};
      const details = err.details || [];

      if (err.code === "EMAIL_EXISTS") {
        emailGroup.classList.add("invalid");
        emailSpan.textContent = err.message;
        return;
      }

      if (err.code === "VALIDATION_ERROR" && Array.isArray(details)) {
        let hasError = false;
        details.forEach((detail) => {
          if (detail.field === "email") {
            emailGroup.classList.add("invalid");
            emailSpan.textContent = detail.message;
            hasError = true;
          }
          if (detail.field === "password") {
            passwordGroup.classList.add("invalid");
            passwordSpan.textContent = detail.message;
            hasError = true;
          }
        });
        if (hasError) return;
      }

      emailGroup.classList.add("invalid");
      emailSpan.textContent =
        err.message || "Registration failed. Please try again.";
    }
  });

  // Xử lý submit cho form đăng nhập
  const loginContent = loginForm?.querySelector(".auth-form-content");
  loginContent?.addEventListener("submit", async (e) => {
    e.preventDefault();

    const emailInput = e.target.querySelector("#loginEmail");
    const passwordInput = e.target.querySelector("#loginPassword");
    const emailGroup = emailInput.closest(".form-group");
    const passwordGroup = passwordInput.closest(".form-group");
    const emailSpan = emailGroup.querySelector(".error-message span");
    const passwordSpan = passwordGroup.querySelector(".error-message span");

    // Reset lỗi
    [emailGroup, passwordGroup].forEach((group) => {
      group.classList.remove("invalid");
    });
    emailSpan.textContent = "";
    passwordSpan.textContent = "";

    const credentials = {
      email: emailInput.value.trim(),
      password: passwordInput.value.trim(),
    };

    try {
      const { user, access_token } = await httpRequest.post(
        "auth/login",
        credentials
      );
      localStorage.setItem("accessToken", access_token);
      localStorage.setItem("currentUser", JSON.stringify(user));
      checkAuthOnLoad();
      closeModal();
    } catch (error) {
      const err = error?.response?.error || {};
      const details = err.details || [];

      // Case 1: Thông tin đăng nhập sai
      if (err.code === "INVALID_CREDENTIALS") {
        emailGroup.classList.add("invalid");
        passwordGroup.classList.add("invalid");
        emailSpan.textContent = err.message;
        passwordSpan.textContent = err.message;
        return;
      }

      // Case 2: Validation errors
      if (err.code === "VALIDATION_ERROR" && Array.isArray(details)) {
        let hasError = false;
        details.forEach((detail) => {
          if (detail.field === "email") {
            emailGroup.classList.add("invalid");
            emailSpan.textContent = detail.message;
            hasError = true;
          }
          if (detail.field === "password") {
            passwordGroup.classList.add("invalid");
            passwordSpan.textContent = detail.message;
            hasError = true;
          }
        });
        if (hasError) return;
      }

      // Case 3: Lỗi chung
      // emailGroup.classList.add("invalid");
      passwordGroup.classList.add("invalid");
      // emailSpan.textContent = err.message || "Login failed. Please try again.";
      passwordSpan.textContent =
        err.message || "Login failed. Please try again.";
    }
  });

  // Kiểm tra các nút Player Footer
  const playerControls = document.querySelectorAll(
    ".player-center .control-btn, .player-center .play-btn"
  );

  playerControls.forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const accessToken = localStorage.getItem("accessToken");

      if (!accessToken) {
        e.preventDefault();
        e.stopPropagation();
        showLoginForm();
        openModal();
        return;
      }
    });
  });

  // Kiểm tra progress bar
  const progressBar = document.querySelector(".progress-bar");
  if (progressBar) {
    progressBar.addEventListener("mousedown", (e) => {
      const accessToken = localStorage.getItem("accessToken");

      if (!accessToken) {
        e.preventDefault();
        e.stopPropagation();
        showLoginForm;
        openModal();
      }
    });
  }

  // Kiểm tra volume controls
  const volumeBtn = document.querySelector(".volume-container .control-btn");
  const volumeBar = document.querySelector(".volume-bar");

  if (volumeBtn) {
    volumeBtn.addEventListener("click", (e) => {
      const accessToken = localStorage.getItem("accessToken");

      if (!accessToken) {
        e.preventDefault();
        e.stopPropagation();
        showLoginForm();
        openModal();
      }
    });
  }

  if (volumeBar) {
    volumeBar.addEventListener("mousedown", (e) => {
      const accessToken = localStorage.getItem("accessToken");

      if (!accessToken) {
        e.preventDefault();
        e.stopPropagation();
        showLoginForm();
        openModal();
      }
    });
  }

  // InitAuthModal
  const createPlaylistBtn = document.querySelector(".create-playlist-btn");
  const topCreateBtn = document.querySelector(".create-btn");
  const browsePodcastsBtn = document.querySelector(".browse-podcasts-btn");

  document.addEventListener("click", (e) => {
    const target = e.target.closest(
      ".hit-play-btn, .artist-play-btn, .play-btn-large"
    );

    if (target) {
      const accessToken = localStorage.getItem("accessToken");

      if (!accessToken) {
        e.preventDefault();
        e.stopPropagation();
        showLoginForm();
        openModal();
        return;
      }

      // Xử lý play logic nếu đã login
      if (target.classList.contains("hit-play-btn")) {
        const trackId = target.dataset.trackId;
        console.log("Play track:", trackId);
        // Gọi hàm play track
      } else if (target.classList.contains("artist-play-btn")) {
        const artistId = target.dataset.artistId;
        console.log("Play artist:", artistId);
        // Gọi hàm play artist
      }
    }
  });

  if (createPlaylistBtn) {
    createPlaylistBtn.addEventListener("click", (e) => {
      e.preventDefault();

      const accessToken = localStorage.getItem("accessToken");

      if (!accessToken) {
        showLoginForm();
        openModal();
        return;
      }
    });
  }

  if (topCreateBtn) {
    topCreateBtn.addEventListener("click", (e) => {
      e.preventDefault();

      const accessToken = localStorage.getItem("accessToken");

      if (!accessToken) {
        showLoginForm();
        openModal();
        return;
      }
    });
  }

  if (browsePodcastsBtn) {
    browsePodcastsBtn.addEventListener("click", () => {
      console.log("Browse podcasts clicked");
    });
  }
}
