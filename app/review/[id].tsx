import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { notify } from '@/lib/confirm';
import { useRestaurants } from '@/context/RestaurantContext';

function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <View style={{ flexDirection: 'row', gap: 10, marginTop: 8 }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Pressable key={n} onPress={() => onChange(n)} hitSlop={6}>
          <Ionicons
            name={n <= value ? 'star' : 'star-outline'}
            size={36}
            color={n <= value ? '#FDCB6E' : '#ddd'}
          />
        </Pressable>
      ))}
    </View>
  );
}

export default function ReviewScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { getRestaurant, getReviews, saveReview } = useRestaurants();
  const restaurant = getRestaurant(id);
  const [rating, setRating] = useState(4);
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // 기존 리뷰 있으면 불러오기 (나의 리뷰)
    // getReviews는 전체 리뷰이므로 별도로 내 리뷰만 가져오지 않고, 간단히 기본값 사용
  }, []);

  async function handleSave() {
    if (rating === 0) {
      notify('별점을 선택해주세요');
      return;
    }
    setSaving(true);
    try {
      await saveReview(id, rating, content);
      notify('리뷰 저장 완료!', '리뷰가 저장됐어요.');
      router.back();
    } catch (e: any) {
      notify('오류', e.message ?? '저장에 실패했어요.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {restaurant && (
            <View style={styles.restaurantTag}>
              <Text style={styles.restaurantName}>{restaurant.name}</Text>
              {restaurant.area && <Text style={styles.restaurantArea}>📍 {restaurant.area}</Text>}
            </View>
          )}

          <Text style={styles.sectionLabel}>별점</Text>
          <StarPicker value={rating} onChange={setRating} />

          <Text style={[styles.sectionLabel, { marginTop: 20 }]}>리뷰 내용 (선택)</Text>
          <TextInput
            style={styles.textarea}
            value={content}
            onChangeText={setContent}
            placeholder="방문 후기를 자유롭게 적어주세요..."
            placeholderTextColor="#bbb"
            multiline
            numberOfLines={5}
            textAlignVertical="top"
          />

          <Pressable
            onPress={handleSave}
            disabled={saving}
            style={({ pressed }) => [styles.btn, pressed && { opacity: 0.85 }, saving && { opacity: 0.6 }]}
          >
            <Ionicons name="checkmark-circle" size={20} color="#fff" />
            <Text style={styles.btnText}>{saving ? '저장 중...' : '리뷰 저장'}</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F5F5F5' },
  content: { padding: 16, gap: 8, paddingBottom: 40 },
  restaurantTag: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  restaurantName: { fontSize: 16, fontWeight: '700', color: '#1a1a1a' },
  restaurantArea: { fontSize: 13, color: '#888' },
  sectionLabel: { fontSize: 14, fontWeight: '600', color: '#555' },
  textarea: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: '#222',
    borderWidth: 1,
    borderColor: '#eee',
    minHeight: 120,
    marginTop: 6,
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FF6B6B',
    borderRadius: 14,
    paddingVertical: 16,
    marginTop: 12,
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
