import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { REGIONS, listings, fmtPrice } from '../data/mock.js';
import {
  REGION_DISTRICTS, fetchRecentAptTrades, fetchRecentAptRents, fetchPppSeries, outlookFromSeries,
} from '../data/api.js';
import ListingCard from '../components/ListingCard.jsx';

const TYPES = ['전체', '매매', '전세', '월세'];
const BADGE_CLASS = { 매매: '', 전세: 'jeonse', 월세: 'wolse' };
const AREA_RANGES = [
  { key: '전체', label: '면적 전체', min: 0, max: Infinity },
  { key: 'a1', label: '40m² 이하', min: 0, max: 40 },
  { key: 'a2', label: '40 ~ 60m²', min: 40, max: 60 },
  { key: 'a3', label: '60 ~ 85m²', min: 60, max: 85 },
  { key: 'a4', label: '85 ~ 120m²', min: 85, max: 120 },
  { key: 'a5', label: '120m² 초과', min: 120, max: Infinity },
];
const SORTS = [
  { key: 'recent', label: '계약일 최신순' },
  { key: 'priceAsc', label: '가격 낮은순' },
  { key: 'priceDesc', label: '가격 높은순' },
  { key: 'areaDesc', label: '면적 넓은순' },
  { key: 'areaAsc', label: '면적 좁은순' },
];

const shortOf = (name) => REGION_DISTRICTS.find((d) => d.name === name)?.short || name;

function TradeCard({ r }) {
  const pyeong = Math.round((r.areaM2 / 3.3058) * 10) / 10;
  const label = r.kind === '월세' ? `${fmtPrice(r.price)}/${r.monthly}` : fmtPrice(r.price);
  const oldEnough = r.builtYear && new Date().getFullYear() - r.builtYear >= 30;
  const showDiff = r.kind === '매매' && r.diffPct != null && Math.abs(r.diffPct) <= 60;
  return (
    <Link
      className="listing-card"
      to={`/complex/${encodeURIComponent(r.district)}/${encodeURIComponent(r.dong)}/${encodeURIComponent(r.complex)}`}
    >
      <div className="lc-top">
        <span className={`badge ${BADGE_CLASS[r.kind]}`}>{r.kind}</span>
        <span className="lc-district">{shortOf(r.district)} {r.dong}</span>
        <span className="diff-tag" style={{ color: 'var(--text-weak)' }}>계약 {r.date}</span>
      </div>
      <div className="lc-price">{label}</div>
      <div className="lc-name">{r.complex}</div>
      <div className="lc-meta">
        {r.areaM2}m² ({pyeong}평) · {r.floor}층{r.builtYear ? ` · ${r.builtYear}년 준공` : ''}
      </div>
      {(showDiff || oldEnough) && (
        <div className="lc-tags">
          {showDiff && (
            <span className={`outlook-tag grade-${r.diffPct < 0 ? 'down' : r.diffPct > 0 ? 'up2' : 'flat'}`}>
              {r.diffBase} 대비 {r.diffPct > 0 ? '+' : ''}{r.diffPct}%
            </span>
          )}
          {oldEnough && <span className="infra-tag issue">준공 30년+ · 재건축 연한</span>}
        </div>
      )}
    </Link>
  );
}

