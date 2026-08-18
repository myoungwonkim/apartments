import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BarChart, Bar, Cell, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';
import { DISTRICTS, REGIONS, getPriceSeries, getRecentTrades, getMarketCondition, fmtPrice, DATA_SOURCE } from '../data/mock.js';
import { REGION_DISTRICTS, fetchRecentAptTrades, fetchRecentAptRents, fetchPppSeries } from '../data/api.js';
import useTitle from '../useTitle.js';

const Delta = ({ v }) =>
  v == null ? <span style={{ color: 'var(--text-weak)' }}>-</span> : (
    <span className={v >= 0 ? 'delta-up' : 'delta-down'}>
      {v >= 0 ? '▲' : '▼'} {Math.abs(v).toFixed(1)}%
    </span>
  );

const RealBadge = () => <span className="badge" style={{ marginLeft: 8 }}>실데이터</span>;
const DemoBadge = () => <span className="badge wolse" style={{ marginLeft: 8 }}>데모</span>;

export default function Market() {
  const [region, setRegion] = useState('서울');
  const [district, setDistrict] = useState('강남구');
  const [realTrades, setRealTrades] = useState([]);
  const [tradeStatus, setTradeStatus] = useState('loading'); // loading | real | demo
  const [pppSeries, setPppSeries] = useState([]);
  const [pppStatus, setPppStatus] = useState('loading');     // loading | real | demo
  const [rents, setRents] = useState([]);
  const [rentStatus, setRentStatus] = useState('loading');   // loading | real | error
  const [rentType, setRentType] = useState('전세');

  useTitle(`${district} 아파트 시세·평당가 추이`);

  const regionDistricts = REGION_DISTRICTS.filter((d) => d.region === region);
  const switchRegion = (r) => {
    setRegion(r);
    setDistrict(REGION_DISTRICTS.find((d) => d.region === r).name);
  };

  // 매매 실거래 테이블
  useEffect(() => {
    let alive = true;
    setTradeStatus('loading');
    fetchRecentAptTrades(district)
      .then((t) => { if (alive) { setRealTrades(t.slice(0, 15)); setTradeStatus(t.length ? 'real' : 'demo'); } })
      .catch(() => { if (alive) setTradeStatus('demo'); });
    return () => { alive = false; };
  }, [district]);

  // 평당가 시계열 (13개월)
  useEffect(() => {
    let alive = true;
    setPppStatus('loading');
    fetchPppSeries(district)
      .then((s) => { if (alive) { setPppSeries(s); setPppStatus('real'); } })
      .catch(() => { if (alive) setPppStatus('demo'); });
    return () => { alive = false; };
  }, [district]);

  // 전월세 실거래 (최근 2개월)
  useEffect(() => {
    let alive = true;
    setRentStatus('loading');
    fetchRecentAptRents(district)
      .then((r) => { if (alive) { setRents(r); setRentStatus('real'); } })
      .catch(() => { if (alive) setRentStatus('error'); });
    return () => { alive = false; };
  }, [district]);

  // 데모 폴백 데이터 (초기 16개 지역만 존재 — 그 외 지역은 폴백 없이 실패를 표시)
  const hasDemo = DISTRICTS.some((d) => d.name === district);
  const demoSeries = hasDemo ? getPriceSeries(district) : null;
  const trades = hasDemo ? getRecentTrades(district) : [];
  const cond = hasDemo ? getMarketCondition(district) : null;

  // 통계: 실데이터 우선 (완결된 최근 월 기준), 실패 시 데모
  let statLabel, statCur, statMom, statYoy, statN = null;
  if (pppStatus === 'real') {
    const fulls = pppSeries.filter((d) => !d.partial);
    const cur = fulls[fulls.length - 1];
    const prev = fulls[fulls.length - 2];
    const yoyYm = `${Number(cur.ym.slice(0, 4)) - 1}.${cur.ym.slice(5)}`;
    const yoyBase = pppSeries.find((d) => d.ym === yoyYm);
    statLabel = `평당가 (${cur.ym})`;
    statCur = cur.ppp;
    statN = cur.n;
    statMom = prev ? ((cur.ppp - prev.ppp) / prev.ppp) * 100 : null;
    statYoy = yoyBase ? ((cur.ppp - yoyBase.ppp) / yoyBase.ppp) * 100 : null;
  } else if (demoSeries) {
    const cur = demoSeries[demoSeries.length - 1].ppp;
    const prev1m = demoSeries[demoSeries.length - 2].ppp;
    const prev1y = demoSeries[demoSeries.length - 13].ppp;
    statLabel = '현재 평당가 (데모)';
    statCur = cur;
    statMom = ((cur - prev1m) / prev1m) * 100;
    statYoy = ((cur - prev1y) / prev1y) * 100;
  } else {
    statLabel = '평당가';
    statCur = null;
    statMom = null;
    statYoy = null;
  }

  const rentFiltered = rents.filter((r) => r.type === rentType).slice(0, 10);
  const rentCount = (t) => rents.filter((r) => r.type === t).length;

  return (
    <div className="page container">
      <h1 className="page-title">시세 · 실거래가</h1>
      <p className="page-sub">구별 평당가 추이와 최근 실거래 내역을 확인하세요.</p>

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

      <p style={{ margin: '0 0 16px' }}>
        {(() => {
          const now = new Date();
          const p = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          const ym = `${p.getFullYear()}${String(p.getMonth() + 1).padStart(2, '0')}`;
          return (
            <Link to={`/report/${encodeURIComponent(district)}/${ym}`} className="chip" style={{ textDecoration: 'none' }}>
              📄 {district} {p.getMonth() + 1}월 실거래 리포트 보기 →
            </Link>
          );
        })()}
      </p>

      <div className="stat-row">
        <div className="stat">
          <div className="label">{statLabel}</div>
          <div className="value">{pppStatus === 'loading' ? '…' : statCur != null ? `${statCur.toLocaleString()}만` : '-'}</div>
        </div>
        <div className="stat">
          <div className="label">전월 대비</div>
          <div className="value">{pppStatus === 'loading' ? '…' : <Delta v={statMom} />}</div>
        </div>
        <div className="stat">
          <div className="label">전년 대비</div>
          <div className="value">{pppStatus === 'loading' ? '…' : <Delta v={statYoy} />}</div>
        </div>
        <div className="stat">
          <div className="label">국평(84m²) 환산</div>
          <div className="value">{pppStatus === 'loading' ? '…' : statCur != null ? fmtPrice(Math.round(statCur * 25.7 / 500) * 500) : '-'}</div>
        </div>
        <div className="stat">
          <div className="label">{pppStatus === 'real' ? '기준월 거래량' : '매매 매물 (데모)'}</div>
          <div className="value">{pppStatus === 'real' ? `${statN}건` : cond ? `${cond.saleCount}건` : '-'}</div>
        </div>
        <div className="stat">
          <div className="label">급매 비중 (데모)</div>
          <div className="value">{cond ? `${cond.bargainShare}%` : '-'}</div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 14 }}>
        <div className="section-title">
          {district} 실거래 평당가 추이 (14개월)
          {pppStatus === 'real' && <RealBadge />}
          {pppStatus === 'demo' && <DemoBadge />}
        </div>
        {pppStatus === 'loading' ? (
          <p className="page-sub" style={{ margin: '12px 0' }}>국토부 실거래를 집계하는 중… (최초 조회는 수 초 걸릴 수 있어요)</p>
        ) : pppStatus === 'real' ? (
          <>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={pppSeries} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e8eb" vertical={false} />
                <XAxis dataKey="ym" tick={{ fontSize: 11, fill: '#8b95a1' }} interval={1} />
                <YAxis tick={{ fontSize: 12, fill: '#8b95a1' }} width={52}
                  domain={['auto', 'auto']}
                  tickFormatter={(v) => `${(v / 10000).toFixed(2).replace(/\.?0+$/, '')}억`} />
                <Tooltip formatter={(v, name, p) => [`${v.toLocaleString()}만/평 · ${p.payload.n}건`, '월평균 평당가']} />
                <Bar dataKey="ppp" radius={[4, 4, 0, 0]} maxBarSize={40}>
                  {pppSeries.map((d, i) => (
                    <Cell key={i} fill={d.partial ? '#c9ced6' : '#3182f6'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <p className="hint">
              계약일 기준 월평균 (만원/평) · 회색 막대는 집계 초기라 표본이 적은 달입니다.
              월평균은 그 달의 거래 구성(면적·단지)에 따라 출렁일 수 있어 추세 참고용입니다.
              출처: 국토교통부 실거래가 공개시스템.
            </p>
          </>
        ) : !demoSeries ? (
          <p className="hint">⚠ 실거래 API에 연결하지 못했고, 이 지역은 데모 데이터도 없습니다. 잠시 후 다시 시도해 주세요.</p>
        ) : (
          <>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={demoSeries} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e8eb" />
                <XAxis dataKey="ym" tick={{ fontSize: 12, fill: '#8b95a1' }} interval={5} />
                <YAxis tick={{ fontSize: 12, fill: '#8b95a1' }} width={52}
                  domain={['auto', 'auto']}
                  tickFormatter={(v) => `${(v / 1000).toFixed(1)}천`} />
                <Tooltip formatter={(v) => [`${v.toLocaleString()}만/평`, '평당가']} />
                <Line type="monotone" dataKey="ppp" stroke="#3182f6" strokeWidth={2.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
            <p className="hint">⚠ 실거래 API에 연결하지 못해 데모 데이터를 표시하고 있습니다.</p>
          </>
        )}
      </div>

      <div className="card" style={{ marginBottom: 14 }}>
        <div className="section-title">
          {district} 전월세 실거래 (최근 2개월)
          {rentStatus === 'real' && <RealBadge />}
        </div>
        {rentStatus === 'loading' && (
          <p className="page-sub" style={{ margin: '12px 0' }}>전월세 실거래를 불러오는 중…</p>
        )}
        {rentStatus === 'error' && (
          <p className="hint">⚠ 전월세 실거래를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요. (전월세는 데모 데이터가 없어 대체 표시를 하지 않습니다)</p>
        )}
        {rentStatus === 'real' && (
          <>
            <div className="filters" style={{ marginBottom: 12 }}>
              {['전세', '월세'].map((t) => (
                <button key={t} className={`chip ${rentType === t ? 'on' : ''}`} onClick={() => setRentType(t)}>
                  {t} {rentCount(t).toLocaleString()}건
                </button>
              ))}
            </div>
            <table className="table">
              <thead>
                <tr>
                  <th>계약일</th><th>단지</th><th>전용</th><th>층</th>
                  <th className="num">{rentType === '월세' ? '보증금/월세' : '보증금'}</th>
                </tr>
              </thead>
              <tbody>
                {rentFiltered.map((r, i) => (
                  <tr key={i}>
                    <td>{r.date}</td>
                    <td>
                      <Link to={`/complex/${encodeURIComponent(district)}/${encodeURIComponent(r.dong)}/${encodeURIComponent(r.complex)}`} style={{ color: 'var(--blue-dark)' }}>
                        {r.dong} {r.complex}
                      </Link>
                    </td>
                    <td>{r.areaM2}m²</td>
                    <td>{r.floor}층</td>
                    <td className="num">{rentType === '월세' ? `${fmtPrice(r.deposit)}/${r.monthly}` : fmtPrice(r.deposit)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="hint">출처: 국토교통부 실거래가 공개시스템 (아파트 전월세 신고 자료, 계약일 기준 최근 2개월)</p>
          </>
        )}
      </div>

      <div className="card">
        <div className="section-title">
          {district} 매매 실거래 (최근 3개월)
          {tradeStatus === 'real' && <RealBadge />}
          {tradeStatus === 'demo' && <DemoBadge />}
        </div>
        {tradeStatus === 'loading' ? (
          <p className="page-sub" style={{ margin: '12px 0' }}>국토부 실거래가를 불러오는 중…</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>계약일</th><th>단지</th><th>전용</th><th>층</th><th className="num">거래가</th>
              </tr>
            </thead>
            <tbody>
              {(tradeStatus === 'real' ? realTrades : trades).map((t, i) => (
                <tr key={i}>
                  <td>{tradeStatus === 'real' ? `${t.ym.slice(5)}.${t.date.split('.')[1]}` : t.date}</td>
                  <td>
                    {tradeStatus === 'real' && t.dong ? (
                      <Link to={`/complex/${encodeURIComponent(district)}/${encodeURIComponent(t.dong)}/${encodeURIComponent(t.complex)}`} style={{ color: 'var(--blue-dark)' }}>
                        {t.dong} {t.complex}
                      </Link>
                    ) : t.complex}
                  </td>
                  <td>{t.areaM2}m²</td>
                  <td>{t.floor}층</td>
                  <td className="num">{fmtPrice(t.price)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {tradeStatus === 'real' && (
          <p className="hint">출처: 국토교통부 실거래가 공개시스템 (프록시 경유 조회, 계약일 기준 최근 3개월)</p>
        )}
        {tradeStatus === 'demo' && (
          <p className="hint">⚠ 실거래 API에 연결하지 못해 데모 데이터를 표시하고 있습니다. {DATA_SOURCE.real}</p>
        )}
      </div>
    </div>
  );
}
