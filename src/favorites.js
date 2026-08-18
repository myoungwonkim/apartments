// 관심 단지 즐겨찾기 — 기기(localStorage)에만 저장, 서버 없음.
const KEY = 'pallin_favs';

export function getFavs() {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) || '[]');
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

const same = (a, b) => a.district === b.district && a.dong === b.dong && a.name === b.name;

export function isFav(fav) {
  return getFavs().some((f) => same(f, fav));
}

export function toggleFav(fav) {
  const favs = getFavs();
  const next = favs.some((f) => same(f, fav))
    ? favs.filter((f) => !same(f, fav))
    : [...favs, fav].slice(-30); // 최대 30개
  try { localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* 저장 불가 시 무시 */ }
  return next.some((f) => same(f, fav));
}
