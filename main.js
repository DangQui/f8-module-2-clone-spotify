import httpRequest from "./utils/httpRequest.js";

// Hàm validate blur
function setupBlurValidation(
  input,
  formGroup,
  errorSpan,
  message = "Cannot be left blank."
) {
  input.addEventListener("blur", function () {
    if (!input.value.trim()) {
      formGroup.classList.add("invalid");
      errorSpan.textContent = message;
    }
  });

  input.addEventListener("blur", function () {
    if (formGroup.classList.contains("invalid") && input.value.trim()) {
      formGroup.classList.remove("invalid");
      errorSpan.textContent = "";
    }
  });
}

// xử lý Modal Đăng ký/Đăng nhập
document.addEventListener("DOMContentLoaded", function () {
  // Get DOM elements
  const signupBtn = document.querySelector(".signup-btn");
  const loginBtn = document.querySelector(".login-btn");
  const authModal = document.getElementById("authModal");
  const modalClose = document.getElementById("modalClose");
  const signupForm = document.getElementById("signupForm");
  const loginForm = document.getElementById("loginForm");
  const showLoginBtn = document.getElementById("showLogin");
  const showSignupBtn = document.getElementById("showSignup");

  // Hàm xử lý hiển thị form đăng ký
  function showSignupForm() {
    signupForm.style.display = "block";
    loginForm.style.display = "none";
  }

  // Hàm xử lý hiển thị form đăng nhập
  function showLoginForm() {
    signupForm.style.display = "none";
    loginForm.style.display = "block";
  }

  // Hàm mở Modal
  function openModal() {
    authModal.classList.add("show");
    document.body.style.overflow = "hidden"; // Prevent background scrolling
  }

  // Mở Modal với form Đăng ký chỉ sử lý nút Sign up
  signupBtn.addEventListener("click", function () {
    showSignupForm();
    openModal();
  });

  // Mở Modal với form Đăng nhập chỉ sử lý nút Login
  loginBtn.addEventListener("click", function () {
    showLoginForm();
    openModal();
  });

  // Hàm đóng modal
  function closeModal() {
    authModal.classList.remove("show");
    document.body.style.overflow = "auto"; // Restore scrolling
  }

  // Đóng Modal khi click nút đóng
  modalClose.addEventListener("click", closeModal);

  // Đóng Modal khi click overlay
  authModal.addEventListener("click", function (e) {
    if (e.target === authModal) {
      closeModal();
    }
  });

  // Đóng Modal khi nhấn phím escape
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && authModal.classList.contains("show")) {
      closeModal();
    }
  });

  // Chuyển sang form Đăng nhập
  showLoginBtn.addEventListener("click", function () {
    showLoginForm();
  });

  // Chuyển sang form Đăng ký
  showSignupBtn.addEventListener("click", function () {
    showSignupForm();
  });

  // Validate blur cho form Đăng ký
  if (signupForm) {
    // Validate trường hợp email
    const signupEmailInput = signupForm.querySelector("#signupEmail");
    if (signupEmailInput) {
      const emailFormGroup = signupEmailInput.closest(".form-group");
      const emailErrorSpan = emailFormGroup.querySelector(
        ".error-message span"
      );
      if (emailFormGroup && emailErrorSpan) {
        setupBlurValidation(
          signupEmailInput,
          emailFormGroup,
          emailErrorSpan,
          "Email cannot be blank."
        );
      }
    }

    // Validate cho password
    const signupPasswordInput = signupForm.querySelector("#signupPassword");
    if (signupPasswordInput) {
      const passwordFormGroup = signupPasswordInput.closest(".form-group");
      const passwordErrorSpan = passwordFormGroup.querySelector(
        ".error-message span"
      );
      if (passwordFormGroup && passwordErrorSpan) {
        setupBlurValidation(
          signupPasswordInput,
          passwordFormGroup,
          passwordErrorSpan,
          "Password cannot be blank."
        );
      }
    }
  }

  signupForm
    .querySelector(".auth-form-content")
    .addEventListener("submit", async (e) => {
      e.preventDefault();

      // Lấy elements
      const emailInput = e.target.querySelector("#signupEmail");
      const passwordInput = e.target.querySelector("#signupPassword");
      const emailFormGroup = emailInput.closest(".form-group");
      const passwordFormGroup = passwordInput.closest(".form-group");
      const emailErrorSpan = emailFormGroup.querySelector(
        ".error-message span"
      );
      const passwordErrorSpan = passwordFormGroup.querySelector(
        ".error-message span"
      );

      // Reset UI: Xóa class invalid và text lỗi (CSS sẽ ẩn message)
      [emailFormGroup, passwordFormGroup].forEach((group) =>
        group.classList.remove("invalid")
      );
      emailErrorSpan.textContent = "";
      passwordErrorSpan.textContent = "";

      const credentials = {
        email: emailInput.value.trim(),
        password: passwordInput.value.trim(),
      };

      // Gọi API ngay
      try {
        const { user, access_token } = await httpRequest.post(
          "auth/register",
          credentials
        );
        localStorage.setItem("accessToken", access_token);
        localStorage.setItem("currentUser", JSON.stringify(user));
        updateCurrentUser(user);
        closeModal(); // Đóng modal sau success
      } catch (error) {
        // Parse lỗi từ API response
        const err = error?.response?.error || {};
        const details = err.details || [];

        // Case 1: Email đã tồn tại
        if (err.code === "EMAIL_EXISTS") {
          emailFormGroup.classList.add("invalid");
          emailErrorSpan.textContent = err.message || "Email already exists";
          return;
        }

        // Case 2: Validation errors (required, format, length) – multi-field
        if (err.code === "VALIDATION_ERROR" && Array.isArray(details)) {
          let hasError = false;
          details.forEach((detail) => {
            if (detail.field === "email") {
              emailFormGroup.classList.add("invalid");
              emailErrorSpan.textContent = detail.message || "Invalid email";
              hasError = true;
            }
            if (detail.field === "password") {
              passwordFormGroup.classList.add("invalid");
              passwordErrorSpan.textContent =
                detail.message || "Invalid password";
              hasError = true;
            }
          });
          if (hasError) return;
        }

        // Case 3: Lỗi chung (server error, network, hoặc code khác)
        emailFormGroup.classList.add("invalid");
        emailErrorSpan.textContent =
          err.message || "Registration failed. Please try again.";
      }
    });
});

