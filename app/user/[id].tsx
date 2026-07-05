import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import * as Linking from 'expo-linking';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Platform,
  Pressable,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Avatar from '@/components/Avatar';
import ChipRow from '@/components/ChipRow';
import ReportModal from '@/components/ReportModal';
import RestaurantCard from '@/components/RestaurantCard';
import SearchBar from '@/components/SearchBar';
import { CATEGORIES, PROVINCES, inferDistrictFromAddress, inferProvinceFromAddress } from '@/constants/filters';
import { confirmAction, notify } from '@/lib/confirm';
import { useAuth } from '@/context/AuthContext';
import { useRestaurants } from '@/context/RestaurantContext';
import { Profile, Restaurant } from '@/types/restaurant';

const SITE = 'https://matdam-official.vercel.app';

export default function UserListScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const navigation = useNavigation();
  const { user } = useAuth();
  const {
    getUserRestaurants,
    getUsers,
    copyRestaurant,
    likeList,
    unlikeList,
    incrementProfileView,
    blockUser,
    restaurants: myRestaurants,
  } = useRestaurants();

  const [items, setItems] = useState<Restaurant[]>([]);
  const [owner, setOwner] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [copiedIds, setCopiedIds] = useState<Set<string>>(new Set());
  const [province, setProvince] = useState<string | null>(null);
  const [district, setDistrict] = useState<string | null>(null);
  const [category, setCategory] = useState<string | null>(null);
  const [reportOpen, setReportOpen] = useState(false);

  const isMyList = id === user?.id;
  const myNames = new Set(myRestaurants.map((r) => r.name));

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [list, users] = await Promise.all([getUserRestaurants(id), getUsers()]);
      setItems(list);
      setOwner(users.find((u) => u.id === id) ?? null);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [id, getUserRestaurants, getUsers]);

  useEffect(() => {
    load();
    incrementProfileView(id);
  }, [load, incrementProfileView, id]);

  useEffect(() => {
    navigation.setOptions({ title: owner ? `${owner.display_name}님의 리스트` : '리스트' });
  }, [owner, navigation]);

  async function handleCopy(r: Restaurant) {
    try {
      await copyRestaurant(r);
      setCopiedIds((prev) => new Set(prev).add(r.id));
    } catch {
      /* 무시 */
    }
  }

  async function toggleLike() {
    if (!owner || isMyList) return;
    const liked = !owner.liked;
    setOwner({ ...owner, liked, like_count: (owner.like_count ?? 0) + (liked ? 1 : -1) });
    try {
      if (liked) await likeList(owner.id);
      else await unlikeList(owner.id);
    } catch {
      load();
    }
  }

  // 이 리스트에 실제로 있는 시/도·구·카테고리만 필터로 노출
  const provinces = useMemo(() => {
    const set = new Set<string>();
    items.forEach((r) => {
      const p = inferProvinceFromAddress(r.address);
      if (p) set.add(p);
    });
    return PROVINCES.filter((p) => set.has(p));
  }, [items]);

  const districts = useMemo(() => {
    const set = new Set<string>();
    items.forEach((r) => {
      if (province && !(r.address ?? '').includes(province)) return;
      const d = inferDistrictFromAddress(r.address);
      if (d) set.add(d);
    });
    return Array.from(set).sort();
  }, [items, province]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    items.forEach((r) => {
      if (r.category) set.add(r.category);
    });
    const known = CATEGORIES.filter((c) => set.has(c));
    const extra = [...set].filter((c) => !CATEGORIES.includes(c)).sort();
    return [...known, ...extra];
  }, [items]);

  function handleBlockOwner() {
    if (!owner) return;
    confirmAction(
      '사용자 차단',
      `${owner.display_name}님을 차단할까요?\n차단하면 이 사용자의 맛집·리뷰·리스트가 더 이상 보이지 않아요. (마이 화면에서 해제 가능)`,
      async () => {
        try {
          await blockUser(owner.id);
          notify('차단 완료', '이 사용자의 콘텐츠가 더 이상 보이지 않아요.');
          router.back();
        } catch (e: any) {
          notify('오류', e.message ?? '차단에 실패했어요.');
        }
      },
      '차단',
      true,
    );
  }

  async function shareList() {
    const url = `${SITE}/user/${id}`;
    if (Platform.OS === 'web') {
      try {
        await (navigator as any).clipboard.writeText(url);
        notify('링크 복사됨!', '인스타·카톡에 붙여넣기 하세요 🔗');
      } catch {
        notify('공유 링크', url);
      }
    } else {
      Share.share({ message: `${owner?.display_name ?? ''}님의 맛집 리스트 👉 ${url}` });
    }
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#6C5CE7" />
      </View>
    );
  }

  const q = query.trim().toLowerCase();
  const filtered = items.filter((r) => {
    if (q && !`${r.name} ${r.area ?? ''} ${r.memo ?? ''}`.toLowerCase().includes(q)) return false;
    if (province && !(r.address ?? '').includes(province)) return false;
    if (district) {
      const inDist = r.address?.includes(district);
      const inArea = r.area === district;
      if (!inDist && !inArea) return false;
    }
    if (category && r.category !== category) return false;
    return true;
  });

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <RestaurantCard
            restaurant={item}
            mode={isMyList ? 'own' : 'browse'}
            onPress={() => router.push(`/detail/${item.id}`)}
            onCopy={() => handleCopy(item)}
            copied={copiedIds.has(item.id) || (!isMyList && myNames.has(item.name))}
          />
        )}
        ListHeaderComponent={
          <>
            {/* 프로필 카드 */}
            {owner && (
              <View style={styles.profileCard}>
                <View style={styles.profileTop}>
                  <Avatar uri={owner.avatar_url} name={owner.display_name} size={52} admin={owner.is_admin} />
                  <View style={{ flex: 1 }}>
                    <View style={styles.nameRow}>
                      <Text style={styles.ownerName}>{owner.display_name}</Text>
                      {owner.is_admin && (
                        <View style={styles.adminBadge}>
                          <Text style={styles.adminBadgeText}>공식</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.stats}>
                      맛집 {owner.count ?? items.length} · ❤️ {owner.like_count ?? 0} · 👀 {owner.view_count ?? 0}
                    </Text>
                  </View>
                </View>

                {owner.bio ? <Text style={styles.bio}>{owner.bio}</Text> : null}

                {owner.sns_url ? (
                  <Pressable
                    style={styles.snsBtn}
                    onPress={() => Linking.openURL(owner.sns_url!).catch(() => notify('오류', '링크를 열 수 없어요'))}
                  >
                    <Ionicons name="logo-instagram" size={16} color="#E1306C" />
                    <Text style={styles.snsText} numberOfLines={1}>{owner.sns_url}</Text>
                  </Pressable>
                ) : null}

                {/* 좋아요 / 공유 */}
                <View style={styles.actionRow}>
                  {!isMyList && (
                    <Pressable
                      onPress={toggleLike}
                      style={[styles.likeBtn, owner.liked && styles.likeBtnActive]}
                    >
                      <Ionicons
                        name={owner.liked ? 'heart' : 'heart-outline'}
                        size={18}
                        color={owner.liked ? '#fff' : '#FF7A45'}
                      />
                      <Text style={[styles.likeBtnText, owner.liked && { color: '#fff' }]}>
                        좋아요 {owner.like_count ?? 0}
                      </Text>
                    </Pressable>
                  )}
                  <Pressable onPress={shareList} style={styles.shareBtn}>
                    <Ionicons name="share-social-outline" size={18} color="#6C5CE7" />
                    <Text style={styles.shareBtnText}>리스트 공유</Text>
                  </Pressable>
                </View>

                {/* 다른 사용자 신고·차단 */}
                {!isMyList && (
                  <View style={styles.modRow}>
                    <Pressable onPress={() => setReportOpen(true)} hitSlop={6}>
                      <Text style={styles.modText}>🚩 신고</Text>
                    </Pressable>
                    {!owner.is_admin && (
                      <>
                        <Text style={styles.modDivider}>·</Text>
                        <Pressable onPress={handleBlockOwner} hitSlop={6}>
                          <Text style={styles.modText}>🚫 차단</Text>
                        </Pressable>
                      </>
                    )}
                  </View>
                )}
              </View>
            )}

            <SearchBar value={query} onChangeText={setQuery} />

            {/* 지역 필터 (이 리스트에 있는 시/도만) */}
            {provinces.length > 0 && (
              <ChipRow style={styles.chipRow}>
                <Pressable
                  onPress={() => { setProvince(null); setDistrict(null); }}
                  style={[styles.chip, province === null && styles.chipActiveRegion]}
                >
                  <Text style={[styles.chipText, province === null && styles.chipTextActive]}>전체 지역</Text>
                </Pressable>
                {provinces.map((p) => (
                  <Pressable
                    key={p}
                    onPress={() => { setProvince(province === p ? null : p); setDistrict(null); }}
                    style={[styles.chip, province === p && styles.chipActiveRegion]}
                  >
                    <Text style={[styles.chipText, province === p && styles.chipTextActive]}>{p}</Text>
                  </Pressable>
                ))}
              </ChipRow>
            )}

            {/* 구 (시/도 선택 시) */}
            {province && districts.length > 0 && (
              <ChipRow style={styles.chipRow}>
                <Pressable
                  onPress={() => setDistrict(null)}
                  style={[styles.chip, district === null && styles.chipActiveDistrict]}
                >
                  <Text style={[styles.chipText, district === null && styles.chipTextActive]}>{province} 전체</Text>
                </Pressable>
                {districts.map((d) => (
                  <Pressable
                    key={d}
                    onPress={() => setDistrict(district === d ? null : d)}
                    style={[styles.chip, district === d && styles.chipActiveDistrict]}
                  >
                    <Text style={[styles.chipText, district === d && styles.chipTextActive]}>{d}</Text>
                  </Pressable>
                ))}
              </ChipRow>
            )}

            {/* 카테고리 필터 (이 리스트에 있는 것만) */}
            {categories.length > 0 && (
              <ChipRow style={styles.chipRow}>
                <Pressable
                  onPress={() => setCategory(null)}
                  style={[styles.chip, category === null && styles.chipActiveCategory]}
                >
                  <Text style={[styles.chipText, category === null && styles.chipTextActive]}>전체 카테고리</Text>
                </Pressable>
                {categories.map((c) => (
                  <Pressable
                    key={c}
                    onPress={() => setCategory(category === c ? null : c)}
                    style={[styles.chip, category === c && styles.chipActiveCategory]}
                  >
                    <Text style={[styles.chipText, category === c && styles.chipTextActive]}>{c}</Text>
                  </Pressable>
                ))}
              </ChipRow>
            )}

            {/* 필터 결과 개수 */}
            {(province || district || category || q) ? (
              <Text style={styles.countText}>맛집 {filtered.length}개</Text>
            ) : null}
          </>
        }
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Text style={styles.emptySub}>{q ? '검색 결과가 없어요' : '아직 등록된 맛집이 없어요'}</Text>
          </View>
        }
        contentContainerStyle={styles.list}
        keyboardShouldPersistTaps="handled"
      />

      {owner && (
        <ReportModal
          visible={reportOpen}
          onClose={() => setReportOpen(false)}
          targetType="profile"
          targetId={owner.id}
          targetOwnerId={owner.id}
          targetLabel={`${owner.display_name}님의 리스트`}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F5F5F5' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { paddingBottom: 40 },
  profileCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 16,
    padding: 16,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  profileTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#6C5CE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarAdmin: { backgroundColor: '#FF7A45' },
  avatarText: { color: '#fff', fontSize: 22, fontWeight: '700' },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  ownerName: { fontSize: 18, fontWeight: '800', color: '#1a1a1a' },
  adminBadge: { backgroundColor: '#FFE8E8', paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6 },
  adminBadgeText: { fontSize: 11, color: '#FF7A45', fontWeight: '700' },
  stats: { fontSize: 13, color: '#999', marginTop: 3 },
  bio: { fontSize: 14, color: '#555', lineHeight: 20 },
  snsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FDF2F8',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  snsText: { fontSize: 13, color: '#E1306C', flex: 1 },
  actionRow: { flexDirection: 'row', gap: 8 },
  likeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#FF7A45',
    backgroundColor: '#fff',
  },
  likeBtnActive: { backgroundColor: '#FF7A45' },
  likeBtnText: { color: '#FF7A45', fontSize: 14, fontWeight: '700' },
  shareBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#6C5CE7',
    backgroundColor: '#fff',
  },
  shareBtnText: { color: '#6C5CE7', fontSize: 14, fontWeight: '700' },
  modRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 10 },
  modText: { fontSize: 12, color: '#aaa' },
  modDivider: { fontSize: 12, color: '#ddd' },
  emptyBox: { alignItems: 'center', paddingTop: 60 },
  emptySub: { fontSize: 14, color: '#aaa' },

  // 필터 칩
  chipRow: { paddingHorizontal: 16, paddingVertical: 4, gap: 8, flexDirection: 'row', alignItems: 'center' },
  chip: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: '#ddd',
    backgroundColor: '#fff',
  },
  chipActiveRegion: { backgroundColor: '#FF7A45', borderColor: '#FF7A45' },
  chipActiveDistrict: { backgroundColor: '#E17055', borderColor: '#E17055' },
  chipActiveCategory: { backgroundColor: '#6C5CE7', borderColor: '#6C5CE7' },
  chipText: { fontSize: 13, color: '#555' },
  chipTextActive: { color: '#fff', fontWeight: '600' },
  countText: { fontSize: 12, color: '#aaa', paddingHorizontal: 16, paddingTop: 6 },
});
