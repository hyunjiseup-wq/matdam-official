import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import * as Linking from 'expo-linking';
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
import { Profile } from '@/types/restaurant';

export default function ExploreScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { getUsers, likeList, unlikeList } = useRestaurants();
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setUsers(await getUsers());
    } catch {
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [getUsers]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  async function toggleLike(p: Profile) {
    const liked = !p.liked;
    // 낙관적 업데이트
    setUsers((prev) =>
      prev.map((u) =>
        u.id === p.id
          ? { ...u, liked, like_count: (u.like_count ?? 0) + (liked ? 1 : -1) }
          : u,
      ),
    );
    try {
      if (liked) await likeList(p.id);
      else await unlikeList(p.id);
    } catch {
      load(); // 실패 시 새로고침
    }
  }

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
        data={users}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const isMe = item.id === user?.id;
          return (
            <Pressable
              style={({ pressed }) => [styles.userCard, pressed && { opacity: 0.9 }]}
              onPress={() => router.push(`/user/${item.id}` as any)}
            >
              <View style={[styles.avatar, item.is_admin && styles.avatarAdmin]}>
                <Text style={styles.avatarText}>{item.display_name[0] ?? '?'}</Text>
              </View>
              <View style={styles.userInfo}>
                <View style={styles.nameRow}>
                  <Text style={styles.userName}>
                    {item.display_name}
                    {isMe && <Text style={styles.meTag}> (나)</Text>}
                  </Text>
                  {item.is_admin && (
                    <View style={styles.adminBadge}>
                      <Text style={styles.adminBadgeText}>공식</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.userMeta}>
                  맛집 {item.count ?? 0} · 👀 {item.view_count ?? 0}
                </Text>
                {item.sns_url ? (
                  <Pressable
                    onPress={(e) => {
                      e.stopPropagation();
                      Linking.openURL(item.sns_url!).catch(() => {});
                    }}
                    style={styles.snsRow}
                    hitSlop={4}
                  >
                    <Ionicons name="logo-instagram" size={13} color="#E1306C" />
                    <Text style={styles.snsText} numberOfLines={1}>{item.sns_url}</Text>
                  </Pressable>
                ) : null}
              </View>

              {/* 좋아요 */}
              <Pressable
                onPress={(e) => {
                  e.stopPropagation();
                  if (!isMe) toggleLike(item);
                }}
                style={styles.likeBtn}
                hitSlop={6}
                disabled={isMe}
              >
                <Ionicons
                  name={item.liked ? 'heart' : 'heart-outline'}
                  size={20}
                  color={item.liked ? '#FF7A45' : '#ccc'}
                />
                <Text style={[styles.likeCount, item.liked && { color: '#FF7A45' }]}>
                  {item.like_count ?? 0}
                </Text>
              </Pressable>
            </Pressable>
          );
        }}
        ListHeaderComponent={
          <Text style={styles.header}>
            인기순으로 정렬돼요 🔥 좋아요·조회수가 많은 리스트가 위로!
          </Text>
        }
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Text style={styles.emptySub}>아직 사용자가 없어요</Text>
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
  list: { padding: 16, gap: 8 },
  header: { fontSize: 14, color: '#888', lineHeight: 20, marginBottom: 8, paddingHorizontal: 2 },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#6C5CE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarAdmin: { backgroundColor: '#FF7A45' },
  avatarText: { color: '#fff', fontSize: 18, fontWeight: '700' },
  userInfo: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  userName: { fontSize: 16, fontWeight: '700', color: '#1a1a1a' },
  meTag: { fontSize: 13, color: '#aaa', fontWeight: '500' },
  adminBadge: { backgroundColor: '#FFE8E8', paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6 },
  adminBadgeText: { fontSize: 11, color: '#FF7A45', fontWeight: '700' },
  userMeta: { fontSize: 13, color: '#999', marginTop: 2 },
  snsRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 3 },
  snsText: { fontSize: 12, color: '#E1306C', maxWidth: 180 },
  likeBtn: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4, minWidth: 36 },
  likeCount: { fontSize: 12, color: '#bbb', fontWeight: '600', marginTop: 1 },
  emptyBox: { alignItems: 'center', paddingTop: 60 },
  emptySub: { fontSize: 14, color: '#aaa' },
});
