import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import BrandIcon from '@/components/BrandIcon';
import { useAuth } from '@/context/AuthContext';

export default function LoginScreen() {
  const router = useRouter();
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  function changeMode(nextMode: 'login' | 'signup') {
    if (loading) return;
    setMode(nextMode);
    setFormError('');
    setFormSuccess('');
  }

  async function handleSubmit() {
    if (loading) return;

    const trimmedId = loginId.trim();
    const trimmedName = displayName.trim();
    setFormError('');
    setFormSuccess('');

    if (!trimmedId) {
      setFormError('아이디 또는 이메일을 입력해주세요.');
      return;
    }
    if (!password) {
      setFormError('비밀번호를 입력해주세요.');
      return;
    }
    if (mode === 'signup' && !trimmedName) {
      setFormError('닉네임을 입력해주세요.');
      return;
    }
    if (mode === 'signup' && trimmedName.length < 2) {
      setFormError('닉네임은 2자 이상 입력해주세요.');
      return;
    }
    if (mode === 'signup' && (trimmedId.length < 3 || trimmedId.length > 30)) {
      setFormError('아이디는 3자 이상 30자 이하로 입력해주세요.');
      return;
    }
    if (mode === 'signup' && !/^[a-zA-Z0-9._-]+$/.test(trimmedId)) {
      setFormError('아이디는 영문, 숫자, 마침표, 밑줄, 하이픈만 사용할 수 있어요.');
      return;
    }
    if (mode === 'signup' && password.length < 6) {
      setFormError('비밀번호는 6자 이상 입력해주세요.');
      return;
    }
    setLoading(true);
    try {
      if (mode === 'login') {
        await signIn(trimmedId, password);
      } else {
        await signUp(trimmedId, password, trimmedName);
        setMode('login');
        setPassword('');
        setFormError('');
        setFormSuccess('회원가입이 완료됐어요. 만든 계정으로 로그인해주세요.');
      }
    } catch (e: any) {
      const msg = e.message ?? '오류가 발생했어요.';
      if (msg.includes('Invalid login credentials')) {
        setFormError('아이디 또는 비밀번호가 올바르지 않습니다.');
      } else if (msg.includes('User already registered')) {
        setFormError('이미 사용 중인 아이디예요. 로그인하거나 다른 아이디를 입력해주세요.');
      } else if (msg.includes('Password should be')) {
        setFormError('비밀번호는 6자 이상 입력해주세요.');
      } else {
        setFormError('요청을 처리하지 못했어요. 인터넷 연결을 확인하고 다시 시도해주세요.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {/* 로고 — 브랜드 마크 (핀 속 밥그릇) */}
          <View style={styles.logoArea}>
            <Image source={require('@/assets/icon.png')} style={styles.logoMark} />
            <Text style={styles.logoTitle}>맛담</Text>
            <Text style={styles.logoSub}>맛집을 담고, 친구와 나누는 공간</Text>
          </View>

          {/* 탭 */}
          <View style={styles.tabRow}>
            <Pressable
              onPress={() => changeMode('login')}
              disabled={loading}
              style={[styles.tab, mode === 'login' && styles.tabActive]}
            >
              <Text style={[styles.tabText, mode === 'login' && styles.tabTextActive]}>로그인</Text>
            </Pressable>
            <Pressable
              onPress={() => changeMode('signup')}
              disabled={loading}
              style={[styles.tab, mode === 'signup' && styles.tabActive]}
            >
              <Text style={[styles.tabText, mode === 'signup' && styles.tabTextActive]}>회원가입</Text>
            </Pressable>
          </View>

          {/* 폼 */}
          <View style={styles.form}>
            {mode === 'signup' && (
              <TextInput
                style={styles.input}
                value={displayName}
                onChangeText={(value) => {
                  setDisplayName(value);
                  setFormError('');
                  setFormSuccess('');
                }}
                placeholder="닉네임 (예: 푸드마스터)"
                placeholderTextColor="#bbb"
                returnKeyType="next"
                maxLength={30}
              />
            )}
            <TextInput
              style={styles.input}
              value={loginId}
              onChangeText={(value) => {
                setLoginId(value);
                setFormError('');
                setFormSuccess('');
              }}
              placeholder={mode === 'login' ? '아이디 또는 이메일' : '아이디 (영문/숫자, 예: foodmaster)'}
              placeholderTextColor="#bbb"
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="next"
              maxLength={mode === 'signup' ? 30 : 254}
            />
            <View style={[styles.passwordWrap, !!formError && styles.inputError]}>
              <TextInput
                style={styles.passwordInput}
                value={password}
                onChangeText={(value) => {
                  setPassword(value);
                  setFormError('');
                  setFormSuccess('');
                }}
                placeholder="비밀번호 (6자 이상)"
                placeholderTextColor="#bbb"
                secureTextEntry={!showPassword}
                returnKeyType="done"
                onSubmitEditing={handleSubmit}
                editable={!loading}
                maxLength={128}
              />
              <Pressable
                onPress={() => setShowPassword((visible) => !visible)}
                accessibilityRole="button"
                accessibilityLabel={showPassword ? '비밀번호 숨기기' : '비밀번호 보기'}
                hitSlop={10}
                style={styles.passwordToggle}
              >
                <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={21} color="#777" />
              </Pressable>
            </View>
            {!!formError && (
              <View style={styles.errorBox} accessibilityRole="alert">
                <Ionicons name="alert-circle-outline" size={18} color="#C62828" />
                <Text style={styles.errorText}>{formError}</Text>
              </View>
            )}
            {!!formSuccess && (
              <View style={styles.successBox} accessibilityRole="alert">
                <Ionicons name="checkmark-circle-outline" size={18} color="#087F5B" />
                <Text style={styles.successText}>{formSuccess}</Text>
              </View>
            )}
            {mode === 'signup' && (
              <View style={styles.noticeBox}>
                <BrandIcon name="warning" size={16} color="#E17055" />
                <Text style={styles.notice}>
                  개인 이메일·비밀번호 말고{'\n'}새 아이디와 비밀번호를 만들어 쓰세요!{'\n'}
                  가입 후 마이 탭에서 이메일을 등록하면{'\n'}비밀번호를 잊어도 찾을 수 있어요.
                </Text>
              </View>
            )}

            <Pressable
              onPress={handleSubmit}
              disabled={loading}
              style={({ pressed }) => [styles.btn, pressed && { opacity: 0.85 }, loading && { opacity: 0.6 }]}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Ionicons name={mode === 'login' ? 'log-in-outline' : 'person-add-outline'} size={20} color="#fff" />
              )}
              <Text style={styles.btnText}>
                {loading ? '처리 중...' : mode === 'login' ? '로그인' : '회원가입'}
              </Text>
            </Pressable>
          </View>

          {mode === 'login' && (
            <Text style={styles.forgotLink} onPress={() => router.push('/forgot-password' as any)}>
              비밀번호를 잊으셨나요?
            </Text>
          )}

          <Text style={styles.hint}>
            {mode === 'login'
              ? '아직 계정이 없으신가요? 위에서 회원가입하세요.'
              : '이미 계정이 있으신가요? 위에서 로그인하세요.'}
          </Text>

          {/* 정책 동의 고지 */}
          <View style={styles.policyRow}>
            <Text style={styles.policyText}>
              {mode === 'signup' ? '가입 시 ' : '서비스 이용 시 '}
              <Text style={styles.policyLink} onPress={() => router.push('/policy/terms' as any)}>
                이용약관
              </Text>
              {' 및 '}
              <Text style={styles.policyLink} onPress={() => router.push('/policy/privacy' as any)}>
                개인정보처리방침
              </Text>
              에 동의하는 것으로 간주됩니다.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 24, paddingTop: 60, gap: 0 },
  logoArea: { alignItems: 'center', marginBottom: 40 },
  logoMark: { width: 76, height: 76, borderRadius: 20 },
  logoTitle: { fontSize: 24, fontWeight: '800', color: '#1a1a1a', marginTop: 8 },
  logoSub: { fontSize: 14, color: '#999', marginTop: 6, textAlign: 'center' },
  tabRow: { flexDirection: 'row', marginBottom: 20, borderRadius: 12, backgroundColor: '#f5f5f5', padding: 4 },
  tab: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  tabActive: { backgroundColor: '#fff', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 },
  tabText: { fontSize: 15, color: '#aaa', fontWeight: '600' },
  tabTextActive: { color: '#FF7A45' },
  form: { gap: 12, marginBottom: 16 },
  input: {
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: '#222',
    borderWidth: 1,
    borderColor: '#eee',
  },
  passwordWrap: {
    minHeight: 50,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#eee',
  },
  passwordInput: {
    flex: 1,
    paddingLeft: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: '#222',
  },
  passwordToggle: { paddingHorizontal: 14, alignSelf: 'stretch', justifyContent: 'center' },
  inputError: { borderColor: '#D32F2F', backgroundColor: '#FFF8F8' },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 7,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#FFEBEE',
  },
  errorText: { flex: 1, color: '#B71C1C', fontSize: 13, lineHeight: 19, fontWeight: '600' },
  successBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 7,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#E8FFF4',
  },
  successText: { flex: 1, color: '#087F5B', fontSize: 13, lineHeight: 19, fontWeight: '600' },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FF7A45',
    borderRadius: 14,
    paddingVertical: 16,
    marginTop: 4,
    shadowColor: '#FF7A45',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  noticeBox: {
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFF4F0',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginTop: 2,
  },
  notice: {
    fontSize: 12,
    color: '#E17055',
    lineHeight: 18,
    textAlign: 'center',
  },
  hint: { textAlign: 'center', fontSize: 13, color: '#bbb', marginTop: 8 },
  forgotLink: {
    textAlign: 'center',
    fontSize: 13,
    color: '#FF7A45',
    marginTop: 14,
    textDecorationLine: 'underline',
  },
  policyRow: { marginTop: 20, paddingHorizontal: 12 },
  policyText: { textAlign: 'center', fontSize: 12, color: '#bbb', lineHeight: 18 },
  policyLink: { color: '#FF7A45', textDecorationLine: 'underline' },
});
