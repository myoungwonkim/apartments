// 목데이터 생성 모듈.
// 나중에 국토부 실거래가 API(RTMSDataSvcAptTradeDev)로 교체할 때
// 이 파일의 export 시그니처(listings, getPriceSeries, getRecentTrades)만 유지하면 됨.

export const DATA_SOURCE = {
  demo: '본 화면의 매물·시세·리뷰는 데모용 생성 데이터입니다.',
  real: '실서비스 연동 시 출처: 국토교통부 실거래가 공개시스템(rt.molit.go.kr) · 한국부동산원 R-ONE · 서울열린데이터광장',
};

function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const DISTRICTS = [
  // 서울
  { name: '강남구', region: '서울', short: '강남', lat: 37.4979, lng: 127.0628, ppp: 9800, subway: ['2호선', '수인분당선'], dong: ['역삼동', '대치동', '개포동'] },
  { name: '서초구', region: '서울', short: '서초', lat: 37.4837, lng: 127.0324, ppp: 9200, subway: ['2호선', '3호선'], dong: ['방배동', '서초동', '잠원동'] },
  { name: '송파구', region: '서울', short: '송파', lat: 37.5145, lng: 127.1050, ppp: 7300, subway: ['8호선', '9호선'], dong: ['문정동', '가락동', '방이동'] },
  { name: '용산구', region: '서울', short: '용산', lat: 37.5326, lng: 126.9905, ppp: 8100, subway: ['1호선', '경의중앙선'], dong: ['한남동', '이촌동', '후암동'] },
  { name: '마포구', region: '서울', short: '마포', lat: 37.5638, lng: 126.9084, ppp: 6100, subway: ['2호선', '공항철도'], dong: ['망원동', '연남동', '성산동'] },
  { name: '성동구', region: '서울', short: '성동', lat: 37.5633, lng: 127.0371, ppp: 6600, subway: ['2호선', '수인분당선'], dong: ['성수동', '금호동', '옥수동'] },
  { name: '노원구', region: '서울', short: '노원', lat: 37.6542, lng: 127.0568, ppp: 3900, subway: ['4호선', '7호선'], dong: ['상계동', '중계동', '월계동'] },
  { name: '강서구', region: '서울', short: '강서', lat: 37.5509, lng: 126.8495, ppp: 4400, subway: ['5호선', '9호선'], dong: ['마곡동', '화곡동', '등촌동'] },
  // 경기
  { name: '과천시', region: '경기', short: '과천', lat: 37.4292, lng: 126.9876, ppp: 7500, subway: ['4호선'], dong: ['별양동', '부림동', '중앙동'] },
  { name: '성남시 분당구', region: '경기', short: '분당', lat: 37.3825, lng: 127.1189, ppp: 5800, subway: ['신분당선', '수인분당선'], dong: ['정자동', '서현동', '판교동'] },
  { name: '하남시', region: '경기', short: '하남', lat: 37.5393, lng: 127.2148, ppp: 4200, subway: ['5호선'], dong: ['미사동', '덕풍동', '신장동'] },
  { name: '광명시', region: '경기', short: '광명', lat: 37.4786, lng: 126.8646, ppp: 4000, subway: ['7호선', '1호선'], dong: ['철산동', '하안동', '소하동'] },
  { name: '안양시 동안구', region: '경기', short: '평촌', lat: 37.3925, lng: 126.9512, ppp: 3800, subway: ['4호선'], dong: ['평촌동', '호계동', '관양동'] },
  { name: '용인시 수지구', region: '경기', short: '수지', lat: 37.3222, lng: 127.0978, ppp: 3600, subway: ['신분당선'], dong: ['죽전동', '동천동', '상현동'] },
  { name: '수원시 영통구', region: '경기', short: '영통', lat: 37.2596, lng: 127.0465, ppp: 3300, subway: ['신분당선', '수인분당선'], dong: ['영통동', '매탄동', '광교동'] },
  { name: '고양시 일산동구', region: '경기', short: '일산', lat: 37.6586, lng: 126.7944, ppp: 2900, subway: ['3호선', '경의중앙선'], dong: ['장항동', '마두동', '백석동'] },
];

