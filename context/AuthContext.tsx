import { Session, User } from '@supabase/supabase-js';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { emailFromId, isAdminEmail } from '@/lib/admin';
import { identifyUser, resetAnalytics, track } from '@/lib/analytics';
import { assertClean } from '@/lib/moderation';
import { registerPushToken, unregisterPushToken } from '@/lib/push';
import { supabase } from '@/lib/supabase';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  displayName: string;
  isAdmin: boolean;
  signIn: (id: string, password: string) => Promise<void>;
  signUp: (id: string, password: string, displayName: string) => Promise<void>;
  signOut: () => Promise<void>;
  deleteAccount: () => Promise<void>;
  registerEmail: (email: string) => Promise<void>;
  changePassword: (newPassword: string) => Promise<void>;
  requestPasswordReset: (email: string) => Promise<void>;
}

const SITE_URL = 'https://matdam-official.vercel.app';

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, sess) => {
      setSession(sess);
    });
    return () => subscription.unsubscribe();
  }, []);

  const user = session?.user ?? null;

  const displayName =
    user?.user_metadata?.display_name ??
    user?.email?.split('@')[0] ??
    '사용자';

  const isAdmin = isAdminEmail(user?.email);

  // 로그인 시 profiles 테이블에 내 정보 등록 (다른 사람이 내 리스트를 찾을 수 있도록)
  // is_admin은 보안상 클라이언트가 쓰지 않는다 — DB에서만 관리 (RLS 컬럼 잠금)
  useEffect(() => {
    if (!user) return;
    supabase
      .from('profiles')
      .upsert({
        id: user.id,
        display_name: displayName,
      })
      .then(({ error }) => {
        if (error) console.warn('[Profile] upsert error:', error.message);
      });
  }, [user?.id, displayName]);

  // 로그인 시 이 기기의 푸시 토큰 등록 (네이티브 전용, 실패해도 무시)
  // + 분석 도구에 사용자 연결 (uid만 — 개인정보 미전송)
  useEffect(() => {
    if (!user) return;
    registerPushToken(user.id);
    identifyUser(user.id);
  }, [user?.id]);

  const signIn = useCallback(async (id: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email: emailFromId(id),
      password,
    });
    if (error) throw new Error(error.message);
  }, []);

  const signUp = useCallback(async (id: string, password: string, name: string) => {
    assertClean(name, '닉네임');
    assertClean(id, '아이디');
    const { error } = await supabase.auth.signUp({
      email: emailFromId(id),
      password,
      options: { data: { display_name: name } },
    });
    if (error) throw new Error(error.message);
    track('회원가입');
  }, []);

  const signOut = useCallback(async () => {
    await unregisterPushToken();
    resetAnalytics();
    await supabase.auth.signOut();
  }, []);

  // 실제 이메일 등록/변경 — 인증 메일의 링크를 눌러야 반영된다.
  // 등록 후에는 이 이메일이 로그인 계정이 된다 (아이디 로그인 → 이메일 로그인).
  const registerEmail = useCallback(async (email: string) => {
    const v = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) throw new Error('올바른 이메일 주소를 입력해주세요.');
    if (v.endsWith(`@${'seoulmatjip.app'}`)) throw new Error('실제 사용하는 이메일을 입력해주세요.');
    const { error } = await supabase.auth.updateUser({ email: v });
    if (error) throw new Error(error.message);
  }, []);

  // 로그인 상태에서 비밀번호 변경 (재설정 링크로 들어온 복구 세션에서도 사용)
  const changePassword = useCallback(async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw new Error(error.message);
  }, []);

  // 비밀번호 재설정 메일 요청 — 등록된 이메일로만 발송된다.
  const requestPasswordReset = useCallback(async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
      redirectTo: `${SITE_URL}/reset-password`,
    });
    if (error) throw new Error(error.message);
  }, []);

  // 계정 삭제: 업로드 사진은 Storage API로 정리(SQL 직접 삭제 금지),
  // 나머지 데이터와 auth 계정은 delete_my_account RPC가 지운다.
  // 삭제 후에는 서버 세션이 이미 사라졌을 수 있으므로 signOut 실패는 무시한다.
  const deleteAccount = useCallback(async () => {
    try {
      const uid = (await supabase.auth.getUser()).data.user?.id;
      if (uid) {
        const { data: files } = await supabase.storage.from('restaurant-photos').list(uid, { limit: 1000 });
        if (files?.length) {
          await supabase.storage.from('restaurant-photos').remove(files.map((f) => `${uid}/${f.name}`));
        }
      }
    } catch {
      // 사진 정리는 best-effort — 실패해도 계정 삭제는 진행
    }
    const { error } = await supabase.rpc('delete_my_account');
    if (error) throw new Error(error.message);
    await supabase.auth.signOut().catch(() => {});
    setSession(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, session, loading, displayName, isAdmin, signIn, signUp, signOut, deleteAccount, registerEmail, changePassword, requestPasswordReset }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
