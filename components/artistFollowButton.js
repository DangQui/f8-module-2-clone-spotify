import {
  checkIfFollowingArtist,
  followArtist,
  unfollowArtist,
} from "../services/artistFollowService.js";

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
  _attachEventListeners() {
    if (!this.button) return;

    this.button.addEventListener("click", async (e) => {
      e.preventDefault();
      e.stopPropagation();

      // Prevent double clicks
      if (this.isLoading) return;

      await this._toggleFollow();
    });

    // Show "Unfollow" on hover when following
    this.button.addEventListener("mouseenter", () => {
      if (this.isFollowing && !this.isLoading) {
        const span = this.button.querySelector("span");
        const icon = this.button.querySelector("i");
        if (span) span.textContent = "Unfollow";
        if (icon) {
          icon.classList.remove("fa-check");
          icon.classList.add("fa-minus");
        }
      }
    });

    this.button.addEventListener("mouseleave", () => {
      if (this.isFollowing && !this.isLoading) {
        const span = this.button.querySelector("span");
        const icon = this.button.querySelector("i");
        if (span) span.textContent = "Following";
        if (icon) {
          icon.classList.remove("fa-minus");
          icon.classList.add("fa-check");
        }
      }
    });
  }

  // Toggle follow/unfollow
  async _toggleFollow() {
    this.isLoading = true;
    this._setLoadingState();

    try {
      if (this.isFollowing) {
        await unfollowArtist(this.artistId);
        this.isFollowing = false;
        this._showNotification("Artist unfollowed");
      } else {
        await followArtist(this.artistId);
        this.isFollowing = true;
        this._showNotification("Artist added to your library");
      }

      // Re - render button
      this._render();
      this._attachEventListeners();

      // Emit custom event for other component to listen
      this._emitFollowEvent();
    } catch (error) {
      console.error("Error toggling follow:", error);

      // Show error based on response
      const errorMessage =
        error.response?.error?.message || "Failed to update follow status";
      this._showNotification(errorMessage, "error");
    } finally {
      this.isLoading = false;
    }
  }

  // Set loading state
  _setLoadingState() {
    if (this.button) {
      this.button.disabled = true;
      this.button.classList.add("loading");
      const span = this.button.querySelector("span");
      if (span) span.textContent = "...";
    }
  }

  // Hide button
  _hideButton() {
    if (this.container) {
      this.container.style.display = "none";
    }
  }

  // Show notification toast
  _showNotification(message, type = "success") {
    // Create toast notification
    const toast = document.createElement("div");
    toast.className = `notification-toast ${type}`;
    toast.innerHTML = `
      <i class="fas ${
        type === "success" ? "fa-check-circle" : "fa-exclamation-circle"
      }"></i>
      <span>${message}</span>
    `;

    document.body.appendChild(toast);

    // Show toast
    setTimeout(() => toast.classList.add("show"), 100);

    // Remove toast after 3s
    setTimeout(() => {
      toast.classList.remove("show");
      setTimeout(() => toast.remove(), 3000);
    }, 3000);
  }

  // Emit custom event when follow status changes
  _emitFollowEvent() {
    const event = new CustomEvent("artist:followchange", {
      detail: {
        artistId: this.artistId,
        isFollowing: this.isFollowing,
      },
    });
    document.dispatchEvent(event);
  }

  // Public method to refresh follow status
  async refresh() {
    try {
      this.isFollowing = await checkIfFollowingArtist(this.artistId);
      this._render();
      this._attachEventListeners();
    } catch (error) {
      console.error("Error refreshing follow status:", error);
    }
  }
}

export default ArtistFollowButton;
