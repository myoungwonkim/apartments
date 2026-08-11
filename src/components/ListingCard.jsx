import { Link } from 'react-router-dom';
import { priceLabel, getOutlook } from '../data/mock.js';

const BADGE_CLASS = { 매매: '', 전세: 'jeonse', 월세: 'wolse' };

export default function ListingCard({ l }) {
  const meta =
    l.category === '토지'
      ? `${l.areaM2}m² (${l.pyeong}평) · ${l.direction} · ${l.landType} · ${l.landZone}`
      : `${l.areaM2}m² (${l.pyeong}평) · ${l.rooms} · ${l.direction} · ${l.floor}/${l.totalFloor}층`;
  const sub =
    l.category === '토지'
      ? l.desc
      : `${l.builtYear}.${String(l.builtMonth).padStart(2, '0')} 준공 · ${l.desc}`;

  return (
    <Link to={`/listing/${l.id}`} className="listing-card">
      <div className="lc-top">
        <span className="badge cat">{l.category}</span>
        <span className={`badge ${BADGE_CLASS[l.type]}`}>{l.type}</span>
        <span className="lc-district">{l.district}</span>
        {l.type === '매매' && l.marketDiffPct !== 0 && (
          <span className={`diff-tag ${l.marketDiffPct < 0 ? 'down' : 'up'}`}>
            시세 대비 {l.marketDiffPct > 0 ? '+' : ''}{l.marketDiffPct}%
          </span>
        )}
      </div>
      <div className="lc-price">{priceLabel(l)}</div>
      <div className="lc-name">{l.complex}</div>
      <div className="lc-meta">{meta}</div>
      <div className="lc-meta">{sub}</div>
      <div className="lc-tags">
        <span className={`outlook-tag grade-${getOutlook(l).grade.cls}`}>전망 · {getOutlook(l).grade.label}</span>
        {l.infra.slice(0, 2).map((t) => (
          <span key={t} className="infra-tag">{t}</span>
        ))}
        {l.issue !== '특이사항 없음' && <span className="infra-tag issue">{l.issue}</span>}
      </div>
    </Link>
  );
}
