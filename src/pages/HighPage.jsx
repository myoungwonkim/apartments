import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { REGIONS, fmtPrice } from '../data/mock.js';
import { REGION_DISTRICTS, fetchRecentAptTrades } from '../data/api.js';
import useTitle from '../useTitle.js';

// 신고가 판정: 같은 단지·같은 면적대(전용 m² 반올림)에서
// 이전 12개월 내 모든 거래보다 높은 가격에 계약된 건
function findRecords(trades) {
  const asc = [...trades].sort((a, b) => a.sortKey.localeCompare(b.sortKey));
  const maxSoFar = {}; // key → { price, count }
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

export default function HighPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initDistrict = REGION_DISTRICTS.some((d) => d.name === searchParams.get('district'))
    ? searchParams.get('district') : '강남구';
  const [district, setDistrict] = useState(initDistrict);
  const [region, setRegion] = useState(REGION_DISTRICTS.find((d) => d.name === initDistrict).region);
  const [trades, setTrades] = useState([]);
  const [status, setStatus] = useState('loading'); // loading | ok | error

  useTitle(`${district} 아파트 신고가 경신 단지`);

  useEffect(() => {
    const p = district !== '강남구' ? { district } : {};
    setSearchParams(p, { replace: true });
  }, [district, setSearchParams]);

  useEffect(() => {
    let alive = true;
    setStatus('loading');
    fetchRecentAptTrades(district, 12)
      .then((t) => { if (alive) { setTrades(t); setStatus('ok'); } })
      .catch(() => { if (alive) setStatus('error'); });
    return () => { alive = false; };
  }, [district]);

  const records = useMemo(() => findRecords(trades), [trades]);
  const recent30 = useMemo(() => {
    if (!records.length) return [];
    const latest = records[0].sortKey;
    const latestDate = new Date(Number(latest.slice(0, 4)), Number(latest.slice(4, 6)) - 1, Number(latest.slice(6, 8)));
    const from = new Date(latestDate); from.setDate(from.getDate() - 30);
    const fromKey = `${from.getFullYear()}${String(from.getMonth() + 1).padStart(2, '0')}${String(from.getDate()).padStart(2, '0')}`;
    return records.filter((r) => r.sortKey >= fromKey);
  }, [records]);

  const regionDistricts = REGION_DISTRICTS.filter((d) => d.region === region);
  const switchRegion = (r) => {
    setRegion(r);
    setDistrict(REGION_DISTRICTS.find((d) => d.region === r).name);
  };

  return (
    <div className="page container">
      <h1 className="page-title">신고가 경신 <span className="badge" style={{ verticalAlign: 'middle' }}>실데이터</span></h1>
      <p className="page-sub">
        같은 단지·같은 면적대에서 최근 12개월 내 가장 비싸게 계약된 거래입니다.
        지역 단위 집계라 한 지역씩 조회됩니다.
      </p>

      <div className="filters">
        {REGIONS.map((r) => (
          <button key={r} className={`chip ${region === r ? 'on' : ''}`} onClick={() => switchRegion(r)}>
            {r}
          </button>
        ))}
        <select className="chip" value={district} onChange={(e) => setDistrict(e.target.value)}>
          {regionDistricts.map((d) => (
            <option key={d.name} value={d.name}>{d.name}</option>
          ))}
        </select>
      </div>

      {status === 'loading' && (
        <p className="page-sub">{district} 12개월 거래를 집계하는 중… (최초 조회는 수 초 걸릴 수 있어요)</p>
      )}
      {status === 'error' && (
        <p className="hint">⚠ 거래 데이터를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.</p>
      )}

      {status === 'ok' && (
        <>
          <div className="stat-row">
            <div className="stat">
              <div className="label">최근 30일 신고가</div>
              <div className="value">{recent30.length.toLocaleString()}건</div>
            </div>
            <div className="stat">
              <div className="label">12개월 신고가 경신</div>
              <div className="value">{records.length.toLocaleString()}건</div>
            </div>
            <div className="stat">
              <div className="label">12개월 매매 거래</div>
              <div className="value">{trades.length.toLocaleString()}건</div>
            </div>
          </div>

          {records.length === 0 ? (
            <p className="hint">최근 12개월 내 신고가 경신 거래가 없습니다.</p>
          ) : (
            <div>
              {records.slice(0, 100).map((r, i) => (
                <Link
                  key={i}
                  className="trade-row"
                  to={`/complex/${encodeURIComponent(district)}/${encodeURIComponent(r.dong)}/${encodeURIComponent(r.complex)}`}
                >
                  <div>
                    <div className="tr-name">
                      {r.complex}
                      <span className="tr-loc">{r.dong} · {Math.round(r.areaM2)}m²</span>
                    </div>
                    <div className="tr-meta">
                      계약 {r.ym.slice(2)}.{r.date.split('.')[1]} · {r.floor}층
                      {r.builtYear ? ` · '${String(r.builtYear).slice(2)}준공` : ''}
                      {' · 직전 최고 '}{fmtPrice(r.prevHigh)}
                    </div>
                  </div>
                  <div className="tr-right">
                    <div className="tr-price">{fmtPrice(r.price)} <span style={{ fontSize: 12 }}>🔺</span></div>
                    <div className="tr-sub" style={{ color: 'var(--red)' }}>+{r.gainPct.toFixed(1)}%</div>
                  </div>
                </Link>
              ))}
              {records.length > 100 && (
                <p className="hint">최근 100건까지 표시합니다 (전체 {records.length.toLocaleString()}건).</p>
              )}
            </div>
          )}
          <p className="hint" style={{ marginTop: 16 }}>
            출처: 국토교통부 실거래가 공개시스템 · 비교 범위가 최근 12개월이므로 그 이전의 역대 최고가와는 다를 수 있습니다.
            해제 거래 제외 · 면적대는 전용면적 반올림 기준.
          </p>
        </>
      )}
    </div>
  );
}
