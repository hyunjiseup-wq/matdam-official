import { Session, User } from '@supabase/supabase-js';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { emailFromId, isAdminEmail } from '@/lib/admin';
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
}

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

  const signIn = useCallback(async (id: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email: emailFromId(id),
      password,
    });
    if (error) throw new Error(error.message);
  }, []);

  const signUp = useCallback(async (id: string, password: string, name: string) => {
    const { error } = await supabase.auth.signUp({
      email: emailFromId(id),
      password,
      options: { data: { display_name: name } },
    });
    if (error) throw new Error(error.message);
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, session, loading, displayName, isAdmin, signIn, signUp, signOut }}
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
