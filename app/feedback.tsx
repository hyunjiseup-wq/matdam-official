import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
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
import { useRestaurants } from '@/context/RestaurantContext';

const TYPES = [
  { value: 'general', label: '💬 일반 피드백', color: '#6C5CE7' },
  { value: 'feature', label: '✨ 기능 요청', color: '#00B894' },
  { value: 'bug', label: '🐛 버그 신고', color: '#FF7A45' },
  { value: 'data', label: '📍 맛집 정보 수정', color: '#FDCB6E' },
];

export default function FeedbackScreen() {
  const router = useRouter();
  const { submitFeedback } = useRestaurants();
  const [type, setType] = useState('general');
  const [content, setContent] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  async function handleSend() {
    if (sending || sent) return; // 중복 전송 방지
    if (!content.trim()) {
      setErrorMsg('내용을 입력해주세요.');
      return;
    }
    setErrorMsg('');
    setSending(true);
    try {
      await submitFeedback(type, content.trim());
      setSent(true); // 완료 화면 표시
    } catch {
      setErrorMsg('전송에 실패했어요. 잠시 후 다시 시도해주세요.');
    } finally {
      setSending(false);
    }
  }

  // ── 전송 완료 화면 ──────────────────────────────────────────────────────
  if (sent) {
    return (
      <SafeAreaView style={styles.safe} edges={['bottom']}>
        <View style={styles.doneBox}>
          <View style={styles.doneCircle}>
            <Ionicons name="checkmark" size={48} color="#fff" />
          </View>
          <Text style={styles.doneTitle}>피드백이 전송됐어요!</Text>
          <Text style={styles.doneSub}>소중한 의견 정말 감사합니다 😊</Text>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [styles.doneBtn, pressed && { opacity: 0.85 }]}
          >
            <Text style={styles.doneBtnText}>확인</Text>
          </Pressable>
          <Pressable onPress={() => router.replace('/my-feedback' as any)} style={styles.doneLink}>
            <Ionicons name="chatbubbles-outline" size={16} color="#6C5CE7" />
            <Text style={styles.doneLinkText}>내 피드백 / 관리자 답변 보기</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.desc}>
            불편한 점, 추가됐으면 하는 기능, 잘못된 맛집 정보 등 뭐든 알려주세요!
          </Text>

          <Pressable onPress={() => router.push('/my-feedback' as any)} style={styles.myFbLink}>
            <Ionicons name="chatbubbles-outline" size={16} color="#6C5CE7" />
            <Text style={styles.myFbText}>내가 보낸 피드백 / 관리자 답변 보기 →</Text>
          </Pressable>

          {/* 유형 선택 */}
          <View style={styles.typeGrid}>
            {TYPES.map((t) => (
              <Pressable
                key={t.value}
                onPress={() => setType(t.value)}
                style={[
                  styles.typeChip,
                  type === t.value && { backgroundColor: t.color, borderColor: t.color },
                ]}
              >
                <Text style={[styles.typeText, type === t.value && { color: '#fff' }]}>
                  {t.label}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* 내용 */}
          <TextInput
            style={styles.textarea}
            value={content}
            onChangeText={(v) => {
              setContent(v);
              if (errorMsg) setErrorMsg('');
            }}
            placeholder="내용을 자유롭게 적어주세요..."
            placeholderTextColor="#bbb"
            multiline
            numberOfLines={6}
            textAlignVertical="top"
            editable={!sending}
          />

          {errorMsg ? <Text style={styles.error}>{errorMsg}</Text> : null}

          <Pressable
            onPress={handleSend}
            disabled={sending}
            style={({ pressed }) => [styles.btn, pressed && { opacity: 0.85 }, sending && { opacity: 0.6 }]}
          >
            <Ionicons name={sending ? 'hourglass-outline' : 'send'} size={18} color="#fff" />
            <Text style={styles.btnText}>{sending ? '전송 중...' : '피드백 보내기'}</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F5F5F5' },
  content: { padding: 16, gap: 14, paddingBottom: 40 },
  desc: { fontSize: 14, color: '#666', lineHeight: 20 },
  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  typeChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#ddd',
    backgroundColor: '#fff',
  },
  typeText: { fontSize: 13, color: '#555', fontWeight: '500' },
  textarea: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: '#222',
    borderWidth: 1,
    borderColor: '#eee',
    minHeight: 140,
  },
  error: { color: '#FF7A45', fontSize: 13, marginTop: -4 },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FF7A45',
    borderRadius: 14,
    paddingVertical: 16,
    shadowColor: '#FF7A45',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },

  doneBox: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 32 },
  doneCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#00B894',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  doneTitle: { fontSize: 20, fontWeight: '800', color: '#1a1a1a' },
  doneSub: { fontSize: 14, color: '#888' },
  doneLink: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
  doneLinkText: { color: '#6C5CE7', fontSize: 14, fontWeight: '600' },
  myFbLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F0EEFF',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  myFbText: { color: '#6C5CE7', fontSize: 13, fontWeight: '600' },
  doneBtn: {
    marginTop: 16,
    backgroundColor: '#FF7A45',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 48,
  },
  doneBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
