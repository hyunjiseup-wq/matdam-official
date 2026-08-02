export const PASSWORD_MIN_LENGTH = 8;

export function getPasswordValidationError(password: string): string | null {
  if (password.length < PASSWORD_MIN_LENGTH) {
    return `비밀번호는 ${PASSWORD_MIN_LENGTH}자 이상 입력해주세요.`;
  }
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
    return '비밀번호에 영문과 숫자를 모두 포함해주세요.';
  }
  return null;
}

export function assertValidPassword(password: string): void {
  const error = getPasswordValidationError(password);
  if (error) throw new Error(error);
}
