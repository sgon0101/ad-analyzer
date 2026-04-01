export const COLORS = {
  A: { color: '#4f8ef7', bg: 'rgba(79,142,247,0.12)',  text: '#93c5fd' },
  B: { color: '#60a5fa', bg: 'rgba(96,165,250,0.10)',  text: '#bfdbfe' },
  C: { color: '#a78bfa', bg: 'rgba(167,139,250,0.12)', text: '#c4b5fd' },
  D: { color: '#818cf8', bg: 'rgba(129,140,248,0.10)', text: '#c7d2fe' },
  E: { color: '#2dd4bf', bg: 'rgba(45,212,191,0.12)',  text: '#5eead4' },
  F: { color: '#34d399', bg: 'rgba(52,211,153,0.10)',  text: '#6ee7b7' },
  G: { color: '#9ca3af', bg: 'rgba(156,163,175,0.12)', text: '#d1d5db' },
};

export function getStatus(s) {
  if (s >= 75) return { label: '우수', color: '#3ecf8e', bg: 'rgba(62,207,142,0.12)' };
  if (s >= 50) return { label: '보통', color: '#f5a623', bg: 'rgba(245,166,35,0.12)' };
  return { label: '보완', color: '#f05252', bg: 'rgba(240,82,82,0.12)' };
}

export function hexToRgba(hex, a) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${a})`;
}

export function toBase64(file) {
  return new Promise((res, rej) => {
    const reader = new FileReader();
    reader.onload = () => res(reader.result.split(',')[1]);
    reader.onerror = rej;
    reader.readAsDataURL(file);
  });
}
