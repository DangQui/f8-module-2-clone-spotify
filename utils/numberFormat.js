export function formatNumberManual(num) {
  if (typeof num !== "number" || num < 0) return "0";

  const numStr = num.toString();
  let result = "";
  let count = 0;

  for (let i = numStr.length - 1; i >= 0; i--) {
    result = numStr[i] + result;
    count++;

    if (count % 3 === 0 && i > 0) {
      result = "," + result;
    }
  }

  return result;
}

export function formatMonthlyListeners(num) {
  const formattedNum = formatNumberManual(num);
  return `${formattedNum} monthly listeners`;
}
