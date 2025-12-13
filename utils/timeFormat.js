export function formatDuration(seconds) {
  if (typeof seconds !== "number" || seconds < 0) return "0:00";

  // Làm tròn số giây để loại bỏ mili giây
  const totalSeconds = Math.floor(seconds);

  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;

  const paddedSecs = secs.toString().padStart(2, "0");

  return `${mins}:${paddedSecs}`;
}

export function formatTrackDuration(seconds) {
  return formatDuration(seconds);
}
