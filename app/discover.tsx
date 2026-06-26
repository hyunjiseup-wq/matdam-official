import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import SearchBar from '@/components/SearchBar';
import { CATEGORY_BG, CATEGORY_COLORS } from '@/constants/filters';
import { useRestaurants } from '@/context/RestaurantContext';
import { DiscoverItem, DiscoverSort, OwnerRef, Profile } from '@/types/restaurant';

const SORTS: { key: DiscoverSort; label: string }[] = [
  { key: 'popular', label: '🔥 인기순' },
  { key: 'rating', label: '⭐ 별점순' },
  { key: 'visited', label: '👣 방문순' },
];

function sortFeed(items: DiscoverItem[], sort: DiscoverSort): DiscoverItem[] {
  const copy = [...items];
  if (sort === 'popular') {
    copy.sort((a, b) => b.addedCount - a.addedCount || b.avgRating - a.avgRating || b.visitedCount - a.visitedCount);
  } else if (sort === 'rating') {
    copy.sort((a, b) => b.avgRating - a.avgRating || b.reviewCount - a.reviewCount || b.addedCount - a.addedCount);
  } else {
    copy.sort((a, b) => b.visitedCount - a.visitedCount || b.addedCount - a.addedCount || b.avgRating - a.avgRating);
  }
  return copy;
}

function Stars({ value }: { value: number }) {
  const full = Math.round(value);
  return (
    <View style={{ flexDirection: 'row', gap: 1 }}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Ionicons key={i} name={i < full ? 'star' : 'star-outline'} size={12} color={i < full ? '#FDCB6E' : '#ddd'} />
      ))}
    </View>
  );
}

function OwnerChips({ owners, onPress }: { owners: OwnerRef[]; onPress: (id: string) => void }) {
  if (owners.length === 0) return null;
  return (
    <View style={styles.ownerRow}>
      <Text style={styles.ownerLabel}>👥 담은 사람</Text>
      {owners.map((o, i) => (
        <Pressable
          key={o.id}
          onPress={(e) => {
            e.stopPropagation();
            onPress(o.id);
          }}
          style={[styles.ownerChip, o.is_admin && styles.ownerChipAdmin]}
          hitSlop={4}
        >
          {i === 0 && <Text style={styles.crown}>👑</Text>}
          <Text style={[styles.ownerChipText, o.is_admin && { color: '#FF7A45' }]} numberOfLines={1}>
            {o.display_name}
          </Text>
          {o.like_count > 0 && <Text style={styles.ownerLike}>❤️{o.like_count}</Text>}
        </Pressable>
      ))}
    </View>
  );
}

function DiscoverCard({ item, onOpen, onOwner }: { item: DiscoverItem; onOpen: () => void; onOwner: (id: string) => void }) {
  const catColor = item.category ? CATEGORY_COLORS[item.category] ?? '#888' : '#888';
  const catBg = item.category ? CATEGORY_BG[item.category] ?? '#f5f5f5' : '#f5f5f5';
  return (
    <Pressable onPress={onOpen} style={({ pressed }) => [styles.card, pressed && { opacity: 0.92 }]}>
      <View style={styles.cardTop}>
        <View style={{ flex: 1 }}>
          <View style={styles.badges}>
            {item.category && (
              <View style={[styles.badge, { backgroundColor: catBg }]}>
                <Text style={[styles.badgeText, { color: catColor }]}>{item.category}</Text>
              </View>
            )}
            {item.area && (
              <View style={styles.areaBadge}>
                <Text style={styles.areaBadgeText}>📍 {item.area}</Text>
              </View>
            )}
          </View>
          <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
          <View style={styles.metaRow}>
            {item.reviewCount > 0 ? (
              <View style={styles.metaItem}>
                <Stars value={item.avgRating} />
                <Text style={styles.metaText}>{item.avgRating.toFixed(1)} ({item.reviewCount})</Text>
              </View>
            ) : (
              <Text style={styles.metaMuted}>리뷰 없음</Text>
            )}
            <Text style={styles.metaDot}>·</Text>
            <Text style={styles.metaStrong}>👥 {item.addedCount}명</Text>
            <Text style={styles.metaDot}>·</Text>
            <Text style={styles.metaText}>👣 {item.visitedCount}</Text>
          </View>
        </View>
        {item.image_url ? <Image source={{ uri: item.image_url }} style={styles.thumb} /> : null}
      </View>
      <OwnerChips owners={item.topOwners} onPress={onOwner} />
    </Pressable>
  );
}

