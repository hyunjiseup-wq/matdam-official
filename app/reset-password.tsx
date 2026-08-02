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
import { getPasswordValidationError } from '@/lib/password';

export default function ResetPasswordScreen() {
  const router = useRouter();
  const { user, loading, changePassword } = useAuth();
  const [pw1, setPw1] = useState('');
  const [pw2, setPw2] = useState('');
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState('');

  async function handleSave() {
    if (saving) return;
    setFormError('');
    const passwordError = getPasswordValidationError(pw1);
    if (passwordError) {
      setFormError(passwordError);
      return;
    }
    if (pw1 !== pw2) {
      setFormError('두 비밀번호가 서로 달라요.');
      return;
    }
    setSaving(true);
    try {
      await changePassword(pw1);
      notify('변경 완료', '새 비밀번호로 저장됐어요. 다음 로그인부터 사용하세요.');
      router.replace('/' as any);
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

        <View style={[styles.passwordWrap, !!formError && styles.inputError]}>
          <TextInput
            style={styles.passwordInput}
            value={pw1}
            onChangeText={(value) => {
              setPw1(value);
              setFormError('');
            }}
            placeholder="새 비밀번호"
            placeholderTextColor="#bbb"
            secureTextEntry={!showPassword}
            returnKeyType="next"
            editable={!saving}
            maxLength={128}
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={showPassword ? '비밀번호 숨기기' : '비밀번호 보기'}
            onPress={() => setShowPassword((visible) => !visible)}
            hitSlop={10}
            style={styles.passwordToggle}
          >
            <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={21} color="#777" />
          </Pressable>
        </View>
        <View style={[styles.passwordWrap, !!formError && styles.inputError]}>
          <TextInput
            style={styles.passwordInput}
            value={pw2}
            onChangeText={(value) => {
              setPw2(value);
              setFormError('');
            }}
            placeholder="새 비밀번호 확인"
            placeholderTextColor="#bbb"
            secureTextEntry={!showPassword}
            returnKeyType="done"
            onSubmitEditing={handleSave}
            editable={!saving}
            maxLength={128}
          />
        </View>
        {!!formError && (
          <View style={styles.errorBox} accessibilityRole="alert">
            <Ionicons name="alert-circle-outline" size={18} color="#C62828" />
            <Text style={styles.errorText}>{formError}</Text>
          </View>
        )}
        <Pressable
          style={({ pressed }) => [styles.btn, pressed && { opacity: 0.85 }, saving && { opacity: 0.6 }]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Ionicons name="checkmark-circle-outline" size={18} color="#fff" />
          )}
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
  passwordWrap: {
    alignSelf: 'stretch',
    minHeight: 50,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#eee',
    marginBottom: 12,
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
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 7,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#FFEBEE',
    marginBottom: 12,
  },
  errorText: { flex: 1, color: '#B71C1C', fontSize: 13, lineHeight: 19, fontWeight: '600' },
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
