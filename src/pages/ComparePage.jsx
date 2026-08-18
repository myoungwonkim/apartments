import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';
import { fmtPrice } from '../data/mock.js';
import { fetchComplexHistory } from '../data/api.js';
import useTitle from '../useTitle.js';

const COLORS = ['#3182f6', '#f04452'];
const ppp = (t) => t.price / (t.areaM2 / 3.3058);

function parseKey(s) {
  const [district, dong, name] = (s || '').split('|');
  return district && dong && name ? { district, dong, name } : null;
}

function summarize(h) {
  if (!h) return null;
  const { sales, rents } = h;
  const latest = sales[0] || null;
  const avgPpp = sales.length
    ? Math.round(sales.reduce((a, t) => a + ppp(t), 0) / sales.length) : null;
  const jeonse = rents.filter((r) => r.type === '전세');
  return {
    latest, avgPpp,
    saleCount: sales.length,
    jeonseCount: jeonse.length,
    latestJeonse: jeonse[0] || null,
    builtYear: sales[0]?.builtYear || rents[0]?.builtYear || null,
    high: sales.length ? Math.max(...sales.map((t) => t.price)) : null,
  };
}

export default function ComparePage() {
  const [sp] = useSearchParams();
  const a = parseKey(sp.get('a'));
  const b = parseKey(sp.get('b'));
  const [dataA, setDataA] = useState(null);
  const [dataB, setDataB] = useState(null);
  const [status, setStatus] = useState('loading');

  useTitle(a && b ? `${a.name} vs ${b.name} 실거래 비교` : '단지 비교');

  useEffect(() => {
    if (!a || !b) return;
    let alive = true;
    setStatus('loading');
    Promise.allSettled([
      fetchComplexHistory(a.district, a.dong, a.name),
      fetchComplexHistory(b.district, b.dong, b.name),
    ]).then(([ra, rb]) => {
      if (!alive) return;
      if (ra.status !== 'fulfilled' || rb.status !== 'fulfilled') { setStatus('error'); return; }
      setDataA(ra.value);
      setDataB(rb.value);
      setStatus('ok');
    });
    return () => { alive = false; };
  }, [sp]);

  const sumA = useMemo(() => summarize(dataA), [dataA]);
  const sumB = useMemo(() => summarize(dataB), [dataB]);

  // 월별 평균 평당가 두 선 병합
  const chartData = useMemo(() => {
    if (!dataA || !dataB) return [];
    const byYm = {};
    [[dataA, 'a'], [dataB, 'b']].forEach(([d, k]) => {
      const g = {};
      d.sales.forEach((t) => { (g[t.ym] ||= []).push(ppp(t)); });
      Object.entries(g).forEach(([ym, pps]) => {
        (byYm[ym] ||= { ym })[k] = Math.round(pps.reduce((x, y) => x + y, 0) / pps.length);
      });
    });
    return Object.values(byYm).sort((x, y) => x.ym.localeCompare(y.ym));
  }, [dataA, dataB]);

  if (!a || !b) {
    return (
      <div className="page container" style={{ maxWidth: 720 }}>
        <h1 className="page-title">단지 비교</h1>
        <p className="page-sub">
          비교할 단지 두 곳이 필요합니다. 단지 상세 페이지에서 <b>"⚖ 비교 담기"</b>를 누른 뒤,
          다른 단지 상세에서 <b>"⚖ OO와 비교"</b>를 누르면 이 화면이 열립니다.
        </p>
        <Link className="chip" to="/">실거래 목록으로</Link>
      </div>
    );
  }

  const complexLink = (k) =>
    `/complex/${encodeURIComponent(k.district)}/${encodeURIComponent(k.dong)}/${encodeURIComponent(k.name)}`;

  return (
    <div className="page container" style={{ maxWidth: 760 }}>
      <div className="lc-top">
        <span className="badge cat">단지 비교</span>
        {status === 'ok' && <span className="badge">실데이터</span>}
      </div>
      <h1 className="page-title" style={{ fontSize: 22 }}>
        <span style={{ color: COLORS[0] }}>{a.name}</span>
        {' vs '}
        <span style={{ color: COLORS[1] }}>{b.name}</span>
      </h1>
      <p className="page-sub">최근 12개월 실거래 기준 · {a.district} {a.dong} / {b.district} {b.dong}</p>

      {status === 'loading' && <p className="page-sub">두 단지의 12개월 이력을 집계하는 중… (수 초 걸릴 수 있어요)</p>}
      {status === 'error' && <p className="hint">⚠ 데이터를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.</p>}

      {status === 'ok' && sumA && sumB && (
        <>
          <div className="card" style={{ marginBottom: 14 }}>
            <div className="section-title">한눈 비교</div>
            <table className="table">
              <thead>
                <tr>
                  <th></th>
                  <th><Link to={complexLink(a)} style={{ color: COLORS[0] }}>{a.name}</Link></th>
                  <th><Link to={complexLink(b)} style={{ color: COLORS[1] }}>{b.name}</Link></th>
                </tr>
              </thead>
              <tbody>
                <tr><td>평균 평당가 (12개월)</td>
                  <td>{sumA.avgPpp ? `${sumA.avgPpp.toLocaleString()}만` : '-'}</td>
                  <td>{sumB.avgPpp ? `${sumB.avgPpp.toLocaleString()}만` : '-'}</td></tr>
                <tr><td>최근 매매</td>
                  <td>{sumA.latest ? `${fmtPrice(sumA.latest.price)} (${sumA.latest.areaM2}m²)` : '-'}</td>
                  <td>{sumB.latest ? `${fmtPrice(sumB.latest.price)} (${sumB.latest.areaM2}m²)` : '-'}</td></tr>
                <tr><td>12개월 최고가</td>
                  <td>{sumA.high ? fmtPrice(sumA.high) : '-'}</td>
                  <td>{sumB.high ? fmtPrice(sumB.high) : '-'}</td></tr>
                <tr><td>매매 / 전세 건수</td>
                  <td>{sumA.saleCount} / {sumA.jeonseCount}건</td>
                  <td>{sumB.saleCount} / {sumB.jeonseCount}건</td></tr>
                <tr><td>최근 전세</td>
                  <td>{sumA.latestJeonse ? `${fmtPrice(sumA.latestJeonse.deposit)} (${sumA.latestJeonse.areaM2}m²)` : '-'}</td>
                  <td>{sumB.latestJeonse ? `${fmtPrice(sumB.latestJeonse.deposit)} (${sumB.latestJeonse.areaM2}m²)` : '-'}</td></tr>
                <tr><td>준공</td>
                  <td>{sumA.builtYear ? `${sumA.builtYear}년` : '-'}</td>
                  <td>{sumB.builtYear ? `${sumB.builtYear}년` : '-'}</td></tr>
              </tbody>
            </table>
          </div>

          {chartData.length >= 2 && (
            <div className="card">
              <div className="section-title">월평균 평당가 추이 (만원/평)</div>
              <div style={{ display: 'flex', gap: 14, marginBottom: 6 }}>
                {[a, b].map((k, i) => (
                  <span key={i} style={{ fontSize: 13, color: 'var(--text-sub)' }}>
                    <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 2, background: COLORS[i], marginRight: 5 }} />
                    {k.name}
                  </span>
                ))}
              </div>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={chartData} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e8eb" vertical={false} />
                  <XAxis dataKey="ym" tick={{ fontSize: 11, fill: '#8b95a1' }} />
                  <YAxis tick={{ fontSize: 12, fill: '#8b95a1' }} width={56}
                    domain={['auto', 'auto']}
                    tickFormatter={(v) => `${v.toLocaleString()}만`} />
                  <Tooltip formatter={(v, k) => [`${v.toLocaleString()}만/평`, k === 'a' ? a.name : b.name]} />
                  <Line type="monotone" dataKey="a" stroke={COLORS[0]} strokeWidth={2.5} dot={{ r: 3 }} connectNulls />
                  <Line type="monotone" dataKey="b" stroke={COLORS[1]} strokeWidth={2.5} dot={{ r: 3 }} connectNulls />
                </LineChart>
              </ResponsiveContainer>
              <p className="hint">
                평당가는 면적 차이를 보정한 비교 지표입니다. 단지별 거래 면적 구성이 달라
                절대 비교보다 추세 비교에 적합합니다. 출처: 국토교통부 실거래가 공개시스템.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
