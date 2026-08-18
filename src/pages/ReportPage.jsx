import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { fmtPrice } from '../data/mock.js';
import { REGION_DISTRICTS, fetchAptTrades, fetchAptRents } from '../data/api.js';
import useTitle from '../useTitle.js';

const ppp = (t) => t.price / (t.areaM2 / 3.3058);
const avg = (arr) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0);

function ymLabel(ym) {
  return `${ym.slice(0, 4)}년 ${Number(ym.slice(4, 6))}월`;
}
function shiftYm(ym, diff) {
  const d = new Date(Number(ym.slice(0, 4)), Number(ym.slice(4, 6)) - 1 + diff, 1);
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}`;
}
function latestFullYm() {
  const now = new Date();
  const p = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  return `${p.getFullYear()}${String(p.getMonth() + 1).padStart(2, '0')}`;
}

export default function ReportPage() {
  const { district, ym } = useParams();
  const valid = REGION_DISTRICTS.some((d) => d.name === district) && /^\d{6}$/.test(ym || '');
  const [data, setData] = useState(null); // { cur, prev, rents }
  const [status, setStatus] = useState('loading');

  useTitle(valid ? `${district} 아파트 실거래 리포트 ${ymLabel(ym)}` : null);

  useEffect(() => {
    if (!valid) return;
    let alive = true;
    setStatus('loading');
    Promise.allSettled([
      fetchAptTrades(district, ym),
      fetchAptTrades(district, shiftYm(ym, -1)),
      fetchAptRents(district, ym),
    ]).then(([c, p, r]) => {
      if (!alive) return;
      if (c.status !== 'fulfilled') { setStatus('error'); return; }
      setData({
        cur: c.value,
        prev: p.status === 'fulfilled' ? p.value : null,
        rents: r.status === 'fulfilled' ? r.value : null,
      });
      setStatus('ok');
    });
    return () => { alive = false; };
  }, [district, ym, valid]);

  const summary = useMemo(() => {
    if (!data) return null;
    const { cur, prev, rents } = data;
    const curPpp = Math.round(avg(cur.map(ppp)));
    const prevPpp = prev && prev.length ? Math.round(avg(prev.map(ppp))) : null;
    const pppDiff = prevPpp ? ((curPpp - prevPpp) / prevPpp) * 100 : null;
    const cntDiff = prev ? cur.length - prev.length : null;
    const top5 = [...cur].sort((a, b) => b.price - a.price).slice(0, 5);
    const bands = {};
    cur.forEach((t) => { const b = Math.round(t.areaM2); (bands[b] ||= []).push(t); });
    const bandRows = Object.entries(bands)
      .sort((a, b) => b[1].length - a[1].length)
      .slice(0, 6)
      .map(([b, list]) => ({
        band: Number(b), n: list.length,
        avgPrice: Math.round(avg(list.map((t) => t.price))),
      }));
    return {
      cnt: cur.length, curPpp, pppDiff, cntDiff, top5, bandRows,
      jeonse: rents ? rents.filter((x) => x.type === '전세').length : null,
      wolse: rents ? rents.filter((x) => x.type === '월세').length : null,
    };
  }, [data]);

  if (!valid) {
    return (
      <div className="page container">
        <h1 className="page-title">리포트를 찾을 수 없어요</h1>
        <p className="page-sub"><Link to="/" style={{ textDecoration: 'underline' }}>홈으로 돌아가기</Link></p>
      </div>
    );
  }

  const prevYm = shiftYm(ym, -1);
  const nextYm = shiftYm(ym, 1);
  const hasNext = nextYm <= latestFullYm();

  return (
    <div className="page container" style={{ maxWidth: 760 }}>
      <div className="lc-top">
        <span className="badge cat">월간 리포트</span>
        <span className="lc-district">{district}</span>
        {status === 'ok' && <span className="badge">실데이터</span>}
      </div>
      <h1 className="page-title">{district} 아파트 실거래 리포트</h1>
      <p className="page-sub">
        {ymLabel(ym)} · 국토교통부 신고 자료 기준
      </p>
      <div className="filters" style={{ marginBottom: 20 }}>
        <Link className="chip" to={`/report/${encodeURIComponent(district)}/${prevYm}`}>← {ymLabel(prevYm)}</Link>
        {hasNext && <Link className="chip" to={`/report/${encodeURIComponent(district)}/${nextYm}`}>{ymLabel(nextYm)} →</Link>}
      </div>

      {status === 'loading' && <p className="page-sub">리포트를 집계하는 중…</p>}
      {status === 'error' && <p className="hint">⚠ 데이터를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.</p>}

      {status === 'ok' && summary && (
        summary.cnt === 0 ? (
          <p className="hint">{ymLabel(ym)}에 신고된 {district} 아파트 매매 거래가 아직 없습니다.
            (계약 후 30일 이내 신고 규정에 따라 월초에는 데이터가 적을 수 있습니다)</p>
        ) : (
          <>
            <div className="card" style={{ marginBottom: 14, lineHeight: 1.8 }}>
              <p>
                {ymLabel(ym)} <b>{district}</b>에서는 아파트 매매 <b>{summary.cnt.toLocaleString()}건</b>이 신고되었습니다
                {summary.cntDiff != null && <>(전월 대비 {summary.cntDiff >= 0 ? '+' : ''}{summary.cntDiff.toLocaleString()}건)</>}.
                이달 거래의 평균 평당가는 <b>{summary.curPpp.toLocaleString()}만원</b>
                {summary.pppDiff != null && (
                  <>으로, 전월 대비 <b style={{ color: summary.pppDiff >= 0 ? 'var(--red)' : 'var(--blue)' }}>
                    {summary.pppDiff >= 0 ? '+' : ''}{summary.pppDiff.toFixed(1)}%
                  </b> {summary.pppDiff >= 0 ? '상승' : '하락'}했습니다</>
                )}
                {summary.pppDiff == null && '입니다'}.
                국민평형(전용 84m²) 환산 시 약 <b>{fmtPrice(Math.round(summary.curPpp * 25.7 / 500) * 500)}</b> 수준입니다.
                {summary.jeonse != null && (
                  <> 같은 달 전세 계약은 {summary.jeonse.toLocaleString()}건, 월세 계약은 {summary.wolse.toLocaleString()}건 신고되었습니다.</>
                )}
              </p>
              <p className="hint">
                평균 평당가는 해당 월 거래의 단순 평균으로, 거래된 단지·면적 구성에 따라 출렁일 수 있는 참고 지표입니다.
              </p>
            </div>

            <div className="card" style={{ marginBottom: 14 }}>
              <div className="section-title">{ymLabel(ym)} 최고가 거래 TOP 5</div>
              <table className="table">
                <thead>
                  <tr><th>단지</th><th>전용</th><th>층</th><th className="num">거래가</th></tr>
                </thead>
                <tbody>
                  {summary.top5.map((t, i) => (
                    <tr key={i}>
                      <td>
                        <Link to={`/complex/${encodeURIComponent(district)}/${encodeURIComponent(t.dong)}/${encodeURIComponent(t.complex)}`} style={{ color: 'var(--blue-dark)' }}>
                          {t.dong} {t.complex}
                        </Link>
                      </td>
                      <td>{t.areaM2}m²</td>
                      <td>{t.floor}층</td>
                      <td className="num">{fmtPrice(t.price)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="card">
              <div className="section-title">면적대별 평균 매매가</div>
              <table className="table">
                <thead>
                  <tr><th>전용</th><th>거래</th><th className="num">평균 거래가</th></tr>
                </thead>
                <tbody>
                  {summary.bandRows.map((b) => (
                    <tr key={b.band}>
                      <td>{b.band}m²</td>
                      <td>{b.n}건</td>
                      <td className="num">{fmtPrice(b.avgPrice)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="hint">
                출처: 국토교통부 실거래가 공개시스템 · 계약일 기준 · 해제 거래 제외 ·
                거래량 상위 6개 면적대만 표시. 투자 권유가 아닌 참고 자료입니다.
              </p>
            </div>
          </>
        )
      )}
    </div>
  );
}
