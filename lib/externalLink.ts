import * as Linking from 'expo-linking';

export async function openExternalLink(rawUrl: string): Promise<void> {
  const value = rawUrl.trim();
  let parsed: URL;

  try {
    parsed = new URL(value);
  } catch {
    throw new Error('올바르지 않은 링크예요.');
  }

  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
    throw new Error('안전하지 않은 링크는 열 수 없어요.');
  }

  await Linking.openURL(parsed.toString());
}

export function isSafeExternalUrl(rawUrl: string): boolean {
  try {
    const parsed = new URL(rawUrl.trim());
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}
