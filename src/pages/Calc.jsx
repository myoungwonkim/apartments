import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { fmtPrice } from '../data/mock.js';
import useTitle from '../useTitle.js';

// 원리금균등 월 상환액 (원금 P만원, 연이율 rate%, n개월)
function monthlyPayment(P, rate, n) {
  const r = rate / 100 / 12;
  if (r === 0) return P / n;
  return (P * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
}

// 연간 상환가능액(만원)으로 빌릴 수 있는 원금 역산
function principalFromAnnualPay(annualPay, rate, n) {
  const r = rate / 100 / 12;
  const m = annualPay / 12;
  if (r === 0) return m * n;
  return (m * (Math.pow(1 + r, n) - 1)) / (r * Math.pow(1 + r, n));
}

function Field({ label, value, onChange, suffix, ...rest }) {
  return (
    <div className="field">
      <label>{label}{suffix ? ` (${suffix})` : ''}</label>
      <input type="number" value={value} onChange={(e) => onChange(Number(e.target.value))} {...rest} />
    </div>
  );
}

function LoanLimit({ initPrice }) {
  const [price, setPrice] = useState(initPrice || 90000);   // 만원
  const [income, setIncome] = useState(7000);  // 연소득 만원
  const [existingDebt, setExistingDebt] = useState(0); // 기존 연 원리금 만원
  const [rate, setRate] = useState(4.2);
  const [years, setYears] = useState(30);

  const ltvLimit = Math.round(price * 0.7);
  const dsrBudget = Math.max(0, income * 0.4 - existingDebt);
  const dsrLimit = principalFromAnnualPay(dsrBudget, rate, years * 12);
  const limit = Math.floor(Math.min(ltvLimit, dsrLimit));
  const pay = monthlyPayment(limit, rate, years * 12);

  return (
    <div className="card">
      <Field label="주택 가격" suffix="만원" value={price} onChange={setPrice} step={1000} />
      <Field label="연소득" suffix="만원" value={income} onChange={setIncome} step={100} />
      <Field label="기존 대출 연간 원리금" suffix="만원" value={existingDebt} onChange={setExistingDebt} step={100} />
      <Field label="금리" suffix="%" value={rate} onChange={setRate} step={0.1} />
      <Field label="대출 기간" suffix="년" value={years} onChange={setYears} step={5} />
      <div className="result-box">
        <div className="result-row big"><span className="k">예상 대출 한도</span><span className="v">{fmtPrice(limit)}</span></div>
        <div className="result-row"><span className="k">LTV 70% 한도</span><span className="v">{fmtPrice(Math.floor(ltvLimit))}</span></div>
        <div className="result-row"><span className="k">DSR 40% 한도</span><span className="v">{fmtPrice(Math.floor(dsrLimit))}</span></div>
        <div className="result-row"><span className="k">한도 대출 시 월 상환액</span><span className="v">약 {Math.round(pay).toLocaleString()}만원</span></div>
        <div className="result-row"><span className="k">필요 자기자본</span><span className="v">{fmtPrice(Math.max(0, price - limit))}</span></div>
      </div>
      <p className="hint">
        무주택·비규제지역 LTV 70%, DSR 40%(원리금균등) 기준의 참고 계산입니다.
        실제 한도는 규제지역 여부, 스트레스 DSR, 은행별 심사에 따라 달라집니다.
      </p>
    </div>
  );
}

function Repayment() {
  const [amount, setAmount] = useState(40000);
  const [rate, setRate] = useState(4.2);
  const [years, setYears] = useState(30);
  const [method, setMethod] = useState('원리금균등');

  const n = years * 12;
  const r = rate / 100 / 12;
  let firstPay, totalInterest;
  if (method === '원리금균등') {
    firstPay = monthlyPayment(amount, rate, n);
    totalInterest = firstPay * n - amount;
  } else if (method === '원금균등') {
    firstPay = amount / n + amount * r;
    totalInterest = amount * r * (n + 1) / 2;
  } else {
    firstPay = amount * r;
    totalInterest = amount * r * n;
  }

  return (
    <div className="card">
      <Field label="대출 금액" suffix="만원" value={amount} onChange={setAmount} step={1000} />
      <Field label="금리" suffix="%" value={rate} onChange={setRate} step={0.1} />
      <Field label="대출 기간" suffix="년" value={years} onChange={setYears} step={5} />
      <div className="field">
        <label>상환 방식</label>
        <select value={method} onChange={(e) => setMethod(e.target.value)}>
          <option>원리금균등</option>
          <option>원금균등</option>
          <option>만기일시</option>
        </select>
      </div>
      <div className="result-box">
        <div className="result-row big">
          <span className="k">{method === '원리금균등' ? '월 상환액' : '첫 달 상환액'}</span>
          <span className="v">약 {Math.round(firstPay).toLocaleString()}만원</span>
        </div>
        <div className="result-row"><span className="k">총 이자</span><span className="v">{fmtPrice(Math.round(totalInterest))}</span></div>
        <div className="result-row"><span className="k">총 상환액</span><span className="v">{fmtPrice(Math.round(amount + totalInterest))}</span></div>
      </div>
      {method === '원금균등' && <p className="hint">원금균등은 매달 상환액이 점차 줄어듭니다. 표시된 금액은 첫 달 기준입니다.</p>}
      {method === '만기일시' && <p className="hint">만기일시는 매달 이자만 내고 만기에 원금을 일시 상환합니다.</p>}
    </div>
  );
}

function AcqTax({ initPrice }) {
  const [price, setPrice] = useState(initPrice || 90000);
  const [houses, setHouses] = useState('1주택');
  const [regulated, setRegulated] = useState('비조정');
  const [large, setLarge] = useState('85m² 이하');

  const eok = price / 10000;
  let taxRate;
  if (houses === '1주택' || (houses === '2주택' && regulated === '비조정')) {
    taxRate = eok <= 6 ? 1 : eok >= 9 ? 3 : (eok * 2) / 3 - 3;
  } else if (houses === '2주택') {
    taxRate = 8;
  } else {
    taxRate = regulated === '조정' ? 12 : 8;
  }
  const acqTax = price * taxRate / 100;
  const eduRate = taxRate <= 3 ? taxRate * 0.1 : 0.4;
  const eduTax = price * eduRate / 100;
  const ruralTax = large === '85m² 초과' ? price * 0.2 / 100 : 0;
  const total = acqTax + eduTax + ruralTax;

  return (
    <div className="card">
      <Field label="주택 가격" suffix="만원" value={price} onChange={setPrice} step={1000} />
      <div className="field">
        <label>보유 주택 수 (취득 후 기준)</label>
        <select value={houses} onChange={(e) => setHouses(e.target.value)}>
          <option>1주택</option><option>2주택</option><option>3주택 이상</option>
        </select>
      </div>
      <div className="field">
        <label>조정대상지역 여부</label>
        <select value={regulated} onChange={(e) => setRegulated(e.target.value)}>
          <option>비조정</option><option>조정</option>
        </select>
      </div>
      <div className="field">
        <label>전용면적</label>
        <select value={large} onChange={(e) => setLarge(e.target.value)}>
          <option>85m² 이하</option><option>85m² 초과</option>
        </select>
      </div>
      <div className="result-box">
        <div className="result-row big"><span className="k">총 취득 세금</span><span className="v">{fmtPrice(Math.round(total))}</span></div>
        <div className="result-row"><span className="k">취득세 ({taxRate.toFixed(2)}%)</span><span className="v">{fmtPrice(Math.round(acqTax))}</span></div>
        <div className="result-row"><span className="k">지방교육세 ({eduRate.toFixed(2)}%)</span><span className="v">{fmtPrice(Math.round(eduTax))}</span></div>
        <div className="result-row"><span className="k">농어촌특별세</span><span className="v">{ruralTax ? fmtPrice(Math.round(ruralTax)) : '비과세'}</span></div>
      </div>
      <p className="hint">
        유상취득(매매) 기준 참고 계산입니다. 일시적 2주택 특례, 생애최초 감면 등은 반영되지 않으며
        실제 세액은 세무 전문가 확인이 필요합니다.
      </p>
    </div>
  );
}

const TAB_KEYS = ['대출 한도', '월 상환액', '취득세'];

export default function Calc() {
  const [tab, setTab] = useState('대출 한도');
  const [sp] = useSearchParams();
  // 실거래 목록의 "월 상환액 계산" 버튼에서 가격(만원)을 전달받음
  const initPrice = Math.max(0, Math.round(Number(sp.get('price')))) || null;
  useTitle('부동산 계산기 — 주담대 한도·월 상환액·취득세');
  return (
    <div className="page container" style={{ maxWidth: 620 }}>
      <h1 className="page-title">계산기</h1>
      <p className="page-sub">대출 한도부터 세금까지, 자금 계획을 미리 세워보세요.</p>
      <div className="calc-tabs">
        {TAB_KEYS.map((k) => (
          <button key={k} className={`chip ${tab === k ? 'on' : ''}`} onClick={() => setTab(k)}>
            {k}
          </button>
        ))}
      </div>
      {tab === '대출 한도' && <LoanLimit initPrice={initPrice} />}
      {tab === '월 상환액' && <Repayment />}
      {tab === '취득세' && <AcqTax initPrice={initPrice} />}
    </div>
  );
}
