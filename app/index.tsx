import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import FilterBar from '@/components/FilterBar';
import RestaurantCard from '@/components/RestaurantCard';
import SearchBar from '@/components/SearchBar';
import { useAuth } from '@/context/AuthContext';
import { useRestaurants } from '@/context/RestaurantContext';

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
  } = useRestaurants();

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
                  <Text style={styles.exploreTitle}>전체 맛집 둘러보기 🔥</Text>
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
              <Text style={styles.emptyEmoji}>🍽️</Text>
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
  countText: { fontSize: 12, color: '#aaa' },
  emptyBox: { alignItems: 'center', paddingTop: 60, paddingHorizontal: 32, gap: 8 },
  emptyEmoji: { fontSize: 56 },
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
