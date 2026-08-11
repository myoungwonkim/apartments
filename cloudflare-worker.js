// 집한눈 실거래가 프록시 (Cloudflare Worker) — v3
// 역할: 국토부 API 키를 숨긴 채 실거래가를 대신 조회 + CORS 허용 + 12시간 캐시
// v2: "상세 자료(Dev)"와 "기본 자료" 두 API 상품을 순서대로 시도
// v3: Secret에 Encoding/Decoding 어느 키를 넣어도 자동 판별

const API_BASE = 'https://apis.data.go.kr/1613000';
const ENDPOINTS = {
  'apt-trade': [
    '/RTMSDataSvcAptTradeDev/getRTMSDataSvcAptTradeDev', // 아파트 매매 상세
    '/RTMSDataSvcAptTrade/getRTMSDataSvcAptTrade',       // 아파트 매매 기본
  ],
  'apt-rent': [
    '/RTMSDataSvcAptRent/getRTMSDataSvcAptRent',         // 아파트 전월세
  ],
};

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
};

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (request.method === 'OPTIONS') return new Response(null, { headers: CORS });

    const targets = ENDPOINTS[url.pathname.replace(/^\//, '')];
    if (!targets) {
      return new Response('사용법: /apt-trade?lawdCd=11680&dealYmd=202607', {
        status: 404, headers: CORS,
      });
    }
    if (!env.MOLIT_KEY) {
      return new Response('MOLIT_KEY Secret이 설정되지 않았습니다', { status: 500, headers: CORS });
    }

    const lawdCd = url.searchParams.get('lawdCd') || '';
    const dealYmd = url.searchParams.get('dealYmd') || '';
    if (!/^\d{5}$/.test(lawdCd) || !/^\d{6}$/.test(dealYmd)) {
      return new Response('lawdCd(시군구 5자리)와 dealYmd(YYYYMM)가 필요합니다', {
        status: 400, headers: CORS,
      });
    }

    // 같은 조회는 12시간 캐시 → 국토부 호출량 절약, 응답 속도 향상
    const cache = caches.default;
    const cacheKey = new Request(url.toString());
    const cached = await cache.match(cacheKey);
    if (cached) {
      const res = new Response(cached.body, cached);
      Object.entries(CORS).forEach(([k, v]) => res.headers.set(k, v));
      return res;
    }

    // 키 자동 판별: % 가 있으면 이미 인코딩된(Encoding) 키 → 그대로 사용
    const key = env.MOLIT_KEY.includes('%')
      ? env.MOLIT_KEY
      : encodeURIComponent(env.MOLIT_KEY);

    // 등록된 상품을 찾을 때까지 순서대로 시도
    let body = '', status = 502;
    for (const target of targets) {
      const apiUrl =
        `${API_BASE}${target}?serviceKey=${key}` +
        `&LAWD_CD=${lawdCd}&DEAL_YMD=${dealYmd}&pageNo=1&numOfRows=500`;
      const upstream = await fetch(apiUrl);
      body = await upstream.text();
      status = upstream.status;
      const keyError = body.includes('SERVICE_KEY_IS_NOT_REGISTERED') ||
                       body.includes('SERVICE ERROR');
      if (upstream.ok && !keyError) break; // 이 상품은 등록됨 → 사용
    }

    const res = new Response(body, {
      status,
      headers: {
        ...CORS,
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=43200',
      },
    });
    if (status === 200 && body.includes('<resultCode>00')) {
      await cache.put(cacheKey, res.clone());
    }
    return res;
  },
};
