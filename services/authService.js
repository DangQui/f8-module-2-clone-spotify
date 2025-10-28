// Xử lý kiểm tra trạng thái đăng nhập và cập nhật UI người dùng

import httpRequest from "../utils/httpRequest.js";

export async function checkAuthOnLoad() {
  const authButtons = document.querySelector(".auth-buttons");
  const userInfo = document.querySelector(".user-info");
  const accessToken = localStorage.getItem("accessToken");

  if (!accessToken) {
    authButtons?.classList.add("show");
    userInfo?.classList.remove("show");
    return;
  }

  try {
    const { user } = await httpRequest.get("users/me", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    updateCurrentUser(user);
    userInfo?.classList.add("show");
    authButtons?.classList.remove("show");
  } catch (error) {
    console.warn("Token không hợp lệ hoặc hết hạn:", error);
    authButtons?.classList.add("show");
    userInfo?.classList.remove("show");
    localStorage.removeItem("accessToken");
  }
}

export function updateCurrentUser(user) {
  const userName = document.querySelector("#user-name");
  const userAvatar = document.querySelector("#user-avatar");
  if (user.avatar_url) {
    userAvatar.src = user.avatar_url;
  }
  if (user.email) {
    userName.textContent = user.email;
  }
}
