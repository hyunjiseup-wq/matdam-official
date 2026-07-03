import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AREAS, CATEGORIES, inferAreaFromAddress } from '@/constants/filters';
import { notify } from '@/lib/confirm';
import { extractPlace } from '@/lib/placeExtract';
import { useRestaurants } from '@/context/RestaurantContext';
import { MapSource, Restaurant } from '@/types/restaurant';

function Label({ text, required }: { text: string; required?: boolean }) {
  return (
    <Text style={styles.label}>
      {text}
      {required && <Text style={styles.required}> *</Text>}
    </Text>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.field}>
      <Label text={label} required={required} />
      {children}
    </View>
  );
}

function ChipSelector({
  options,
  value,
  onChange,
  color = '#FF7A45',
}: {
  options: string[];
  value: string;
  onChange: (v: string) => void;
  color?: string;
}) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 6 }}>
      <View style={{ flexDirection: 'row', gap: 6 }}>
        {options.map((opt) => {
          const active = value === opt;
          return (
            <Pressable
              key={opt}
              onPress={() => onChange(active ? '' : opt)}
              style={[styles.chip, active && { backgroundColor: color, borderColor: color }]}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{opt}</Text>
            </Pressable>
          );
        })}
      </View>
    </ScrollView>
  );
}

function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Pressable key={n} onPress={() => onChange(n)} hitSlop={4}>
          <Ionicons
            name={n <= value ? 'star' : 'star-outline'}
            size={28}
            color={n <= value ? '#FDCB6E' : '#ddd'}
          />
        </Pressable>
      ))}
      <Text style={styles.priorityLabel}>{value}/5</Text>
    </View>
  );
}

type FormData = {
  name: string;
  area: string;
  category: string;
  address: string;
  naver_map_url: string;
  map_source: '' | MapSource;
  image_url: string;
  tagsInput: string;
  memo: string;
  visited: boolean;
  wishlist: boolean;
  priority: number;
};

