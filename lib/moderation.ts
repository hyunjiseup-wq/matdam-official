// 금칙어 기본 필터 (출시 체크리스트 B5)
// 닉네임·리뷰·소개·피드백 등 사용자 입력에 적용한다.
// 공백·특수문자를 끼워 넣는 우회를 잡기 위해 한글/영문/숫자만 남기고 비교한다.

const BANNED_WORDS = [
  // 욕설·비속어
  '시발', '씨발', '씨빨', '시빨', '씨팔', '시팔', '싸발', '슈발', 'ㅅㅂ', 'ㅆㅂ',
  '병신', '븅신', 'ㅂㅅ', '빙신',
  '개새끼', '개색기', '개색끼', '개세끼', '새끼야',
  '지랄', 'ㅈㄹ', '좆', '좃같', '존나', '졸라빡',
  '니미', '느금', '엠창', '애미없', '애비없',
  '썅', '꺼져라', '뒤져라', '뒈져',
  '미친놈', '미친년', '또라이', '싸이코년',
  // 혐오 표현
  '급식충', '틀딱', '한남충', '김치녀', '맘충', '짱깨', '쪽바리', '흑형',
  // 성적 표현
  '섹스', '자지', '보지', '야동', '포르노', '창녀', '창남',
  // 사칭·사기 위험
  '관리자사칭', '공식계정',
];

function normalizeForFilter(text: string): string {
  return text.toLowerCase().replace(/[^가-힣ㄱ-ㅎㅏ-ㅣa-z0-9]/g, '');
}

/** 금칙어가 있으면 해당 단어를, 없으면 null을 돌려준다. */
export function findBannedWord(text: string): string | null {
  if (!text) return null;
  const normalized = normalizeForFilter(text);
  for (const word of BANNED_WORDS) {
    if (normalized.includes(normalizeForFilter(word))) return word;
  }
  return null;
}

/** 통과하면 true. 걸리면 notify용 메시지를 던진다. */
export function assertClean(text: string, fieldLabel: string): void {
  const hit = findBannedWord(text);
  if (hit) {
    throw new Error(`${fieldLabel}에 사용할 수 없는 표현이 있어요. 표현을 바꿔주세요.`);
  }
}
