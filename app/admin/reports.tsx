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
import { confirmAction, notify } from '@/lib/confirm';
import { useAuth } from '@/context/AuthContext';
import { useRestaurants } from '@/context/RestaurantContext';
import { Report, ReportStatus } from '@/types/restaurant';

const TYPE_LABEL: Record<Report['target_type'], { label: string; color: string; bg: string }> = {
  restaurant: { label: '🍽️ 맛집', color: '#FF7A45', bg: '#FFF4F0' },
  review: { label: '⭐ 리뷰', color: '#E1A100', bg: '#FFF8E8' },
  profile: { label: '👤 리스트/프로필', color: '#6C5CE7', bg: '#F0EEFF' },
};

const STATUS_LABEL: Record<ReportStatus, { label: string; color: string }> = {
  open: { label: '접수됨', color: '#E1A100' },
  resolved: { label: '처리완료', color: '#00B894' },
  dismissed: { label: '기각', color: '#aaa' },
};

const FILTERS: { label: string; value: 'all' | ReportStatus }[] = [
  { label: '전체', value: 'all' },
  { label: '접수됨', value: 'open' },
  { label: '처리완료', value: 'resolved' },
  { label: '기각', value: 'dismissed' },
];

export default function AdminReportsScreen() {
  const { isAdmin } = useAuth();
  const router = useRouter();
  const { getReports, setReportStatus, deleteReview } = useRestaurants();
  const [items, setItems] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | ReportStatus>('open');

  const load = useCallback(async () => {
    try {
      setItems(await getReports());
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [getReports]);

  useFocusEffect(
    useCallback(() => {
      if (isAdmin) load();
      else setLoading(false);
    }, [isAdmin, load]),
  );

  async function updateStatus(report: Report, status: ReportStatus) {
    try {
      await setReportStatus(report.id, status);
      setItems((prev) => prev.map((r) => (r.id === report.id ? { ...r, status } : r)));
    } catch (e: any) {
      notify('오류', e.message ?? '상태 변경 실패');
    }
  }

  function openTarget(report: Report) {
    if (report.target_type === 'restaurant') {
      router.push(`/detail/${report.target_id}` as any);
    } else if (report.target_type === 'profile') {
      router.push(`/user/${report.target_id}` as any);
    }
  }

  function handleDeleteReview(report: Report) {
    confirmAction('리뷰 삭제', '신고된 리뷰를 삭제하고 처리완료로 표시할까요?', async () => {
      try {
        await deleteReview(report.target_id);
        await updateStatus(report, 'resolved');
        notify('삭제 완료', '리뷰를 삭제하고 신고를 처리했어요.');
      } catch (e: any) {
        notify('오류', e.message ?? '삭제 실패 (이미 삭제된 리뷰일 수 있어요)');
      }
    }, '삭제', true);
  }

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

  const shown = filter === 'all' ? items : items.filter((r) => r.status === filter);

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
          const t = TYPE_LABEL[item.target_type];
          const s = STATUS_LABEL[item.status];
          return (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={[styles.typeBadge, { backgroundColor: t.bg }]}>
                  <Text style={[styles.typeBadgeText, { color: t.color }]}>{t.label}</Text>
                </View>
                <Text style={[styles.status, { color: s.color }]}>● {s.label}</Text>
              </View>

              <Text style={styles.reason}>{item.reason}</Text>
              {item.detail ? <Text style={styles.detail}>{item.detail}</Text> : null}
              <Text style={styles.meta}>
                {new Date(item.created_at).toLocaleString('ko-KR')}
              </Text>

              <View style={styles.actionRow}>
                {item.target_type !== 'review' && (
                  <Pressable style={styles.actionBtn} onPress={() => openTarget(item)}>
                    <Ionicons name="open-outline" size={14} color="#6C5CE7" />
                    <Text style={[styles.actionText, { color: '#6C5CE7' }]}>대상 보기</Text>
                  </Pressable>
                )}
                {item.target_type === 'review' && item.status === 'open' && (
                  <Pressable style={styles.actionBtn} onPress={() => handleDeleteReview(item)}>
                    <Ionicons name="trash-outline" size={14} color="#E74C3C" />
                    <Text style={[styles.actionText, { color: '#E74C3C' }]}>리뷰 삭제</Text>
                  </Pressable>
                )}
                {item.status === 'open' ? (
                  <>
                    <Pressable style={styles.actionBtn} onPress={() => updateStatus(item, 'resolved')}>
                      <Ionicons name="checkmark-circle-outline" size={14} color="#00B894" />
                      <Text style={[styles.actionText, { color: '#00B894' }]}>처리완료</Text>
                    </Pressable>
                    <Pressable style={styles.actionBtn} onPress={() => updateStatus(item, 'dismissed')}>
                      <Ionicons name="close-circle-outline" size={14} color="#aaa" />
                      <Text style={[styles.actionText, { color: '#aaa' }]}>기각</Text>
                    </Pressable>
                  </>
                ) : (
                  <Pressable style={styles.actionBtn} onPress={() => updateStatus(item, 'open')}>
                    <Ionicons name="refresh-outline" size={14} color="#E1A100" />
                    <Text style={[styles.actionText, { color: '#E1A100' }]}>다시 열기</Text>
                  </Pressable>
                )}
              </View>
            </View>
          );
        }}
        ListHeaderComponent={<Text style={styles.header}>신고 {shown.length}건</Text>}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Text style={styles.emptySub}>해당 신고가 없어요</Text>
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
  reason: { fontSize: 15, color: '#333', fontWeight: '600' },
  detail: { fontSize: 13.5, color: '#666', lineHeight: 20 },
  meta: { fontSize: 12, color: '#bbb' },
  actionRow: { flexDirection: 'row', gap: 14, marginTop: 2, flexWrap: 'wrap' },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  actionText: { fontSize: 13, fontWeight: '600' },
  emptyBox: { alignItems: 'center', paddingTop: 60 },
  emptySub: { fontSize: 14, color: '#aaa' },
});
