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
import Avatar from '@/components/Avatar';
import ChipRow from '@/components/ChipRow';
import SearchBar from '@/components/SearchBar';
import { CATEGORIES, PROVINCES, inferDistrictFromAddress, inferProvinceFromAddress } from '@/constants/filters';
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

function OwnerAvatars({ owners, onPress }: { owners: OwnerRef[]; onPress: (id: string) => void }) {
  if (owners.length === 0) return null;
  return (
    <View style={styles.ownerSection}>
      <Text style={styles.ownerHeading}>👑 이 맛집을 담은 인기 유저 TOP{owners.length}</Text>
      <View style={styles.ownerList}>
        {owners.map((o) => (
          <Pressable
            key={o.id}
            style={styles.ownerItem}
            onPress={(e) => {
              e.stopPropagation();
              onPress(o.id);
            }}
            hitSlop={4}
          >
            <Avatar uri={o.avatar_url} name={o.display_name} size={40} admin={o.is_admin} style={{ marginBottom: 3 }} />
            <Text style={styles.ownerName} numberOfLines={1}>{o.display_name}</Text>
            {o.like_count > 0 && <Text style={styles.ownerLike}>❤️ {o.like_count}</Text>}
          </Pressable>
        ))}
        <View style={styles.ownerArrow}>
          <Ionicons name="chevron-forward" size={18} color="#ccc" />
        </View>
      </View>
    </View>
  );
}

function DiscoverCard({
  item,
  onOpen,
  onOwner,
  onSave,
  saved,
}: {
  item: DiscoverItem;
  onOpen: () => void;
  onOwner: (id: string) => void;
  onSave: () => void;
  saved: boolean;
}) {
  const sub = [item.area, item.category, item.price_range ? `💰 ${item.price_range}` : ''].filter(Boolean).join(' · ');
  return (
    <Pressable onPress={onOpen} style={({ pressed }) => [styles.card, pressed && { opacity: 0.96 }]}>
      {/* 대표 사진 */}
      <View style={styles.imageWrap}>
        {item.image_url ? (
          <Image source={{ uri: item.image_url }} style={styles.image} />
        ) : (
          <View style={[styles.image, styles.imagePlaceholder]}>
            <Ionicons name="restaurant" size={34} color="#fff" />
          </View>
        )}
        {item.reviewCount > 0 && (
          <View style={styles.ratingBadge}>
            <Ionicons name="star" size={12} color="#FDCB6E" />
            <Text style={styles.ratingBadgeText}>{item.avgRating.toFixed(1)}</Text>
          </View>
        )}
        <Pressable
          style={styles.bookmark}
          onPress={(e) => {
            e.stopPropagation();
            if (!saved) onSave();
          }}
          hitSlop={6}
        >
          <Ionicons name={saved ? 'bookmark' : 'bookmark-outline'} size={18} color={saved ? '#FF7A45' : '#fff'} />
        </Pressable>
      </View>

      {/* 본문 */}
      <View style={styles.body}>
        <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
        {sub ? <Text style={styles.sub}>{sub}</Text> : null}

        <View style={styles.metaRow}>
          {item.reviewCount > 0 ? (
            <View style={styles.metaItem}>
              <Stars value={item.avgRating} />
              <Text style={styles.metaText}>{item.avgRating.toFixed(1)} ({item.reviewCount})</Text>
            </View>
          ) : (
            <Text style={styles.metaMuted}>리뷰 없음</Text>
          )}
          <View style={styles.addedPill}>
            <Text style={styles.addedPillText}>👥 {item.addedCount}명이 담음</Text>
          </View>
        </View>

        <OwnerAvatars owners={item.topOwners} onPress={onOwner} />
      </View>
    </Pressable>
  );
}