export const REGIONS = ['서울', '경기'];
export const CATEGORIES = ['아파트', '빌라', '토지'];
export const DIRECTIONS_LIST = ['남향', '남동향', '남서향', '동향', '서향', '북향'];

const COMPLEX_PREFIX = ['래미안', '자이', '힐스테이트', '푸르지오', 'e편한세상', '아이파크', '롯데캐슬', '더샵'];
const COMPLEX_SUFFIX = ['퍼스트', '센트럴', '리버뷰', '파크', '포레', '에듀', '스카이', '그랑'];
const VILLA_NAMES = ['해든빌', '수정빌라', '그린힐', '한빛주택', '동원빌', '소망하이츠', '미소빌', '청록맨션'];
const DIRECTIONS = ['남향', '남동향', '남서향', '동향', '서향', '북향'];
const APT_AREAS = [49, 59, 84, 114];
const VILLA_AREAS = [29, 38, 45, 56];

const ISSUES = {
  아파트: ['재건축 예비안전진단 통과', '리모델링 추진위원회 구성', '역세권 복합개발 인접', 'GTX 개통 수혜 기대', '단지 외벽·조경 재정비 완료', '특이사항 없음'],
  빌라: ['신축급 전체 리모델링 완료', '모아타운 후보지 포함', '주차장 확장 공사 예정', '옥상 방수 공사 완료', '특이사항 없음'],
  토지: ['지구단위계획 수립 중', '전면 도로 확장 예정', '개발행위허가 이력 있음', '인접 필지 합필 가능', '특이사항 없음'],
};

const REVIEWS = [
  { text: '단지가 조용하고 관리가 잘 돼요. 경비실 대응도 빨라요.', rating: 5 },
  { text: '저녁엔 주차가 조금 빡빡하지만 전반적으로 살기 좋아요.', rating: 4 },
  { text: '초등학교가 가까워서 아이 키우기 좋습니다.', rating: 5 },
  { text: '연식이 있어서 배관 소음이 가끔 있어요.', rating: 3 },
  { text: '역까지 도보로 충분하고 상권이 가까워요.', rating: 4 },
  { text: '윗집 층간소음 빼면 만족하며 살고 있어요.', rating: 4 },
  { text: '겨울에 따뜻하고 관리비가 합리적이에요.', rating: 5 },
  { text: '엘리베이터 교체 후 훨씬 쾌적해졌어요.', rating: 4 },
  { text: '커뮤니티 시설이 잘 되어 있어 만족도가 높아요.', rating: 5 },
  { text: '골목 주차 전쟁이 있지만 집 자체는 좋습니다.', rating: 3 },
];

const LAND_TYPES = ['대지', '전', '답', '임야', '잡종지'];
const LAND_ZONES = ['제1종일반주거지역', '제2종일반주거지역', '제3종일반주거지역', '준주거지역', '일반상업지역', '자연녹지지역'];

const rand = mulberry32(20260810);
const pick = (arr) => arr[Math.floor(rand() * arr.length)];

function toPyeong(m2) { return m2 / 3.3058; }

function strSeed(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}
const round500 = (v) => Math.round(v / 500) * 500;

// 카테고리별 평당가 기준 (아파트 ppp 대비)
const pppOf = (d, category) =>
  category === '아파트' ? d.ppp : category === '빌라' ? Math.round(d.ppp * 0.42) : Math.round(d.ppp * 1.2);

function makeInfra(d) {
  const walk = 3 + Math.floor(rand() * 12);
  const out = [`${pick(d.subway)} 도보 ${walk}분`];
  const pool = ['초등학교 도보권', '대형마트 인접', '종합병원 10분', '근린공원 인접', '중·고교 학군', '스타벅스 상권', '도서관 인접'];
  const n = 2 + Math.floor(rand() * 3);
  const shuffled = [...pool].sort(() => rand() - 0.5);
  return out.concat(shuffled.slice(0, n));
}

