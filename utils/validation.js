function setupBlurValidation(
  input,
  fromGroup,
  errorSpan,
  message = " Cannot be left blank"
) {
  // Blur check rỗng và show lỗi
  input.addEventListener("blur", function () {
    if (!input.value.trim()) {
      fromGroup.classList.add("invalid");
      errorSpan.textContent = message;
    }
  });

  input.addEventListener("blur", function () {
    if (fromGroup.classList.contains("invalid") && input.value.trim()) {
      fromGroup.classList.remove("invalid");
      errorSpan.textContent = "";
    }
  });
}

export { setupBlurValidation };
