import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import * as Linking from 'expo-linking';
import React, { useCallback, useEffect, useState } from 'react';
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
import RestaurantCard from '@/components/RestaurantCard';
import SearchBar from '@/components/SearchBar';
import { notify } from '@/lib/confirm';
import { useAuth } from '@/context/AuthContext';
import { useRestaurants } from '@/context/RestaurantContext';
import { Profile, Restaurant } from '@/types/restaurant';

const SITE = 'https://2nd-app-green.vercel.app';

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
    restaurants: myRestaurants,
  } = useRestaurants();

  const [items, setItems] = useState<Restaurant[]>([]);
  const [owner, setOwner] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [copiedIds, setCopiedIds] = useState<Set<string>>(new Set());

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
  const filtered = q
    ? items.filter((r) => `${r.name} ${r.area ?? ''} ${r.memo ?? ''}`.toLowerCase().includes(q))
    : items;

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
                  <View style={[styles.avatar, owner.is_admin && styles.avatarAdmin]}>
                    <Text style={styles.avatarText}>{owner.display_name[0] ?? '?'}</Text>
                  </View>
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
              </View>
            )}

            <SearchBar value={query} onChangeText={setQuery} />
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
  emptyBox: { alignItems: 'center', paddingTop: 60 },
  emptySub: { fontSize: 14, color: '#aaa' },
});