export default function DiscoverScreen() {
  const router = useRouter();
  const { getDiscoverFeed, getUsers } = useRestaurants();
  const [feed, setFeed] = useState<DiscoverItem[]>([]);
  const [users, setUsers] = useState<Profile[]>([]);
  const [sort, setSort] = useState<DiscoverSort>('popular');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [f, u] = await Promise.all([getDiscoverFeed(), getUsers()]);
      setFeed(f);
      setUsers(u);
    } catch {
      setFeed([]);
    } finally {
      setLoading(false);
    }
  }, [getDiscoverFeed, getUsers]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const q = query.trim().toLowerCase();

  const userMatches = useMemo(() => {
    if (!q) return [];
    return users.filter((u) => u.display_name.toLowerCase().includes(q)).slice(0, 8);
  }, [users, q]);

  const visible = useMemo(() => {
    const filtered = q
      ? feed.filter((it) =>
          `${it.name} ${it.area ?? ''} ${it.category ?? ''} ${it.address ?? ''}`.toLowerCase().includes(q),
        )
      : feed;
    return sortFeed(filtered, sort);
  }, [feed, q, sort]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#6C5CE7" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <FlatList
        data={visible}
        keyExtractor={(item) => item.key}
        renderItem={({ item }) => (
          <DiscoverCard
            item={item}
            onOpen={() => router.push(`/detail/${item.representativeId}` as any)}
            onOwner={(id) => router.push(`/user/${id}` as any)}
          />
        )}
        ListHeaderComponent={
          <>
            <SearchBar value={query} onChangeText={setQuery} placeholder="맛집·지역·사용자 검색" />

            {/* 사용자 검색 결과 */}
            {userMatches.length > 0 && (
              <View style={styles.userSection}>
                <Text style={styles.sectionLabel}>👤 사용자</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.userScroll}>
                  {userMatches.map((u) => (
                    <Pressable key={u.id} style={styles.userChip} onPress={() => router.push(`/user/${u.id}` as any)}>
                      <View style={[styles.userAvatar, u.is_admin && { backgroundColor: '#FF7A45' }]}>
                        <Text style={styles.userAvatarText}>{u.display_name[0] ?? '?'}</Text>
                      </View>
                      <Text style={styles.userChipText} numberOfLines={1}>{u.display_name}</Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* 정렬 탭 */}
            <View style={styles.sortRow}>
              {SORTS.map((s) => (
                <Pressable
                  key={s.key}
                  onPress={() => setSort(s.key)}
                  style={[styles.sortChip, sort === s.key && styles.sortChipActive]}
                >
                  <Text style={[styles.sortText, sort === s.key && styles.sortTextActive]}>{s.label}</Text>
                </Pressable>
              ))}
            </View>
          </>
        }
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Text style={styles.emptySub}>{q ? '검색 결과가 없어요' : '아직 맛집이 없어요'}</Text>
          </View>
        }
        contentContainerStyle={styles.list}
        keyboardShouldPersistTaps="handled"
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F5F5F5' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { paddingBottom: 40 },
  userSection: { marginTop: 4 },
  sectionLabel: { fontSize: 13, fontWeight: '700', color: '#888', paddingHorizontal: 16, marginBottom: 6 },
  userScroll: { paddingHorizontal: 16, gap: 10, flexDirection: 'row' },
  userChip: { alignItems: 'center', width: 60 },
  userAvatar: {
    width: 46, height: 46, borderRadius: 23, backgroundColor: '#6C5CE7',
    alignItems: 'center', justifyContent: 'center', marginBottom: 4,
  },
  userAvatarText: { color: '#fff', fontSize: 18, fontWeight: '700' },
  userChipText: { fontSize: 12, color: '#555', maxWidth: 60 },
  sortRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingVertical: 10 },
  sortChip: {
    flex: 1, paddingVertical: 9, borderRadius: 10, borderWidth: 1, borderColor: '#ddd',
    backgroundColor: '#fff', alignItems: 'center',
  },
  sortChipActive: { backgroundColor: '#6C5CE7', borderColor: '#6C5CE7' },
  sortText: { fontSize: 13, color: '#555', fontWeight: '600' },
  sortTextActive: { color: '#fff' },
  card: {
    backgroundColor: '#fff', marginHorizontal: 16, marginVertical: 5, borderRadius: 14, padding: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.07, shadowRadius: 5, elevation: 2,
  },
  cardTop: { flexDirection: 'row', gap: 10 },
  badges: { flexDirection: 'row', gap: 6, flexWrap: 'wrap', marginBottom: 5 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  badgeText: { fontSize: 12, fontWeight: '600' },
  areaBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, backgroundColor: '#f0f0f0' },
  areaBadgeText: { fontSize: 12, color: '#666' },
  name: { fontSize: 17, fontWeight: '700', color: '#1a1a1a', marginBottom: 5 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 5, flexWrap: 'wrap' },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 12, color: '#888' },
  metaStrong: { fontSize: 12, color: '#FF7A45', fontWeight: '700' },
  metaMuted: { fontSize: 12, color: '#bbb' },
  metaDot: { fontSize: 12, color: '#ddd' },
  thumb: { width: 72, height: 72, borderRadius: 10, backgroundColor: '#f0f0f0', flexShrink: 0 },
  ownerRow: {
    flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap',
    marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#f5f5f5',
  },
  ownerLabel: { fontSize: 11, color: '#aaa', fontWeight: '600' },
  ownerChip: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: '#F3F0FF', borderRadius: 20, paddingHorizontal: 9, paddingVertical: 4, maxWidth: 130,
  },
  ownerChipAdmin: { backgroundColor: '#FFF0E8' },
  crown: { fontSize: 10 },
  ownerChipText: { fontSize: 12, color: '#6C5CE7', fontWeight: '600' },
  ownerLike: { fontSize: 10, color: '#999' },
  emptyBox: { alignItems: 'center', paddingTop: 60 },
  emptySub: { fontSize: 14, color: '#aaa' },
});
