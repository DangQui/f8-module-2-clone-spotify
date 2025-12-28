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
    this._progressHandle = document.querySelector(".progress-handle");
    this._progressTooltip = null; // NEW: Tooltip element sẽ được tạo động
    this._currentTimeElement = document.querySelector(".time:first-of-type");
    this._durationElement = document.querySelector(".time:last-of-type");

    // DOM Element - Volume
    this._volumeBtn = document.querySelector(".volume-container .control-btn");
    this._volumeBar = document.querySelector(".volume-bar");
    this._volumeFill = document.querySelector(".volume-fill");
    this._volumeHandle = document.querySelector(".volume-handle");
    this._volumeTooltip = null; // NEW: Tooltip element sẽ được tạo động

    // State Management
    this._currentTrack = null;
    this._playList = [];
    this._currentPlayListType = null; // Thêm state để track type playlist
    this._currentIndex = 0;
    this._isPlaying = false;
    this._isSeeking = false;
    this._isVolumeChanging = false;
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

    // NEW: Tạo tooltip cho progress bar
    this._createProgressTooltip();

    // NEW: Tạo tooltip cho volume bar
    this._createVolumeTooltip();

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

  // NEW: Tạo tooltip cho progress bar
  _createProgressTooltip() {
    if (this._progressBar && !this._progressTooltip) {
      this._progressTooltip = document.createElement("div");
      this._progressTooltip.className = "progress-tooltip";
      this._progressTooltip.textContent = "0:00";
      this._progressBar.appendChild(this._progressTooltip);
    }
  }

  // NEW: Tạo tooltip cho volume bar
  _createVolumeTooltip() {
    if (this._volumeBar && !this._volumeTooltip) {
      this._volumeTooltip = document.createElement("div");
      this._volumeTooltip.className = "volume-tooltip";
      this._volumeTooltip.textContent = "70%";
      this._volumeBar.appendChild(this._volumeTooltip);
    }
  }

  _setupEventListeners() {
    // Play/Pause
    this._playPauseBtn?.addEventListener("click", () =>
      this._togglePlayPause()
    );
    this._audioElement?.addEventListener("play", () => this._handlePlay());
    this._audioElement?.addEventListener("pause", () => this._handlePause());

    // Next/Prev
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
    // NEW: Thêm sự kiện hover để hiển thị tooltip
    this._progressBar?.addEventListener("mouseenter", () => {
      if (this._progressTooltip) {
        this._progressTooltip.classList.add("show");
      }
    });
    this._progressBar?.addEventListener("mouseleave", () => {
      if (this._progressTooltip && !this._isSeeking) {
        this._progressTooltip.classList.remove("show");
      }
    });
    // NEW: Cập nhật tooltip position khi di chuyển chuột
    this._progressBar?.addEventListener("mousemove", (e) => {
      this._updateProgressTooltipPosition(e);
    });
    document.addEventListener("mousemove", (e) =>
      this._handleProgressMouseMove(e)
    );
    document.addEventListener("mouseup", () => this._handleProgressMouseUp());

    // Volume
    this._volumeBtn?.addEventListener("click", () => this._toggleMute());
    this._volumeBar?.addEventListener("click", (e) =>
      this._handleVolumeClick(e)
    );
    this._volumeBar?.addEventListener("mousedown", (e) =>
      this._handleVolumeMouseDown(e)
    );
    // NEW: Thêm sự kiện hover để hiển thị tooltip
    this._volumeBar?.addEventListener("mouseenter", () => {
      if (this._volumeTooltip) {
        this._volumeTooltip.classList.add("show");
      }
    });
    this._volumeBar?.addEventListener("mouseleave", () => {
      if (this._volumeTooltip && !this._isVolumeChanging) {
        this._volumeTooltip.classList.remove("show");
      }
    });
    // NEW: Cập nhật tooltip position khi di chuyển chuột
    this._volumeBar?.addEventListener("mousemove", (e) => {
      this._updateVolumeTooltipPosition(e);
    });
    document.addEventListener("mousemove", (e) =>
      this._handleVolumeMouseMove(e)
    );
    document.addEventListener("mouseup", () => this._handleVolumeMouseUp());

    // Time update
    this._audioElement.addEventListener("timeupdate", () =>
      this._handleTimeUpdate()
    );
    this._audioElement.addEventListener("loadedmetadata", () =>
      this._handleMetadataLoaded()
    );
    this._audioElement.addEventListener("ended", () =>
      this._handleTrackEnded()
    );

    // NEW: Lưu thời gian trước khi tắt/reload trang
    window.addEventListener("beforeunload", () => {
      if (this._currentTrack) {
        this._saveState("lastPlaybackTime", this._audioElement.currentTime);
        this._saveState("isPlaying", this._isPlaying);
      }
    });

    // Global track play events
    this._setupGlobalTrackEvents();
  }

  // Lắng nghe sự kiện click vào tracks trên trang
  _setupGlobalTrackEvents() {
    // Lắng nghe click vào các nút play trên hit cards
    document.addEventListener("click", async (e) => {
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

  emitEvent(eventType, detail = {}) {
    const event = new CustomEvent(eventType, { detail });
    document.dispatchEvent(event);
    console.log(`Event emitted: ${eventType}`, detail);
  }

  async _playTrackById(trackId) {
    try {
      // Load track hoặc tìm track từ playList hiện tại
      const track = this._findTrackById(trackId);
      if (!track) {
        console.error("Track not found in playlist:", trackId);
        return;
      }

      // Toggle: Nếu đang play track này -> pause; else load + play
      if (this._currentTrack?.id === trackId) {
        if (this._isPlaying) {
          this.pause();
        } else {
          this.play();
        }
        return;
      }

      // Không phải current -> play mới
      await playTrack(trackId);
      this.loadTrack(track, true);
    } catch (error) {
      console.error("Error playing track:", error);
    }
  }

  // Tìm track trong playlist
  _findTrackById(trackId) {
    const track = this._playList.find((track) => track.id === trackId);
    return track;
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

    // Emit Trackchange
    this.emitEvent("player:trackchange", {
      trackId: track.id,
      title: track.title,
    });

    // NEW: Lưu track và thời gian phát hiện tại
    this._saveState("lastTrack", track);
    this._saveState("lastPlaybackTime", 0); // Reset thời gian khi load track mới

    if (autoPlay) {
      this.play();
    }
  }

  // Load Playlist
  loadPlaylist(tracks, startIndex = 0, playListType = "trending") {
    this._playList = tracks || [];
    this._currentIndex = startIndex;
    this._currentPlayListType = playListType;

    if (this._playList.length > 0) {
      this.loadTrack(this._playList[this._currentIndex], true);
    }
  }

  // Check nếu playlist hiện tại là của artist
  isCurrentPlaylistForArtist(artistId) {
    return this._currentPlayListType === `artist:${artistId}`;
  }

  // NEW: Cập nhật playlist mà KHÔNG load track mới (dùng khi navigate)
  updatePlaylistOnly(tracks, playListType = "trending") {
    this._playList = tracks || [];
    this._currentPlayListType = playListType;

    // Tìm index của track hiện tại trong playlist mới
    if (this._currentTrack) {
      const newIndex = this._playList.findIndex(
        (track) => track.id === this._currentTrack.id
      );
      if (newIndex !== -1) {
        this._currentIndex = newIndex;
      }
    }

    console.log(
      "Playlist updated, current track preserved:",
      this._currentTrack?.title
    );
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
    // NEW: Lưu trạng thái đang phát
    this._saveState("isPlaying", true);
    this.emitEvent("player:play", {
      trackId: this._currentTrack?.id,
      isPlaying: true,
    });
  }

  // Handle pause event
  _handlePause() {
    this._isPlaying = false;
    if (this._playIcon) {
      this._playIcon.classList.remove("fa-pause");
      this._playIcon.classList.add("fa-play");
    }
    // NEW: Lưu trạng thái tạm dừng
    this._saveState("isPlaying", false);
    this.emitEvent("player:pause", {
      trackId: this._currentTrack?.id,
      isPlaying: false,
    });
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

  // Play prev track
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

  // Handle time update - FIX: Cập nhật handle position
  _handleTimeUpdate() {
    if (this._isSeeking) return;

    const { currentTime, duration } = this._audioElement;
    if (!duration) return;

    // Update progress bar
    const progress = (currentTime / duration) * 100;
    this._updateProgressUI(progress);

    // Update time display
    if (this._currentTimeElement) {
      this._currentTimeElement.textContent = formatTrackDuration(currentTime);
    }

    // NEW: Lưu thời gian phát hiện tại mỗi 5 giây để tránh lưu quá nhiều
    if (Math.floor(currentTime) % 5 === 0) {
      this._saveState("lastPlaybackTime", currentTime);
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

  // CHANGED: Handle progress bar click - Thêm cập nhật tooltip và lưu thời gian
  _handleProgressClick(e) {
    const rect = this._progressBar.getBoundingClientRect();
    const percent = Math.max(
      0,
      Math.min(1, (e.clientX - rect.left) / rect.width)
    );
    this._audioElement.currentTime = percent * this._audioElement.duration;

    // Cập nhật UI ngay lập tức (không có transition)
    this._updateProgressUI(percent * 100);

    // NEW: Cập nhật tooltip với thời gian hiện tại
    if (this._progressTooltip) {
      const time = percent * this._audioElement.duration;
      this._progressTooltip.textContent = formatTrackDuration(time);
    }

    // NEW: Lưu thời gian mới sau khi tua
    this._saveState("lastPlaybackTime", this._audioElement.currentTime);
  }

  // Handle progress mousedown
  _handleProgressMouseDown(e) {
    this._isSeeking = true;
    this._handleProgressClick(e);
    // NEW: Hiển thị tooltip khi đang kéo
    if (this._progressTooltip) {
      this._progressTooltip.classList.add("show");
    }
  }

  // CHANGED: Handle progress mousemove - Cập nhật tooltip khi kéo
  _handleProgressMouseMove(e) {
    if (!this._isSeeking) return;
    this._handleProgressClick(e);
  }

  // CHANGED: Handle progress mouseup - Ẩn tooltip sau khi thả chuột
  _handleProgressMouseUp() {
    if (this._isSeeking) {
      this._isSeeking = false;
      // NEW: Ẩn tooltip sau khi kéo xong
      if (this._progressTooltip) {
        this._progressTooltip.classList.remove("show");
      }
    }
  }

  // NEW: Cập nhật vị trí và nội dung tooltip khi hover
  _updateProgressTooltipPosition(e) {
    if (!this._progressTooltip || !this._audioElement.duration) return;

    const rect = this._progressBar.getBoundingClientRect();
    const percent = Math.max(
      0,
      Math.min(1, (e.clientX - rect.left) / rect.width)
    );
    const time = percent * this._audioElement.duration;

    // Cập nhật nội dung tooltip
    this._progressTooltip.textContent = formatTrackDuration(time);

    // Cập nhật vị trí tooltip
    this._progressTooltip.style.left = `${percent * 100}%`;
  }

  // CHANGED: Update progress UI - Loại bỏ transition
  _updateProgressUI(progress) {
    if (this._progressFill) {
      this._progressFill.style.width = `${progress}%`;
    }
    if (this._progressHandle) {
      this._progressHandle.style.left = `${progress}%`;
    }
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

  // CHANGED: Handle volume click - Thêm cập nhật tooltip
  _handleVolumeClick(e) {
    const rect = this._volumeBar.getBoundingClientRect();
    const percent = Math.max(
      0,
      Math.min(1, (e.clientX - rect.left) / rect.width)
    );
    this._volume = percent;
    this._audioElement.volume = this._volume;
    this._isMuted = this._volume === 0;
    this._updateVolumeUI();

    // NEW: Cập nhật tooltip
    if (this._volumeTooltip) {
      this._volumeTooltip.textContent = `${Math.round(percent * 100)}%`;
    }
  }

  // Handle volume mousedown
  _handleVolumeMouseDown(e) {
    this._isVolumeChanging = true;
    this._handleVolumeClick(e);
    // NEW: Hiển thị tooltip khi đang kéo
    if (this._volumeTooltip) {
      this._volumeTooltip.classList.add("show");
    }
  }

  // CHANGED: Handle volume mousemove - Cập nhật tooltip khi kéo
  _handleVolumeMouseMove(e) {
    if (!this._isVolumeChanging) return;
    this._handleVolumeClick(e);
  }

  // CHANGED: Handle volume mouseup - Ẩn tooltip sau khi thả chuột
  _handleVolumeMouseUp() {
    if (this._isVolumeChanging) {
      this._isVolumeChanging = false;
      // NEW: Ẩn tooltip sau khi kéo xong
      if (this._volumeTooltip) {
        this._volumeTooltip.classList.remove("show");
      }
    }
  }

  // NEW: Cập nhật vị trí và nội dung tooltip khi hover
  _updateVolumeTooltipPosition(e) {
    if (!this._volumeTooltip) return;

    const rect = this._volumeBar.getBoundingClientRect();
    const percent = Math.max(
      0,
      Math.min(1, (e.clientX - rect.left) / rect.width)
    );

    // Cập nhật nội dung tooltip
    this._volumeTooltip.textContent = `${Math.round(percent * 100)}%`;

    // Cập nhật vị trí tooltip
    this._volumeTooltip.style.left = `${percent * 100}%`;
  }

  // CHANGED: Update volume UI - Loại bỏ transition
  _updateVolumeUI() {
    const volumePercent = this._volume * 100;

    if (this._volumeFill) {
      this._volumeFill.style.width = `${volumePercent}%`;
    }

    // Update handle position
    if (this._volumeHandle) {
      this._volumeHandle.style.left = `${volumePercent}%`;
    }

    // NEW: Cập nhật tooltip
    if (this._volumeTooltip) {
      this._volumeTooltip.textContent = `${Math.round(volumePercent)}%`;
      this._volumeTooltip.style.left = `${volumePercent}%`;
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

  // NEW: Load last track và phục hồi trạng thái phát từ localStorage
  _loadLastTrack() {
    const lastTrack = this._loadState("lastTrack");
    const lastPlaybackTime = this._loadState("lastPlaybackTime", 0);
    const wasPlaying = this._loadState("isPlaying", false);

    if (lastTrack) {
      this._currentTrack = lastTrack;

      // Set audio source
      if (lastTrack.audio_url) {
        this._audioElement.src = lastTrack.audio_url;

        // CHANGED: Sử dụng cả loadedmetadata và canplay để đảm bảo
        const restorePlayback = () => {
          // Khôi phục thời gian phát
          if (
            lastPlaybackTime &&
            lastPlaybackTime < this._audioElement.duration
          ) {
            this._audioElement.currentTime = lastPlaybackTime;
            console.log(`Restored playback time: ${lastPlaybackTime}s`);
          }

          // Tự động phát lại nếu trước đó đang phát
          if (wasPlaying) {
            // Đợi một chút để đảm bảo currentTime đã được set
            setTimeout(() => {
              this.play();
              console.log(
                `Auto-playing from ${this._audioElement.currentTime}s`
              );
            }, 100);
          }
        };

        // Lắng nghe cả 2 sự kiện để đảm bảo
        this._audioElement.addEventListener("loadedmetadata", restorePlayback, {
          once: true,
        });
      }

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

  // NEW: Public method để lấy trạng thái phát nhạc (dùng cho navigation)
  getPlaybackState() {
    return {
      track: this._currentTrack,
      isPlaying: this._isPlaying,
      currentTime: this._audioElement.currentTime,
      duration: this._audioElement.duration,
    };
  }

  // NEW: Public method để khôi phục trạng thái phát nhạc (dùng cho navigation)
  restorePlaybackState() {
    const wasPlaying = this._loadState("isPlaying", false);

    // CHANGED: Chỉ play nếu chưa đang phát và cần phát lại
    if (wasPlaying && this._currentTrack && !this._isPlaying) {
      console.log("Restoring playback state...");
      this.play();
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

// class MusicPlayer {
//   constructor() {
//     // DOM Elements - Player Controls
//     this._audioElement = document.querySelector("#audio-player");
//     this._playPauseBtn = document.querySelector(".player-center .player-btn");
//     this._playIcon = this._playPauseBtn?.querySelector("i");
//     this._nextBtn = document.querySelector(
//       ".player-center .control-btn:nth-child(4)"
//     );
//     this._prevBtn = document.querySelector(
//       ".player-center .control-btn:nth:child(2)"
//     );
//     this._shuffleBtn = document.querySelector(
//       ".player-center .control-btn:first-child"
//     );
//     this._repeatBtn = document.querySelector(
//       ".player-center .control-btn:last-child"
//     );

//     // DOM Element - Player Info
//     this._playerImage = document.querySelector(".player-image");
//     this._playerTitle = document.querySelector(".player-title");
//     this._playerArtist = document.querySelector(".player-artist");

//     // DOM Element - Progress
//     this._progressBar = document.querySelector(".progress-bar");
//     this._progressFill = document.querySelector(".progress-fill");
//     this._progressHandle = document.querySelector(".progress-handle");
//     this._progressTooltip = null;
//     this._currentTimeElement = document.querySelector(".time:first-of-type");
//     this._durationElement = document.querySelector("time:last-of-type");

//     // DOM Element - Volume
//     this._volumeBtn = document.querySelector(".volume-container .control-btn");
//     this._volumeBar = document.querySelector(".volume-bar");
//     this._volumeFill = document.querySelector(".volume-fill");
//     this._volumeHandle = document.querySelector(".volume-hanlde");
//     this._volumeTooltip = null;

//     // State Management
//     this._currentTrack = null;
//     this._playList = [];
//     this._currentIndex = 0;
//     this._isPlaying = false;
//     this._isSeeking = false;
//     this._isVolumeChanging = false;
//     this._volume = 0.7;
//     this._isMuted = false;
//     this._previousVolume = 0.7;

//     // Chế độ phát
//     this._isShuffleMode = this._loadState("isShuffleMode", false);
//     this._isRepeatMode = this._loadState("isRepeatMode", false);
//     this._playHistory = this._loadState("playHistory", []);
//   }

//   // Khởi tạo player
//   _initialize() {
//     if (!this._audioElement) {
//       // Tạo audio element
//       this._audioElement = document.createElement("audio");
//       this._audioElement.id = "audio-player";
//       this._audioElement.preload = "metadata";
//       document.body.appendChild(this._audioElement);
//     }

//     // Tạo tooltip cho progress bar, volume bar
//     this._createProgressTooltip();
//     this._createVolumeTooltip();

//     // Set Volume ban đầu
//     this._audioElement.volume = this._volume;
//     this._updateVolume();

//     // Cập nhật UI cho shuffle/repeat
//     this._updateShuffleUI();
//     this._updataRepeatUI();

//     // Đăng ký events
//     this._setupEventListeners();

//     // Load track cuối cùng từ localStorage
//     this._loadLastTrack();
//   }

//   // Tạo tooltip cho progress bar
//   _createProgressTooltip() {
//     if (this._progressBar && !this._progressTooltip) {
//       this._progressTooltip = document.createElement("div");
//       this._progressTooltip.className = "progress-tooltip";
//       this._progressTooltip.textContent = "0:00";
//       this._progressBar.appendChild(this._progressTooltip);
//     }
//   }

//   // Tạo tooltip cho volume bar
//   _createVolumeTooltip() {
//     if (this._volumeBar && !this._volumeTooltip) {
//       this._volumeTooltip = document.createElement("div");
//       this._volumeTooltip.className = "volume-tooltip";
//       this._volumeTooltip.textContent = "70%";
//       this._volumeBar.appendChild(this._volumeTooltip);
//     }
//   }

//   _setupEventListeners() {
//     // Play/Pause
//     this._playPauseBtn?.addEventListener("click", () =>
//       this._togglePlayPause()
//     );
//     this._audioElement?.addEventListener("play", () => this._handlePlay());
//     this._audioElement?.addEventListener("pause", () => this.handlePause());

//     // Next/Prev
//     this._nextBtn?.addEventListener("click", () => this._playNext());
//     this._prevBtn?.addEventListener("click", this._playPrevious());

//     // Shuffle/Repeat
//     this._shuffleBtn?.addEventListener("click", () => this._toggleShuffle());
//     this._repeatBtn?.addEventListener("click", () => this._toggleRepeat());

//     // Progress bar
//     this._progressBar.addEventListener("mousedown", (e) =>
//       this._handleProgressMouseDown(e)
//     );
//     this._progressBar?.addEventListener("click", (e) =>
//       this._handleProgressClick(e)
//     );

//     // Thêm sự kiện hover để hiển thị tooltip
//     this._progressBar?.addEventListener("mouseenter", () => {
//       if (this._progressTooltip) {
//         this._progressTooltip.classList.add("show");
//       }
//     });
//     this._progressBar?.addEventListener("mouseleave", () => {
//       if (this._progressTooltip && !this._isSeeking) {
//         this._progressTooltip.classList.remove("show");
//       }
//     });

//     // Cập nhật tooltip position khi di chuyển chuột
//     this._progressBar?.addEventListener("mousemove", (e) => (e) => {
//       this._updateProgressTooltipPosition(e);
//     });
//     document.addEventListener("mousemove", (e) => {
//       this._handleProgressMouseMove(e);
//     });
//     document.addEventListener("mouseup", () => this._handleProgressMouseUp());

//     // Volume
//     this._volumeBtn?.addEventListener("click", () => this._toggleMute());
//     this._volumeBar.addEventListener("click", (e) => this._handleVolumeCick(e));
//     this._volumeBar.addEventListener("mousedown", (e) =>
//       this._handleVolumeMouseDown(e)
//     );

//     // Thêm sự kiên hover để hiển thị tooltip
//     this._volumeBar?.addEventListener("mouseenter", () => {
//       if (this._volumeTooltip) {
//         this._volumeTooltip.classList.add("show");
//       }
//     });
//     this._volumeBar?.addEventListener("mouseleave", () => {
//       if (this._volumeTooltip && !this._isVolumeChanging) {
//         this._volumeTooltip.classList.remove("show");
//       }
//     });

//     // Cập nhật tooltip position khi di chuyển chuột
//     this._volumeBar?.addEventListener("mousemove", () =>
//       this._updateVolumeTooltipPosition(e)
//     );
//     document.addEventListener("mousemove", (e) =>
//       this._handleVolumeMouseMove(e)
//     );
//     document.addEventListener("mouseup", () => this._handleVolumeMouseUp());

//     // Time update
//     this._audioElement.addEventListener("timeupdate", () =>
//       this._handleTimeUpdate()
//     );
//     this._audioElement.addEventListener("loadedmetadata", () =>
//       this._handleMetadataLoaded()
//     );
//     this._audioElement.addEventListener("ended", () =>
//       this._handleTrackEnded()
//     );

//     // Lưu thời gian trước khi tắt/reload trang
//     window.addEventListener("beforeunload", () => {
//       if (this._currentTrack) {
//         this._saveState("lastPlaybackTime", this._audioElement.currentTime);
//         this._saveState("isPlaying", this._isPlaying);
//         // this._saveState("lastVolume", this._audioElement.currentVolume);
//       }
//     });

//     // Global track play events
//     this._setupGlobalTrackEvents();
//   }

//   // Lăng nghe sự kiện click và track trên trang
//   _setupGlobalTrackEvents() {
//     // Lăng nghe click vào các nút play trên hit cards
//     document.addEventListener("click", async (e) => {
//       const playBtn = e.target.closest(".hit-play-btn");
//       if (playBtn) {
//         e.preventDefault();
//         e.stopPropagation();

//         const trackId = playBtn.dataset.trackId;
//         if (trackId) {
//           await this._playTrackById(trackId);
//         }
//       }

//       // Lắng nghe click vào track items
//       const trackItem = e.target.closest(".track-item");
//       if (trackItem && !e.target.closest(".track-menu-btn")) {
//         const trackId = trackItem.dataset.trackId;
//         if (trackId) {
//           await this._playTrackById(trackId);
//         }
//       }
//     });
//   }

//   async _playTrackById(trackId) {
//     try {
//       await playTrack(trackId);

//       // Load track hoặc tìm track từ playList hiện tại
//       const track = this._findTrackById(trackId);
//       if (track) {
//         this.loadTrack(track);
//         this.play();
//       }
//     } catch (error) {
//       console.error("Error playing track", error);
//     }
//   }

//   // Tìm track trong playList
//   _findTrackById(trackId) {
//     return this._playList.find((track) => track.id === parseInt(trackId));
//   }

//   // Toggle Play/Pause
//   _togglePlayPause() {
//     if (this._audioElement.paused) {
//       this.play();
//     } else {
//       this.pause();
//     }
//   }

//   // Play
//   play() {
//     if (this._currentTrack && this._audioElement.src) {
//       this._audioElement.play().catch((error) => {
//         console.error("Error playing audio:", error);
//       });
//     }
//   }

//   // Pause
//   pause() {
//     this._audioElement.pause();
//   }

//   // Load track
//   loadTrack(track, autoPlay = false) {
//     if (!track && !track.audio_url) {
//       console.error("Invalid track data");
//       return;
//     }

//     this._currentTrack = track;
//     this._audioElement.src = track.audio_url;

//     // Updata UI
//     this._updatePlayerUI();

//     // Lưu track, thời gian và volume phát hiện tại
//     this._saveState("lastTrack", track);
//     this._saveState("lastPlaybackTime", 0); // Reset thời gian khi load track mới

//     if (autoPlay) {
//       this.play();
//     }
//   }

//   // Load Playlist
//   loadPlaylist(tracks, startIndex = 0) {
//     this._playList = tracks || [];
//     this._currentIndex = startIndex;

//     if (this._playList.length > 0) {
//       this.loadTrack(this._playList[this._currentIndex], false);
//     }
//   }

//   // Cập nhật playList mà không load track mới
//   updatePlayListOnly(tracks) {
//     this._playList = tracks || [];

//     // Tìm index của track hiện tại trong playList mới
//     if (this._currentTrack) {
//       const newIndex = this._playList.findIndex(
//         (track) => track.id === this._currentTrack.id
//       );

//       if (newIndex !== -1) {
//         this._currentIndex = newIndex;
//       }
//     }

//     console.log(
//       "Playlist updated, current track preserved:",
//       this._currentTrack?.title
//     );
//   }

//   _updatePlayerUI() {
//     if (!this._currentTrack) return;

//     // Update image
//     if (this._playerImage) {
//       this._playerImage.src =
//         this._currentTrack.image_url || "placeholder.svg?height=56&width=56";
//       this._playerImage.alt = this._currentTrack.title;
//     }

//     // Update title
//     if (this._playerTitle) {
//       this._playerTitle.textContent = this._currentTrack.title;
//     }

//     // Update Artist
//     if (this._playerArtist) {
//       this._playerArtist.textContent =
//         this._currentTrack.artits_name || "Unknown Artist";
//     }

//     // Highlight active track
//     this._highlightActiveTrack();
//   }

//   // Highlight active track in UI
//   _highlightActiveTrack() {
//     // Remove all playing classes
//     document.querySelectorAll(".track-item.playing").forEach((item) => {
//       item.classList.remove("playing");
//       const number = item.querySelector(".track-number");
//       if (number && number.querySelector(".playing-icon")) {
//         number.innerHTML =
//           Array.from(item.parentElement.children).indexOf(item) + 1;
//       }
//     });

//     document.querySelectorAll(".hit-card.playing").forEach((card) => {
//       card.classList.remove("playing");
//     });

//     // Add playing class to current track
//     if (this._currentTrack) {
//       const trackItem = document.querySelector(
//         `.track-item[data-track-id="${this._currentTrack.id}"]`
//       );
//       if (trackItem) {
//         trackItem.classList.add("playing");
//         const number = trackItem.querySelector(".track-number");
//         if (number) {
//           number.innerHTML = `<i class="fas fa-volume-up playing-icon"></i>`;
//         }
//       }

//       const hitCard = document.querySelector(
//         `.hit-card[data-track-id="${this._currentTrack.id}"]`
//       );
//       if (hitCard) {
//         hitCard.classList.add("playing");
//       }
//     }
//   }

//   // Handle play event
//   _handlePlay() {
//     this._isPlaying = true;
//     if (this._playIcon) {
//       this._playIcon.classList.remove("fa-play");
//       this._playIcon.classList.add("fa-pause");
//     }
//     // Lưu trạng thái đang phát
//     this._saveState("isPlaying", true);
//   }

//   // Handle pause event
//   _handlePause() {
//     this._isPlaying = false;
//     if (this._playIcon) {
//       this._playIcon.classList.remove("fa-pause");
//       this._playIcon.classList.add("fa-play");
//     }
//     // Lưu trạng thái tạm dừng
//     this._saveState("isPlaying", false);
//   }

//   // Play next track
//   _playNext() {
//     if (this._playList.length === 0) return;

//     if (this._isShuffleMode) {
//       this._playRandomTrack();
//     } else {
//       this._currentIndex = (this._currentIndex + 1) % this._playList.length;
//       this.loadTrack(this._playList[this._currentIndex], true);
//     }
//   }

//   // Play prev track
//   _playPrevious() {
//     if (this._playList.length === 0) return;

//     // Nếu đang phát > 3s, restart track hiện tại
//     if (this._audioElement.currentTime > 3) {
//       this._audioElement.currentTime = 0;
//       return;
//     }

//     // Ngược lại, phát track phía trước
//     this._currentIndex =
//       (this._currentIndex - 1 + this._playList.length) % this._playList.length;
//     this.loadTrack(this._playList[this._currentIndex], true);
//   }

//   // Toggle shuffle mode
//   _toggleShuffle() {
//     this._isShuffleMode = !this._isShuffleMode;
//     this._saveState("isShuffleMode", this._isShuffleMode);
//     this._updatePlayerUI();

//     if (!this._isShuffleMode) {
//       this._playHistory = [];
//       this._saveState("playHistory", this._playHistory);
//     }
//   }

//   _updateShuffleUI() {
//     if (this._shuffleBtn) {
//       this._shuffleBtn.classList.toggle("active", this._playHistory);
//     }
//   }

//   _toggleRepeat() {
//     this._isRepeatMode = !this._isRepeatMode;
//     this._saveState("isRepeatMode", this._isRepeatMode);
//     this._updateRepeatUI();
//   }

//   _updateRepeatUI() {
//     if (this._repeatBtn) {
//       this._repeatBtn.classList.toggle("active", this._isRepeatMode);
//     }
//   }

//   _playRandomTrack() {
//     if (this._playList.length === 0) return;

//     // Thêm track hiện tại vào history
//     if (
//       this._currentIndex !== null &&
//       !this._playHistory.includes(this._currentIndex)
//     ) {
//       this._playHistory.push(this._currentIndex);
//     }

//     // Reset lại history nếu đã phát hết
//     if (this._playHistory.length >= this._playList.length) {
//       this._playHistory = [];
//     }

//     // Lấy các index chưa phát
//     const availableIndexes = [];
//     for (let i = 0; i < this._playList.length; i++) {
//       if (!this._playHistory.includes(i)) {
//         availableIndexes.push(i);
//       }
//     }

//     // Random từ available indexes
//     const randomIdx = Math.floor(Math.random() * availableIndexes.length);
//     this._currentIndex = availableIndexes[randomIdx];

//     this._saveState("playHistory", this._playHistory);
//     this.loadTrack(this._playList[this._currentIndex], true);
//   }

//   // Handle track ended
//   _handleTrackEnded() {
//     if (this._isRepeatMode) {
//       this._audioElement.currentTime = 0;
//       this.play();
//     } else {
//       this._playNext();
//     }
//   }

//   // Handle time update
//   _handleTimeUpdate() {
//     if (this._isSeeking) return;

//     const { currentTime, duration } = this._audioElement;
//     if (!duration) return;

//     // Update progress bar
//     const progress = (currentTime / duration) * 100;
//     this._updateProgressUI(progress);

//     // Update time display
//     if (this._currentTimeElement) {
//       this._currentTimeElement.textContent = formatTrackDuration(currentTime);
//     }

//     // Lưu thời gian phát hiện tại mỗi 5 giây để tránh lưu quá nhiều
//     if (Math.floor(currentTime) % 5 === 0) {
//       this._saveState("lastPlaybackTime", currentTime);
//     }
//   }

//   // Handle metadata loaded
//   _handleMetadataLoaded() {
//     if (this._durationElement) {
//       this._durationElement.textContent = formatTrackDuration(
//         this._audioElement.duration
//       );
//     }
//   }

//   // Handle progress bar click
//   _handleProgressClick(e) {
//     const rect = this._progressBar.getBoundingClientRect();
//     const percent = Math.max(
//       0,
//       Math.min(1, (e.clientX - rect.left) / rect.width)
//     );
//     this._audioElement.currentTime = percent * this._audioElement.duration;

//     // Cập nhật UI ngay lập tức (không có transition)
//     this._updateProgressUI(percent * 100);

//     // Cập nhật tooltip với thời gian hiện tại
//     if (this._progressTooltip) {
//       const time = percent * this._audioElement.duration;
//       this._progressTooltip.textContent = formatTrackDuration(time);
//     }

//     // Lưu thời gian mới sau khi tua
//     this._saveState("lastPlaybackTime", this._audioElement.currentTime);
//   }

//   // Handle progress mousedown
//   _handleProgressMouseDown(e) {
//     this._isSeeking = true;
//     this._handleProgressClick(e);

//     // Hiển thị tooltip khi đang kéo
//     if (this._progressTooltip) {
//       this._progressTooltip.classList.add("show");
//     }
//   }
// }
