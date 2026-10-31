export function madridToday(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Madrid",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export function pend(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return "Pendiente";
  return String(value);
}

function capital(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export function formatDay(iso: string, withWeekday = true): string {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return capital(new Intl.DateTimeFormat("es-ES", {
    timeZone: "UTC",
    weekday: withWeekday ? "long" : undefined,
    day: "numeric",
    month: "long",
  }).format(date));
}

export function formatMonth(iso: string): string {
  const [y, m] = iso.split("-").map(Number);
  return capital(new Intl.DateTimeFormat("es-ES", { timeZone: "UTC", month: "long", year: "numeric" }).format(new Date(Date.UTC(y, m - 1, 1))));
}

export function formatWhen(iso: string): string {
  return new Intl.DateTimeFormat("es-ES", {
    timeZone: "Europe/Madrid",
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function shortDay(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return new Intl.DateTimeFormat("es-ES", { timeZone: "UTC", day: "numeric", month: "short" }).format(new Date(Date.UTC(y, m - 1, d)));
}

export function shiftDay(iso: string, delta: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + delta)).toISOString().slice(0, 10);
}

export function addDay(iso: string): string {
  return shiftDay(iso, 1);
}

export function eachDay(desde: string, hasta: string): string[] {
  const days: string[] = [];
  for (let day = desde; day <= hasta; day = addDay(day)) days.push(day);
  return days;
}

export function mondayIndex(iso: string): number {
  const [y, m, d] = iso.split("-").map(Number);
  const sunday = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  return (sunday + 6) % 7;
}

export function weekStart(iso: string): string {
  return shiftDay(iso, -mondayIndex(iso));
}

export function km(value: number): string {
  return value.toLocaleString("es-ES", { maximumFractionDigits: 2 });
}

export function kg(value: number): string {
  return value.toLocaleString("es-ES", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
}

export function signedKg(value: number): string {
  const text = kg(Math.abs(value));
  if (value > 0) return `+${text} kg`;
  if (value < 0) return `−${text} kg`;
  return `${text} kg`;
}
