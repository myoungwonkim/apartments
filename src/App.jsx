import { Routes, Route, NavLink, Link, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import Home from './pages/Home.jsx';
import MapPage from './pages/MapPage.jsx';
import Detail from './pages/Detail.jsx';
import Market from './pages/Market.jsx';
import Calc from './pages/Calc.jsx';
import Privacy from './pages/Privacy.jsx';
import { DATA_SOURCE } from './data/mock.js';
import { initAds, maybeShowInterstitial } from './ads.js';

export default function App() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); maybeShowInterstitial(); }, [pathname]);
  useEffect(() => { initAds(); }, []);

  return (
    <>
      <header className="header">
        <div className="header-inner">
          <NavLink to="/" className="logo">팔린아파트</NavLink>
          <nav className="nav">
            <NavLink to="/" end>홈</NavLink>
            <NavLink to="/map">지도</NavLink>
            <NavLink to="/market">시세</NavLink>
            <NavLink to="/calc">계산기</NavLink>
          </nav>
        </div>
      </header>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/map" element={<MapPage />} />
        <Route path="/listing/:id" element={<Detail />} />
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
