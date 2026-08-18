import { Routes, Route, NavLink, Link, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import Home from './pages/Home.jsx';
import Detail from './pages/Detail.jsx';
import ComplexDetail from './pages/ComplexDetail.jsx';
import HighPage from './pages/HighPage.jsx';
import Market from './pages/Market.jsx';
import Calc from './pages/Calc.jsx';
import Privacy from './pages/Privacy.jsx';
import { DATA_SOURCE } from './data/mock.js';
import { initAds, maybeShowInterstitial } from './ads.js';

export default function App() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); maybeShowInterstitial(); }, [pathname]);
  useEffect(() => { initAds(); }, []);
  useEffect(() => {
    const origin = 'https://apartments.nolsoopgames.com';
    const titles = {
      '/': '아파트 실거래가 조회 — 부르는 값 말고, 팔린 값 | 팔린아파트',
      '/market': '아파트 시세 · 실거래가 추이 | 팔린아파트',
      '/calc': '아파트 대출 · 취득세 계산기 | 팔린아파트',
      '/privacy': '개인정보처리방침 | 팔린아파트',
    };
    const key = pathname.replace(/\/+$/, '') || '/';
    if (titles[key]) document.title = titles[key];
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
