import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

// 세션 저장소: 웹은 localStorage(새로고침/탭 종료 후에도 유지), 앱은 AsyncStorage.
// 라이브러리 기본값에 의존하지 않고 명시적으로 지정해 로그인 유지를 보장한다.
const authStorage =
  Platform.OS === 'web'
    ? typeof window !== 'undefined'
      ? window.localStorage
      : undefined
    : AsyncStorage;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: authStorage,
    autoRefreshToken: true,
    persistSession: true,
    // 웹에서 비밀번호 재설정 링크(URL 해시 토큰)로 세션을 복구하려면 필요
    detectSessionInUrl: Platform.OS === 'web',
  },
});
