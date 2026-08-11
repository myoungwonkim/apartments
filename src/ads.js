// AdMob 광고: 하단 배너(상시) + 전면 광고(페이지 이동 시, 빈도 제한).
// 네이티브 앱에서만 동작하며 웹에서는 아무것도 하지 않음.
// 웹뷰 앱에 애드센스를 넣는 것은 구글 정책 위반이므로 앱 광고는 반드시 AdMob 사용.
//
// AdMob 전면 광고 정책 요약:
// - 앱 실행 직후·종료 시점 노출 금지, 사용자가 예상 못 한 시점 노출 금지
import { Capacitor } from '@capacitor/core';

// 실제 AdMob 광고단위 ID (2026-08-10 발급).
// IS_TESTING이 true인 동안은 테스트 광고가 나온다 — 출시 빌드 직전에만 false로 변경할 것.
// (개발 중 실제 광고를 띄우고 본인이 클릭하면 AdMob 계정 정지 사유가 됨)
const BANNER_AD_ID = 'ca-app-pub-4999376453226791/3492152866';
const INTERSTITIAL_AD_ID = 'ca-app-pub-4999376453226791/8361336167';
const IS_TESTING = true;

const LAUNCH_GRACE_MS = 60 * 1000;      // 앱 실행 후 1분간은 전면광고 금지 (정책)
const MIN_INTERVAL_MS = 2 * 60 * 1000;  // 전면광고 최소 간격 2분
const MIN_NAVS_BETWEEN = 3;             // 페이지 이동 3회 이상마다 1회

let AdMobRef = null;
let BannerEnums = null;
let ready = false;
let launchedAt = 0;
let lastShownAt = 0;
let navCount = 0;

// 애드센스 게시자 ID.
// 주의: AdMob 번호와 동일하게 추정한 값 — AdSense(adsense.google.com) 가입 후
// 발급되는 실제 게시자 ID(ca-pub-…)와 대조해서 다르면 교체할 것. public/ads.txt도 함께.
const ADSENSE_CLIENT = 'ca-pub-4999376453226791';

// 웹 전용: 애드센스 자동광고 스크립트 로드.
// 앱(웹뷰)에서 애드센스를 로드하면 구글 정책 위반이므로 네이티브에서는 절대 실행 금지.
function initWebAds() {
  if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') return; // 개발 환경 제외
  if (document.getElementById('adsense-loader')) return;
  const s = document.createElement('script');
  s.id = 'adsense-loader';
  s.async = true;
  s.crossOrigin = 'anonymous';
  s.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`;
  document.head.appendChild(s);
}

export async function initAds() {
  if (!Capacitor.isNativePlatform()) {
    initWebAds();
    return;
  }
  try {
    const mod = await import('@capacitor-community/admob');
    AdMobRef = mod.AdMob;
    BannerEnums = { position: mod.BannerAdPosition, size: mod.BannerAdSize };
    launchedAt = Date.now();
    await AdMobRef.initialize();
    // 하단 상시 배너
    await AdMobRef.showBanner({
      adId: BANNER_AD_ID,
      adSize: BannerEnums.size.ADAPTIVE_BANNER,
      position: BannerEnums.position.BOTTOM_CENTER,
      isTesting: IS_TESTING,
    });
    document.body.classList.add('has-app-banner'); // 배너가 콘텐츠를 가리지 않도록 여백
    await prepareNext();
  } catch (e) {
    console.warn('AdMob 초기화 실패:', e);
  }
}

async function prepareNext() {
  try {
    await AdMobRef.prepareInterstitial({ adId: INTERSTITIAL_AD_ID, isTesting: IS_TESTING });
    ready = true;
  } catch (e) {
    console.warn('전면광고 로드 실패:', e);
  }
}

// 페이지 이동 시 호출. 빈도 조건을 만족할 때만 전면 광고를 띄운다.
export async function maybeShowInterstitial() {
  if (!AdMobRef || !ready) return;
  navCount++;
  const now = Date.now();
  if (now - launchedAt < LAUNCH_GRACE_MS) return;
  if (navCount < MIN_NAVS_BETWEEN) return;
  if (lastShownAt && now - lastShownAt < MIN_INTERVAL_MS) return;
  try {
    ready = false;
    await AdMobRef.showInterstitial();
    lastShownAt = Date.now();
    navCount = 0;
  } catch (e) {
    console.warn('전면광고 표시 실패:', e);
  }
  prepareNext();
}