export default function DiscoverScreen() {
  const router = useRouter();
  const { getDiscoverFeed, getUsers, fetchRestaurantById, copyRestaurant, restaurants } = useRestaurants();
  const [feed, setFeed] = useState<DiscoverItem[]>([]);
  const [users, setUsers] = useState<Profile[]>([]);
  const [sort, setSort] = useState<DiscoverSort>('popular');
  const [query, setQuery] = useState('');
  const [province, setProvince] = useState<string | null>(null);
  const [district, setDistrict] = useState<string | null>(null);
  const [category, setCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [savedKeys, setSavedKeys] = useState<Set<string>>(new Set());

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

  const myNames = useMemo(() => new Set(restaurants.map((r) => r.name)), [restaurants]);

  const handleSave = useCallback(
    async (item: DiscoverItem) => {
      setSavedKeys((prev) => new Set(prev).add(item.key)); // 낙관적
      try {
        const full = await fetchRestaurantById(item.representativeId);
        if (full) await copyRestaurant(full);
      } catch {
        setSavedKeys((prev) => {
          const n = new Set(prev);
          n.delete(item.key);
          return n;
        });
      }
    },
    [fetchRestaurantById, copyRestaurant],
  );

  const q = query.trim().toLowerCase();

  const userMatches = useMemo(() => {
    if (!q) return [];
    return users.filter((u) => u.display_name.toLowerCase().includes(q)).slice(0, 8);
  }, [users, q]);

  // 데이터에 실제로 존재하는 시/도만 노출
  const provinces = useMemo(() => {
    const set = new Set<string>();
    feed.forEach((it) => {
      const p = inferProvinceFromAddress(it.address);
      if (p) set.add(p);
    });
    return PROVINCES.filter((p) => set.has(p));
  }, [feed]);

  // 선택한 시/도 안의 구 목록
  const districts = useMemo(() => {
    const set = new Set<string>();
    feed.forEach((it) => {
      if (province && !(it.address ?? '').includes(province)) return;
      const d = inferDistrictFromAddress(it.address);
      if (d) set.add(d);
    });
    return Array.from(set).sort();
  }, [feed, province]);

  // 데이터에 실제로 존재하는 카테고리만 노출 (기본 순서 유지)
  const categories = useMemo(() => {
    const set = new Set<string>();
    feed.forEach((it) => {
      if (it.category) set.add(it.category);
    });
    const known = CATEGORIES.filter((c) => set.has(c));
    const extra = [...set].filter((c) => !CATEGORIES.includes(c)).sort();
    return [...known, ...extra];
  }, [feed]);

  const visible = useMemo(() => {
    const filtered = feed.filter((it) => {
      if (q && !`${it.name} ${it.area ?? ''} ${it.category ?? ''} ${it.address ?? ''}`.toLowerCase().includes(q))
        return false;
      if (province && !(it.address ?? '').includes(province)) return false;
      if (district) {
        const inDist = it.address?.includes(district);
        const inArea = it.area === district;
        if (!inDist && !inArea) return false;
      }
      if (category && it.category !== category) return false;
      return true;
    });
    return sortFeed(filtered, sort);
  }, [feed, q, province, district, category, sort]);

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
            onSave={() => handleSave(item)}
            saved={savedKeys.has(item.key) || myNames.has(item.name)}
          />
        )}
        ListHeaderComponent={
          <>
            <SearchBar value={query} onChangeText={setQuery} placeholder="맛집·지역·사용자 검색" />

            {userMatches.length > 0 && (
              <View style={styles.userSection}>
                <Text style={styles.sectionLabel}>👤 사용자</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.userScroll}>
                  {userMatches.map((u) => (
                    <Pressable key={u.id} style={styles.userChip} onPress={() => router.push(`/user/${u.id}` as any)}>
                      <Avatar uri={u.avatar_url} name={u.display_name} size={46} admin={u.is_admin} style={{ marginBottom: 4 }} />
                      <Text style={styles.userChipText} numberOfLines={1}>{u.display_name}</Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* 지역 필터 (데이터에 있는 시/도만 노출) */}
            {provinces.length > 0 && (
              <ChipRow style={styles.regionRow}>
                <Pressable
                  onPress={() => { setProvince(null); setDistrict(null); }}
                  style={[styles.regionChip, province === null && styles.regionChipActive]}
                >
                  <Text style={[styles.regionText, province === null && styles.regionTextActive]}>전체 지역</Text>
                </Pressable>
                {provinces.map((p) => (
                  <Pressable
                    key={p}
                    onPress={() => { setProvince(province === p ? null : p); setDistrict(null); }}
                    style={[styles.regionChip, province === p && styles.regionChipActive]}
                  >
                    <Text style={[styles.regionText, province === p && styles.regionTextActive]}>{p}</Text>
                  </Pressable>
                ))}
              </ChipRow>
            )}

            {/* 구 (시/도 선택 시) */}
            {province && districts.length > 0 && (
              <ChipRow style={styles.regionRow}>
                <Pressable
                  onPress={() => setDistrict(null)}
                  style={[styles.regionChip, styles.districtChip, district === null && styles.districtChipActive]}
                >
                  <Text style={[styles.regionText, district === null && styles.regionTextActive]}>{province} 전체</Text>
                </Pressable>
                {districts.map((d) => (
                  <Pressable
                    key={d}
                    onPress={() => setDistrict(district === d ? null : d)}
                    style={[styles.regionChip, styles.districtChip, district === d && styles.districtChipActive]}
                  >
                    <Text style={[styles.regionText, district === d && styles.regionTextActive]}>{d}</Text>
                  </Pressable>
                ))}
              </ChipRow>
            )}

            {/* 카테고리 필터 (데이터에 있는 것만 노출) */}
            {categories.length > 0 && (
              <ChipRow style={styles.regionRow}>
                <Pressable
                  onPress={() => setCategory(null)}
                  style={[styles.regionChip, category === null && styles.categoryChipActive]}
                >
                  <Text style={[styles.regionText, category === null && styles.regionTextActive]}>전체 카테고리</Text>
                </Pressable>
                {categories.map((c) => (
                  <Pressable
                    key={c}
                    onPress={() => setCategory(category === c ? null : c)}
                    style={[styles.regionChip, category === c && styles.categoryChipActive]}
                  >
                    <Text style={[styles.regionText, category === c && styles.regionTextActive]}>{c}</Text>
                  </Pressable>
                ))}
              </ChipRow>
            )}

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
  list: { paddingBottom: 96 },
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
  regionRow: { paddingHorizontal: 16, paddingVertical: 4, gap: 8, flexDirection: 'row', alignItems: 'center' },
  regionChip: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: '#ddd',
    backgroundColor: '#fff',
  },
  regionChipActive: { backgroundColor: '#FF7A45', borderColor: '#FF7A45' },
  districtChip: {},
  districtChipActive: { backgroundColor: '#E17055', borderColor: '#E17055' },
  categoryChipActive: { backgroundColor: '#6C5CE7', borderColor: '#6C5CE7' },
  regionText: { fontSize: 13, color: '#555' },
  regionTextActive: { color: '#fff', fontWeight: '600' },
  sortRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingVertical: 10 },
  sortChip: {
    flex: 1, paddingVertical: 9, borderRadius: 10, borderWidth: 1, borderColor: '#ddd',
    backgroundColor: '#fff', alignItems: 'center',
  },
  sortChipActive: { backgroundColor: '#6C5CE7', borderColor: '#6C5CE7' },
  sortText: { fontSize: 13, color: '#555', fontWeight: '600' },
  sortTextActive: { color: '#fff' },

  // 카드 (큰 사진형)
  card: {
    backgroundColor: '#fff', marginHorizontal: 16, marginVertical: 6, borderRadius: 16, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 3,
  },
  imageWrap: { width: '100%', height: 168, backgroundColor: '#eee' },
  image: { width: '100%', height: '100%' },
  imagePlaceholder: { backgroundColor: '#FFB48A', alignItems: 'center', justifyContent: 'center' },
  ratingBadge: {
    position: 'absolute', top: 10, left: 10, flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: 'rgba(0,0,0,0.55)', paddingHorizontal: 9, paddingVertical: 4, borderRadius: 20,
  },
  ratingBadgeText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  bookmark: {
    position: 'absolute', top: 8, right: 8, width: 34, height: 34, borderRadius: 17,
    backgroundColor: 'rgba(0,0,0,0.35)', alignItems: 'center', justifyContent: 'center',
  },
  body: { padding: 14 },
  name: { fontSize: 18, fontWeight: '800', color: '#1a1a1a' },
  sub: { fontSize: 13, color: '#888', marginTop: 3 },
  metaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8, gap: 8 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 12, color: '#888' },
  metaMuted: { fontSize: 12, color: '#bbb' },
  addedPill: { backgroundColor: '#FFF0E8', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  addedPillText: { fontSize: 12, color: '#FF7A45', fontWeight: '700' },

  // 담은 유저 TOP3
  ownerSection: { marginTop: 12, borderTopWidth: 1, borderTopColor: '#f5f5f5', paddingTop: 10 },
  ownerHeading: { fontSize: 12, color: '#888', fontWeight: '600', marginBottom: 8 },
  ownerList: { flexDirection: 'row', alignItems: 'flex-start', gap: 14 },
  ownerItem: { alignItems: 'center', width: 56 },
  ownerAvatar: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: '#6C5CE7',
    alignItems: 'center', justifyContent: 'center', marginBottom: 3,
  },
  ownerAvatarText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  ownerName: { fontSize: 11, color: '#555', maxWidth: 56 },
  ownerLike: { fontSize: 10, color: '#aaa', marginTop: 1 },
  ownerArrow: { flex: 1, alignItems: 'flex-end', justifyContent: 'center', alignSelf: 'center' },

  emptyBox: { alignItems: 'center', paddingTop: 60 },
  emptySub: { fontSize: 14, color: '#aaa' },
});
