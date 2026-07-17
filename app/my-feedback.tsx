import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRestaurants } from '@/context/RestaurantContext';
import { Feedback, FeedbackStatus } from '@/types/restaurant';

const TYPE_LABEL: Record<string, { label: string; color: string; bg: string }> = {
  general: { label: '일반', color: '#6C5CE7', bg: '#F0EEFF' },
  feature: { label: '기능', color: '#00B894', bg: '#E8FFF9' },
  bug: { label: '버그', color: '#FF7A45', bg: '#FFE8E8' },
  data: { label: '정보', color: '#E1A100', bg: '#FFF8E8' },
};

const STATUS_LABEL: Record<FeedbackStatus, { label: string; color: string }> = {
  open: { label: '확인 중', color: '#E1A100' },
  resolved: { label: '처리완료', color: '#00B894' },
  archived: { label: '보관', color: '#aaa' },
};

export default function MyFeedbackScreen() {
  const router = useRouter();
  const { getMyFeedback } = useRestaurants();
  const [items, setItems] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setItems(await getMyFeedback());
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [getMyFeedback]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#FF7A45" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const t = TYPE_LABEL[item.type] ?? TYPE_LABEL.general;
          const s = STATUS_LABEL[item.status];
          return (
            <Pressable
              style={({ pressed }) => [styles.card, pressed && { opacity: 0.9 }]}
              onPress={() => router.push(`/feedback-thread/${item.id}` as any)}
            >
              <View style={styles.cardHeader}>
                <View style={[styles.typeBadge, { backgroundColor: t.bg }]}>
                  <Text style={[styles.typeBadgeText, { color: t.color }]}>{t.label}</Text>
                </View>
                <Text style={[styles.status, { color: s.color }]}>● {s.label}</Text>
              </View>
              <Text style={styles.content} numberOfLines={2}>{item.content}</Text>
              <View style={styles.cardFooter}>
                <Text style={styles.date}>{new Date(item.created_at).toLocaleDateString('ko-KR')}</Text>
                <View style={styles.replyHint}>
                  <Ionicons name="chatbubble-ellipses-outline" size={14} color="#6C5CE7" />
                  <Text style={styles.replyHintText}>관리자 답변 보기</Text>
                </View>
              </View>
            </Pressable>
          );
        }}
        ListHeaderComponent={
          <Text style={styles.header}>내가 보낸 피드백 · 탭하면 관리자 답변/대화를 볼 수 있어요</Text>
        }
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Text style={styles.emptyTitle}>아직 보낸 피드백이 없어요</Text>
            <Pressable style={styles.writeBtn} onPress={() => router.push('/feedback' as any)}>
              <Ionicons name="create-outline" size={18} color="#fff" />
              <Text style={styles.writeBtnText}>피드백 보내기</Text>
            </Pressable>
          </View>
        }
        contentContainerStyle={styles.list}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F5F5F5' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { padding: 16 },
  header: { fontSize: 13, color: '#888', marginBottom: 10, fontWeight: '600', lineHeight: 18 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  typeBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  typeBadgeText: { fontSize: 12, fontWeight: '700' },
  status: { fontSize: 12, fontWeight: '700' },
  content: { fontSize: 15, color: '#333', lineHeight: 22 },
  cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  date: { fontSize: 12, color: '#bbb' },
  replyHint: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  replyHintText: { fontSize: 12, color: '#6C5CE7', fontWeight: '600' },
  emptyBox: { alignItems: 'center', paddingTop: 60, gap: 16 },
  emptyTitle: { fontSize: 16, color: '#888' },
  writeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FF7A45',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  writeBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
