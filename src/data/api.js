// 국토부 실거래가 API 연동 (Cloudflare Worker 프록시 경유).
// 프록시가 응답하지 않으면 호출부에서 목데이터로 폴백하고 "데모"임을 표시한다.

export const PROXY_URL = 'https://jiphannun-proxy.nolsoop-games.workers.dev';

// 실거래 조회 대상 전체 지역 (서울 25개 구 + 경기 전체 시군구, 가나다순)
// lawdCd = 법정동 시군구 코드 앞 5자리. 화성시는 2020년대 구 신설로 4개 코드로 분리됨(실측 확인).
export const REGION_DISTRICTS = [
  // 서울
  { name: '강남구', short: '강남', region: '서울', lawdCd: '11680' },
  { name: '강동구', short: '강동', region: '서울', lawdCd: '11740' },
  { name: '강북구', short: '강북', region: '서울', lawdCd: '11305' },
  { name: '강서구', short: '강서', region: '서울', lawdCd: '11500' },
  { name: '관악구', short: '관악', region: '서울', lawdCd: '11620' },
  { name: '광진구', short: '광진', region: '서울', lawdCd: '11215' },
  { name: '구로구', short: '구로', region: '서울', lawdCd: '11530' },
  { name: '금천구', short: '금천', region: '서울', lawdCd: '11545' },
  { name: '노원구', short: '노원', region: '서울', lawdCd: '11350' },
  { name: '도봉구', short: '도봉', region: '서울', lawdCd: '11320' },
  { name: '동대문구', short: '동대문', region: '서울', lawdCd: '11230' },
  { name: '동작구', short: '동작', region: '서울', lawdCd: '11590' },
  { name: '마포구', short: '마포', region: '서울', lawdCd: '11440' },
  { name: '서대문구', short: '서대문', region: '서울', lawdCd: '11410' },
  { name: '서초구', short: '서초', region: '서울', lawdCd: '11650' },
  { name: '성동구', short: '성동', region: '서울', lawdCd: '11200' },
  { name: '성북구', short: '성북', region: '서울', lawdCd: '11290' },
  { name: '송파구', short: '송파', region: '서울', lawdCd: '11710' },
  { name: '양천구', short: '양천', region: '서울', lawdCd: '11470' },
  { name: '영등포구', short: '영등포', region: '서울', lawdCd: '11560' },
  { name: '용산구', short: '용산', region: '서울', lawdCd: '11170' },
  { name: '은평구', short: '은평', region: '서울', lawdCd: '11380' },
  { name: '종로구', short: '종로', region: '서울', lawdCd: '11110' },
  { name: '중구', short: '중구', region: '서울', lawdCd: '11140' },
  { name: '중랑구', short: '중랑', region: '서울', lawdCd: '11260' },
  // 경기
  { name: '가평군', short: '가평', region: '경기', lawdCd: '41820' },
  { name: '고양시 덕양구', short: '덕양', region: '경기', lawdCd: '41281' },
  { name: '고양시 일산동구', short: '일산동', region: '경기', lawdCd: '41285' },
  { name: '고양시 일산서구', short: '일산서', region: '경기', lawdCd: '41287' },
  { name: '과천시', short: '과천', region: '경기', lawdCd: '41290' },
  { name: '광명시', short: '광명', region: '경기', lawdCd: '41210' },
  { name: '광주시', short: '광주', region: '경기', lawdCd: '41610' },
  { name: '구리시', short: '구리', region: '경기', lawdCd: '41310' },
  { name: '군포시', short: '군포', region: '경기', lawdCd: '41410' },
  { name: '김포시', short: '김포', region: '경기', lawdCd: '41570' },
  { name: '남양주시', short: '남양주', region: '경기', lawdCd: '41360' },
  { name: '동두천시', short: '동두천', region: '경기', lawdCd: '41250' },
  { name: '부천시 소사구', short: '소사', region: '경기', lawdCd: '41194' },
  { name: '부천시 오정구', short: '오정', region: '경기', lawdCd: '41196' },
  { name: '부천시 원미구', short: '원미', region: '경기', lawdCd: '41192' },
  { name: '성남시 분당구', short: '분당', region: '경기', lawdCd: '41135' },
  { name: '성남시 수정구', short: '수정', region: '경기', lawdCd: '41131' },
  { name: '성남시 중원구', short: '중원', region: '경기', lawdCd: '41133' },
  { name: '수원시 권선구', short: '권선', region: '경기', lawdCd: '41113' },
  { name: '수원시 영통구', short: '영통', region: '경기', lawdCd: '41117' },
  { name: '수원시 장안구', short: '장안', region: '경기', lawdCd: '41111' },
  { name: '수원시 팔달구', short: '팔달', region: '경기', lawdCd: '41115' },
  { name: '시흥시', short: '시흥', region: '경기', lawdCd: '41390' },
  { name: '안산시 단원구', short: '단원', region: '경기', lawdCd: '41273' },
  { name: '안산시 상록구', short: '상록', region: '경기', lawdCd: '41271' },
  { name: '안성시', short: '안성', region: '경기', lawdCd: '41550' },
  { name: '안양시 동안구', short: '동안', region: '경기', lawdCd: '41173' },
  { name: '안양시 만안구', short: '만안', region: '경기', lawdCd: '41171' },
  { name: '양주시', short: '양주', region: '경기', lawdCd: '41630' },
  { name: '양평군', short: '양평', region: '경기', lawdCd: '41830' },
  { name: '여주시', short: '여주', region: '경기', lawdCd: '41670' },
  { name: '연천군', short: '연천', region: '경기', lawdCd: '41800' },
  { name: '오산시', short: '오산', region: '경기', lawdCd: '41370' },
  { name: '용인시 기흥구', short: '기흥', region: '경기', lawdCd: '41463' },
  { name: '용인시 수지구', short: '수지', region: '경기', lawdCd: '41465' },
  { name: '용인시 처인구', short: '처인', region: '경기', lawdCd: '41461' },
  { name: '의왕시', short: '의왕', region: '경기', lawdCd: '41430' },
  { name: '의정부시', short: '의정부', region: '경기', lawdCd: '41150' },
  { name: '이천시', short: '이천', region: '경기', lawdCd: '41500' },
  { name: '파주시', short: '파주', region: '경기', lawdCd: '41480' },
  { name: '평택시', short: '평택', region: '경기', lawdCd: '41220' },
  { name: '포천시', short: '포천', region: '경기', lawdCd: '41650' },
  { name: '하남시', short: '하남', region: '경기', lawdCd: '41450' },
  { name: '화성시(남양·송산)', short: '화성서부', region: '경기', lawdCd: '41591' },
  { name: '화성시(동탄)', short: '동탄', region: '경기', lawdCd: '41597' },
  { name: '화성시(병점)', short: '병점', region: '경기', lawdCd: '41595' },
  { name: '화성시(봉담)', short: '봉담', region: '경기', lawdCd: '41593' },
];

