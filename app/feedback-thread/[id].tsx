import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
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
import { confirmAction, notify } from '@/lib/confirm';
import { useAuth } from '@/context/AuthContext';
import { useRestaurants } from '@/context/RestaurantContext';
import { Feedback, FeedbackReply, FeedbackStatus } from '@/types/restaurant';

const TYPE_LABEL: Record<string, string> = {
  general: '💬 일반',
  feature: '✨ 기능 요청',
  bug: '🐛 버그',
  data: '📍 정보 수정',
};

const STATUS_LABEL: Record<FeedbackStatus, { label: string; color: string; bg: string }> = {
  open: { label: '확인 중', color: '#E1A100', bg: '#FFF8E8' },
  resolved: { label: '처리 완료', color: '#00B894', bg: '#E8FFF9' },
  archived: { label: '보관됨', color: '#888', bg: '#f0f0f0' },
};

export default function FeedbackThreadScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user, isAdmin } = useAuth();
  const {
    getFeedbackById,
    getFeedbackReplies,
    addFeedbackReply,
    setFeedbackStatus,
    deleteFeedback,
  } = useRestaurants();

  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [replies, setReplies] = useState<FeedbackReply[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);

  const load = useCallback(async () => {
    const [fb, reps] = await Promise.all([getFeedbackById(id), getFeedbackReplies(id)]);
    setFeedback(fb);
    setReplies(reps);
    setLoading(false);
  }, [id, getFeedbackById, getFeedbackReplies]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#FF6B6B" />
      </View>
    );
  }

  if (!feedback) {
    return (
      <View style={styles.center}>
        <Text style={styles.muted}>피드백을 찾을 수 없어요</Text>
      </View>
    );
  }

  // 권한: 관리자이거나 작성자 본인만 열람
  const isAuthor = feedback.user_id && feedback.user_id === user?.id;
  if (!isAdmin && !isAuthor) {
    return (
      <View style={styles.center}>
        <Ionicons name="lock-closed-outline" size={40} color="#ccc" />
        <Text style={styles.muted}>볼 수 없는 대화예요</Text>
      </View>
    );
  }

  async function handleSend() {
    if (sending || !text.trim()) return;
    setSending(true);
    try {
      await addFeedbackReply(id, text.trim());
      setText('');
      await load();
    } catch (e: any) {
      notify('오류', e.message ?? '전송 실패');
    } finally {
      setSending(false);
    }
  }

  async function changeStatus(status: FeedbackStatus) {
    try {
      await setFeedbackStatus(id, status);
      setFeedback((f) => (f ? { ...f, status } : f));
    } catch (e: any) {
      notify('오류', e.message ?? '');
    }
  }

  function handleDelete() {
    confirmAction('피드백 삭제', '이 피드백과 대화를 모두 삭제할까요?', async () => {
      try {
        await deleteFeedback(id);
        router.back();
      } catch (e: any) {
        notify('오류', e.message ?? '');
      }
    }, '삭제', true);
  }

  const st = STATUS_LABEL[feedback.status];

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content}>
          {/* 원본 피드백 */}
          <View style={styles.originCard}>
            <View style={styles.originHeader}>
              <Text style={styles.typeLabel}>{TYPE_LABEL[feedback.type] ?? feedback.type}</Text>
              <View style={[styles.statusBadge, { backgroundColor: st.bg }]}>
                <Text style={[styles.statusText, { color: st.color }]}>{st.label}</Text>
              </View>
            </View>
            <Text style={styles.originContent}>{feedback.content}</Text>
            <Text style={styles.originMeta}>
              — {feedback.display_name ?? '익명'} · {new Date(feedback.created_at).toLocaleDateString('ko-KR')}
            </Text>
          </View>

          {/* 관리자 컨트롤 */}
          {isAdmin && (
            <View style={styles.adminBar}>
              <Pressable onPress={() => changeStatus('resolved')} style={[styles.adminBtn, { borderColor: '#00B894' }]}>
                <Text style={[styles.adminBtnText, { color: '#00B894' }]}>처리완료</Text>
              </Pressable>
              <Pressable onPress={() => changeStatus('archived')} style={[styles.adminBtn, { borderColor: '#888' }]}>
                <Text style={[styles.adminBtnText, { color: '#888' }]}>보관</Text>
              </Pressable>
              <Pressable onPress={() => changeStatus('open')} style={[styles.adminBtn, { borderColor: '#E1A100' }]}>
                <Text style={[styles.adminBtnText, { color: '#E1A100' }]}>다시열기</Text>
              </Pressable>
              <Pressable onPress={handleDelete} style={[styles.adminBtn, { borderColor: '#FF6B6B' }]}>
                <Ionicons name="trash-outline" size={14} color="#FF6B6B" />
              </Pressable>
            </View>
          )}

          {/* 대화 */}
          <Text style={styles.threadTitle}>대화 {replies.length > 0 ? `(${replies.length})` : ''}</Text>
          {replies.length === 0 ? (
            <Text style={styles.muted}>
              {isAdmin ? '답글을 남기면 작성자에게 보여요.' : '관리자 답변을 기다리는 중이에요.'}
            </Text>
          ) : (
            replies.map((r) => {
              const mine = r.user_id === user?.id;
              return (
                <View key={r.id} style={[styles.bubbleRow, mine ? styles.rowRight : styles.rowLeft]}>
                  <View style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleOther, r.is_admin && styles.bubbleAdmin]}>
                    <Text style={[styles.bubbleName, mine && { color: '#ffffffcc' }]}>
                      {r.display_name}{r.is_admin ? ' 👑' : ''}
                    </Text>
                    <Text style={[styles.bubbleText, mine && { color: '#fff' }]}>{r.content}</Text>
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>

        {/* 입력 */}
        <View style={styles.inputBar}>
          <TextInput
            style={styles.input}
            value={text}
            onChangeText={setText}
            placeholder={isAdmin ? '답변 입력...' : '추가 의견 입력...'}
            placeholderTextColor="#bbb"
            multiline
          />
          <Pressable onPress={handleSend} disabled={sending} style={[styles.sendBtn, sending && { opacity: 0.5 }]}>
            <Ionicons name="send" size={18} color="#fff" />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F5F5F5' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
  muted: { fontSize: 14, color: '#aaa', textAlign: 'center', paddingVertical: 12 },
  content: { padding: 16, gap: 10 },
  originCard: { backgroundColor: '#fff', borderRadius: 14, padding: 16, gap: 8 },
  originHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  typeLabel: { fontSize: 13, fontWeight: '700', color: '#6C5CE7' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 12, fontWeight: '700' },
  originContent: { fontSize: 15, color: '#333', lineHeight: 22 },
  originMeta: { fontSize: 12, color: '#bbb' },
  adminBar: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  adminBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1.5,
    backgroundColor: '#fff',
  },
  adminBtnText: { fontSize: 12, fontWeight: '700' },
  threadTitle: { fontSize: 14, fontWeight: '700', color: '#555', marginTop: 6 },
  bubbleRow: { flexDirection: 'row' },
  rowLeft: { justifyContent: 'flex-start' },
  rowRight: { justifyContent: 'flex-end' },
  bubble: { maxWidth: '80%', borderRadius: 14, padding: 10, gap: 2 },
  bubbleMine: { backgroundColor: '#6C5CE7' },
  bubbleOther: { backgroundColor: '#fff' },
  bubbleAdmin: {},
  bubbleName: { fontSize: 11, color: '#999', fontWeight: '600' },
  bubbleText: { fontSize: 14, color: '#333', lineHeight: 20 },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    backgroundColor: '#fff',
  },
  input: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    maxHeight: 100,
    color: '#222',
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FF6B6B',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
