import fs from "node:fs";
import path from "node:path";

const dist = path.resolve("dist");
const src = path.join(dist, "index.html");
const html = fs.readFileSync(src, "utf8");

const pages = [
  {
    file: "index.html",
    title: "아파트 실거래가 조회 — 부르는 값 말고, 팔린 값 | 팔린아파트",
    desc: "국토교통부에 신고된 진짜 계약만 보여드립니다. 서울·경기 전 지역 아파트 매매·전세·월세 실거래가 조회, 평당가 추이, 대출·취득세 계산기.",
    url: "https://apartments.nolsoopgames.com/",
  },
  {
    file: path.join("market", "index.html"),
    title: "아파트 시세 · 실거래가 추이 | 팔린아파트",
    desc: "서울·경기 아파트 매매·전세 실거래 시세와 평당가 추이를 지역별로 확인하세요.",
    url: "https://apartments.nolsoopgames.com/market",
  },
  {
    file: path.join("calc", "index.html"),
    title: "아파트 대출 · 취득세 계산기 | 팔린아파트",
    desc: "아파트 매매가 기준 주택담보대출 상환과 취득세를 계산합니다.",
    url: "https://apartments.nolsoopgames.com/calc",
  },
  {
    file: path.join("privacy", "index.html"),
    title: "개인정보처리방침 | 팔린아파트",
    desc: "팔린아파트 개인정보 처리방침.",
    url: "https://apartments.nolsoopgames.com/privacy",
  },
];

function apply(page) {
  let out = html;
  out = out.replace(/<title>[\s\S]*?<\/title>/, `<title>${page.title}</title>`);
  out = out.replace(
    /<meta name="description" content="[^"]*" \/>/,
    `<meta name="description" content="${page.desc}" />`,
  );
  out = out.replace(
    /<link rel="canonical" href="[^"]*" \/>/,
    `<link rel="canonical" href="${page.url}" />`,
  );
  out = out.replace(
    /<meta property="og:url" content="[^"]*" \/>/,
    `<meta property="og:url" content="${page.url}" />`,
  );
  out = out.replace(
    /<meta property="og:title" content="[^"]*" \/>/,
    `<meta property="og:title" content="${page.title}" />`,
  );
  const dest = path.join(dist, page.file);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, out);
}

for (const page of pages) apply(page);
console.log("prerender-seo: wrote unique canonical HTML for sitemap routes");