export const LAWD_CD = Object.fromEntries(REGION_DISTRICTS.map((d) => [d.name, d.lawdCd]));

// XML 항목에서 태그 텍스트 추출 (신규 영문 태그 / 구 한글 태그 모두 지원)
function tagText(item, ...names) {
  for (const n of names) {
    const el = item.getElementsByTagName(n)[0];
    if (el && el.textContent.trim()) return el.textContent.trim();
  }
  return '';
}

// 한 달치 아파트 매매 실거래 조회 → [{date, complex, areaM2, floor, price(만원)}]
export async function fetchAptTrades(districtName, dealYmd) {
  const lawdCd = LAWD_CD[districtName];
  if (!lawdCd) throw new Error(`법정동 코드 없음: ${districtName}`);

  const res = await fetch(`${PROXY_URL}/apt-trade?lawdCd=${lawdCd}&dealYmd=${dealYmd}`, {
    signal: AbortSignal.timeout(30000),
    cache: 'no-store', // 프록시 장애 시의 에러 응답이 브라우저에 캐시되는 것 방지
  });
  if (!res.ok) throw new Error(`프록시 응답 오류 (HTTP ${res.status})`);
  const xml = new DOMParser().parseFromString(await res.text(), 'application/xml');

  const resultCode = xml.getElementsByTagName('resultCode')[0]?.textContent.trim();
  if (resultCode && resultCode !== '00' && resultCode !== '000') {
    const msg = xml.getElementsByTagName('resultMsg')[0]?.textContent.trim();
    throw new Error(`국토부 API 오류: ${msg || resultCode}`);
  }

  return [...xml.getElementsByTagName('item')].map((item) => {
    if (tagText(item, 'cdealType') === 'O') return null; // 해제된 거래 제외
    const y = tagText(item, 'dealYear', '년');
    const m = tagText(item, 'dealMonth', '월');
    const d = tagText(item, 'dealDay', '일');
    return {
      date: `${Number(m)}.${Number(d)}`,
      ym: `${y}.${String(m).padStart(2, '0')}`,
      complex: tagText(item, 'aptNm', '아파트'),
      dong: tagText(item, 'umdNm', '법정동'),
      areaM2: Math.round(Number(tagText(item, 'excluUseAr', '전용면적')) * 10) / 10,
      floor: Number(tagText(item, 'floor', '층')) || 0,
      builtYear: Number(tagText(item, 'buildYear', '건축년도')) || null,
      price: Number(tagText(item, 'dealAmount', '거래금액').replace(/,/g, '')) || 0,
      sortKey: `${y}${String(m).padStart(2, '0')}${String(d).padStart(2, '0')}`,
    };
  }).filter((t) => t && t.price > 0);
}

