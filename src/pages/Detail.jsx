import { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';
import { listings, getPriceSeries, getOutlook, fmtPrice, priceLabel, DATA_SOURCE } from '../data/mock.js';
import ListingCard from '../components/ListingCard.jsx';

const BADGE_CLASS = { 매매: '', 전세: 'jeonse', 월세: 'wolse' };

function Stars({ n }) {
  return <span className="stars">{'★'.repeat(n)}{'☆'.repeat(5 - n)}</span>;
}

export default function Detail() {
  const { id } = useParams();
  const l = listings.find((x) => x.id === Number(id));

  // 위치 미니 지도
  useEffect(() => {
    if (!l) return;
    const map = L.map('detail-map', { scrollWheelZoom: false }).setView([l.lat, l.lng], 15);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);
    const icon = L.divIcon({
      className: '',
      html: `<div class="price-marker">${priceLabel(l)}</div>`,
      iconAnchor: [30, 14],
    });
    L.marker([l.lat, l.lng], { icon }).addTo(map);
    return () => map.remove();
  }, [l]);

  if (!l) {
    return (
      <div className="page container">
        <h1 className="page-title">매물을 찾을 수 없어요</h1>
        <Link to="/" className="chip">매물 목록으로</Link>
      </div>
    );
  }

  const series = getPriceSeries(l.district);
  const curPpp = series[series.length - 1].ppp;
  const outlook = getOutlook(l);
  const diff = l.type === '매매' ? l.price - l.estimate : null;
  const isLand = l.category === '토지';
  const nearby = listings
    .filter((x) => x.district === l.district && x.id !== l.id)
    .sort((a, b) => (b.category === l.category) - (a.category === l.category))
    .slice(0, 3);

  return (
    <div className="page container">
      <div className="detail-hero">
        <div className="lc-top">
          <span className="badge cat">{l.category}</span>
          <span className={`badge ${BADGE_CLASS[l.type]}`}>{l.type}</span>
          <span className="lc-district">{l.district}</span>
        </div>
        <h1 className="page-title">{l.complex}</h1>
        <div className="lc-price" style={{ fontSize: 28 }}>{priceLabel(l)}</div>
        <p className="page-sub" style={{ marginBottom: 0 }}>{l.desc}</p>
      </div>

      <p className="hint" style={{ marginBottom: 20 }}>
        이 매물에 등록된 사진이 없습니다. 사진은 매물 등록 시 제공되는 경우에만 표시됩니다.
      </p>

      <div className="detail-grid">
        <div className="card">
          <div className="section-title">기본 정보</div>
          <div className="kv"><span className="k">면적</span><span className="v">{l.areaM2}m² ({l.pyeong}평)</span></div>
          <div className="kv"><span className="k">방향</span><span className="v">{l.direction}</span></div>
          {isLand ? (
            <>
              <div className="kv"><span className="k">유형(지목)</span><span className="v">{l.landType}</span></div>
              <div className="kv"><span className="k">용도지역</span><span className="v">{l.landZone}</span></div>
              <div className="kv"><span className="k">평당가</span><span className="v">{Math.round(l.price / l.pyeong).toLocaleString()}만/평</span></div>
            </>
          ) : (
            <>
              <div className="kv"><span className="k">구조</span><span className="v">{l.rooms}</span></div>
              <div className="kv"><span className="k">층수</span><span className="v">{l.floor}층 / {l.totalFloor}층</span></div>
              <div className="kv"><span className="k">준공</span><span className="v">{l.builtYear}년 {l.builtMonth}월</span></div>
              {l.type === '월세' && (
                <div className="kv"><span className="k">보증금 / 월세</span><span className="v">{fmtPrice(l.price)} / {l.monthly}만</span></div>
              )}
            </>
          )}
        </div>

        <div className="card">
          <div className="section-title">주변 시세 대비</div>
          <div className="kv"><span className="k">주변 시세 추정가{isLand ? '' : ' (매매)'}</span><span className="v">{fmtPrice(l.estimate)}</span></div>
          {diff !== null && (
            <div className="kv">
              <span className="k">시세 대비</span>
              <span className="v" style={{ color: diff > 0 ? 'var(--red)' : diff < 0 ? 'var(--blue)' : 'inherit' }}>
                {diff === 0 ? '시세 수준' : `${diff > 0 ? '+' : '-'}${fmtPrice(Math.abs(diff))} (${l.marketDiffPct > 0 ? '+' : ''}${l.marketDiffPct}%) ${diff > 0 ? '높음' : '낮음'}`}
              </span>
            </div>
          )}
          {l.type === '전세' && (
            <div className="kv"><span className="k">전세가율</span><span className="v">{Math.round((l.price / l.estimate) * 100)}%</span></div>
          )}
          {!isLand && (
            <div className="kv"><span className="k">{l.district} 아파트 평당가</span><span className="v">{curPpp.toLocaleString()}만/평</span></div>
          )}
          <p className="hint">
            시세 추정가는 {l.district} {l.category} 평균 평당가 × 면적 기준의 참고값입니다.
            {' '}{DATA_SOURCE.demo}
          </p>
        </div>

        <div className="card full">
          <div className="section-title">향후 가치 전망 · 현재 판매 상황 기준</div>
          <span className={`outlook-badge grade-${outlook.grade.cls}`}>{outlook.grade.label}</span>
          <div className="cond-row">
            <span className="cond-item">{l.district} 매매 매물 <b>{outlook.condition.saleCount}건</b></span>
            <span className="cond-item">급매 비중 <b>{outlook.condition.bargainShare}%</b></span>
            <span className="cond-item">3개월 시세 <b>{outlook.condition.mom3 >= 0 ? '+' : ''}{outlook.condition.mom3}%</b></span>
            <span className="cond-item">전년 대비 <b>{outlook.condition.yoy >= 0 ? '+' : ''}{outlook.condition.yoy}%</b></span>
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
            현재 판매 상황(매물·급매 비중·시세 흐름)과 물건 요인을 점수화한 규칙 기반 참고 지표입니다.
            투자 권유나 수익 보장이 아니며, 실제 가치는 시장 상황에 따라 달라질 수 있습니다.
          </p>
        </div>

        <div className="card">
          <div className="section-title">최근 이슈</div>
          <p style={{ fontSize: 15, fontWeight: 600 }}>
            {l.issue === '특이사항 없음' ? '보고된 이슈가 없어요.' : l.issue}
          </p>
          <p className="hint">재건축·리모델링·개발계획 등 물건에 영향을 주는 사항을 표시합니다.</p>
        </div>

        <div className="card">
          <div className="section-title">인프라</div>
          <div className="lc-tags" style={{ marginTop: 0 }}>
            {l.infra.map((t) => <span key={t} className="infra-tag" style={{ fontSize: 13, padding: '6px 10px' }}>{t}</span>)}
          </div>
        </div>

        <div className="card full">
          <div className="section-title">위치 · {l.district}</div>
          <div id="detail-map" className="detail-map" />
          <p className="hint">데모 좌표입니다. 실매물 연동 시 실제 소재지 좌표로 표시됩니다.</p>
        </div>

        {!isLand && (
          <div className="card full">
            <div className="section-title">주민 리뷰 <span style={{ color: 'var(--text-weak)', fontWeight: 500, fontSize: 14 }}>({l.reviews.length})</span></div>
            {l.reviews.map((r, i) => (
              <div key={i} className="review-card">
                <div className="review-head">
                  <Stars n={r.rating} />
                  <span className="who">{r.author} · {r.date}</span>
                </div>
                <div className="review-text">{r.text}</div>
              </div>
            ))}
          </div>
        )}

        <div className="card full">
          <div className="section-title">
            {l.district} 아파트 평당가 추이 (36개월){isLand || l.category === '빌라' ? ' · 참고 지표' : ''}
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={series} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e8eb" />
              <XAxis dataKey="ym" tick={{ fontSize: 12, fill: '#8b95a1' }} interval={5} />
              <YAxis tick={{ fontSize: 12, fill: '#8b95a1' }} width={52}
                domain={['auto', 'auto']}
                tickFormatter={(v) => `${(v / 1000).toFixed(1)}천`} />
              <Tooltip formatter={(v) => [`${v.toLocaleString()}만/평`, '평당가']} />
              <Line type="monotone" dataKey="ppp" stroke="#3182f6" strokeWidth={2.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={{ marginTop: 28 }}>
        <div className="section-title">{l.district}의 다른 매물</div>
        <div className="listing-grid">
          {nearby.map((x) => <ListingCard key={x.id} l={x} />)}
        </div>
      </div>
    </div>
  );
}
