// Xử lý modal đăng ký/đăng nhập (sự kiện mở/đóng, chuyển form, validate blur)
import { setupBlurValidation } from "../utils/validation.js";
import httpRequest from "../utils/httpRequest.js";
import { checkAuthOnLoad } from "../services/authService.js";
import musicPlayer from "./musicPlayer.js";
import { renderArtistPopularTracks } from "./renderArtists.js";

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

  // Lưu trạng thái hiện tại để revert (cho next/prev)
  let previousTrack = musicPlayer ? musicPlayer._audioElement : null;

  playerControls.forEach((btn) => {
    btn.addEventListener(
      "click",
      (e) => {
        const accessToken = localStorage.getItem("accessToken");

        if (!accessToken) {
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();

          if (musicPlayer) {
            musicPlayer.pause();
            musicPlayer._audioElement?.pause(); // Safe access để tránh lỗi nếu chưa init

            // Detect và reset shuffle/repeat nếu click nút đó
            if (
              btn.classList.contains("active") ||
              btn.querySelector("i.fa-random") ||
              btn.querySelector("i.fa-redo")
            ) {
              musicPlayer._isShuffleMode = false;
              musicPlayer._isRepeatMode = false;
              musicPlayer._saveState("isShuffleMode", false);
              musicPlayer._saveState("isRepeatMode", false);
              musicPlayer._updateShuffleUI();
              musicPlayer._updateRepeatUI();
              // Remove class active từ btn
              btn.classList.remove("active");
            }

            // Reset UI cho next/prev
            if (previousTrack && musicPlayer._currentTrack !== previousTrack) {
              musicPlayer._currentTrack = previousTrack;
              musicPlayer._updatePlayerUI();
              musicPlayer._highlightActiveTrack();
            }
            previousTrack = musicPlayer._currentTrack; // Update để lần sau
          }

          showLoginForm();
          openModal();
          return;
        }
      },
      { capture: true } // Chạy trước musicPlayer bubbling
    );
  });

  // Kiểm tra progress bar
  const progressBar = document.querySelector(".progress-bar");
  if (progressBar) {
    progressBar.addEventListener(
      "mousedown",
      (e) => {
        const accessToken = localStorage.getItem("accessToken");

        if (!accessToken) {
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();

          if (musicPlayer) {
            musicPlayer.pause();
            musicPlayer._audioElement?.pause(); // Safe access để tránh lỗi nếu chưa init
            // Reset currentTime về 0 nếu không có track
            if (musicPlayer._currentTrack && musicPlayer._audioElement) {
              musicPlayer._audioElement.currentTime = 0;
              musicPlayer._updateProgressUI(0); // Update UI ngay
            }
          }
          showLoginForm();
          openModal();
          return;
        }
      },
      { capture: true }
    );
  }

  // Kiểm tra volume controls
  const volumeBtn = document.querySelector(".volume-container .control-btn");
  const volumeBar = document.querySelector(".volume-bar");

  if (volumeBtn) {
    volumeBtn.addEventListener(
      "click",
      (e) => {
        const accessToken = localStorage.getItem("accessToken");

        if (!accessToken) {
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();

          if (musicPlayer) {
            musicPlayer.pause();
            musicPlayer._audioElement?.pause();
          }

          // Reset volume về default và update UI
          if (musicPlayer) {
            musicPlayer._volume = 0.7;
            musicPlayer._isMuted = false;
            if (musicPlayer._audioElement) {
              musicPlayer._audioElement.volume = 0.7;
            }
            musicPlayer._updateVolumeUI();
          }

          showLoginForm();
          openModal();
          return;
        }
      },
      { capture: true }
    );
  }

  if (volumeBar) {
    volumeBar.addEventListener(
      "mousedown",
      (e) => {
        const accessToken = localStorage.getItem("accessToken");

        if (!accessToken) {
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();

          if (musicPlayer) {
            musicPlayer.pause();
            musicPlayer._audioElement.pause();
          }

          if (musicPlayer) {
            musicPlayer._volume = 0.7;
            musicPlayer._isMuted = false;
            if (musicPlayer._audioElement) {
              musicPlayer._audioElement.volume = 0.7;
            }
            musicPlayer._updateVolumeUI();
          }

          showLoginForm();
          openModal();
          return;
        }
      },
      { capture: true }
    );
  }

  // Sync cho .track-item (artist tracks) + .play-btn-large (play all)
  document.addEventListener("player:play", (e) => {
    const { trackId, isPlaying } = e.detail;
    console.log("Player play event:", trackId, isPlaying);

    // Sync hit-play-btn (giữ nguyên)
    const allHitBtns = document.querySelectorAll(
      ".hit-play-btn[data-track-id]"
    );
    allHitBtns.forEach((btn) => {
      if (btn.dataset.trackId === trackId && isPlaying) {
        const icon = btn.querySelector("i");
        if (icon) {
          icon.classList.remove("fa-play");
          icon.classList.add("fa-pause");
          btn.classList.add("playing");
        }
      }
    });

    // MỚI: Sync .track-item trong artist view (nếu đang ở popular-section show)
    const allTrackItems = document.querySelectorAll(
      ".popular-section.show .track-item[data-track-id]"
    );
    allTrackItems.forEach((item) => {
      if (item.dataset.trackId === trackId && isPlaying) {
        item.classList.add("playing");
        const number = item.querySelector(".track-number");
        if (number)
          number.innerHTML = `<i class="fas fa-volume-up playing-icon"></i>`;
        // Nếu có play icon trong item: Update pause (giả sử add <button class="track-play-btn"><i class="fa-play"></i></button>)
        const trackIcon = item.querySelector(".track-play-btn i");
        if (trackIcon) {
          trackIcon.classList.remove("fa-play");
          trackIcon.classList.add("fa-pause");
        }
      }
    });

    // MỚI: Sync play-btn-large (play all artist, nếu playlist là artist type)
    const playLargeBtn = document.querySelector(".play-btn-large"); // Adjust selector nếu khác
    if (
      playLargeBtn &&
      musicPlayer &&
      musicPlayer.isCurrentPlaylistForArtist(trackId.split(":")[1])
    ) {
      // Check type 'artist:ID'
      const icon = playLargeBtn.querySelector("i");
      if (icon && isPlaying) {
        icon.classList.remove("fa-play");
        icon.classList.add("fa-pause");
        playLargeBtn.classList.add("playing");
      }
    }
  });

  document.addEventListener("player:pause", (e) => {
    const { trackId, isPlaying } = e.detail;
    console.log("Player pause event:", trackId, isPlaying);

    // Revert tất cả hit-play-btn (giữ nguyên)
    const allHitBtns = document.querySelectorAll(".hit-play-btn");
    allHitBtns.forEach((btn) => {
      const icon = btn.querySelector("i");
      if (icon) {
        icon.classList.remove("fa-pause");
        icon.classList.add("fa-play");
        btn.classList.remove("playing");
      }
    });

    // MỚI: Revert .track-item
    const allTrackItems = document.querySelectorAll(
      ".popular-section .track-item"
    );
    allTrackItems.forEach((item) => {
      item.classList.remove("playing");
      const number = item.querySelector(".track-number");
      if (number && number.querySelector(".playing-icon")) {
        const index = Array.from(item.parentElement.children).indexOf(item);
        number.innerHTML = index + 1;
      }
      const trackIcon = item.querySelector(".track-play-btn i");
      if (trackIcon) {
        trackIcon.classList.remove("fa-pause");
        trackIcon.classList.add("fa-play");
      }
    });

    // MỚI: Revert play-btn-large
    const playLargeBtn = document.querySelector(".play-btn-large");
    if (playLargeBtn) {
      const icon = playLargeBtn.querySelector("i");
      if (icon) {
        icon.classList.remove("fa-pause");
        icon.classList.add("fa-play");
        playLargeBtn.classList.remove("playing");
      }
    }
  });

  document.addEventListener("player:trackchange", (e) => {
    const { trackId } = e.detail;

    // Revert tất cả, trừ nút match track mới (nếu đang play) – Giữ nguyên cho hit
    const allHitBtns = document.querySelectorAll(
      ".hit-play-btn[data-track-id]"
    );
    allHitBtns.forEach((btn) => {
      const icon = btn.querySelector("i");
      if (icon) {
        icon.classList.remove("fa-pause");
        icon.classList.add("fa-play");
        btn.classList.remove("playing");

        if (btn.dataset.trackId === trackId && musicPlayer._isPlaying) {
          icon.classList.remove("fa-play");
          icon.classList.add("fa-pause");
          btn.classList.add("playing");
        }
      }
    });

    // MỚI: Tương tự cho .track-item
    const allTrackItems = document.querySelectorAll(
      ".popular-section .track-item[data-track-id]"
    );
    allTrackItems.forEach((item) => {
      item.classList.remove("playing");
      const number = item.querySelector(".track-number");
      if (number && number.querySelector(".playing-icon")) {
        const index = Array.from(item.parentElement.children).indexOf(item);
        number.innerHTML = index + 1;
      }
      const trackIcon = item.querySelector(".track-play-btn i");
      if (trackIcon) {
        trackIcon.classList.remove("fa-pause");
        trackIcon.classList.add("fa-play");

        if (item.dataset.trackId === trackId && musicPlayer._isPlaying) {
          item.classList.add("playing");
          number.innerHTML = `<i class="fas fa-volume-up playing-icon"></i>`;
          trackIcon.classList.remove("fa-play");
          trackIcon.classList.add("fa-pause");
        }
      }
    });

    // MỚI: Cho play-btn-large (nếu current playlist là artist)
    const playLargeBtn = document.querySelector(".play-btn-large");
    if (
      playLargeBtn &&
      musicPlayer &&
      musicPlayer._currentPlayListType?.startsWith("artist:")
    ) {
      const icon = playLargeBtn.querySelector("i");
      if (icon && musicPlayer._isPlaying) {
        icon.classList.remove("fa-play");
        icon.classList.add("fa-pause");
        playLargeBtn.classList.add("playing");
      } else if (icon) {
        icon.classList.remove("fa-pause");
        icon.classList.add("fa-play");
        playLargeBtn.classList.remove("playing");
      }
    }
  });

  // InitAuthModal
  const createPlaylistBtn = document.querySelector(".create-playlist-btn");
  const topCreateBtn = document.querySelector(".create-btn");
  const browsePodcastsBtn = document.querySelector(".browse-podcasts-btn");

  // Reset shuffle/repeat mode về false khi chưa login
  document.addEventListener(
    "click",
    (e) => {
      const target = e.target.closest(
        ".hit-play-btn, .artist-play-btn, .play-btn-large"
      );

      if (target) {
        const accessToken = localStorage.getItem("accessToken");

        if (!accessToken) {
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();

          if (musicPlayer) {
            musicPlayer.pause();
            musicPlayer._audioElement?.pause();
          }

          showLoginForm();
          openModal();
          return;
        }

        // Xử lý play logic nếu đã login
        if (target.classList.contains("hit-play-btn")) {
          const trackId = target.dataset.trackId;
          console.log("Play track:", trackId);

          if (musicPlayer) {
            musicPlayer._playTrackById(trackId);
          }
        } else if (target.classList.contains("artist-play-btn")) {
          const artistId = target.dataset.artistId;
          console.log("Play artist:", artistId);

          // Check nếu đang play playList của artist này
          if (musicPlayer.isCurrentPlaylistForArtist(artistId)) {
            // Tiếp tục bài nếu paused
            if (!musicPlayer._isPlaying) {
              musicPlayer.play(); // Tiếp tục từ vị trí hiện tại
            } else {
              musicPlayer.pause(); // Toggle pause nếu đang play
            }
          } else {
            renderArtistPopularTracks(artistId)
              .then((tracks) => {
                if (tracks.length > 0) {
                  musicPlayer.loadPlaylist(tracks, 0, `artist:${artistId}`); // Load playlist artist tracks
                  musicPlayer.play(); // Play bài đầu tiên
                } else {
                  console.warn("No tracks for artist:", artistId);
                }
              })
              .catch((error) => {
                console.error("Error loading artist tracks:", error);
              });

            // Update icon tạm
            const icon = target.querySelector("i");
            if (icon) {
              if (musicPlayer._isPlaying) {
                icon.classList.remove("fa-play");
                icon.classList.add("fa-pause");
                target.classList.add("playing");
              } else {
                icon.classList.remove("fa-pause");
                icon.classList.add("fa-play");
                target.classList.remove("playing");
              }
            }
          }
        }
      }
    },
    { capture: true }
  );

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