// 최근 N개월의 YYYYMM 목록 (과거 → 현재 순)
function monthKeys(months, baseDate = new Date()) {
  const out = [];
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(baseDate.getFullYear(), baseDate.getMonth() - i, 1);
    out.push(`${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}`);
  }
  return out;
}

// 최근 N개월 실거래 병합 조회 (최신순)
export async function fetchRecentAptTrades(districtName, months = 3) {
  const results = await Promise.all(
    monthKeys(months).map((ymd) => fetchAptTrades(districtName, ymd))
  );
  return results.flat().sort((a, b) => b.sortKey.localeCompare(a.sortKey));
}

// 한 달치 아파트 전월세 실거래 조회. monthlyRent가 0이면 전세, 있으면 월세.
export async function fetchAptRents(districtName, dealYmd) {
  const lawdCd = LAWD_CD[districtName];
  if (!lawdCd) throw new Error(`법정동 코드 없음: ${districtName}`);

  const res = await fetch(`${PROXY_URL}/apt-rent?lawdCd=${lawdCd}&dealYmd=${dealYmd}`, {
    signal: AbortSignal.timeout(30000),
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`프록시 응답 오류 (HTTP ${res.status})`);
  const xml = new DOMParser().parseFromString(await res.text(), 'application/xml');

  return [...xml.getElementsByTagName('item')].map((item) => {
    const y = tagText(item, 'dealYear', '년');
    const m = tagText(item, 'dealMonth', '월');
    const d = tagText(item, 'dealDay', '일');
    const deposit = Number((tagText(item, 'deposit', '보증금액') || '0').replace(/,/g, ''));
    const monthly = Number((tagText(item, 'monthlyRent', '월세금액') || '0').replace(/,/g, ''));
    return {
      date: `${String(m).padStart(2, '0')}.${String(d).padStart(2, '0')}`,
      complex: tagText(item, 'aptNm', '아파트'),
      dong: tagText(item, 'umdNm', '법정동'),
      areaM2: Math.round(Number(tagText(item, 'excluUseAr', '전용면적')) * 10) / 10,
      floor: Number(tagText(item, 'floor', '층')) || 0,
      builtYear: Number(tagText(item, 'buildYear', '건축년도')) || null,
      deposit, monthly,
      type: monthly > 0 ? '월세' : '전세',
      sortKey: `${y}${String(m).padStart(2, '0')}${String(d).padStart(2, '0')}`,
    };
  }).filter((r) => r.deposit > 0);
}

// 최근 N개월 전월세 병합 조회 (최신순)
export async function fetchRecentAptRents(districtName, months = 2) {
  const results = await Promise.all(
    monthKeys(months).map((ymd) => fetchAptRents(districtName, ymd))
  );
  return results.flat().sort((a, b) => b.sortKey.localeCompare(a.sortKey));
}

// 단지별 거래 이력 (매매+전월세, 최근 N개월).
// 단지명은 신고서마다 공백·하이픈 표기가 달라질 수 있어 제거 후 비교한다.
const normName = (s) => (s || '').replace(/[\s\-]/g, '');

export async function fetchComplexHistory(districtName, dong, complexName, months = 12) {
  const yms = monthKeys(months);
  const [tradeResults, rentResults] = await Promise.all([
    Promise.allSettled(yms.map((ym) => fetchAptTrades(districtName, ym))),
    Promise.allSettled(yms.map((ym) => fetchAptRents(districtName, ym))),
  ]);
  const target = normName(complexName);
  const inComplex = (x) => x.dong === dong && normName(x.complex) === target;
  const pickOk = (rs) => rs.filter((r) => r.status === 'fulfilled').flatMap((r) => r.value);
  const sales = pickOk(tradeResults).filter(inComplex)
    .sort((a, b) => b.sortKey.localeCompare(a.sortKey));
  const rents = pickOk(rentResults).filter(inComplex)
    .sort((a, b) => b.sortKey.localeCompare(a.sortKey));
  return { sales, rents };
}

// 최근 N개월 매매 전체 (조회 실패한 달은 건너뜀)
export async function fetchTradesMonths(districtName, months = 14) {
  const results = await Promise.allSettled(
    monthKeys(months).map((ym) => fetchAptTrades(districtName, ym))
  );
  return results.filter((r) => r.status === 'fulfilled').flatMap((r) => r.value);
}

// 매매 목록 → 월별 평균 평당가 시계열 (fetchPppSeries와 동일한 출력 형태)
export function seriesFromTrades(trades) {
  const now = new Date();
  const nowYm = `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, '0')}`;
  const byYm = {};
  for (const t of trades) {
    (byYm[t.ym] ||= []).push(t.price / (t.areaM2 / 3.3058));
  }
  const series = Object.entries(byYm)
    .map(([ym, pps]) => ({
      ym,
      ppp: Math.round(pps.reduce((a, b) => a + b, 0) / pps.length),
      n: pps.length,
      partial: ym === nowYm,
    }))
    .sort((a, b) => a.ym.localeCompare(b.ym));
  return series.length >= 4 ? series : null;
}

// 신고가 판정: 같은 단지·같은 면적대(전용 m² 반올림)에서
// 조회 기간 내 이전 모든 거래보다 높은 가격에 계약된 건
export function findRecords(trades) {
  const asc = [...trades].sort((a, b) => a.sortKey.localeCompare(b.sortKey));
  const maxSoFar = {};
  const records = [];
  for (const t of asc) {
    const key = `${t.dong}|${t.complex}|${Math.round(t.areaM2)}`;
    const prev = maxSoFar[key];
    if (prev && t.price > prev.price) {
      records.push({
        ...t,
        prevHigh: prev.price,
        gainPct: ((t.price - prev.price) / prev.price) * 100,
      });
    }
    if (!prev || t.price > prev.price) maxSoFar[key] = { price: t.price };
  }
  return records.sort((a, b) => b.sortKey.localeCompare(a.sortKey));
}

// 하락 거래 비중: 기준월(windowYm, 'YYYY.MM') 거래 중
// 같은 단지·같은 면적대의 직전 거래보다 낮은 가격에 계약된 비율.
// 표본(직전 거래가 있는 계약)이 5건 미만이면 null — 신뢰할 수 없는 비율은 표시하지 않는다.
export function declineShareFromTrades(trades, windowYm) {
  if (!windowYm) return null;
  const asc = [...trades].sort((a, b) => a.sortKey.localeCompare(b.sortKey));
  const last = {};
  let down = 0, total = 0;
  for (const t of asc) {
    const key = `${t.dong}|${t.complex}|${Math.round(t.areaM2)}`;
    const prev = last[key];
    if (t.ym === windowYm && prev != null) {
      total++;
      if (t.price < prev) down++;
    }
    last[key] = t.price;
  }
  return total >= 5 ? { share: Math.round((down / total) * 100), n: total } : null;
}

// 실거래 기반 향후 가치 전망 (구 단위, 규칙 기반).
// 전부 실거래 신고 데이터에서 계산: 시세 모멘텀(3개월·전년), 거래량 변화, 하락 거래 비중.
// 매물·호가·급매 정보는 공공데이터에 없으므로 반영하지 않는다 (UI에 고지할 것).
export function outlookFromSeries(series, decline = null) {
  const fulls = series.filter((d) => !d.partial);
  if (fulls.length < 5) return null;
  const cur = fulls[fulls.length - 1];
  const m3 = fulls[fulls.length - 4];
  const yoyYm = `${Number(cur.ym.slice(0, 4)) - 1}.${cur.ym.slice(5)}`;
  const yoyBase = series.find((d) => d.ym === yoyYm);
  const mom3 = m3 ? ((cur.ppp - m3.ppp) / m3.ppp) * 100 : null;
  const yoy = yoyBase ? ((cur.ppp - yoyBase.ppp) / yoyBase.ppp) * 100 : null;
  const prevN = fulls.slice(-4, -1).reduce((a, d) => a + d.n, 0) / 3;
  const volChg = prevN ? ((cur.n - prevN) / prevN) * 100 : null;

  const factors = [];
  let score = 0;
  if (mom3 != null) {
    if (mom3 >= 2.5) { score += 2; factors.push({ dir: '+', text: `최근 3개월 평당가 +${mom3.toFixed(1)}% — 강한 상승세` }); }
    else if (mom3 >= 1) { score += 1; factors.push({ dir: '+', text: `최근 3개월 평당가 +${mom3.toFixed(1)}%` }); }
    else if (mom3 <= -2.5) { score -= 2; factors.push({ dir: '-', text: `최근 3개월 평당가 ${mom3.toFixed(1)}% — 뚜렷한 하락세` }); }
    else if (mom3 <= -1) { score -= 1; factors.push({ dir: '-', text: `최근 3개월 평당가 ${mom3.toFixed(1)}%` }); }
    else factors.push({ dir: '0', text: `최근 3개월 평당가 보합 (${mom3 >= 0 ? '+' : ''}${mom3.toFixed(1)}%)` });
  }
  if (yoy != null) {
    if (yoy >= 5) { score += 1; factors.push({ dir: '+', text: `전년 동월 대비 +${yoy.toFixed(1)}%` }); }
    else if (yoy <= -5) { score -= 1; factors.push({ dir: '-', text: `전년 동월 대비 ${yoy.toFixed(1)}%` }); }
  }
  if (volChg != null) {
    if (volChg >= 25) { score += 1; factors.push({ dir: '+', text: `거래량 ${cur.n}건, 직전 3개월 평균 대비 +${Math.round(volChg)}% — 수요 유입` }); }
    else if (volChg <= -25) { score -= 1; factors.push({ dir: '-', text: `거래량 ${cur.n}건, 직전 3개월 평균 대비 ${Math.round(volChg)}% — 관망세` }); }
    else factors.push({ dir: '0', text: `거래량 ${cur.n}건 — 직전 3개월과 비슷한 수준` });
  }

  if (decline) {
    if (decline.share >= 60) { score -= 1; factors.push({ dir: '-', text: `직전 거래보다 낮게 계약된 비율 ${decline.share}% (${decline.n}건 중) — 하락 거래 우위` }); }
    else if (decline.share <= 35) { score += 1; factors.push({ dir: '+', text: `직전 거래보다 낮게 계약된 비율 ${decline.share}% (${decline.n}건 중) — 상승 거래 우위` }); }
    else factors.push({ dir: '0', text: `하락 거래 비중 ${decline.share}% — 상승·하락 혼조` });
  }

  const grade =
    score >= 3 ? { label: '상승 여력 높음', cls: 'up2' } :
    score >= 1 ? { label: '완만한 상승 기대', cls: 'up1' } :
    score >= -1 ? { label: '보합 전망', cls: 'flat' } :
    { label: '하방 압력 주의', cls: 'down' };

  return { grade, factors, cur, mom3, yoy, volChg, decline };
}

// 월별 평균 평당가 시계열 (만원/평). 실패한 달은 건너뛰고, 현재 진행 중인 달은 partial 표시.
// 14개월 = 완결된 최근 월의 "전년 동월"까지 포함
export async function fetchPppSeries(districtName, months = 14) {
  const yms = monthKeys(months);
  const nowYm = yms[yms.length - 1];
  const results = await Promise.allSettled(
    yms.map((ymd) => fetchAptTrades(districtName, ymd))
  );
  const series = results.map((r, i) => {
    if (r.status !== 'fulfilled') return null;
    const pps = r.value.map((t) => t.price / (t.areaM2 / 3.3058));
    if (!pps.length) return null;
    return {
      ym: `${yms[i].slice(0, 4)}.${yms[i].slice(4)}`,
      ppp: Math.round(pps.reduce((a, b) => a + b, 0) / pps.length),
      n: pps.length,
      partial: yms[i] === nowYm, // 집계 초기 월 (표본 부족 가능)
    };
  }).filter(Boolean);
  if (series.length < 4) throw new Error('실거래 표본 부족');
  return series;
}
