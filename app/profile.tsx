import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
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
import { useAuth } from '@/context/AuthContext';
import { useRestaurants } from '@/context/RestaurantContext';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, displayName } = useAuth();
  const { getProfile, updateProfile } = useRestaurants();

  const [name, setName] = useState(displayName);
  const [bio, setBio] = useState('');
  const [snsUrl, setSnsUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      if (!user) return;
      const p = await getProfile(user.id);
      if (p) {
        setName(p.display_name ?? displayName);
        setBio(p.bio ?? '');
        setSnsUrl(p.sns_url ?? '');
      }
      setLoading(false);
    })();
  }, [user, getProfile]);

  async function handleSave() {
    if (!name.trim()) {
      notify('닉네임을 입력해주세요');
      return;
    }
    setSaving(true);
    try {
      await updateProfile({ display_name: name.trim(), bio: bio.trim(), sns_url: snsUrl.trim() });
      notify('저장 완료!', '프로필이 업데이트됐어요.');
      router.back();
    } catch (e: any) {
      notify('오류', e.message ?? '저장에 실패했어요.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#FF6B6B" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.avatarArea}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{(name[0] ?? '?').toUpperCase()}</Text>
            </View>
          </View>

          <Text style={styles.label}>닉네임</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="예: 푸드마스터"
            placeholderTextColor="#bbb"
          />

          <Text style={styles.label}>소개 (내 리스트에 표시돼요)</Text>
          <TextInput
            style={[styles.input, styles.textarea]}
            value={bio}
            onChangeText={setBio}
            placeholder="예: 성수·연남 위주 / 디저트 러버 🍰"
            placeholderTextColor="#bbb"
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />

          <Text style={styles.label}>SNS 링크 (인스타 등)</Text>
          <TextInput
            style={styles.input}
            value={snsUrl}
            onChangeText={setSnsUrl}
            placeholder="https://instagram.com/내계정"
            placeholderTextColor="#bbb"
            autoCapitalize="none"
            keyboardType="url"
          />

          <Pressable
            onPress={handleSave}
            disabled={saving}
            style={({ pressed }) => [styles.saveBtn, pressed && { opacity: 0.85 }, saving && { opacity: 0.6 }]}
          >
            <Ionicons name="checkmark-circle" size={20} color="#fff" />
            <Text style={styles.saveBtnText}>{saving ? '저장 중...' : '프로필 저장'}</Text>
          </Pressable>

          {user && (
            <Pressable style={styles.viewListBtn} onPress={() => router.push(`/user/${user.id}` as any)}>
              <Ionicons name="list-outline" size={18} color="#6C5CE7" />
              <Text style={styles.viewListText}>내 리스트 미리보기 (다른 사람에게 보이는 모습)</Text>
            </Pressable>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F5F5F5' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { padding: 16, paddingBottom: 40 },
  avatarArea: { alignItems: 'center', marginBottom: 20, marginTop: 8 },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FF6B6B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: '#fff', fontSize: 34, fontWeight: '800' },
  label: { fontSize: 13, fontWeight: '600', color: '#555', marginBottom: 6, marginTop: 14 },
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
  textarea: { height: 80, paddingTop: 12 },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FF6B6B',
    borderRadius: 14,
    paddingVertical: 16,
    marginTop: 24,
  },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  viewListBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    marginTop: 12,
  },
  viewListText: { color: '#6C5CE7', fontSize: 13, fontWeight: '600' },
});
