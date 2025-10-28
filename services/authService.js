// Xử lý kiểm tra trạng thái đăng nhập và cập nhật UI người dùng

import httpRequest from "../utils/httpRequest.js";

export async function checkAuthOnLoad() {
  const authButtons = document.querySelector(".auth-buttons");
  const userInfo = document.querySelector(".user-info");
  const accessToken = localStorage.getItem("accessToken");
  const unauthLibrary = document.querySelector(".unauth-library");
  const navTabs = document.querySelector(".nav-tabs");
  const playListsTab = document.querySelector(".nav-tab:first-of-type");
  const artistsTab = document.querySelector(".nav-tab:last-of-type");
  const searchLibrary = document.querySelector(".search-library");
  const libraryContent = document.querySelector(".library-content");

  if (!accessToken) {
    authButtons?.classList.add("show");
    userInfo?.classList.remove("show");
    unauthLibrary?.classList.add("show");
    navTabs?.classList.remove("show");
    searchLibrary?.classList.remove("show");
    libraryContent?.classList.remove("show");
    return;
  }

  try {
    const { user, stats } = await httpRequest.get("users/me", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    updateCurrentUser(user);
    userInfo?.classList.add("show");
    authButtons?.classList.remove("show");

    // Đặt point cho playList và artists
    const hasPlaylists = (stats.playlists || 0) > 0;
    const hasArtists = (stats.following || 0) > 0;

    // Nếu cả hai point bằng là false
    if (!hasPlaylists && !hasArtists) {
      unauthLibrary?.classList.add("show");
      playListsTab?.classList.remove("show");
      artistsTab?.classList.remove("show");
      searchLibrary?.classList.remove("show");
      libraryContent?.classList.remove("show");
      return;
    }

    // Nếu có ít nhất một point là true
    unauthLibrary?.classList.remove("show");
    searchLibrary?.classList.add("show");
    libraryContent?.classList.add("show");

    if (hasPlaylists) {
      playListsTab?.classList.add("show");
      playListsTab.classList.add("active");
    } else {
      playListsTab?.classList.remove("show");
    }

    if (hasArtists) {
      artistsTab?.classList.add("show");
    } else {
      artistsTab?.classList.remove("show");
    }

    if (!hasPlaylists && hasArtists) {
      artistsTab.classList.add("active");
    }
  } catch (error) {
    authButtons?.classList.add("show");
    userInfo?.classList.remove("show");
    unauthLibrary?.classList.add("show");
    playListsTab?.classList.remove("show");
    artistsTab?.classList.remove("show");
    searchLibrary?.classList.remove("show");
    libraryContent?.classList.remove("show");
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