export default function Home() {
  const [region, setRegion] = useState('서울');
  const [district, setDistrict] = useState('전체');
  const [progress, setProgress] = useState({ done: 0, total: 1 });
  const [failedDistricts, setFailedDistricts] = useState([]);
  const [type, setType] = useState('전체');
  const [query, setQuery] = useState('');
  const [areaKey, setAreaKey] = useState('전체');
  const [priceMin, setPriceMin] = useState(''); // 억 단위
  const [priceMax, setPriceMax] = useState('');
  const [sort, setSort] = useState('recent');
  const [records, setRecords] = useState([]);
  const [status, setStatus] = useState('loading'); // loading | real | demo
  const [visible, setVisible] = useState(30);
  const [outlook, setOutlook] = useState(null); // outlookFromSeries 결과 또는 null

  const regionDistricts = REGION_DISTRICTS.filter((d) => d.region === region);
  const switchRegion = (r) => {
    setRegion(r);
    setDistrict('전체');
  };

  // 실거래 조회: 매매 3개월 + 전월세 2개월. "전체" 선택 시 권역 내 모든 지역을 병렬 조회.
  useEffect(() => {
    let alive = true;
    setStatus('loading');
    setVisible(30);
    const names = district === '전체'
      ? REGION_DISTRICTS.filter((d) => d.region === region).map((d) => d.name)
      : [district];
    setProgress({ done: 0, total: names.length });
    const day = (sk) => `${sk.slice(4, 6)}.${sk.slice(6, 8)}`;

    // 한 지역 조회 + 시세 대비 계산(해당 구 안에서만 비교)
    const fetchOne = async (nm) => {
      const [t, r] = await Promise.allSettled([
        fetchRecentAptTrades(nm, 3),
        fetchRecentAptRents(nm, 2),
      ]);
      const sales = t.status === 'fulfilled' ? t.value.map((x) => ({
        district: nm, kind: '매매', price: x.price, monthly: null,
        complex: x.complex, dong: x.dong, areaM2: x.areaM2, floor: x.floor,
        builtYear: x.builtYear, date: day(x.sortKey), sortKey: x.sortKey,
      })) : [];
      const rents = r.status === 'fulfilled' ? r.value.map((x) => ({
        district: nm, kind: x.type, price: x.deposit, monthly: x.monthly || null,
        complex: x.complex, dong: x.dong, areaM2: x.areaM2, floor: x.floor,
        builtYear: x.builtYear, date: day(x.sortKey), sortKey: x.sortKey,
      })) : [];
      const ppp = (x) => x.price / (x.areaM2 / 3.3058);
      const avgPpp = sales.length ? sales.reduce((a, x) => a + ppp(x), 0) / sales.length : 0;
      for (const s of sales) {
        const peers = sales.filter((o) => o !== s && o.complex === s.complex && Math.abs(o.areaM2 - s.areaM2) <= 3);
        if (peers.length >= 2) {
          const avg = peers.reduce((a, o) => a + o.price, 0) / peers.length;
          s.diffPct = Math.round(((s.price - avg) / avg) * 100);
          s.diffBase = '단지 평균';
        } else if (avgPpp) {
          const est = avgPpp * (s.areaM2 / 3.3058);
          s.diffPct = Math.round(((s.price - est) / est) * 100);
          s.diffBase = '구 평균';
        }
      }
      // 매매·전월세 조회가 모두 실패한 지역은 "누락"으로 기록 (조용히 빠뜨리지 않기 위해)
      const failed = t.status === 'rejected' && r.status === 'rejected';
      return { recs: [...sales, ...rents], failed, name: nm };
    };

    setFailedDistricts([]);
    // 브라우저가 수백 개 요청을 동시에 던지면 일부를 즉시 거절하므로, 지역을 8개씩 나눠 순차 처리
    const CHUNK = 8;
    (async () => {
      const rs = [];
      for (let i = 0; i < names.length && alive; i += CHUNK) {
        const batch = await Promise.allSettled(
          names.slice(i, i + CHUNK).map((nm) => fetchOne(nm).then((out) => {
            if (alive) setProgress((p) => ({ ...p, done: p.done + 1 }));
            return out;
          }))
        );
        rs.push(...batch);
      }
      if (!alive) return;
      const ok = rs.filter((x) => x.status === 'fulfilled').map((x) => x.value);
      const all = ok.flatMap((x) => x.recs)
        .sort((a, b) => b.sortKey.localeCompare(a.sortKey));
      setFailedDistricts(ok.filter((x) => x.failed).map((x) => x.name));
      if (all.length) { setRecords(all); setStatus('real'); }
      else setStatus('demo');
    })();
    return () => { alive = false; };
  }, [district, region]);

  // 향후 가치 전망 (실거래 14개월 시계열 기반). 특정 지역 선택 시에만 — 전체 보기에서는 표시하지 않음.
  useEffect(() => {
    let alive = true;
    setOutlook(null);
    if (district === '전체') return;
    fetchPppSeries(district)
      .then((s) => { if (alive) setOutlook(outlookFromSeries(s)); })
      .catch(() => { if (alive) setOutlook(null); });
    return () => { alive = false; };
  }, [district]);

  const counts = useMemo(() => ({
    매매: records.filter((r) => r.kind === '매매').length,
    전세: records.filter((r) => r.kind === '전세').length,
    월세: records.filter((r) => r.kind === '월세').length,
  }), [records]);

  const filtered = useMemo(() => {
    const ar = AREA_RANGES.find((a) => a.key === areaKey);
    const min = priceMin === '' ? 0 : Number(priceMin) * 10000;
    const max = priceMax === '' ? Infinity : Number(priceMax) * 10000;
    const q = query.trim().replace(/\s/g, '');
    let out = records.filter(
      (r) =>
        (type === '전체' || r.kind === type) &&
        (q === '' ||
          r.complex.replace(/\s/g, '').includes(q) ||
          r.dong.replace(/\s/g, '').includes(q)) &&
        r.areaM2 >= ar.min && r.areaM2 < ar.max &&
        r.price >= min && r.price <= max
    );
    if (sort === 'priceAsc') out = [...out].sort((a, b) => a.price - b.price);
    if (sort === 'priceDesc') out = [...out].sort((a, b) => b.price - a.price);
    if (sort === 'areaDesc') out = [...out].sort((a, b) => b.areaM2 - a.areaM2);
    if (sort === 'areaAsc') out = [...out].sort((a, b) => a.areaM2 - b.areaM2);
    return out;
  }, [records, type, query, areaKey, priceMin, priceMax, sort]);

  const demoListings = listings.filter((l) =>
    district === '전체' ? l.region === region : l.district === district
  );

  return (
    <div className="page container">
      <h1 className="page-title">
        최근에 팔린 아파트
        {status === 'real' && <span className="badge" style={{ marginLeft: 10, verticalAlign: 'middle' }}>실데이터</span>}
        {status === 'demo' && <span className="badge wolse" style={{ marginLeft: 10, verticalAlign: 'middle' }}>데모</span>}
      </h1>
      <p className="page-sub">
        호가 매물이 아니라 국토부에 신고된 <b>실제 계약</b>입니다 (아파트 매매 3개월 · 전월세 2개월).
        {status === 'real' && <> {district === '전체' ? `${region} 전체` : district} <b>{records.length.toLocaleString()}건</b>{filtered.length !== records.length && <> · 필터 결과 {filtered.length.toLocaleString()}건</>}</>}
      </p>

      <div className="filters">
        {REGIONS.map((r) => (
          <button key={r} className={`chip ${region === r ? 'on' : ''}`} onClick={() => switchRegion(r)}>
            {r}
          </button>
        ))}
        <select className="chip" value={district} onChange={(e) => setDistrict(e.target.value)}>
          <option value="전체">{region} 전체</option>
          {regionDistricts.map((d) => (
            <option key={d.name} value={d.name}>{d.name}</option>
          ))}
        </select>
      </div>
      <div className="filters">
        {TYPES.map((t) => (
          <button key={t} className={`chip ${type === t ? 'on' : ''}`} onClick={() => setType(t)}>
            {t}{status === 'real' && t !== '전체' ? ` ${counts[t].toLocaleString()}` : ''}
          </button>
        ))}
        <span className="price-range search-box">
          <input
            type="search" placeholder="아파트 이름·동 검색 (예: 래미안, 정자동)"
            value={query} onChange={(e) => setQuery(e.target.value)}
          />
          {query !== '' && <button className="pr-clear" onClick={() => setQuery('')}>×</button>}
        </span>
        <span className="price-range">
          <span className="pr-label">가격(억)</span>
          <input type="number" min="0" placeholder="최소" value={priceMin} onChange={(e) => setPriceMin(e.target.value)} />
          <span className="pr-tilde">~</span>
          <input type="number" min="0" placeholder="최대" value={priceMax} onChange={(e) => setPriceMax(e.target.value)} />
          {(priceMin !== '' || priceMax !== '') && (
            <button className="pr-clear" onClick={() => { setPriceMin(''); setPriceMax(''); }}>×</button>
          )}
        </span>
        <select className="chip" value={areaKey} onChange={(e) => setAreaKey(e.target.value)}>
          {AREA_RANGES.map((a) => <option key={a.key} value={a.key}>{a.label}</option>)}
        </select>
        <select className="chip" value={sort} onChange={(e) => setSort(e.target.value)}>
          {SORTS.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
        </select>
      </div>

      {status === 'loading' && (
        <p className="page-sub">
          {district === '전체'
            ? `${region} 전체 실거래 집계 중… (${progress.done}/${progress.total} 지역)`
            : `${district} 실거래를 불러오는 중… (최초 조회는 수 초 걸릴 수 있어요)`}
        </p>
      )}

      {status === 'real' && failedDistricts.length > 0 && (
        <p className="hint" style={{ margin: '0 0 14px' }}>
          ⚠ {failedDistricts.length}개 지역({failedDistricts.slice(0, 5).join(', ')}{failedDistricts.length > 5 ? ' 외' : ''})은
          일시적으로 집계하지 못했습니다. 표시된 건수에 해당 지역은 빠져 있으며, 새로고침하면 다시 시도합니다.
        </p>
      )}

      {status === 'real' && outlook && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="section-title">
            {district} 향후 가치 전망 · 현재 판매 상황 기준
            <span className="badge" style={{ marginLeft: 8 }}>실데이터</span>
          </div>
          <span className={`outlook-badge grade-${outlook.grade.cls}`}>{outlook.grade.label}</span>
          <div className="cond-row">
            <span className="cond-item">기준월 {outlook.cur.ym} 평당가 <b>{outlook.cur.ppp.toLocaleString()}만</b></span>
            <span className="cond-item">3개월 <b>{outlook.mom3 >= 0 ? '+' : ''}{outlook.mom3?.toFixed(1)}%</b></span>
            {outlook.yoy != null && <span className="cond-item">전년 <b>{outlook.yoy >= 0 ? '+' : ''}{outlook.yoy.toFixed(1)}%</b></span>}
            <span className="cond-item">기준월 거래 <b>{outlook.cur.n}건</b></span>
          </div>
          <div style={{ marginTop: 8 }}>
            {outlook.factors.map((f, i) => (
              <div key={i} className="factor">
                <span className={`sign ${f.dir === '+' ? 'plus' : f.dir === '-' ? 'minus' : 'zero'}`}>
                  {f.dir === '0' ? '·' : f.dir}
                </span>
                {f.text}
              </div>
            ))}
          </div>
          <p className="hint">
            국토부 실거래 신고 데이터(시세 흐름·거래량)만으로 계산한 규칙 기반 참고 지표입니다.
            호가·매물·급매 정보는 공공데이터에 없어 반영되지 않으며, 투자 권유가 아닙니다.
          </p>
        </div>
      )}

      {status === 'real' && (
        <>
          <div className="listing-grid">
            {filtered.slice(0, visible).map((r, i) => <TradeCard key={i} r={r} />)}
          </div>
          {filtered.length === 0 && <p className="page-sub" style={{ marginTop: 16 }}>조건에 맞는 거래가 없어요. 필터를 조정해 보세요.</p>}
          {filtered.length > visible && (
            <div style={{ textAlign: 'center', marginTop: 20 }}>
              <button className="chip" onClick={() => setVisible(visible + 30)}>
                더보기 ({(filtered.length - visible).toLocaleString()}건 남음)
              </button>
            </div>
          )}
          <p className="hint" style={{ marginTop: 20 }}>
            출처: 국토교통부 실거래가 공개시스템 · 월세 표기는 보증금/월세(만원) · 해제된 거래 제외.
            빌라·토지 실거래는 별도 API 활용신청이 필요해 아직 아파트만 제공합니다.
            지금 판매 중인 호가 매물(네이버 부동산 등)과는 다른 데이터입니다.
            방 구조·방향·재건축 이슈·주민 리뷰·인프라는 실거래 공공데이터에 없는 정보라 표시하지 않습니다
            (건축물대장·정비사업 데이터 연동 시 일부 추가 가능).
          </p>
        </>
      )}

      {status === 'demo' && (
        demoListings.length > 0 ? (
          <>
            <p className="hint" style={{ margin: '0 0 16px' }}>
              ⚠ 실거래 API에 연결하지 못해 데모 매물을 표시하고 있습니다. 아래는 실제 매물이 아닙니다.
            </p>
            <div className="listing-grid">
              {demoListings.map((l) => <ListingCard key={l.id} l={l} />)}
            </div>
          </>
        ) : (
          <p className="hint">⚠ 실거래 API에 연결하지 못했고, 이 지역은 데모 데이터도 없습니다. 잠시 후 다시 시도해 주세요.</p>
        )
      )}
    </div>
  );
}
