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
import { useAuth } from '@/context/AuthContext';
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

const FILTERS: { label: string; value: 'all' | FeedbackStatus }[] = [
  { label: '전체', value: 'all' },
  { label: '확인 중', value: 'open' },
  { label: '처리완료', value: 'resolved' },
  { label: '보관', value: 'archived' },
];

export default function AdminFeedbackScreen() {
  const { isAdmin } = useAuth();
  const router = useRouter();
  const { getAllFeedback } = useRestaurants();
  const [items, setItems] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | FeedbackStatus>('all');

  const load = useCallback(async () => {
    try {
      setItems(await getAllFeedback());
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [getAllFeedback]);

  useFocusEffect(
    useCallback(() => {
      if (isAdmin) load();
      else setLoading(false);
    }, [isAdmin, load]),
  );

  if (!isAdmin) {
    return (
      <View style={styles.center}>
        <Ionicons name="lock-closed-outline" size={40} color="#ccc" />
        <Text style={styles.noAuth}>관리자만 볼 수 있는 화면이에요</Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#FF7A45" />
      </View>
    );
  }

  const shown = filter === 'all' ? items : items.filter((f) => f.status === filter);

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <View style={styles.filterRow}>
        {FILTERS.map((f) => (
          <Pressable
            key={f.value}
            onPress={() => setFilter(f.value)}
            style={[styles.filterChip, filter === f.value && styles.filterChipActive]}
          >
            <Text style={[styles.filterText, filter === f.value && styles.filterTextActive]}>{f.label}</Text>
          </Pressable>
        ))}
      </View>

      <FlatList
        data={shown}
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
                <Text style={styles.author}>— {item.display_name ?? '익명'}</Text>
                <View style={styles.replyHint}>
                  <Ionicons name="chatbubble-ellipses-outline" size={14} color="#bbb" />
                  <Text style={styles.replyHintText}>답글</Text>
                </View>
              </View>
            </Pressable>
          );
        }}
        ListHeaderComponent={<Text style={styles.header}>피드백 {shown.length}건 · 탭하면 답글 대화</Text>}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Text style={styles.emptySub}>해당 피드백이 없어요</Text>
          </View>
        }
        contentContainerStyle={styles.list}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F5F5F5' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  noAuth: { fontSize: 15, color: '#999' },
  filterRow: { flexDirection: 'row', gap: 6, padding: 12, paddingBottom: 4 },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 18,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#eee',
  },
  filterChipActive: { backgroundColor: '#FF7A45', borderColor: '#FF7A45' },
  filterText: { fontSize: 13, color: '#666' },
  filterTextActive: { color: '#fff', fontWeight: '700' },
  list: { padding: 16, paddingTop: 8 },
  header: { fontSize: 13, color: '#888', marginBottom: 10, fontWeight: '600' },
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
  author: { fontSize: 13, color: '#999' },
  replyHint: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  replyHintText: { fontSize: 12, color: '#bbb' },
  emptyBox: { alignItems: 'center', paddingTop: 60 },
  emptySub: { fontSize: 14, color: '#aaa' },
});