function makeReviews() {
  const n = 2 + Math.floor(rand() * 2);
  const shuffled = [...REVIEWS].sort(() => rand() - 0.5);
  return shuffled.slice(0, n).map((r) => ({
    ...r,
    author: `입주민 ${pick(['김', '이', '박', '최', '정', '한'])}**`,
    date: `2026.0${1 + Math.floor(rand() * 7)}`,
  }));
}

export const listings = [];
let id = 1;

for (const d of DISTRICTS) {
  // ---- 아파트 10건 + 빌라 4건 ----
  for (const [category, count, areas, names] of [
    ['아파트', 10, APT_AREAS, null],
    ['빌라', 4, VILLA_AREAS, VILLA_NAMES],
  ]) {
    for (let i = 0; i < count; i++) {
      const areaM2 = pick(areas);
      const pyeong = Math.round(toPyeong(areaM2) * 10) / 10;
      const name = category === '아파트'
        ? `${d.short} ${pick(COMPLEX_PREFIX)}${pick(COMPLEX_SUFFIX)}`
        : `${d.short} ${pick(names)}`;
      const floor = category === '아파트' ? 2 + Math.floor(rand() * 23) : 1 + Math.floor(rand() * 4);
      const totalFloor = category === '아파트' ? floor + Math.floor(rand() * 10) + 2 : Math.max(floor, 3 + Math.floor(rand() * 2));
      const builtYear = 1998 + Math.floor(rand() * 27);
      const builtMonth = 1 + Math.floor(rand() * 12);
      const factor = 0.85 + rand() * 0.3;
      const estimate = round500(pppOf(d, category) * toPyeong(areaM2));
      const sale = round500(pppOf(d, category) * toPyeong(areaM2) * factor);
      const r = rand();
      const type = r < 0.5 ? '매매' : r < 0.8 ? '전세' : '월세';
      let price, monthly = null;
      if (type === '매매') price = sale;
      else if (type === '전세') price = round500(sale * (0.5 + rand() * 0.12));
      else { price = Math.round(sale * (0.05 + rand() * 0.1) / 1000) * 1000; monthly = Math.max(30, Math.round(sale * 0.0004 / 5) * 5); }
      listings.push({
        id: id++, category, district: d.name, region: d.region, complex: name, type,        areaM2, pyeong, floor, totalFloor, builtYear, builtMonth,
        direction: pick(DIRECTIONS),
        price, monthly, salePrice: sale, estimate,
        marketDiffPct: Math.round(((sale - estimate) / estimate) * 100),
        lat: d.lat + (rand() - 0.5) * 0.045,
        lng: d.lng + (rand() - 0.5) * 0.055,
        rooms: areaM2 >= 84 ? '방3 · 욕실2' : areaM2 >= 59 ? '방3 · 욕실1' : areaM2 >= 38 ? '방2 · 욕실1' : '방1 · 욕실1',
        issue: pick(ISSUES[category]),
        infra: makeInfra(d),
        reviews: makeReviews(),
        desc: pick(['역세권 도보 5분, 남향 판상형', '올수리 완료, 즉시 입주 가능', '초품아 단지, 커뮤니티 우수', '한강 조망 가능, 고층 선호층', '갭투자 문의 환영, 세안고 매물', '단지 내 조경 우수, 주차 여유']),
      });
    }
  }

  // ---- 토지 3건 ----
  for (let i = 0; i < 3; i++) {
    const pyeongSize = 40 + Math.floor(rand() * 210); // 40~250평
    const areaM2 = Math.round(pyeongSize * 3.3058);
    const factor = 0.8 + rand() * 0.4;
    const estimate = round500(pppOf(d, '토지') * pyeongSize);
    const sale = round500(pppOf(d, '토지') * pyeongSize * factor);
    listings.push({
      id: id++, category: '토지', district: d.name, region: d.region,
      complex: `${d.short} ${d.dong[i % d.dong.length]} 필지`,
      type: '매매',
      photoHue: Math.floor(rand() * 360),
      areaM2, pyeong: pyeongSize,
      direction: pick(DIRECTIONS),
      landType: pick(LAND_TYPES),
      landZone: pick(LAND_ZONES),
      price: sale, monthly: null, salePrice: sale, estimate,
      marketDiffPct: Math.round(((sale - estimate) / estimate) * 100),
      lat: d.lat + (rand() - 0.5) * 0.045,
      lng: d.lng + (rand() - 0.5) * 0.055,
      issue: pick(ISSUES['토지']),
      infra: makeInfra(d),
      reviews: [],
      desc: pick(['코너 필지, 접도 양호', '평지 정방형, 활용도 높음', '완만한 경사, 조망 우수', '이면도로 접함, 개발 잠재력']),
    });
  }
}

