import useTitle from '../useTitle.js';

export default function Privacy() {
  useTitle('개인정보처리방침');
  return (
    <div className="page container" style={{ maxWidth: 720 }}>
      <h1 className="page-title">개인정보처리방침</h1>
      <p className="page-sub">시행일: 2026-08-10</p>

      <div className="card" style={{ lineHeight: 1.8, fontSize: 15 }}>
        <div className="section-title">1. 수집하는 개인정보</div>
        <p>
          팔린아파트(이하 "서비스")는 회원가입 없이 이용하는 서비스로,
          이름·이메일·전화번호 등 개인을 식별할 수 있는 정보를 직접 수집하지 않습니다.
        </p>

        <div className="section-title" style={{ marginTop: 20 }}>2. 자동으로 수집되는 정보</div>
        <p>
          서비스 운영 및 광고 게재 과정에서 다음 정보가 자동으로 수집될 수 있습니다:
          기기 정보(모델·OS 버전), 광고 식별자(ADID), 접속 기록, 쿠키.
        </p>

        <div className="section-title" style={{ marginTop: 20 }}>3. 광고 및 제3자 제공</div>
        <p>
          서비스는 Google AdMob(앱)·광고 네트워크(웹)를 통해 광고를 게재하며,
          이 과정에서 광고 사업자가 광고 식별자와 쿠키를 사용해 맞춤 광고를 제공할 수 있습니다.
          맞춤 광고는 기기 설정(Android: 설정 → Google → 광고)에서 제한할 수 있습니다.
          또한 방문 통계 분석을 위해 Google Analytics를 사용하며, 이 과정에서 쿠키가 이용됩니다.
        </p>

        <div className="section-title" style={{ marginTop: 20 }}>4. 데이터 출처</div>
        <p>
          서비스가 표시하는 실거래 정보는 국토교통부 실거래가 공개시스템의 공공데이터이며,
          개인을 식별할 수 있는 정보를 포함하지 않습니다.
        </p>

        <div className="section-title" style={{ marginTop: 20 }}>5. 보관 및 파기</div>
        <p>
          서비스는 이용자의 개인정보를 서버에 저장하지 않습니다.
          관심 지역 등 설정값은 이용자 기기(브라우저)에만 저장되며 삭제 시 즉시 파기됩니다.
        </p>

        <div className="section-title" style={{ marginTop: 20 }}>6. 문의</div>
        <p>
          개인정보 관련 문의: 서비스 운영자 (이메일 주소는 스토어 등록 페이지에 표기)
        </p>
      </div>
    </div>
  );
}
