import { playTrack } from "../services/tracksService.js";
import { formatTrackDuration } from "../utils/timeFormat.js";

class MusicPlayer {
  constructor() {
    // DOM Elements - Player Controls
    this._audioElement = document.querySelector("#audio-player");
    this._playPauseBtn = document.querySelector(".player-center .play-btn");
    this._playIcon = this._playPauseBtn?.querySelector("i");
    this._nextBtn = document.querySelector(
      ".player-center .control-btn:nth-child(4)"
    );
    this._prevBtn = document.querySelector(
      ".player-center .control-btn:nth-child(2)"
    );
    this._shuffleBtn = document.querySelector(
      ".player-center .control-btn:first-child"
    );
    this._repeatBtn = document.querySelector(
      ".player-center .control-btn:last-child"
    );

    // DOM Elements - Player Info
    this._playerImage = document.querySelector(".player-image");
    this._playerTitle = document.querySelector(".player-title");
    this._playerArtist = document.querySelector(".player-artist");

    // DOM Element - Progress
    this._progressBar = document.querySelector(".progress-bar");
    this._progressFill = document.querySelector(".progress-fill");
    this._currentTimeElement = document.querySelector(".time:first-of-type");
    this._durationElement = document.querySelector(".time:last-of-type");

    // DOM Element - Volume
    this._volumeBtn = document.querySelector(".volume-container .control-btn");
    this._volumeBar = document.querySelector(".volume-bar");
    this._volumeFill = document.querySelector(".volume-fill");

    // State Management
    this._currentTrack = null;
    this._playList = [];
    this._currentIndex = 0;
    this._isPlaying = false;
    this._isSeeking = false;
    this._volume = 0.7;
    this._isMuted = false;
    this._previousVolume = 0.7;

    // Chế độ phát
    this._isShuffleMode = this._loadState("isShuffleMode", false);
    this._isRepeatMode = this._loadState("isRepeatMode", false);
    this._playHistory = this._loadState("playHistory", []);

    this._initialize();
  }

  // Khởi tạo player
  _initialize() {
    if (!this._audioElement) {
      // Tạo audio element
      this._audioElement = document.createElement("audio");
      this._audioElement.id = "audio-player";
      this._audioElement.preload = "metadata";
      document.body.appendChild(this._audioElement);
    }

    // Set Volume ban đầu
    this._audioElement.volume = this._volume;
    this._updateVolumeUI();

    // Cập nhật UI cho shuffle/repeat
    this._updateShuffleUI();
    this._updateRepeatUI();

    // Đăng ký events
    this._setupEventListeners();

    // Load track cuối cùng từ localStorage (nếu có)
    this._loadLastTrack();
  }

  _setupEventListeners() {
    // Play/Pause
    this._playPauseBtn?.addEventListener("click", () =>
      this._togglePlayPause()
    );
    this._audioElement?.addEventListener("play", () => this._handlePlay());
    this._audioElement?.addEventListener("pause", () => this._handlePause());

    // Next/Prev - ✅ FIX: Sửa từ _toggleRepeat thành _playPrevious
    this._nextBtn?.addEventListener("click", () => this._playNext());
    this._prevBtn?.addEventListener("click", () => this._playPrevious());

    // Shuffle/Repeat
    this._shuffleBtn?.addEventListener("click", () => this._toggleShuffle());
    this._repeatBtn?.addEventListener("click", () => this._toggleRepeat());

    // Progress bar
    this._progressBar?.addEventListener("mousedown", (e) =>
      this._handleProgressMouseDown(e)
    );
    this._progressBar?.addEventListener("click", (e) =>
      this._handleProgressClick(e)
    );
    document.addEventListener("mousemove", (e) =>
      this._handleProgressMouseMove(e)
    );
    document.addEventListener("mouseup", () => this._handleProgressMouseUp());

    // Volume - ✅ FIX: Sửa từ this._volume thành this._volumeBar
    this._volumeBtn?.addEventListener("click", () => this._toggleMute());
    this._volumeBar?.addEventListener("click", (e) =>
      this._handleVolumeClick(e)
    );

    // Time update - ✅ FIX: Thêm arrow function
    this._audioElement.addEventListener("timeupdate", () =>
      this._handleTimeUpdate()
    );
    this._audioElement.addEventListener("loadedmetadata", () =>
      this._handleMetadataLoaded()
    );
    this._audioElement.addEventListener("ended", () =>
      this._handleTrackEnded()
    );

    // Global track play events
    this._setupGlobalTrackEvents();
  }