// 구별 36개월 평당가 시계열 (만원/평, 아파트 기준)
const seriesCache = new Map();
export function getPriceSeries(districtName) {
  if (seriesCache.has(districtName)) return seriesCache.get(districtName);
  const d = DISTRICTS.find((x) => x.name === districtName);
  const r = mulberry32(strSeed(districtName) * 7919);
  const out = [];
  let v = d.ppp * 0.86;
  for (let i = 35; i >= 0; i--) {
    const date = new Date(2026, 7 - i, 1); // 기준: 2026-08
    v *= 1 + (0.004 + (r() - 0.45) * 0.02);
    out.push({
      ym: `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}`,
      ppp: v,
    });
  }
  // 마지막 달이 현재 평당가(d.ppp)와 일치하도록 시계열 전체를 비례 보정
  const scale = d.ppp / out[out.length - 1].ppp;
  for (const p of out) p.ppp = Math.round(p.ppp * scale);
  seriesCache.set(districtName, out);
  return out;
}

// 구별 최근 실거래 내역
const tradesCache = new Map();
export function getRecentTrades(districtName) {
  if (tradesCache.has(districtName)) return tradesCache.get(districtName);
  const d = DISTRICTS.find((x) => x.name === districtName);
  const r = mulberry32(strSeed(districtName) * 104729);
  const out = [];
  for (let i = 0; i < 12; i++) {
    const areaM2 = APT_AREAS[Math.floor(r() * APT_AREAS.length)];
    const daysAgo = Math.floor(r() * 90);
    const date = new Date(2026, 7, 10 - daysAgo);
    out.push({
      date: `${date.getMonth() + 1}.${date.getDate()}`,
      complex: `${d.short} ${COMPLEX_PREFIX[Math.floor(r() * COMPLEX_PREFIX.length)]}${COMPLEX_SUFFIX[Math.floor(r() * COMPLEX_SUFFIX.length)]}`,
      areaM2,
      floor: 2 + Math.floor(r() * 20),
      price: round500(d.ppp * toPyeong(areaM2) * (0.85 + r() * 0.3)),
    });
  }
  out.sort((a, b) => b.date.localeCompare(a.date, undefined, { numeric: true }));
  tradesCache.set(districtName, out);
  return out;
}

// ---- 현재 판매 상황 (구별) ----
// 매매 매물 수, 급매 비중(시세 대비 -5% 이하), 3개월/12개월 시세 모멘텀
const conditionCache = new Map();
export function getMarketCondition(districtName) {
  if (conditionCache.has(districtName)) return conditionCache.get(districtName);
  const sales = listings.filter((l) => l.district === districtName && l.type === '매매');
  const bargains = sales.filter((l) => l.marketDiffPct <= -5);
  const s = getPriceSeries(districtName);
  const cur = s[s.length - 1].ppp;
  const mom3 = +(((cur - s[s.length - 4].ppp) / s[s.length - 4].ppp) * 100).toFixed(1);
  const yoy = +(((cur - s[s.length - 13].ppp) / s[s.length - 13].ppp) * 100).toFixed(1);
  const out = {
    saleCount: sales.length,
    bargainShare: sales.length ? Math.round((bargains.length / sales.length) * 100) : 0,
    mom3, yoy,
  };
  conditionCache.set(districtName, out);
  return out;
}

