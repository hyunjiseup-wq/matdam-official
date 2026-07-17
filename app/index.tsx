import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
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
import BrandIcon from '@/components/BrandIcon';
import FilterBar from '@/components/FilterBar';
import RestaurantCard from '@/components/RestaurantCard';
import SearchBar from '@/components/SearchBar';
import { useAuth } from '@/context/AuthContext';
import { useRestaurants } from '@/context/RestaurantContext';
import { DiscoverItem } from '@/types/restaurant';

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const {
    restaurants,
    filteredRestaurants,
    loading,
    searchQuery,
    setSearchQuery,
    toggleVisited,
    toggleWishlist,
    getProfile,
    getDiscoverFeed,
  } = useRestaurants();

  // ── 관심 지역 추천 ──────────────────────────────────────────────
  const [region, setRegion] = useState<string>('');
  const [recs, setRecs] = useState<DiscoverItem[]>([]);


  const buildRecs = useCallback(
    (feed: DiscoverItem[], regionInput: string) => {
      const tokens = regionInput
        .split(/[,/·]+/)
        .map((t) => t.trim())
        .filter((t) => t.length >= 2);
      if (tokens.length === 0) return [] as DiscoverItem[];

      // 내 리스트에 이미 있는 맛집은 제외 (이름 기준)
      const mine = new Set(restaurants.map((r) => r.name.replace(/\s+/g, '')));

      return feed
        .filter((it) => {
          const text = `${it.address ?? ''} ${it.area ?? ''}`;
          if (!tokens.some((t) => text.includes(t))) return false;
          if (mine.has(it.name.replace(/\s+/g, ''))) return false;
          return true;
        })
        .sort(
          (a, b) =>
            b.addedCount - a.addedCount ||
            b.avgRating - a.avgRating ||
            b.reviewCount - a.reviewCount,
        )
        .slice(0, 10);
    },
    [restaurants],
  );

  useFocusEffect(
    useCallback(() => {
      if (!user) return;
      let alive = true;
      (async () => {
        try {
          const p = await getProfile(user.id);
          const reg = (p?.preferred_region ?? '').trim();
          if (!alive) return;
          setRegion(reg);
          if (!reg) {
            setRecs([]);
            return;
          }
          const feed = await getDiscoverFeed(); // 컨텍스트에서 60초 캐시됨
          if (!alive) return;
          setRecs(buildRecs(feed, reg));
        } catch {
          // 추천 실패는 조용히 무시 (홈 핵심 기능 아님)
        }
      })();
      return () => {
        alive = false;
      };
    }, [user?.id, getProfile, getDiscoverFeed, buildRecs]),
  );

  // 첫 로그인 시 사용법 가이드 1회 자동 노출
  useEffect(() => {
    if (!user) return;
    const key = `matdam_guide_seen_${user.id}`;
    (async () => {
      try {
        const seen = await AsyncStorage.getItem(key);
        if (!seen) {
          await AsyncStorage.setItem(key, '1');
          router.push('/guide' as any);
        }
      } catch {
        // 무시 (가이드는 프로필에서 언제든 다시 볼 수 있음)
      }
    })();
  }, [user?.id]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#FF7A45" />
        <Text style={styles.loadingText}>맛집 불러오는 중...</Text>
      </View>
    );
  }

  const isEmpty = restaurants.length === 0;

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <FlatList
        data={filteredRestaurants}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <RestaurantCard
            restaurant={item}
            mode="own"
            onPress={() => router.push(`/detail/${item.id}`)}
            onToggleVisited={() => toggleVisited(item.id)}
            onToggleWishlist={() => toggleWishlist(item.id)}
          />
        )}
        ListHeaderComponent={
          <>
            {/* 전체 맛집 배너 */}
            <Pressable style={styles.discoverBanner} onPress={() => router.push('/discover' as any)}>
              <View style={styles.exploreLeft}>
                <Ionicons name="restaurant" size={22} color="#fff" />
                <View>
                  <Text style={styles.exploreTitle}>전체 맛집 둘러보기</Text>
                  <Text style={styles.discoverSub}>인기순·별점순·방문순으로 한눈에</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#fff" />
            </Pressable>

            {/* 둘러보기 배너 */}
            <Pressable style={styles.exploreBanner} onPress={() => router.push('/explore' as any)}>
              <View style={styles.exploreLeft}>
                <Ionicons name="compass" size={22} color="#fff" />
                <View>
                  <Text style={styles.exploreTitle}>다른 사람 리스트 둘러보기</Text>
                  <Text style={styles.exploreSub}>맘에 드는 맛집을 내 리스트로 담아보세요</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#fff" />
            </Pressable>

            {/* 관심 지역 추천 */}
            {region && recs.length > 0 && (
              <View style={styles.recSection}>
                <View style={styles.recHead}>
                  <View style={styles.recTitleRow}>
                    <BrandIcon name="pin" size={13} color="#FF7A45" />
                    <Text style={styles.recTitle}>{region} 추천 맛집</Text>
                  </View>
                  <Pressable onPress={() => router.push('/profile' as any)} hitSlop={6}>
                    <Text style={styles.recEdit}>지역 변경</Text>
                  </Pressable>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.recRow}>
                  {recs.map((it) => (
                    <Pressable
                      key={it.key}
                      style={styles.recCard}
                      onPress={() => router.push(`/detail/${it.representativeId}`)}
                    >
                      {it.image_url ? (
                        <Image source={{ uri: it.image_url }} style={styles.recImg} />
                      ) : (
                        <View style={[styles.recImg, styles.recImgEmpty]}>
                          <BrandIcon name="bowl" size={24} color="#FFB694" />
                        </View>
                      )}
                      <View style={styles.recBody}>
                        <Text style={styles.recName} numberOfLines={1}>{it.name}</Text>
                        <Text style={styles.recMeta} numberOfLines={1}>
                          {it.category || '음식점'}{it.area ? ` · ${it.area}` : ''}
                        </Text>
                        <View style={styles.recStatRow}>
                          <BrandIcon name="fire" size={11} color="#FF7A45" />
                          <Text style={styles.recStat}>{it.addedCount}명 담음</Text>
                          {it.avgRating > 0 && (
                            <>
                              <BrandIcon name="star" size={11} color="#F5A623" />
                              <Text style={styles.recStat}>{it.avgRating.toFixed(1)}</Text>
                            </>
                          )}
                        </View>
                      </View>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* 관심 지역 미설정 힌트 */}
            {!region && !isEmpty && (
              <Pressable style={styles.regionHintRow} onPress={() => router.push('/profile' as any)}>
                <Ionicons name="location-outline" size={15} color="#FF7A45" />
                <Text style={styles.regionHintText}>
                  관심 지역을 설정하면 여기에 추천 맛집이 떠요
                </Text>
                <Ionicons name="chevron-forward" size={14} color="#ccc" />
              </Pressable>
            )}

            {!isEmpty && (
              <>
                <SearchBar value={searchQuery} onChangeText={setSearchQuery} />
                <FilterBar />
                <View style={styles.countRow}>
                  <Text style={styles.countText}>내 맛집 {filteredRestaurants.length}개</Text>
                </View>
              </>
            )}
          </>
        }
        ListEmptyComponent={
          isEmpty ? (
            <View style={styles.emptyBox}>
              <View style={styles.emptyIconWrap}>
                <BrandIcon name="bowl" size={34} color="#FF7A45" />
              </View>
              <Text style={styles.emptyTitle}>아직 담은 맛집이 없어요</Text>
              <Text style={styles.emptySub}>
                위 "둘러보기"에서 다른 사람 리스트를 구경하거나{'\n'}아래 + 버튼으로 직접 추가해보세요
              </Text>
              <Pressable style={styles.emptyBtn} onPress={() => router.push('/explore' as any)}>
                <Ionicons name="compass" size={18} color="#fff" />
                <Text style={styles.emptyBtnText}>둘러보기</Text>
              </Pressable>
              <Pressable style={styles.emptyGuideLink} onPress={() => router.push('/guide' as any)} hitSlop={6}>
                <Ionicons name="book-outline" size={15} color="#FF7A45" />
                <Text style={styles.emptyGuideText}>처음이신가요? 사용법 보기</Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyTitle}>검색 결과가 없어요</Text>
              <Text style={styles.emptySub}>다른 키워드나 필터로 찾아보세요</Text>
            </View>
          )
        }
        contentContainerStyle={styles.list}
        keyboardShouldPersistTaps="handled"
      />

      {/* 오른쪽 중앙: 테마 컬렉션으로 이동 */}
      <Pressable
        style={({ pressed }) => [styles.collectionsFab, pressed && { opacity: 0.85 }]}
        onPress={() => router.push('/collections' as any)}
      >
        <BrandIcon name="compass" size={18} color="#6C5CE7" />
        <Text style={styles.collectionsFabText}>테마{'\n'}컬렉션</Text>
        <Ionicons name="chevron-forward" size={14} color="#6C5CE7" />
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F5F5F5' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText: { fontSize: 14, color: '#aaa' },
  list: { paddingBottom: 100 },
  discoverBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FF7A45',
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    borderRadius: 14,
    padding: 16,
  },
  exploreBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#6C5CE7',
    marginHorizontal: 16,
    marginBottom: 4,
    borderRadius: 14,
    padding: 16,
  },
  exploreLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  exploreTitle: { color: '#fff', fontSize: 15, fontWeight: '700' },
  exploreSub: { color: '#E0DBFF', fontSize: 12, marginTop: 2 },
  discoverSub: { color: '#FFE4D6', fontSize: 12, marginTop: 2 },
  countRow: { paddingHorizontal: 16, paddingBottom: 4, paddingTop: 2 },
  recSection: { marginTop: 8, marginBottom: 4 },
  recHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  recTitle: { fontSize: 15, fontWeight: '800', color: '#1a1a1a' },
  recEdit: { fontSize: 12, color: '#FF7A45', fontWeight: '600' },
  recRow: { paddingHorizontal: 16, gap: 10 },
  recCard: {
    width: 150,
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#eee',
  },
  recImg: { width: '100%', height: 92, backgroundColor: '#f0f0f0' },
  recImgEmpty: { alignItems: 'center', justifyContent: 'center' },
  recBody: { padding: 10, gap: 2 },
  recName: { fontSize: 13, fontWeight: '700', color: '#222' },
  recMeta: { fontSize: 11, color: '#999' },
  recStatRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 2 },
  recStat: { fontSize: 11, color: '#FF7A45', fontWeight: '600' },
  recTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  collectionsFab: {
    position: 'absolute',
    right: 0,
    top: '42%',
    alignItems: 'center',
    gap: 3,
    paddingVertical: 12,
    paddingHorizontal: 7,
    backgroundColor: '#fff',
    borderTopLeftRadius: 14,
    borderBottomLeftRadius: 14,
    borderWidth: 1,
    borderRightWidth: 0,
    borderColor: '#E4DFFF',
    shadowColor: '#000',
    shadowOffset: { width: -2, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },

  collectionsFabText: {
    fontSize: 10.5,
    color: '#6C5CE7',
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 13,
  },
  regionHintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 2,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#FFF7F3',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FFE4D6',
  },
  regionHintText: { flex: 1, fontSize: 12, color: '#B8734F' },
  countText: { fontSize: 12, color: '#aaa' },
  emptyBox: { alignItems: 'center', paddingTop: 60, paddingHorizontal: 32, gap: 8 },
  emptyIconWrap: { width: 76, height: 76, borderRadius: 26, backgroundColor: '#FFF0E9', alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#444' },
  emptySub: { fontSize: 14, color: '#aaa', textAlign: 'center', lineHeight: 20 },
  emptyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#6C5CE7',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 12,
  },
  emptyBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  emptyGuideLink: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 16 },
  emptyGuideText: { color: '#FF7A45', fontSize: 13, fontWeight: '600' },
});