  // Lắng nghe sự kiện click vào tracks trên trang
  _setupGlobalTrackEvents() {
    // Lắng nghe click vào các nút play trên hit cards
    document.addEventListener("click", async (e) => {
      // closest: tìm phần tử cha gần nhất có CSS Seclector là ".hit-play-btn"
      const playBtn = e.target.closest(".hit-play-btn");
      if (playBtn) {
        e.preventDefault();
        e.stopPropagation();

        const trackId = playBtn.dataset.trackId;
        if (trackId) {
          await this._playTrackById(trackId);
        }
      }

      // Lắng nghe click vào track items
      const trackItem = e.target.closest(".track-item");
      if (trackItem && !e.target.closest(".track-menu-btn")) {
        const trackId = trackItem.dataset.trackId;
        if (trackId) {
          await this._playTrackById(trackId);
        }
      }
    });
  }

  async _playTrackById(trackId) {
    try {
      await playTrack(trackId);

      // Load track hoặc tìm track từ playList hiện tại
      const track = this._findTrackById(trackId);
      if (track) {
        this.loadTrack(track);
        this.play();
      }
    } catch (error) {
      console.error("Error playing track:", error);
    }
  }

  // Tìm track trong playlist
  _findTrackById(trackId) {
    return this._playList.find((track) => track.id === parseInt(trackId));
  }

  // Toggle Play/Pause
  _togglePlayPause() {
    if (this._audioElement.paused) {
      this.play();
    } else {
      this.pause();
    }
  }

  // Play
  play() {
    // Kiểm tra đã có bài đang chọn và đường dẫn url của bài đó thì play
    if (this._currentTrack && this._audioElement.src) {
      this._audioElement.play().catch((error) => {
        console.error("Error playing audio:", error);
      });
    }
  }

  // Pause
  pause() {
    this._audioElement.pause();
  }

  // Load track
  loadTrack(track, autoPlay = false) {
    if (!track || !track.audio_url) {
      console.error("Invalid track data");
      return;
    }

    this._currentTrack = track;
    this._audioElement.src = track.audio_url;

    // Update UI
    this._updatePlayerUI();

    // Save to Localstorage
    this._saveState("lastTrack", track);

    if (autoPlay) {
      this.play();
    }
  }

  // Load Playlist
  loadPlaylist(tracks, startIndex = 0) {
    this._playList = tracks || [];
    this._currentIndex = startIndex;

    if (this._playList.length > 0) {
      this.loadTrack(this._playList[this._currentIndex], false);
    }
  }

  _updatePlayerUI() {
    if (!this._currentTrack) return;

    // Update image
    if (this._playerImage) {
      this._playerImage.src =
        this._currentTrack.image_url || "placeholder.svg?height=56&width=56";
      this._playerImage.alt = this._currentTrack.title;
    }

    // Update title
    if (this._playerTitle) {
      this._playerTitle.textContent = this._currentTrack.title;
    }

    // Update Artist
    if (this._playerArtist) {
      this._playerArtist.textContent =
        this._currentTrack.artist_name || "Unknown Artist";
    }

    // Highlight active track
    this._highlightActiveTrack();
  }