// Xử lý bật/tắt hiển thị mật khẩu
document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".toggle-password").forEach((btn) => {
    btn.addEventListener("click", () => {
      const input = btn.previousElementSibling; // Input nằm ngay trước icon mắt
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

// User Menu Dropdown Functionality
document.addEventListener("DOMContentLoaded", function () {
  const userAvatar = document.getElementById("userAvatar");
  const userDropdown = document.getElementById("userDropdown");
  const logoutBtn = document.getElementById("logoutBtn");

  // Toggle dropdown when clicking avatar
  userAvatar.addEventListener("click", function (e) {
    e.stopPropagation();
    userDropdown.classList.toggle("show");
  });

  // Close dropdown when clicking outside
  document.addEventListener("click", function (e) {
    if (!userAvatar.contains(e.target) && !userDropdown.contains(e.target)) {
      userDropdown.classList.remove("show");
    }
  });

  // Close dropdown when pressing Escape
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && userDropdown.classList.contains("show")) {
      userDropdown.classList.remove("show");
    }
  });

  // Handle logout button click
  logoutBtn.addEventListener("click", function () {
    // Close dropdown first
    userDropdown.classList.remove("show");

    console.log("Logout clicked");
    // TODO: Students will implement logout logic here
  });
});

document.addEventListener("DOMContentLoaded", async () => {
  const authButtons = document.querySelector(".auth-buttons");
  const userInfo = document.querySelector(".user-info");
  const accessToken = localStorage.getItem("accessToken");

  // Nếu chưa có token thì hiển thị nút login/signup và thoát luôn
  if (!accessToken) {
    authButtons.classList.add("show");
    userInfo.classList.remove("show");
    return;
  }

  try {
    const { user } = await httpRequest.get("users/me", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    updateCurrentUser(user);
    userInfo.classList.add("show");
    authButtons.classList.remove("show");
  } catch (error) {
    // Nếu token hết hạn hoặc không hợp lệ -> hiển thị lại nút login
    console.warn("Token invalid or expired:", error);
    authButtons.classList.add("show");
    userInfo.classList.remove("show");
    localStorage.removeItem("accessToken"); // Xóa Token cũ
  }
});

function updateCurrentUser(user) {
  const userName = document.querySelector("#user-name");
  const userAvatar = document.querySelector("#user-avatar");
  if (user.avatar_url) {
    userAvatar.src = user.avatar_url;
  }
  if (user.email) {
    userName.textContent = user.email;
  }
}
