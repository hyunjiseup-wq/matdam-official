import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
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
import { useAuth } from '@/context/AuthContext';

export default function LoginScreen() {
  const router = useRouter();
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    if (!loginId.trim() || !password.trim()) {
      Alert.alert('입력 오류', '아이디와 비밀번호를 입력해주세요.');
      return;
    }
    if (mode === 'signup' && !displayName.trim()) {
      Alert.alert('입력 오류', '닉네임을 입력해주세요.');
      return;
    }
    setLoading(true);
    try {
      if (mode === 'login') {
        await signIn(loginId.trim(), password);
      } else {
        await signUp(loginId.trim(), password, displayName.trim());
        Alert.alert(
          '가입 완료',
          '회원가입이 완료됐어요! 바로 로그인할 수 있어요.',
          [{ text: '로그인하기', onPress: () => setMode('login') }],
        );
      }
    } catch (e: any) {
      const msg = e.message ?? '오류가 발생했어요.';
      if (msg.includes('Invalid login credentials')) {
        Alert.alert('로그인 실패', '아이디 또는 비밀번호가 틀렸어요.');
      } else if (msg.includes('User already registered')) {
        Alert.alert('이미 있는 아이디', '이미 사용 중인 아이디예요. 로그인하거나 다른 아이디를 써주세요.');
        setMode('login');
      } else if (msg.includes('Password should be')) {
        Alert.alert('비밀번호 오류', '비밀번호는 6자 이상이어야 해요.');
      } else {
        Alert.alert('오류', msg);
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
          {/* 로고 */}
          <View style={styles.logoArea}>
            <Text style={styles.logoEmoji}>🍽️</Text>
            <Text style={styles.logoTitle}>맛담</Text>
            <Text style={styles.logoSub}>맛집을 담고, 친구와 나누는 공간</Text>
          </View>

          {/* 탭 */}
          <View style={styles.tabRow}>
            <Pressable
              onPress={() => setMode('login')}
              style={[styles.tab, mode === 'login' && styles.tabActive]}
            >
              <Text style={[styles.tabText, mode === 'login' && styles.tabTextActive]}>로그인</Text>
            </Pressable>
            <Pressable
              onPress={() => setMode('signup')}
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
                onChangeText={setDisplayName}
                placeholder="닉네임 (예: 푸드마스터)"
                placeholderTextColor="#bbb"
                returnKeyType="next"
              />
            )}
            <TextInput
              style={styles.input}
              value={loginId}
              onChangeText={setLoginId}
              placeholder={mode === 'login' ? '아이디 또는 이메일' : '아이디 (영문/숫자, 예: foodmaster)'}
              placeholderTextColor="#bbb"
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="next"
            />
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="비밀번호 (6자 이상)"
              placeholderTextColor="#bbb"
              secureTextEntry
              returnKeyType="done"
              onSubmitEditing={handleSubmit}
            />
            {mode === 'signup' && (
              <Text style={styles.notice}>
                ⚠️ 개인 이메일·비밀번호 말고{'\n'}새 아이디와 비밀번호를 만들어 쓰세요!{'\n'}
                가입 후 마이 탭에서 이메일을 등록하면{'\n'}비밀번호를 잊어도 찾을 수 있어요.
              </Text>
            )}

            <Pressable
              onPress={handleSubmit}
              disabled={loading}
              style={({ pressed }) => [styles.btn, pressed && { opacity: 0.85 }, loading && { opacity: 0.6 }]}
            >
              <Ionicons name={mode === 'login' ? 'log-in-outline' : 'person-add-outline'} size={20} color="#fff" />
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
  logoEmoji: { fontSize: 56 },
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
  notice: {
    fontSize: 12,
    color: '#E17055',
    lineHeight: 18,
    textAlign: 'center',
    backgroundColor: '#FFF4F0',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginTop: 2,
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
