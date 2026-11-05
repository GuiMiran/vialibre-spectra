// @spectra BR-002 BR-006 BR-007 BR-009
export const level = delay => typeof delay !== 'number' || !Number.isFinite(delay) ? 'info' : delay >= 15 ? 'grave' : delay >= 5 ? 'leve' : 'ok';

export function arrival(time, delay) {
  if (!time) return '–';
  const [hours, minutes] = time.split(':').map(Number);
  const total = ((hours * 60 + minutes + delay) % 1440 + 1440) % 1440;
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

export function position(train, now, reducedMotion = false) {
  if (reducedMotion || (!train.vx && !train.vy)) return [train.x, train.y];
  const seconds = Math.min(60, Math.max(0, (now - train.ts) / 1000));
  return [train.x + train.vx * seconds, train.y + train.vy * seconds];
}

export function upperMedian(delays) {
  const sorted = delays.filter(delay => typeof delay === "number" && Number.isFinite(delay)).map(delay => Math.max(0, delay)).sort((a, b) => a - b);
  return sorted.length ? sorted[Math.floor(sorted.length / 2)] : 0;
}