export default function FormScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const router = useRouter();
  const { getRestaurant, addRestaurant, updateRestaurant, uploadPhoto } = useRestaurants();

  const isEdit = Boolean(id);
  const existing = id ? getRestaurant(id) : undefined;

  const [form, setForm] = useState<FormData>({
    name: '',
    area: '',
    category: '',
    address: '',
    naver_map_url: '',
    map_source: '',
    image_url: '',
    tagsInput: '',
    memo: '',
    visited: false,
    wishlist: false,
    priority: 3,
  });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [autoUrl, setAutoUrl] = useState('');
  const [extracting, setExtracting] = useState(false);

  useEffect(() => {
    if (existing) {
      setForm({
        name: existing.name,
        area: existing.area ?? '',
        category: existing.category ?? '',
        address: existing.address ?? '',
        naver_map_url: existing.naver_map_url ?? '',
        map_source: existing.map_source ?? '',
        image_url: existing.image_url ?? '',
        tagsInput: (existing.tags ?? []).join(', '),
        memo: existing.memo ?? '',
        visited: existing.visited,
        wishlist: existing.wishlist,
        priority: existing.priority,
      });
    }
  }, []);

  function set<K extends keyof FormData>(key: K, value: FormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleAutofill() {
    const url = autoUrl.trim();
    if (!url) {
      notify('안내', '네이버 또는 구글 지도 링크를 붙여넣어 주세요.');
      return;
    }
    setExtracting(true);
    try {
      const d = await extractPlace(url);
      setForm((prev) => ({
        ...prev,
        name: d.name || prev.name,
        address: d.address || prev.address,
        category: d.category || prev.category,
        area: inferAreaFromAddress(d.address) || prev.area,
        image_url: d.image_url || prev.image_url,
        naver_map_url: d.naver_map_url || url,
        map_source: d.map_source || prev.map_source,
      }));
      notify(
        d.ai ? '자동 인식 완료 ✨' : '기본 정보만 채웠어요',
        d.ai
          ? '내용을 확인하고 필요하면 수정해주세요.'
          : '이름·사진 위주로 채웠어요. 주소·카테고리는 확인해주세요.'
      );
    } catch (e: any) {
      notify('자동 인식 실패', e.message ?? '링크를 확인하거나 직접 입력해주세요.');
    } finally {
      setExtracting(false);
    }
  }

  function pickPhoto() {
    if (Platform.OS !== 'web') {
      notify('안내', '사진 직접 업로드는 웹에서 가능해요.\n모바일에서는 아래에 이미지 URL을 붙여넣어 주세요.');
      return;
    }
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      setUploading(true);
      try {
        const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
        const url = await uploadPhoto(file, ext);
        set('image_url', url);
      } catch (e: any) {
        notify('업로드 실패', e.message ?? '다시 시도해주세요.');
      } finally {
        setUploading(false);
      }
    };
    input.click();
  }

  async function handleSave() {
    if (!form.name.trim()) {
      notify('입력 오류', '식당 이름을 입력해주세요.');
      return;
    }
    setSaving(true);
    const tags = form.tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const payload: Omit<Restaurant, 'id' | 'owner_id' | 'created_at' | 'updated_at'> = {
      name: form.name.trim(),
      area: form.area || undefined,
      category: form.category || undefined,
      address: form.address.trim() || undefined,
      naver_map_url: form.naver_map_url.trim() || undefined,
      map_source: form.map_source || undefined,
      image_url: form.image_url.trim() || undefined,
      tags: tags.length > 0 ? tags : undefined,
      memo: form.memo.trim() || undefined,
      visited: form.visited,
      wishlist: form.wishlist,
      priority: form.priority,
    };

    try {
      if (isEdit && id) {
        await updateRestaurant(id, payload);
      } else {
        await addRestaurant(payload);
      }
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
          {/* 지도 링크 자동 채우기 */}
          {!isEdit && (
            <View style={styles.autofillCard}>
              <View style={styles.autofillHead}>
                <Ionicons name="sparkles" size={16} color="#6C5CE7" />
                <Text style={styles.autofillTitle}>지도 링크로 자동 채우기</Text>
              </View>
              <Text style={styles.autofillSub}>
                네이버·구글 지도의 공유 링크를 붙여넣으면 이름·주소·사진을 자동으로 인식해요.
              </Text>
              <TextInput
                style={[styles.input, { marginTop: 10 }]}
                value={autoUrl}
                onChangeText={setAutoUrl}
                placeholder="예: https://naver.me/xxxxxxx"
                placeholderTextColor="#ccc"
                autoCapitalize="none"
                keyboardType="url"
                editable={!extracting}
              />
              <Pressable
                onPress={handleAutofill}
                disabled={extracting}
                style={({ pressed }) => [
                  styles.autofillBtn,
                  pressed && { opacity: 0.85 },
                  extracting && { opacity: 0.6 },
                ]}
              >
                <Ionicons
                  name={extracting ? 'hourglass-outline' : 'sparkles-outline'}
                  size={18}
                  color="#fff"
                />
                <Text style={styles.autofillBtnText}>
                  {extracting ? '인식 중...' : '자동으로 채우기'}
                </Text>
              </Pressable>
            </View>
          )}

          {/* 식당 이름 */}
          <Field label="식당 이름" required>
            <TextInput
              style={styles.input}
              value={form.name}
              onChangeText={(v) => set('name', v)}
              placeholder="예: 성수연방"
              placeholderTextColor="#ccc"
              returnKeyType="next"
            />
          </Field>

          {/* 지역 */}
          <Field label="지역">
            <TextInput
              style={styles.input}
              value={form.area}
              onChangeText={(v) => set('area', v)}
              placeholder="직접 입력하거나 아래에서 선택"
              placeholderTextColor="#ccc"
            />
            <ChipSelector
              options={AREAS}
              value={form.area}
              onChange={(v) => set('area', v)}
            />
          </Field>

          {/* 카테고리 */}
          <Field label="카테고리">
            <TextInput
              style={styles.input}
              value={form.category}
              onChangeText={(v) => set('category', v)}
              placeholder="직접 입력하거나 아래에서 선택"
              placeholderTextColor="#ccc"
            />
            <ChipSelector
              options={CATEGORIES}
              value={form.category}
              onChange={(v) => set('category', v)}
              color="#6C5CE7"
            />
          </Field>

          {/* 주소 */}
          <Field label="주소">
            <TextInput
              style={styles.input}
              value={form.address}
              onChangeText={(v) => set('address', v)}
              placeholder="서울 성동구 연무장5가길 7"
              placeholderTextColor="#ccc"
            />
          </Field>

          {/* 지도 출처 + 링크 */}
          <Field label="지도 링크">
            <View style={styles.sourceRow}>
              <Pressable
                onPress={() => set('map_source', form.map_source === 'naver' ? '' : 'naver')}
                style={[styles.sourceChip, form.map_source === 'naver' && styles.sourceChipNaver]}
              >
                <Text style={[styles.sourceChipText, form.map_source === 'naver' && { color: '#fff' }]}>
                  N 네이버
                </Text>
              </Pressable>
              <Pressable
                onPress={() => set('map_source', form.map_source === 'google' ? '' : 'google')}
                style={[styles.sourceChip, form.map_source === 'google' && styles.sourceChipGoogle]}
              >
                <Text style={[styles.sourceChipText, form.map_source === 'google' && { color: '#fff' }]}>
                  G 구글
                </Text>
              </Pressable>
              <Text style={styles.sourceHint}>출처 선택 (배지로 표시돼요)</Text>
            </View>
            <TextInput
              style={[styles.input, { marginTop: 8 }]}
              value={form.naver_map_url}
              onChangeText={(v) => set('naver_map_url', v)}
              placeholder="지도 링크 붙여넣기 (네이버/구글 모두 가능)"
              placeholderTextColor="#ccc"
              autoCapitalize="none"
              keyboardType="url"
            />
          </Field>

          {/* 음식 사진 (업로드 또는 URL) */}
          <Field label="음식 사진">
            {form.image_url ? (
              <Image source={{ uri: form.image_url }} style={styles.preview} />
            ) : null}
            <View style={styles.photoRow}>
              <Pressable
                onPress={pickPhoto}
                disabled={uploading}
                style={({ pressed }) => [styles.uploadBtn, pressed && { opacity: 0.85 }, uploading && { opacity: 0.6 }]}
              >
                <Ionicons name="cloud-upload-outline" size={18} color="#6C5CE7" />
                <Text style={styles.uploadBtnText}>{uploading ? '업로드 중...' : '사진 업로드'}</Text>
              </Pressable>
              {form.image_url ? (
                <Pressable onPress={() => set('image_url', '')} style={styles.removePhotoBtn}>
                  <Ionicons name="trash-outline" size={16} color="#FF7A45" />
                  <Text style={styles.removePhotoText}>제거</Text>
                </Pressable>
              ) : null}
            </View>
            <TextInput
              style={[styles.input, { marginTop: 8 }]}
              value={form.image_url}
              onChangeText={(v) => set('image_url', v)}
              placeholder="또는 이미지 URL 붙여넣기"
              placeholderTextColor="#ccc"
              autoCapitalize="none"
              keyboardType="url"
            />
          </Field>

          {/* 태그 */}
          <Field label="태그 (쉼표로 구분)">
            <TextInput
              style={styles.input}
              value={form.tagsInput}
              onChangeText={(v) => set('tagsInput', v)}
              placeholder="예: 라멘, 줄서는집, 혼밥"
              placeholderTextColor="#ccc"
            />
          </Field>

          {/* 메모 */}
          <Field label="메모">
            <TextInput
              style={[styles.input, styles.textarea]}
              value={form.memo}
              onChangeText={(v) => set('memo', v)}
              placeholder="방문 후기나 기억할 점을 적어두세요"
              placeholderTextColor="#ccc"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </Field>

          {/* 우선순위 */}
          <Field label="우선순위">
            <StarPicker value={form.priority} onChange={(v) => set('priority', v)} />
          </Field>

          {/* 가고싶음 */}
          <View style={styles.switchRow}>
            <View>
              <Text style={styles.switchLabel}>❤️ 가고싶음</Text>
              <Text style={styles.switchSub}>내 위시리스트에 추가</Text>
            </View>
            <Switch
              value={form.wishlist}
              onValueChange={(v) => set('wishlist', v)}
              trackColor={{ false: '#ddd', true: '#FF7A45' }}
              thumbColor="#fff"
            />
          </View>

          {/* 방문 여부 */}
          <View style={styles.switchRow}>
            <View>
              <Text style={styles.switchLabel}>✓ 방문 완료</Text>
              <Text style={styles.switchSub}>이미 다녀온 곳</Text>
            </View>
            <Switch
              value={form.visited}
              onValueChange={(v) => set('visited', v)}
              trackColor={{ false: '#ddd', true: '#00B894' }}
              thumbColor="#fff"
            />
          </View>

          {/* 저장 버튼 */}
          <Pressable
            onPress={handleSave}
            disabled={saving}
            style={({ pressed }) => [styles.saveBtn, pressed && { opacity: 0.85 }, saving && { opacity: 0.6 }]}
          >
            <Ionicons name="checkmark-circle" size={20} color="#fff" />
            <Text style={styles.saveBtnText}>{saving ? '저장 중...' : isEdit ? '수정 완료' : '추가하기'}</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F5F5F5' },
  content: { padding: 16, gap: 4, paddingBottom: 40 },
  autofillCard: {
    backgroundColor: '#F5F3FF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: '#E0DBFF',
  },
  autofillHead: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  autofillTitle: { fontSize: 15, fontWeight: '800', color: '#6C5CE7' },
  autofillSub: { fontSize: 12, color: '#8A7FC0', marginTop: 6, lineHeight: 17 },
  autofillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#6C5CE7',
    borderRadius: 12,
    paddingVertical: 13,
    marginTop: 10,
  },
  autofillBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  field: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', color: '#555', marginBottom: 6 },
  required: { color: '#FF7A45' },
  input: {
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#222',
    borderWidth: 1,
    borderColor: '#eee',
  },
  textarea: { height: 100, paddingTop: 12 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
  },
  chipText: { fontSize: 13, color: '#555' },
  chipTextActive: { color: '#fff', fontWeight: '600' },
  priorityLabel: { alignSelf: 'center', fontSize: 14, color: '#888', marginLeft: 4 },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 10,
  },
  switchLabel: { fontSize: 15, color: '#333', fontWeight: '600' },
  switchSub: { fontSize: 12, color: '#aaa', marginTop: 2 },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FF7A45',
    borderRadius: 14,
    paddingVertical: 16,
    marginTop: 8,
    shadowColor: '#FF7A45',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },

  sourceRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sourceChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#ddd',
    backgroundColor: '#fff',
  },
  sourceChipNaver: { backgroundColor: '#03C75A', borderColor: '#03C75A' },
  sourceChipGoogle: { backgroundColor: '#4285F4', borderColor: '#4285F4' },
  sourceChipText: { fontSize: 13, color: '#555', fontWeight: '700' },
  sourceHint: { fontSize: 12, color: '#bbb', flex: 1 },

  preview: { width: '100%', height: 160, borderRadius: 10, backgroundColor: '#f0f0f0', marginBottom: 8 },
  photoRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  uploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#6C5CE7',
    backgroundColor: '#fff',
  },
  uploadBtnText: { color: '#6C5CE7', fontSize: 14, fontWeight: '700' },
  removePhotoBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 8 },
  removePhotoText: { color: '#FF7A45', fontSize: 13, fontWeight: '600' },
});
