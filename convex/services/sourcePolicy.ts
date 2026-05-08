export const DEVICE_SOURCES = new Set(["garmin", "peloton", "intervals", "api"]);

export function sourcePolicy(source: string) {
  const locked = DEVICE_SOURCES.has(source);
  return { locked, deletable: !locked };
}

export function now() {
  return Date.now();
}

export function normalizeTime(value?: string) {
  return value || new Date().toISOString().slice(11, 16);
}

export function normalizeDay(value?: string) {
  return value || new Date().toISOString().slice(0, 10);
}