  // Highlight active track in UI
  _highlightActiveTrack() {
    // Remove all playing classes
    document.querySelectorAll(".track-item.playing").forEach((item) => {
      item.classList.remove("playing");
      const number = item.querySelector(".track-number");
      if (number && number.querySelector(".playing-icon")) {
        number.innerHTML =
          Array.from(item.parentElement.children).indexOf(item) + 1;
      }
    });

    document.querySelectorAll(".hit-card.playing").forEach((card) => {
      card.classList.remove("playing");
    });

    // Add playing class to current track
    if (this._currentTrack) {
      const trackItem = document.querySelector(
        `.track-item[data-track-id="${this._currentTrack.id}"]`
      );
      if (trackItem) {
        trackItem.classList.add("playing");
        const number = trackItem.querySelector(".track-number");
        if (number) {
          number.innerHTML = `<i class="fas fa-volume-up playing-icon"></i>`;
        }
      }

      const hitCard = document.querySelector(
        `.hit-card[data-track-id="${this._currentTrack.id}"]`
      );
      if (hitCard) {
        hitCard.classList.add("playing");
      }
    }
  }

  // Handle play event
  _handlePlay() {
    this._isPlaying = true;
    if (this._playIcon) {
      this._playIcon.classList.remove("fa-play");
      this._playIcon.classList.add("fa-pause");
    }
  }

  // Handle pause event
  _handlePause() {
    this._isPlaying = false;
    if (this._playIcon) {
      this._playIcon.classList.remove("fa-pause");
      this._playIcon.classList.add("fa-play");
    }
  }

  // Play next track
  _playNext() {
    if (this._playList.length === 0) return;

    if (this._isShuffleMode) {
      this._playRandomTrack();
    } else {
      this._currentIndex = (this._currentIndex + 1) % this._playList.length;
      this.loadTrack(this._playList[this._currentIndex], true);
    }
  }

  // Play prev track - ✅ FIX: Sửa logic so sánh
  _playPrevious() {
    if (this._playList.length === 0) return;

    // Nếu đang phát > 3s, restart track hiện tại
    if (this._audioElement.currentTime > 3) {
      this._audioElement.currentTime = 0;
      return;
    }

    // Ngược lại, phát track trước
    this._currentIndex =
      (this._currentIndex - 1 + this._playList.length) % this._playList.length;
    this.loadTrack(this._playList[this._currentIndex], true);
  }

  // Toggle shuffle mode
  _toggleShuffle() {
    this._isShuffleMode = !this._isShuffleMode;
    this._saveState("isShuffleMode", this._isShuffleMode);
    this._updateShuffleUI();

    if (!this._isShuffleMode) {
      this._playHistory = [];
      this._saveState("playHistory", this._playHistory);
    }
  }

  _updateShuffleUI() {
    if (this._shuffleBtn) {
      this._shuffleBtn.classList.toggle("active", this._isShuffleMode);
    }
  }

  _toggleRepeat() {
    this._isRepeatMode = !this._isRepeatMode;
    this._saveState("isRepeatMode", this._isRepeatMode);
    this._updateRepeatUI();
  }

  _updateRepeatUI() {
    if (this._repeatBtn) {
      this._repeatBtn.classList.toggle("active", this._isRepeatMode);
    }
  }

  // ✅ FIX: Sửa các lỗi logic
  _playRandomTrack() {
    if (this._playList.length === 0) return;

    // Thêm track hiện tại vào history
    if (
      this._currentIndex !== null &&
      !this._playHistory.includes(this._currentIndex)
    ) {
      this._playHistory.push(this._currentIndex);
    }

    // Reset lại history nếu đã phát hết
    if (this._playHistory.length >= this._playList.length) {
      this._playHistory = [];
    }

    // Lấy các index chưa phát
    const availableIndexes = [];
    for (let i = 0; i < this._playList.length; i++) {
      if (!this._playHistory.includes(i)) {
        availableIndexes.push(i);
      }
    }

    // Random từ available indexes
    const randomIdx = Math.floor(Math.random() * availableIndexes.length);
    this._currentIndex = availableIndexes[randomIdx];

    this._saveState("playHistory", this._playHistory);
    this.loadTrack(this._playList[this._currentIndex], true);
  }

