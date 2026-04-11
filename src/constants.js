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
  if (s >= 75) return { label: '우수', color: '#3ecf8e', bg: 'rgba(62,207,142,0.12)', cssVar: 'green' };
  if (s >= 50) return { label: '보통', color: '#f5a623', bg: 'rgba(245,166,35,0.12)', cssVar: 'amber' };
  return         { label: '보완', color: '#f05252', bg: 'rgba(240,82,82,0.12)', cssVar: 'red' };
}

export const IMPACT_STYLE = {
  '높음': { color: 'var(--red)',   bg: 'var(--red-dim)'   },
  '중간': { color: 'var(--amber)', bg: 'var(--amber-dim)' },
  '낮음': { color: 'var(--text2)', bg: 'var(--surface2)'  },
};

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

// Canvas로 이미지를 최대 1280px / 최대 1MB JPEG로 압축 후 base64 반환
export function compressImage(file) {
  return new Promise((resolve, reject) => {
    const img    = new Image();
    const objUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objUrl);

      const MAX_DIM = 1280;
      let { naturalWidth: w, naturalHeight: h } = img;

      if (w > MAX_DIM || h > MAX_DIM) {
        if (w >= h) { h = Math.round(h * MAX_DIM / w); w = MAX_DIM; }
        else        { w = Math.round(w * MAX_DIM / h); h = MAX_DIM; }
      }

      const canvas = document.createElement('canvas');
      canvas.width  = w;
      canvas.height = h;
      canvas.getContext('2d').drawImage(img, 0, 0, w, h);

      // 1MB 이하가 될 때까지 품질 낮춤 (base64 len * 0.75 ≈ 바이트)
      const MAX_BYTES = 1_048_576; // 1 MB
      let quality  = 0.8;
      let dataUrl  = canvas.toDataURL('image/jpeg', quality);

      while ((dataUrl.length - 23) * 0.75 > MAX_BYTES && quality > 0.3) {
        quality  = parseFloat((quality - 0.1).toFixed(1));
        dataUrl  = canvas.toDataURL('image/jpeg', quality);
      }

      resolve(dataUrl.split(',')[1]);
    };

    img.onerror = () => { URL.revokeObjectURL(objUrl); reject(new Error('이미지 로드 실패')); };
    img.src = objUrl;
  });
}
