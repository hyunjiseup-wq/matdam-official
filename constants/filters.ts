export const AREAS = ['성수', '홍대', '합정', '연남', '을지로', '종로', '강남', '압구정', '이태원', '용산', '건대', '신촌', '강동'];

export const CATEGORIES = ['음식점', '한식', '한식/고기', '일식', '횟집', '중식', '양식', '아시안', 'BAR', '카페', '분식', '디저트', '쇼핑', '생활/문화'];

export const CATEGORY_COLORS: Record<string, string> = {
  '음식점': '#E17055',
  '한식': '#E17055',
  '한식/고기': '#D63031',
  '일식': '#0984E3',
  '횟집': '#00A8B5',
  '중식': '#F39C12',
  '양식': '#6C5CE7',
  '아시안': '#6AB04C',
  'BAR': '#E84393',
  '카페': '#00B894',
  '분식': '#F39C12',
  '디저트': '#A29BFE',
  '쇼핑': '#74B9FF',
  '생활/문화': '#55EFC4',
  '마트/편의점': '#B2BEC3',
};

export const CATEGORY_BG: Record<string, string> = {
  '음식점': '#FFF0ED',
  '한식': '#FFF0ED',
  '한식/고기': '#FFE8E8',
  '일식': '#EBF5FF',
  '횟집': '#E4F7F9',
  '중식': '#FFFBEF',
  '양식': '#F0EEFF',
  '아시안': '#F0F9EA',
  'BAR': '#FFF0FA',
  '카페': '#E8FFF9',
  '분식': '#FFF8E8',
  '디저트': '#F5F0FF',
  '쇼핑': '#EBF5FF',
  '생활/문화': '#EFFFFC',
  '마트/편의점': '#F5F5F5',
};

// 가격대 밴드 (폼 선택 + 자동인식 추정 공용)
export const PRICE_RANGES = ['만원 이하', '1~2만원', '2~4만원', '4만원 이상'];

const DISTRICT_TO_AREA: Record<string, string> = {
  '성동구': '성수',
  '마포구': '홍대',
  '서대문구': '신촌',
  '용산구': '이태원',
  '강남구': '강남',
  '서초구': '강남',
  '종로구': '종로',
  '중구': '을지로',
  '광진구': '건대',
  '송파구': '강동',
  '강동구': '강동',
  '동작구': '강남',
  '영등포구': '홍대',
};

export function inferAreaFromAddress(address?: string): string | undefined {
  if (!address) return undefined;
  for (const [district, area] of Object.entries(DISTRICT_TO_AREA)) {
    if (address.includes(district)) return area;
  }
  return undefined;
}

// ── 지역 계층 (전체 → 시/도 → 구) ──────────────────────────────────────────────

// 광역시/도 (주소 첫 단어로 매칭). 약칭/정식 모두 지원
export const PROVINCES = [
  '서울', '경기', '인천', '부산', '대구', '대전', '광주', '울산', '세종',
  '강원', '충북', '충남', '전북', '전남', '경북', '경남', '제주',
];

// 주소에서 시/도 추출
export function inferProvinceFromAddress(address?: string): string | undefined {
  if (!address) return undefined;
  for (const p of PROVINCES) {
    if (address.includes(p)) return p;
  }
  return undefined;
}

// 주소에서 "○○구 / ○○시 / ○○군" 추출 (예: "서울 마포구 ..." → "마포구")
export function inferDistrictFromAddress(address?: string): string | undefined {
  if (!address) return undefined;
  const m = address.match(/([가-힣]+(?:구|시|군))/g);
  if (!m) return undefined;
  // 시/도 약칭과 겹치는 첫 토큰은 건너뜀 (예: "부산시")
  for (const token of m) {
    const bare = token.replace(/(구|시|군)$/, '');
    if (!PROVINCES.includes(bare)) return token;
  }
  return m[0];
}