  // Handle track ended
  _handleTrackEnded() {
    if (this._isRepeatMode) {
      this._audioElement.currentTime = 0;
      this.play();
    } else {
      this._playNext();
    }
  }

  // Handle time update
  _handleTimeUpdate() {
    if (this._isSeeking) return;

    const { currentTime, duration } = this._audioElement;
    if (!duration) return;

    // Update progress bar
    const progress = (currentTime / duration) * 100;
    if (this._progressFill) {
      this._progressFill.style.width = `${progress}%`;
    }

    // Update time display
    if (this._currentTimeElement) {
      this._currentTimeElement.textContent = formatTrackDuration(currentTime);
    }
  }

  // Handle metadata loaded
  _handleMetadataLoaded() {
    if (this._durationElement) {
      this._durationElement.textContent = formatTrackDuration(
        this._audioElement.duration
      );
    }
  }

  // Handle progress bar click
  _handleProgressClick(e) {
    const rect = this._progressBar.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    this._audioElement.currentTime = percent * this._audioElement.duration;
  }

  // Handle progress mousedown
  _handleProgressMouseDown(e) {
    this._isSeeking = true;
    this._handleProgressClick(e);
  }

  // Handle progress mousemove
  _handleProgressMouseMove(e) {
    if (!this._isSeeking) return;
    this._handleProgressClick(e);
  }

  // Handle progress mouseup
  _handleProgressMouseUp() {
    this._isSeeking = false;
  }

  // Toggle mute
  _toggleMute() {
    if (this._isMuted) {
      this._audioElement.volume = this._previousVolume;
      this._volume = this._previousVolume;
      this._isMuted = false;
    } else {
      this._previousVolume = this._volume;
      this._audioElement.volume = 0;
      this._volume = 0;
      this._isMuted = true;
    }
    this._updateVolumeUI();
  }

  // Handle volume click
  _handleVolumeClick(e) {
    const rect = this._volumeBar.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    this._volume = Math.max(0, Math.min(1, percent));
    this._audioElement.volume = this._volume;
    this._isMuted = this._volume === 0;
    this._updateVolumeUI();
  }

  // Update volume UI
  _updateVolumeUI() {
    if (this._volumeFill) {
      this._volumeFill.style.width = `${this._volume * 100}%`;
    }

    if (this._volumeBtn) {
      const icon = this._volumeBtn.querySelector("i");
      if (icon) {
        icon.className =
          this._volume === 0 || this._isMuted
            ? "fas fa-volume-mute"
            : this._volume < 0.5
            ? "fas fa-volume-down"
            : "fas fa-volume-up";
      }
    }
  }

  // Load last track form localStorage
  _loadLastTrack() {
    const lastTrack = this._loadState("lastTrack");
    if (lastTrack) {
      this._currentTrack = lastTrack;
      this._updatePlayerUI();
    }
  }

  // Save state to localStorage
  _saveState(key, value) {
    try {
      localStorage.setItem(`musicPlayer_${key}`, JSON.stringify(value));
    } catch (error) {
      console.error("Error saving state", error);
    }
  }

  // Load state form localStorage
  _loadState(key, defaultValue = null) {
    try {
      const value = localStorage.getItem(`musicPlayer_${key}`);
      return value ? JSON.parse(value) : defaultValue;
    } catch (error) {
      console.error("Error loading state:", error);
      return defaultValue;
    }
  }

  // Public API
  getCurrentTrack() {
    return this._currentTrack;
  }

  getPlaylist() {
    return this._playList;
  }

  isPlaying() {
    return this._isPlaying;
  }
}

const musicPlayer = new MusicPlayer();
export default musicPlayer;
