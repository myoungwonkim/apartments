import { useEffect, useMemo, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';
import { fmtPrice } from '../data/mock.js';
import { fetchComplexHistory } from '../data/api.js';
import { isFav, toggleFav } from '../favorites.js';
import useTitle from '../useTitle.js';

const LINE_COLORS = ['#3182f6', '#0a8a4a', '#c76b00'];

export default function ComplexDetail() {
  const { district, dong, name } = useParams();
  const [data, setData] = useState({ sales: [], rents: [] });
  const [status, setStatus] = useState('loading'); // loading | ok | empty | error
  const [tab, setTab] = useState('매매');
  const navigate = useNavigate();
  const favKey = { district, dong, name };
  const [faved, setFaved] = useState(() => isFav(favKey));

  // 단지 비교: 첫 단지를 담아두고, 다른 단지에서 비교 실행
  const meKey = `${district}|${dong}|${name}`;
  const [compareBase, setCompareBase] = useState(() => {
    try { return localStorage.getItem('pallin_compare') || null; } catch { return null; }
  });
  const handleCompare = () => {
    if (compareBase && compareBase !== meKey) {
      navigate(`/compare?a=${encodeURIComponent(compareBase)}&b=${encodeURIComponent(meKey)}`);
      return;
    }
    try { localStorage.setItem('pallin_compare', meKey); } catch { /* 무시 */ }
    setCompareBase(meKey);
  };
  const compareBaseName = compareBase && compareBase !== meKey ? compareBase.split('|')[2] : null;

  useTitle(`${name} 실거래가 — ${district} ${dong} 매매·전세 이력`);

  useEffect(() => {
    let alive = true;
    setStatus('loading');
    fetchComplexHistory(district, dong, name)
      .then((d) => {
        if (!alive) return;
        setData(d);
        setStatus(d.sales.length + d.rents.length > 0 ? 'ok' : 'empty');
      })
      .catch(() => { if (alive) setStatus('error'); });
    return () => { alive = false; };
  }, [district, dong, name]);

  const { sales, rents } = data;
  const builtYear = sales[0]?.builtYear || rents[0]?.builtYear || null;

  // 면적대(전용 m² 반올림) 그룹 — 거래 많은 상위 3개
  const bands = useMemo(() => {
    const g = {};
    sales.forEach((s) => {
      const b = Math.round(s.areaM2);
      (g[b] ||= []).push(s);
    });
    return Object.entries(g)
      .sort((a, b) => b[1].length - a[1].length)
      .slice(0, 3)
      .map(([b, list]) => ({ band: Number(b), list }))
      .sort((a, b) => a.band - b.band);
  }, [sales]);

  // 면적대별 월평균 가격 차트 데이터
  const chartData = useMemo(() => {
    const byYm = {};
    bands.forEach(({ band, list }) => {
      list.forEach((s) => {
        const row = (byYm[s.ym] ||= { ym: s.ym });
        const k = `${band}`;
        (row[`_${k}`] ||= []).push(s.price);
        row[k] = Math.round(row[`_${k}`].reduce((a, v) => a + v, 0) / row[`_${k}`].length);
      });
    });
    return Object.values(byYm).sort((a, b) => a.ym.localeCompare(b.ym));
  }, [bands]);

  // 같은 면적대의 직전 거래 대비 (매매 이력 테이블용)
  const diffOfSale = (s, idx) => {
    const b = Math.round(s.areaM2);
    for (let i = idx + 1; i < sales.length; i++) {
      if (Math.round(sales[i].areaM2) === b) {
        const d = ((s.price - sales[i].price) / sales[i].price) * 100;
        return d;
      }
    }
    return null;
  };

  return (
    <div className="page container">
      <p style={{ marginBottom: 8 }}>
        <Link to="/" style={{ color: 'var(--text-weak)', fontSize: 14 }}>← 실거래 목록으로</Link>
      </p>
      <div className="lc-top">
        <span className="badge cat">아파트</span>
        <span className="lc-district">{district} {dong}</span>
        {status === 'ok' && <span className="badge">실데이터</span>}
      </div>
      <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {name}
        <button
          className={`chip ${faved ? 'on' : ''}`}
          style={{ fontSize: 13 }}
          onClick={() => setFaved(toggleFav(favKey))}
        >
          {faved ? '★ 관심 단지' : '☆ 관심 등록'}
        </button>
        <button className="chip" style={{ fontSize: 13 }} onClick={handleCompare}>
          {compareBaseName ? `⚖ ${compareBaseName}와 비교` : compareBase === meKey ? '⚖ 담김 — 다른 단지에서 비교' : '⚖ 비교 담기'}
        </button>
      </h1>
      <p className="page-sub">
        최근 12개월 거래 이력{builtYear ? ` · ${builtYear}년 준공` : ''}
        {status === 'ok' && <> · 매매 {sales.length}건 · 전세 {rents.filter((r) => r.type === '전세').length}건 · 월세 {rents.filter((r) => r.type === '월세').length}건</>}
      </p>

      {status === 'loading' && (
        <p className="page-sub">12개월 거래 이력을 집계하는 중… (최초 조회는 수 초 걸릴 수 있어요)</p>
      )}
      {status === 'error' && (
        <p className="hint">⚠ 거래 이력을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.</p>
      )}
      {status === 'empty' && (
        <p className="hint">최근 12개월 내 이 단지의 신고된 거래가 없습니다.</p>
      )}

      {status === 'ok' && (
        <>
          {bands.length > 0 && (
            <div className="card" style={{ marginBottom: 14 }}>
              <div className="section-title">면적대별 매매 요약</div>
              <table className="table">
                <thead>
                  <tr>
                    <th>전용</th><th>거래</th><th>최근 거래</th><th className="num">최근가</th>
                    <th className="num">직전 대비</th><th className="num">12개월 최고가</th>
                  </tr>
                </thead>
                <tbody>
                  {bands.map(({ band, list }) => {
                    const latest = list[0];
                    const prev = list.find((s, i) => i > 0);
                    const diff = prev ? ((latest.price - prev.price) / prev.price) * 100 : null;
                    const high = Math.max(...list.map((s) => s.price));
                    return (
                      <tr key={band}>
                        <td>{band}m²</td>
                        <td>{list.length}건</td>
                        <td>{latest.ym.slice(2)}.{latest.date.split('.')[1]}</td>
                        <td className="num">{fmtPrice(latest.price)}</td>
                        <td className="num" style={{ color: diff > 0 ? 'var(--red)' : diff < 0 ? 'var(--blue)' : 'inherit' }}>
                          {diff == null ? '-' : `${diff > 0 ? '+' : ''}${diff.toFixed(1)}%`}
                        </td>
                        <td className="num">
                          {fmtPrice(high)}{latest.price === high && list.length > 1 ? ' 🔺' : ''}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <p className="hint">직전 대비는 같은 면적대의 바로 이전 거래와 비교한 값입니다. 🔺 = 최근 거래가 12개월 최고가(신고가).</p>
            </div>
          )}

          {chartData.length >= 2 && (
            <div className="card" style={{ marginBottom: 14 }}>
              <div className="section-title">면적대별 매매가 추이 (월평균)</div>
              <div style={{ display: 'flex', gap: 14, marginBottom: 6 }}>
                {bands.map(({ band }, i) => (
                  <span key={band} style={{ fontSize: 13, color: 'var(--text-sub)' }}>
                    <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 2, background: LINE_COLORS[i], marginRight: 5 }} />
                    {band}m²
                  </span>
                ))}
              </div>
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={chartData} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e8eb" vertical={false} />
                  <XAxis dataKey="ym" tick={{ fontSize: 11, fill: '#8b95a1' }} />
                  <YAxis tick={{ fontSize: 12, fill: '#8b95a1' }} width={56}
                    domain={['auto', 'auto']}
                    tickFormatter={(v) => `${(v / 10000).toFixed(1).replace(/\.0$/, '')}억`} />
                  <Tooltip formatter={(v, k) => [fmtPrice(v), `${k}m² 월평균`]} />
                  {bands.map(({ band }, i) => (
                    <Line key={band} type="monotone" dataKey={`${band}`} stroke={LINE_COLORS[i]}
                      strokeWidth={2.5} dot={{ r: 3 }} connectNulls />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          <div className="card">
            <div className="section-title">거래 이력</div>
            <div className="filters" style={{ marginBottom: 12 }}>
              {['매매', '전월세'].map((t) => (
                <button key={t} className={`chip ${tab === t ? 'on' : ''}`} onClick={() => setTab(t)}>
                  {t} {t === '매매' ? sales.length : rents.length}건
                </button>
              ))}
            </div>
            {tab === '매매' ? (
              <table className="table">
                <thead>
                  <tr><th>계약일</th><th>전용</th><th>층</th><th className="num">거래가</th><th className="num">같은 면적 직전 대비</th></tr>
                </thead>
                <tbody>
                  {sales.map((s, i) => {
                    const d = diffOfSale(s, i);
                    return (
                      <tr key={i}>
                        <td>{s.ym.slice(2)}.{s.date.split('.')[1]}</td>
                        <td>{s.areaM2}m²</td>
                        <td>{s.floor}층</td>
                        <td className="num">{fmtPrice(s.price)}</td>
                        <td className="num" style={{ color: d > 0 ? 'var(--red)' : d < 0 ? 'var(--blue)' : 'var(--text-weak)' }}>
                          {d == null ? '-' : `${d > 0 ? '+' : ''}${d.toFixed(1)}%`}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <table className="table">
                <thead>
                  <tr><th>계약일</th><th>유형</th><th>전용</th><th>층</th><th className="num">보증금/월세</th></tr>
                </thead>
                <tbody>
                  {rents.map((r, i) => (
                    <tr key={i}>
                      <td>{r.date}</td>
                      <td>{r.type}</td>
                      <td>{r.areaM2}m²</td>
                      <td>{r.floor}층</td>
                      <td className="num">{r.type === '월세' ? `${fmtPrice(r.deposit)}/${r.monthly}` : fmtPrice(r.deposit)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            <p className="hint">
              출처: 국토교통부 실거래가 공개시스템 (계약일 기준 최근 12개월, 해제 거래 제외).
              신고서의 단지명 표기가 달라(띄어쓰기 등) 일부 거래가 나뉘어 보일 수 있습니다.
            </p>
          </div>
        </>
      )}
    </div>
  );
}
