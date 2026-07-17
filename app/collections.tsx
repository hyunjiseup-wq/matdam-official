import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
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
import { confirmAction, notify } from '@/lib/confirm';
import { useAuth } from '@/context/AuthContext';
import { useRestaurants } from '@/context/RestaurantContext';
import { Collection } from '@/types/restaurant';

export default function CollectionsScreen() {
  const router = useRouter();
  const { isAdmin } = useAuth();
  const { getCollections, createCollection, deleteCollection } = useRestaurants();

  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newEmoji, setNewEmoji] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      setCollections(await getCollections());
    } catch {
      // 무시
    } finally {
      setLoading(false);
    }
  }, [getCollections]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  async function handleCreate() {
    if (!newTitle.trim()) {
      notify('입력 오류', '컬렉션 이름을 입력해주세요.');
      return;
    }
    setSaving(true);
    try {
      const id = await createCollection({
        title: newTitle.trim(),
        emoji: newEmoji.trim(),
        description: newDesc.trim(),
      });
      setCreating(false);
      setNewTitle('');
      setNewEmoji('');
      setNewDesc('');
      router.push(`/collection/${id}` as any);
    } catch (e: any) {
      notify('오류', e.message ?? '컬렉션 생성에 실패했어요.');
    } finally {
      setSaving(false);
    }
  }

  function handleDelete(c: Collection) {
    confirmAction('컬렉션 삭제', `"${c.title}" 컬렉션을 삭제할까요?\n(맛집 자체는 삭제되지 않아요)`, async () => {
      try {
        await deleteCollection(c.id);
        setCollections((prev) => prev.filter((x) => x.id !== c.id));
      } catch (e: any) {
        notify('오류', e.message ?? '삭제 실패');
      }
    }, '삭제', true);
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#FF7A45" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <FlatList
        data={collections}
        keyExtractor={(c) => c.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          isAdmin ? (
            <View style={styles.adminBox}>
              {creating ? (
                <View style={styles.createForm}>
                  <View style={styles.createRow}>
                    <TextInput
                      style={[styles.input, styles.emojiInput]}
                      placeholder="🍜"
                      placeholderTextColor="#ccc"
                      value={newEmoji}
                      onChangeText={setNewEmoji}
                      maxLength={4}
                    />
                    <TextInput
                      style={[styles.input, { flex: 1 }]}
                      placeholder="컬렉션 이름 (예: 골목 노포)"
                      placeholderTextColor="#ccc"
                      value={newTitle}
                      onChangeText={setNewTitle}
                    />
                  </View>
                  <TextInput
                    style={styles.input}
                    placeholder="한 줄 소개 (선택)"
                    placeholderTextColor="#ccc"
                    value={newDesc}
                    onChangeText={setNewDesc}
                  />
                  <View style={styles.createRow}>
                    <Pressable style={styles.cancelBtn} onPress={() => setCreating(false)}>
                      <Text style={styles.cancelBtnText}>취소</Text>
                    </Pressable>
                    <Pressable style={styles.saveBtn} onPress={handleCreate} disabled={saving}>
                      <Text style={styles.saveBtnText}>{saving ? '만드는 중...' : '만들기'}</Text>
                    </Pressable>
                  </View>
                </View>
              ) : (
                <Pressable style={styles.newBtn} onPress={() => setCreating(true)}>
                  <Ionicons name="add-circle-outline" size={18} color="#6C5CE7" />
                  <Text style={styles.newBtnText}>새 컬렉션 만들기 (관리자)</Text>
                </Pressable>
              )}
            </View>
          ) : null
        }
        renderItem={({ item }) => (
          <Pressable
            style={styles.card}
            onPress={() => router.push(`/collection/${item.id}` as any)}
          >
            <View style={styles.cardTop}>
              {item.emoji ? (
                <Text style={styles.cardEmoji}>{item.emoji}</Text>
              ) : (
                <View style={styles.cardIconWrap}>
                  <BrandIcon name="bowl" size={22} color="#FF7A45" />
                </View>
              )}
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>{item.title}</Text>
                {item.description ? (
                  <Text style={styles.cardDesc} numberOfLines={2}>{item.description}</Text>
                ) : null}
                <Text style={styles.cardCount}>맛집 {item.itemCount ?? 0}곳</Text>
              </View>
              {isAdmin && (
                <Pressable onPress={() => handleDelete(item)} hitSlop={8}>
                  <Ionicons name="trash-outline" size={17} color="#ccc" />
                </Pressable>
              )}
              <Ionicons name="chevron-forward" size={18} color="#ccc" />
            </View>
            {(item.previewImages ?? []).length > 0 && (
              <View style={styles.previewRow}>
                {(item.previewImages ?? []).map((img, i) => (
                  <Image key={i} source={{ uri: img }} style={styles.previewImg} />
                ))}
              </View>
            )}
          </Pressable>
        )}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <View style={styles.emptyIconWrap}>
              <BrandIcon name="compass" size={34} color="#FF7A45" />
            </View>
            <Text style={styles.emptyTitle}>아직 컬렉션이 없어요</Text>
            <Text style={styles.emptySub}>곧 테마별 맛집 큐레이션이 올라올 예정이에요</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F5F5F5' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { padding: 16, gap: 10, paddingBottom: 100 },

  adminBox: { marginBottom: 4 },
  newBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#6C5CE7',
    borderStyle: 'dashed',
    backgroundColor: '#FBFAFF',
  },
  newBtnText: { color: '#6C5CE7', fontSize: 14, fontWeight: '600' },
  createForm: { backgroundColor: '#fff', borderRadius: 12, padding: 12, gap: 8 },
  createRow: { flexDirection: 'row', gap: 8 },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#333',
  },
  emojiInput: { width: 64, textAlign: 'center' },
  cancelBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#f0f0f0',
  },
  cancelBtnText: { color: '#888', fontWeight: '600' },
  saveBtn: {
    flex: 2,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#6C5CE7',
  },
  saveBtnText: { color: '#fff', fontWeight: '700' },

  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 5,
    elevation: 2,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  cardEmoji: { fontSize: 32 },
  cardIconWrap: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#FFF0E9', alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontSize: 16, fontWeight: '800', color: '#1a1a1a' },
  cardDesc: { fontSize: 12.5, color: '#888', marginTop: 2, lineHeight: 17 },
  cardCount: { fontSize: 12, color: '#FF7A45', fontWeight: '600', marginTop: 4 },
  previewRow: { flexDirection: 'row', gap: 6 },
  previewImg: { flex: 1, height: 76, borderRadius: 8, backgroundColor: '#f0f0f0' },

  emptyBox: { alignItems: 'center', paddingTop: 80, gap: 8 },
  emptyIconWrap: { width: 72, height: 72, borderRadius: 24, backgroundColor: '#FFF0E9', alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: '#444' },
  emptySub: { fontSize: 13, color: '#aaa' },
});
