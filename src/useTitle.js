import { useEffect } from 'react';

const DEFAULT_TITLE = '아파트 실거래가 조회 — 부르는 값 말고, 팔린 값 | 팔린아파트';

// 페이지별 검색 노출용 제목. null이면 기본 제목.
export default function useTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} | 팔린아파트` : DEFAULT_TITLE;
    return () => { document.title = DEFAULT_TITLE; };
  }, [title]);
}
