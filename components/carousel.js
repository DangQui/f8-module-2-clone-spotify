export function initCarousel(
  containerId,
  trackId,
  paginationId,
  totalItems, // Tổng số items từ data API
  visibleItems = 5 // Số items hiển thị (default = 5)
) {
  const container = document.getElementById(containerId);

  if (!container) return;

  // Lấy element track (div chứa items)
  const track = document.getElementById(trackId);

  if (!track) return;

  const prevBtn = container.querySelector(".prev-btn");
  const nextBtn = container.querySelector(".next-btn");

  // Lấy pagination ul từ DOM
  const pagination = document.getElementById(paginationId);

  if (!prevBtn || !nextBtn) return;

  let currentIndex = 0; // Khởi tạo index hiện tại = 0
  const maxIndex = Math.max(0, totalItems - visibleItems);
  const gapPx = 24; // Khoảng gap giữa items (px) - chỉnh nếu cần

  // Hàm tính step % cho mỗi lần slide (bao gồm gap)
  function getStep() {
    const containerWidth = container.offsetWidth;
    const gapPercent = (gapPx / containerWidth) * 100;
    return 100 / visibleItems + gapPercent;
  }

  // Hàm xử lý pagination
  function createDots() {
    pagination.innerHTML = "";
    for (let i = 0; i < maxIndex; i++) {
      const li = document.createElement("li");
      li.className = `pagination-item ${i === 0 ? "active" : ""}`;
      li.dataset.index = i;
      pagination.appendChild(li);
    }
  }

  createDots();

  // Hàm update carousel
  function updateCarousel(instant = false) {
    const step = getStep();
    const translateX = -currentIndex * step;
    track.style.transform = `translateX(${translateX}%)`;
    track.style.transition = instant ? "none" : "transform 0.3s ease";

    prevBtn.disabled = currentIndex === 0;
    nextBtn.disabled = currentIndex >= maxIndex;

    // Update dots
    document
      .querySelectorAll(`#${paginationId} .pagination-item`)
      .forEach((dot, i) => {
        dot.classList.toggle("active", i === currentIndex);
      });
  }

  nextBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    if (currentIndex < maxIndex && !nextBtn.disabled) {
      currentIndex++;
      updateCarousel();
    }
  });

  prevBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    if (currentIndex > 0 && !prevBtn.disabled) {
      currentIndex--;
      updateCarousel();
    }
  });

  pagination.addEventListener("click", (e) => {
    if (e.target.classList.contains("pagination-item")) {
      currentIndex = parseInt(e.target.dataset.index);
      updateCarousel();
    }
  });

  let isDragging = false;
  let startX = 0;
  let currentTranslate = 0;
  let prevTranslate = 0;
  let startTime = 0;

  // Cleanup function (gọi khi destroy carousel nếu cần)
  function cleanupEvents() {
    document.removeEventListener("mousemove", onMouseMove);
    document.removeEventListener("mouseup", onMouseUp);
    document.removeEventListener("touchmove", onTouchMove);
    document.removeEventListener("touchend", onTouchEnd);
  }

  // Bắt đầu drag
  function handleDragStart(e) {
    startTime = Date.now();
    isDragging = true;
    startX = e.type.includes("mouse") ? e.clientX : e.touches[0].clientX;
    const step = getStep();
    prevTranslate = -currentIndex * step; // Dùng step bao gồm gap
    track.style.transition = "none";
  }

  // Trong lúc kéo
  function handleDrag(e) {
    if (!isDragging) return;
    e.preventDefault();
    const currentX = e.type.includes("mouse")
      ? e.clientX
      : e.touches[0].clientX;
    const diff = currentX - startX;
    // Tăng threshold lên 10px để tránh ignore chạm nhẹ
    if (Math.abs(diff) < 10) return;
    currentTranslate = prevTranslate + (diff / container.offsetWidth) * 100;
    track.style.transform = `translateX(${currentTranslate}%)`;
  }

  // Kết thúc drag
  function handleDragEnd(e) {
    if (!isDragging) return;
    isDragging = false;
    const moveBy = currentTranslate - prevTranslate;
    const timeElapsed = Date.now() - startTime; // Fix: Thêm () cho Date.now()
    const threshold = 10;

    // Nếu kéo không đủ dài và thời gian ngắn → snap back
    if (Math.abs(moveBy) < threshold && timeElapsed < 200) {
      updateCarousel(true); // Snap back và sync (instant, không animation)
      return;
    }

    // Quyết định slide dựa trên hướng kéo
    if (Math.abs(moveBy) > threshold / 2) {
      if (moveBy > 0 && currentIndex > 0) {
        currentIndex--;
      } else if (moveBy < 0 && currentIndex < maxIndex) {
        currentIndex++;
      }
    }
    updateCarousel(); // Animate đến vị trí mới
  }

  // Định nghĩa handlers
  const onMouseMove = (e) => handleDrag(e);
  const onMouseUp = (e) => handleDragEnd(e);
  const onTouchMove = (e) => handleDrag(e);
  const onTouchEnd = (e) => handleDragEnd(e);

  // Attach events
  track.addEventListener("mousedown", handleDragStart, { passive: false });
  track.addEventListener("touchstart", handleDragStart, { passive: false });

  document.addEventListener("mousemove", onMouseMove, { passive: false });
  document.addEventListener("mouseup", onMouseUp);
  document.addEventListener("touchmove", onTouchMove, { passive: false }); // Fix: onTouchMove
  document.addEventListener("touchend", onTouchEnd);

  updateCarousel(true);

  // Return cleanup nếu cần destroy (ví dụ: return { destroy: cleanupEvents })
  return { destroy: cleanupEvents };
}
