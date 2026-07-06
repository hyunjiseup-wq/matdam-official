// 비밀번호 찾기 — 마이 탭에서 등록해둔 이메일로 재설정 링크를 보낸다.
// 로그인 전에 접근하는 공개 화면 (_layout 가드에서 예외 처리).
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/context/AuthContext';
import { notify } from '@/lib/confirm';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { requestPasswordReset } = useAuth();
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSend() {
    const v = email.trim();
    if (!v.includes('@')) {
      notify('입력 오류', '가입 후 마이 탭에서 등록한 이메일 주소를 입력해주세요.');
      return;
    }
    setSending(true);
    try {
      await requestPasswordReset(v);
    } catch {
      // 존재 여부를 노출하지 않기 위해 실패해도 같은 안내를 보여준다
    } finally {
      setSending(false);
      setSent(true);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.content}>
        <Text style={styles.emoji}>🔑</Text>
        <Text style={styles.title}>비밀번호 찾기</Text>
        <Text style={styles.sub}>
          마이 탭에서 등록한 이메일 주소를 입력하면{'\n'}재설정 링크를 보내드려요.
        </Text>

        {sent ? (
          <View style={styles.doneBox}>
            <Text style={styles.doneText}>
              등록된 이메일이라면 재설정 링크를 보냈어요.{'\n'}
              메일함(스팸함 포함)을 확인해주세요. 📮
            </Text>
            <Pressable style={styles.btn} onPress={() => router.back()}>
              <Text style={styles.btnText}>로그인으로 돌아가기</Text>
            </Pressable>
          </View>
        ) : (
          <>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="이메일 주소"
              placeholderTextColor="#bbb"
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              returnKeyType="done"
              onSubmitEditing={handleSend}
            />
            <Pressable
              style={({ pressed }) => [styles.btn, pressed && { opacity: 0.85 }, sending && { opacity: 0.6 }]}
              onPress={handleSend}
              disabled={sending}
            >
              <Ionicons name="mail-outline" size={18} color="#fff" />
              <Text style={styles.btnText}>{sending ? '보내는 중...' : '재설정 링크 보내기'}</Text>
            </Pressable>
            <Text style={styles.hint}>
              이메일을 등록한 적이 없다면 링크를 받을 수 없어요.{'\n'}
              이 경우 앱 관리자에게 문의해주세요.
            </Text>
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 24, paddingTop: 60, alignItems: 'center' },
  emoji: { fontSize: 48 },
  title: { fontSize: 22, fontWeight: '800', color: '#1a1a1a', marginTop: 10 },
  sub: { fontSize: 14, color: '#999', marginTop: 8, textAlign: 'center', lineHeight: 21, marginBottom: 28 },
  input: {
    alignSelf: 'stretch',
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: '#222',
    borderWidth: 1,
    borderColor: '#eee',
    marginBottom: 12,
  },
  btn: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FF7A45',
    borderRadius: 14,
    paddingVertical: 15,
  },
  btnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  hint: { fontSize: 12, color: '#bbb', textAlign: 'center', marginTop: 16, lineHeight: 18 },
  doneBox: { alignSelf: 'stretch', gap: 16 },
  doneText: {
    fontSize: 14,
    color: '#00875A',
    backgroundColor: '#E8FFF4',
    borderRadius: 12,
    padding: 16,
    textAlign: 'center',
    lineHeight: 21,
  },
});