// ---- 향후 가치 전망 (규칙 기반) ----
// 판매 상황(모멘텀·급매 비중) + 물건 요인(이슈·연식·역세권·가격 메리트)을 점수화.
// 참고 지표이며 투자 권유가 아님 — UI에서 반드시 고지와 함께 노출할 것.
const POSITIVE_ISSUE = /재건축|리모델링|개발|GTX|모아타운|도로 확장|지구단위|합필/;

export function getOutlook(l) {
  const mc = getMarketCondition(l.district);
  const factors = [];
  let score = 0;

  // 1) 구 시세 모멘텀
  if (mc.mom3 >= 2.5) { score += 2; factors.push({ dir: '+', text: `최근 3개월 ${l.district} 시세 +${mc.mom3}% — 강한 상승세` }); }
  else if (mc.mom3 >= 1) { score += 1; factors.push({ dir: '+', text: `최근 3개월 ${l.district} 시세 +${mc.mom3}%` }); }
  else if (mc.mom3 <= -2.5) { score -= 2; factors.push({ dir: '-', text: `최근 3개월 ${l.district} 시세 ${mc.mom3}% — 뚜렷한 하락세` }); }
  else if (mc.mom3 <= -1) { score -= 1; factors.push({ dir: '-', text: `최근 3개월 ${l.district} 시세 ${mc.mom3}%` }); }
  else factors.push({ dir: '0', text: `최근 3개월 시세 보합 (${mc.mom3 >= 0 ? '+' : ''}${mc.mom3}%)` });
  if (mc.yoy >= 5) { score += 1; factors.push({ dir: '+', text: `전년 대비 +${mc.yoy}%` }); }
  else if (mc.yoy <= -5) { score -= 1; factors.push({ dir: '-', text: `전년 대비 ${mc.yoy}%` }); }

  // 2) 현재 판매 상황 (급매 비중)
  if (mc.bargainShare >= 40) { score -= 1; factors.push({ dir: '-', text: `급매 비중 ${mc.bargainShare}% — 매수자 우위 시장` }); }
  else if (mc.bargainShare <= 15) { score += 1; factors.push({ dir: '+', text: `급매 비중 ${mc.bargainShare}% — 매물 소화 원활` }); }
  else factors.push({ dir: '0', text: `급매 비중 ${mc.bargainShare}% — 수급 균형` });

  // 3) 물건 요인
  if (POSITIVE_ISSUE.test(l.issue)) { score += 2; factors.push({ dir: '+', text: `개발 호재: ${l.issue}` }); }
  if (l.category !== '토지' && l.builtYear <= 1996) { score += 1; factors.push({ dir: '+', text: `준공 ${2026 - l.builtYear}년차 — 재건축 연한 도래` }); }
  const walk = Number((l.infra[0].match(/도보 (\d+)분/) || [])[1]);
  if (walk && walk <= 7) { score += 1; factors.push({ dir: '+', text: `${l.infra[0]} — 초역세권` }); }
  if (l.type === '매매' && l.marketDiffPct <= -5) { score += 1; factors.push({ dir: '+', text: `시세 대비 ${l.marketDiffPct}% — 가격 메리트` }); }
  else if (l.type === '매매' && l.marketDiffPct >= 8) { score -= 1; factors.push({ dir: '-', text: `시세 대비 +${l.marketDiffPct}% — 고평가 부담` }); }

  const grade =
    score >= 5 ? { label: '상승 여력 높음', cls: 'up2' } :
    score >= 3 ? { label: '완만한 상승 기대', cls: 'up1' } :
    score >= 0 ? { label: '보합 전망', cls: 'flat' } :
    { label: '하방 압력 주의', cls: 'down' };

  return { score, grade, factors, condition: mc };
}

// 만원 → "12억 5,000" 표기
export function fmtPrice(manwon) {
  if (manwon == null) return '-';
  const eok = Math.floor(manwon / 10000);
  const rest = manwon % 10000;
  if (eok > 0 && rest > 0) return `${eok}억 ${rest.toLocaleString()}`;
  if (eok > 0) return `${eok}억`;
  return `${rest.toLocaleString()}만`;
}

export function priceLabel(l) {
  if (l.type === '월세') return `${fmtPrice(l.price)}/${l.monthly}`;
  return fmtPrice(l.price);
}
