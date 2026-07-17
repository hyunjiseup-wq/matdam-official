// 비밀번호 재설정 — 이메일의 재설정 링크로 진입한다 (웹).
// 링크의 복구 토큰이 세션을 만들어주므로, 세션이 있으면 새 비밀번호를 저장한다.
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import BrandIcon from '@/components/BrandIcon';
import { useAuth } from '@/context/AuthContext';
import { notify } from '@/lib/confirm';

export default function ResetPasswordScreen() {
  const router = useRouter();
  const { user, loading, changePassword } = useAuth();
  const [pw1, setPw1] = useState('');
  const [pw2, setPw2] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (pw1.length < 8) {
      notify('입력 오류', '비밀번호는 8자 이상, 영문과 숫자를 포함해야 해요.');
      return;
    }
    if (pw1 !== pw2) {
      notify('입력 오류', '두 비밀번호가 서로 달라요.');
      return;
    }
    setSaving(true);
    try {
      await changePassword(pw1);
      notify('변경 완료', '새 비밀번호로 저장됐어요. 다음 로그인부터 사용하세요.');
      router.replace('/');
    } catch (e: any) {
      notify('변경 실패', e.message ?? '다시 시도해주세요.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#FF7A45" />
        </View>
      </SafeAreaView>
    );
  }

  // 링크가 만료됐거나 잘못 진입한 경우
  if (!user) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.content}>
          <View style={styles.heroIconWrap}>
            <BrandIcon name="warning" size={34} color="#FF7A45" />
          </View>
          <Text style={styles.title}>링크가 만료됐어요</Text>
          <Text style={styles.sub}>
            재설정 링크는 일정 시간이 지나면 만료돼요.{'\n'}다시 요청해주세요.
          </Text>
          <Pressable style={styles.btn} onPress={() => router.replace('/forgot-password' as any)}>
            <Text style={styles.btnText}>재설정 링크 다시 받기</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.content}>
        <View style={styles.heroIconWrap}>
          <BrandIcon name="lock" size={34} color="#FF7A45" />
        </View>
        <Text style={styles.title}>새 비밀번호 설정</Text>
        <Text style={styles.sub}>8자 이상, 영문과 숫자를 포함해주세요.</Text>

        <TextInput
          style={styles.input}
          value={pw1}
          onChangeText={setPw1}
          placeholder="새 비밀번호"
          placeholderTextColor="#bbb"
          secureTextEntry
          returnKeyType="next"
        />
        <TextInput
          style={styles.input}
          value={pw2}
          onChangeText={setPw2}
          placeholder="새 비밀번호 확인"
          placeholderTextColor="#bbb"
          secureTextEntry
          returnKeyType="done"
          onSubmitEditing={handleSave}
        />
        <Pressable
          style={({ pressed }) => [styles.btn, pressed && { opacity: 0.85 }, saving && { opacity: 0.6 }]}
          onPress={handleSave}
          disabled={saving}
        >
          <Ionicons name="checkmark-circle-outline" size={18} color="#fff" />
          <Text style={styles.btnText}>{saving ? '저장 중...' : '비밀번호 변경'}</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { padding: 24, paddingTop: 60, alignItems: 'center' },
  heroIconWrap: { width: 72, height: 72, borderRadius: 24, backgroundColor: '#FFF0E9', alignItems: 'center', justifyContent: 'center' },
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
});
