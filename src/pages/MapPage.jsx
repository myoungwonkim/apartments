import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { listings, priceLabel } from '../data/mock.js';

const TYPES = ['전체', '매매', '전세', '월세'];
const CATS = ['전체', '아파트', '빌라', '토지'];
const REGS = ['전체', '서울', '경기'];
const MARKER_CLASS = { 매매: '', 전세: 'jeonse', 월세: 'wolse' };
const REGION_VIEW = {
  전체: { center: [37.48, 127.0], zoom: 10 },
  서울: { center: [37.545, 126.99], zoom: 11 },
  경기: { center: [37.42, 127.02], zoom: 10 },
};

export default function MapPage() {
  const mapRef = useRef(null);
  const layerRef = useRef(null);
  const [type, setType] = useState('전체');
  const [cat, setCat] = useState('전체');
  const [region, setRegion] = useState('전체');
  const navigate = useNavigate();

  useEffect(() => {
    const map = L.map('map', { scrollWheelZoom: true }).setView(REGION_VIEW['전체'].center, REGION_VIEW['전체'].zoom);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);
    mapRef.current = map;
    layerRef.current = L.layerGroup().addTo(map);
    return () => map.remove();
  }, []);

  // 권역 변경 시에만 지도 이동 (필터 변경 때는 시점 유지)
  useEffect(() => {
    const view = REGION_VIEW[region];
    mapRef.current?.setView(view.center, view.zoom);
  }, [region]);

  useEffect(() => {
    const layer = layerRef.current;
    if (!layer) return;
    layer.clearLayers();
    listings
      .filter((l) =>
        (type === '전체' || l.type === type) &&
        (cat === '전체' || l.category === cat) &&
        (region === '전체' || l.region === region))
      .forEach((l) => {
        const icon = L.divIcon({
          className: '',
          html: `<div class="price-marker ${MARKER_CLASS[l.type]}">${priceLabel(l)}</div>`,
          iconAnchor: [30, 14],
        });
        const marker = L.marker([l.lat, l.lng], { icon }).addTo(layer);
        marker.bindPopup(
          `<div style="min-width:180px">
            <div style="font-weight:700;margin-bottom:4px">${l.complex}</div>
            <div style="color:#4e5968;font-size:13px">${l.category} · ${l.type} ${priceLabel(l)} · ${l.areaM2}m²${l.category === '토지' ? '' : ` · ${l.floor}층`}</div>
            <button id="go-${l.id}" style="margin-top:8px;width:100%;padding:8px;border:none;border-radius:8px;background:#3182f6;color:#fff;font-weight:700;cursor:pointer">상세 보기</button>
          </div>`
        );
        marker.on('popupopen', () => {
          document.getElementById(`go-${l.id}`)?.addEventListener('click', () => navigate(`/listing/${l.id}`));
        });
      });
  }, [type, cat, region, navigate]);

  return (
    <div className="page container">
      <h1 className="page-title">지도로 찾기 <span className="badge wolse" style={{ verticalAlign: 'middle' }}>데모</span></h1>
      <p className="page-sub">지도의 매물 위치·가격은 데모 데이터입니다. 실거래에는 좌표 정보가 없어 실데이터 지도는 추후 지오코딩 연동이 필요합니다.</p>
      <div className="map-wrap">
        <div className="map-filters">
          <div className="map-filter-row">
            {REGS.map((r) => (
              <button key={r} className={`chip ${region === r ? 'on' : ''}`} onClick={() => setRegion(r)}>
                {r === '전체' ? '수도권' : r}
              </button>
            ))}
          </div>
          <div className="map-filter-row">
            {CATS.map((c) => (
              <button key={c} className={`chip ${cat === c ? 'on' : ''}`} onClick={() => setCat(c)}>
                {c}
              </button>
            ))}
          </div>
          <div className="map-filter-row">
            {TYPES.map((t) => (
              <button key={t} className={`chip ${type === t ? 'on' : ''}`} onClick={() => setType(t)}>
                {t}
              </button>
            ))}
          </div>
        </div>
        <div id="map" />
      </div>
    </div>
  );
}
