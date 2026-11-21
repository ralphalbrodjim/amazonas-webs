/** Closed-exercise scoring for the Cambridge House demo. Part 4 can score 0, 1 or 2. */

export function normalizeAnswer(value) {
  return String(value).trim().replace(/\s+/g, " ").replace(/[.,!?;:]/g, "").toLowerCase();
}

export function gradeClosed(item, raw) {
  const max = item.part === 4 ? 2 : 1;
  const answer = item.type === "choice" ? raw : normalizeAnswer(raw ?? "");
  if (answer === null || answer === undefined || answer === "") return { status: "empty", points: 0, max, review: false };
  if (item.part === 4 && item.type === "text") {
    const full = (item.answer || []).map(normalizeAnswer);
    const partial = (item.partial || []).map(normalizeAnswer);
    if (full.includes(answer)) return { status: "correct", points: 2, max, review: false };
    if (partial.includes(answer)) return { status: "partial", points: 1, max, review: false };
    if (item.keyword && answer.includes(normalizeAnswer(item.keyword))) return { status: "review", points: null, max, review: true };
    return { status: "incorrect", points: 0, max, review: false };
  }
  if (item.type === "choice") {
    const ok = answer === item.correct;
    return { status: ok ? "correct" : "incorrect", points: ok ? 1 : 0, max, review: false };
  }
  const ok = (item.answer || []).map(normalizeAnswer).includes(answer);
  return { status: ok ? "correct" : "incorrect", points: ok ? 1 : 0, max, review: false };
}

export function turnCap(minutes) {
  if (minutes <= 20) return 4;
  if (minutes <= 30) return 6;
  return 8;
}
