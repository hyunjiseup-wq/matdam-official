import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import BrandIcon from '@/components/BrandIcon';
import RestaurantCard from '@/components/RestaurantCard';
import { notify } from '@/lib/confirm';
import { useAuth } from '@/context/AuthContext';
import { useRestaurants } from '@/context/RestaurantContext';
import { Collection, DiscoverItem, Restaurant } from '@/types/restaurant';

const normalize = (s: string) => s.trim().toLowerCase().replace(/\s+/g, '');

export default function CollectionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { isAdmin } = useAuth();
  const {
    restaurants,
    copyRestaurant,
    getCollection,
    getCollectionRestaurants,
    addToCollection,
    removeFromCollection,
    getDiscoverFeed,
  } = useRestaurants();

  const [collection, setCollection] = useState<Collection | null>(null);
  const [items, setItems] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedIds, setCopiedIds] = useState<Set<string>>(new Set());

  // 관리자: 맛집 추가 패널
  const [adding, setAdding] = useState(false);
  const [feed, setFeed] = useState<DiscoverItem[] | null>(null);
  const [query, setQuery] = useState('');

  const load = useCallback(async () => {
    try {
      const [c, rs] = await Promise.all([getCollection(id), getCollectionRestaurants(id)]);
      setCollection(c);
      setItems(rs);
    } catch {
      // 무시
    } finally {
      setLoading(false);
    }
  }, [id, getCollection, getCollectionRestaurants]);

  useEffect(() => {
    load();
  }, [load]);

  // 내 리스트에 이미 있는 맛집 (이름 기준)
  const myNames = useMemo(
    () => new Set(restaurants.map((r) => normalize(r.name))),
    [restaurants],
  );

  async function handleCopy(r: Restaurant) {
    try {
      await copyRestaurant(r);
      setCopiedIds((prev) => new Set(prev).add(r.id));
      notify('담기 완료!', '내 리스트의 "가고싶음"에 추가됐어요.');
    } catch (e: any) {
      notify('오류', e.message ?? '담기에 실패했어요.');
    }
  }

  async function openAddPanel() {
    setAdding(true);
    if (!feed) {
      try {
        setFeed(await getDiscoverFeed());
      } catch {
        notify('오류', '맛집 목록을 불러오지 못했어요.');
      }
    }
  }

  const candidates = useMemo(() => {
    if (!feed) return [];
    const inCollection = new Set(items.map((r) => normalize(r.name)));
    const q = query.trim().toLowerCase();
    return feed
      .filter((it) => !inCollection.has(normalize(it.name)))
      .filter((it) => {
        if (!q) return true;
        return `${it.name} ${it.area ?? ''} ${it.address ?? ''} ${it.category ?? ''}`
          .toLowerCase()
          .includes(q);
      })
      .slice(0, 20);
  }, [feed, items, query]);

  async function handleAdd(it: DiscoverItem) {
    try {
      await addToCollection(id, it.representativeId);
      await load();
    } catch (e: any) {
      notify('오류', e.message ?? '추가에 실패했어요.');
    }
  }

  async function handleRemove(r: Restaurant) {
    try {
      await removeFromCollection(id, r.id);
      setItems((prev) => prev.filter((x) => x.id !== r.id));
    } catch (e: any) {
      notify('오류', e.message ?? '제거에 실패했어요.');
    }
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#FF7A45" />
      </View>
    );
  }

  if (!collection) {
    return (
      <View style={styles.center}>
        <Text style={{ fontSize: 16, color: '#666' }}>컬렉션을 찾을 수 없어요</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <FlatList
        data={items}
        keyExtractor={(r) => r.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <>
            {/* 컬렉션 헤더 */}
            <View style={styles.header}>
              {collection.emoji ? (
                <Text style={styles.headerEmoji}>{collection.emoji}</Text>
              ) : (
                <View style={styles.headerIconWrap}>
                  <BrandIcon name="bowl" size={30} color="#FF7A45" />
                </View>
              )}
              <Text style={styles.headerTitle}>{collection.title}</Text>
              {collection.description ? (
                <Text style={styles.headerDesc}>{collection.description}</Text>
              ) : null}
              <Text style={styles.headerCount}>맛집 {items.length}곳</Text>
            </View>

            {/* 관리자: 맛집 추가 */}
            {isAdmin && (
              <View style={styles.adminBox}>
                {adding ? (
                  <View style={styles.addPanel}>
                    <View style={styles.addPanelHead}>
                      <TextInput
                        style={styles.searchInput}
                        placeholder="전체 맛집에서 검색..."
                        placeholderTextColor="#ccc"
                        value={query}
                        onChangeText={setQuery}
                        autoFocus
                      />
                      <Pressable onPress={() => setAdding(false)} hitSlop={8}>
                        <Ionicons name="close" size={20} color="#888" />
                      </Pressable>
                    </View>
                    {!feed ? (
                      <ActivityIndicator color="#6C5CE7" style={{ paddingVertical: 16 }} />
                    ) : (
                      candidates.map((it) => (
                        <View key={it.key} style={styles.candRow}>
                          {it.image_url ? (
                            <Image source={{ uri: it.image_url }} style={styles.candImg} />
                          ) : (
                            <View style={[styles.candImg, styles.candImgEmpty]}>
                              <BrandIcon name="bowl" size={18} color="#FFB694" />
                            </View>
                          )}
                          <View style={{ flex: 1 }}>
                            <Text style={styles.candName} numberOfLines={1}>{it.name}</Text>
                            <Text style={styles.candMeta} numberOfLines={1}>
                              {[it.area, it.category].filter(Boolean).join(' · ')}
                            </Text>
                          </View>
                          <Pressable style={styles.candAddBtn} onPress={() => handleAdd(it)} hitSlop={6}>
                            <Ionicons name="add" size={18} color="#fff" />
                          </Pressable>
                        </View>
                      ))
                    )}
                  </View>
                ) : (
                  <Pressable style={styles.addBtn} onPress={openAddPanel}>
                    <Ionicons name="add-circle-outline" size={18} color="#6C5CE7" />
                    <Text style={styles.addBtnText}>맛집 추가 (관리자)</Text>
                  </Pressable>
                )}
              </View>
            )}
          </>
        }
        renderItem={({ item }) => {
          const already = myNames.has(normalize(item.name)) || copiedIds.has(item.id);
          return (
            <View>
              <RestaurantCard
                restaurant={item}
                mode="browse"
                onPress={() => router.push(`/detail/${item.id}`)}
                onCopy={() => handleCopy(item)}
                copied={already}
              />
              {isAdmin && (
                <Pressable style={styles.removeRow} onPress={() => handleRemove(item)} hitSlop={4}>
                  <Ionicons name="remove-circle-outline" size={14} color="#FF7A45" />
                  <Text style={styles.removeText}>컬렉션에서 제거</Text>
                </Pressable>
              )}
            </View>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            {collection.emoji ? (
              <Text style={styles.emptyEmoji}>{collection.emoji}</Text>
            ) : (
              <View style={styles.headerIconWrap}>
                <BrandIcon name="bowl" size={30} color="#FF7A45" />
              </View>
            )}
            <Text style={styles.emptyTitle}>아직 담긴 맛집이 없어요</Text>
            <Text style={styles.emptySub}>곧 채워질 예정이에요!</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F5F5F5' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { paddingVertical: 12, paddingBottom: 100 },

  header: {
    alignItems: 'center',
    gap: 4,
    paddingVertical: 18,
    paddingHorizontal: 24,
    marginHorizontal: 16,
    marginBottom: 8,
    backgroundColor: '#fff',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 5,
    elevation: 2,
  },
  headerIconWrap: { width: 64, height: 64, borderRadius: 20, backgroundColor: '#FFF0E9', alignItems: 'center', justifyContent: 'center' },
  headerEmoji: { fontSize: 44 },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#1a1a1a' },
  headerDesc: { fontSize: 13.5, color: '#888', textAlign: 'center', lineHeight: 19 },
  headerCount: { fontSize: 12.5, color: '#FF7A45', fontWeight: '700', marginTop: 4 },

  adminBox: { marginHorizontal: 16, marginBottom: 8 },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 11,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#6C5CE7',
    borderStyle: 'dashed',
    backgroundColor: '#FBFAFF',
  },
  addBtnText: { color: '#6C5CE7', fontSize: 14, fontWeight: '600' },
  addPanel: { backgroundColor: '#fff', borderRadius: 12, padding: 12, gap: 8 },
  addPanelHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  searchInput: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 14,
    color: '#333',
  },
  candRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  candImg: { width: 40, height: 40, borderRadius: 8, backgroundColor: '#f0f0f0' },
  candImgEmpty: { alignItems: 'center', justifyContent: 'center' },
  candName: { fontSize: 14, fontWeight: '600', color: '#333' },
  candMeta: { fontSize: 12, color: '#999' },
  candAddBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#6C5CE7',
    alignItems: 'center',
    justifyContent: 'center',
  },

  removeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 4,
  },
  removeText: { fontSize: 12, color: '#FF7A45' },

  emptyBox: { alignItems: 'center', paddingTop: 60, gap: 8 },
  emptyEmoji: { fontSize: 52 },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: '#444' },
  emptySub: { fontSize: 13, color: '#aaa' },
});
