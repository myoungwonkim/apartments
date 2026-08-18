import { Routes, Route, NavLink, Link, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import Home from './pages/Home.jsx';
import Detail from './pages/Detail.jsx';
import ComplexDetail from './pages/ComplexDetail.jsx';
import HighPage from './pages/HighPage.jsx';
import ReportPage from './pages/ReportPage.jsx';
import ComparePage from './pages/ComparePage.jsx';
import Market from './pages/Market.jsx';
import Calc from './pages/Calc.jsx';
import Privacy from './pages/Privacy.jsx';
import { DATA_SOURCE } from './data/mock.js';
import { initAds, maybeShowInterstitial } from './ads.js';

export default function App() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); maybeShowInterstitial(); }, [pathname]);
  useEffect(() => { initAds(); }, []);
  // 캐노니컬 URL을 현재 경로로 갱신. (제목은 각 페이지의 useTitle이 더 구체적으로 설정)
  useEffect(() => {
    const origin = 'https://apartments.nolsoopgames.com';
    const key = pathname.replace(/\/+$/, '') || '/';
    const canonical = document.querySelector('link[rel="canonical"]');
    if (canonical) canonical.setAttribute('href', origin + (key === '/' ? '/' : key));
  }, [pathname]);

  return (
    <>
      <header className="header">
        <div className="header-inner">
          <NavLink to="/" className="logo">팔린아파트</NavLink>
          <nav className="nav">
            <NavLink to="/" end>홈</NavLink>
            <NavLink to="/high">신고가</NavLink>
            <NavLink to="/market">시세</NavLink>
            <NavLink to="/calc">계산기</NavLink>
          </nav>
        </div>
      </header>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/listing/:id" element={<Detail />} />
        <Route path="/complex/:district/:dong/:name" element={<ComplexDetail />} />
        <Route path="/high" element={<HighPage />} />
        <Route path="/report/:district/:ym" element={<ReportPage />} />
        <Route path="/compare" element={<ComparePage />} />
        <Route path="/market" element={<Market />} />
        <Route path="/calc" element={<Calc />} />
        <Route path="/privacy" element={<Privacy />} />
      </Routes>
      <footer className="source-note">
        {DATA_SOURCE.demo}<br />{DATA_SOURCE.real}<br />
        <Link to="/privacy" style={{ textDecoration: 'underline' }}>개인정보처리방침</Link>
      </footer>
    </>
  );
}
