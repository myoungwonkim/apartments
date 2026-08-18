// 빌드 시 사이트맵 생성: 고정 경로 + 지역별 거래량 상위 단지 + 최신 월간 리포트.
// 프록시(엣지 캐시 12h)를 통해 각 지역의 최근 완결월 매매를 읽어 단지별 거래량 상위 N개를 뽑는다.
// 일부 지역 조회에 실패해도 빌드는 계속한다 (해당 지역 단지만 누락).
import fs from "node:fs";
import path from "node:path";
import { REGION_DISTRICTS } from "../src/data/api.js";

const ORIGIN = "https://apartments.nolsoopgames.com";
const PROXY = "https://jiphannun-proxy.nolsoop-games.workers.dev";
const TOP_N = 10; // 지역당 단지 수

// 최근 완결월 (이번 달은 집계 중이므로 지난달)
const now = new Date();
const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
const YM = `${prev.getFullYear()}${String(prev.getMonth() + 1).padStart(2, "0")}`;

const item = (re, s) => { const m = s.match(re); return m ? m[1].trim() : ""; };

async function topComplexes(d) {
  const res = await fetch(`${PROXY}/apt-trade?lawdCd=${d.lawdCd}&dealYmd=${YM}`, {
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const xml = await res.text();
  const counts = {};
  for (const it of xml.match(/<item>[\s\S]*?<\/item>/g) || []) {
    if (item(/<cdealType>([^<]*)</, it) === "O") continue;
    const apt = item(/<aptNm>([^<]*)</, it);
    const dong = item(/<umdNm>([^<]*)</, it);
    if (!apt || !dong) continue;
    const key = `${dong}|${apt}`;
    counts[key] = (counts[key] || 0) + 1;
  }
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, TOP_N)
    .map(([key]) => {
      const [dong, apt] = key.split("|");
      return `${ORIGIN}/complex/${encodeURIComponent(d.name)}/${encodeURIComponent(dong)}/${encodeURIComponent(apt)}`;
    });
}

const urls = [
  { loc: `${ORIGIN}/`, freq: "daily", pri: "1.0" },
  { loc: `${ORIGIN}/market`, freq: "daily", pri: "0.9" },
  { loc: `${ORIGIN}/high`, freq: "daily", pri: "0.8" },
  { loc: `${ORIGIN}/calc`, freq: "monthly", pri: "0.6" },
  { loc: `${ORIGIN}/privacy`, freq: "yearly", pri: "0.1" },
];

let okCount = 0;
let failCount = 0;
const CHUNK = 8;
for (let i = 0; i < REGION_DISTRICTS.length; i += CHUNK) {
  const batch = REGION_DISTRICTS.slice(i, i + CHUNK);
  const results = await Promise.allSettled(batch.map((d) => topComplexes(d)));
  results.forEach((r, j) => {
    if (r.status === "fulfilled") {
      okCount++;
      for (const loc of r.value) urls.push({ loc, freq: "weekly", pri: "0.7" });
      // 지역별 최신 월간 리포트
      urls.push({
        loc: `${ORIGIN}/report/${encodeURIComponent(batch[j].name)}/${YM}`,
        freq: "monthly", pri: "0.6",
      });
    } else {
      failCount++;
      console.warn(`sitemap: ${batch[j].name} 조회 실패 — 건너뜀`);
    }
  });
}

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${u.loc}</loc><changefreq>${u.freq}</changefreq><priority>${u.pri}</priority></url>`).join("\n")}
</urlset>
`;

fs.writeFileSync(path.resolve("dist", "sitemap.xml"), xml);
console.log(`build-sitemap: ${urls.length}개 URL (지역 성공 ${okCount} · 실패 ${failCount} · 기준월 ${YM})`);
