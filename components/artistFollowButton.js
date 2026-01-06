import { checkIfFollowingArtist } from "../services/artistFollowService";

class ArtistFollowButton {
  constructor(containerId, artistId) {
    this.container = document.getElementById(containerId);
    this.artistId = artistId;
    this.isFollowing = false;
    this.isLoading = false;
    this.button = null;
  }

  // Initialize the follow button
  async init() {
    if (!this.container) {
      console.error("Follow button container not found");
      return;
    }

    // Check if user is logged in
    const accessToken = localStorage.getItem("accessToken");
    if (!accessToken) {
      this._hideButton();
      return;
    }

    try {
      this.isFollowing = await checkIfFollowingArtist(this.artistId);
      this._render();
      this._attachEventListeners();
    } catch (error) {
      console.error("Error initializing follow button");
      this._hideButton();
    }
  }

  // Render the button
  _render() {
    const buttonClass = this.isFollowing ? "following" : "not-following";
    const buttonText = this.isFollowing ? "Following" : "Follow";
    const iconClass = this.isFollowing ? "fa-check" : "fa-plus";

    this.container.innerHTML = `
        <button class="follow-artist-btn ${buttonClass}" ${
      this.isLoading ? "disable" : ""
    }>
        <i class="fas ${iconClass}"></i>
        <span>${buttonText}</span>
    </button>
    `;

    this.button = this.container.querySelector(".follow-artist-btn");
  }

  // Attach event listeners
}
