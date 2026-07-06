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
import Avatar from '@/components/Avatar';
import { confirmAction, notify } from '@/lib/confirm';
import { AVATAR_MAX_DIM } from '@/lib/imagePrep';
import { useAuth } from '@/context/AuthContext';
import { useRestaurants } from '@/context/RestaurantContext';
import { MyInfluence } from '@/types/restaurant';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, displayName, isAdmin, deleteAccount } = useAuth();
  const { getProfile, updateProfile, getMyInfluence, uploadPhoto, getBlockedProfiles, unblockUser } = useRestaurants();

  const [name, setName] = useState(displayName);
  const [bio, setBio] = useState('');
  const [snsUrl, setSnsUrl] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [preferredRegion, setPreferredRegion] = useState('');
  const [influence, setInfluence] = useState<MyInfluence | null>(null);
  const [blockedList, setBlockedList] = useState<{ id: string; display_name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    (async () => {
      if (!user) return;
      const [p, inf, blocked] = await Promise.all([getProfile(user.id), getMyInfluence(), getBlockedProfiles()]);
      setBlockedList(blocked);
      if (p) {
        setName(p.display_name ?? displayName);
        setBio(p.bio ?? '');
        setSnsUrl(p.sns_url ?? '');
        setAvatarUrl(p.avatar_url ?? '');
        setPreferredRegion(p.preferred_region ?? '');
      }
      setInfluence(inf);
      setLoading(false);
    })();
  }, [user, getProfile, getMyInfluence, getBlockedProfiles]);

  async function handleUnblock(uid: string, name: string) {
    try {
      await unblockUser(uid);
      setBlockedList((prev) => prev.filter((b) => b.id !== uid));
      notify('차단 해제', `${name}님의 콘텐츠가 다시 보여요.`);
    } catch (e: any) {
      notify('오류', e.message ?? '차단 해제에 실패했어요.');
    }
  }

  function pickAvatar() {
    if (Platform.OS !== 'web') {
      notify('안내', '프로필 사진 업로드는 웹에서 가능해요.');
      return;
    }
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      setUploadingAvatar(true);
      try {
        const url = await uploadPhoto(file, AVATAR_MAX_DIM);
        setAvatarUrl(url);
      } catch (e: any) {
        notify('업로드 실패', e.message ?? '다시 시도해주세요.');
      } finally {
        setUploadingAvatar(false);
      }
    };
    input.click();
  }

  async function handleSave() {
    if (!name.trim()) {
      notify('닉네임을 입력해주세요');
      return;
    }
    setSaving(true);
    try {
      await updateProfile({ display_name: name.trim(), bio: bio.trim(), sns_url: snsUrl.trim(), avatar_url: avatarUrl.trim(), preferred_region: preferredRegion.trim() });
      notify('저장 완료!', '프로필이 업데이트됐어요.');
      router.back();
    } catch (e: any) {
      notify('오류', e.message ?? '저장에 실패했어요.');
    } finally {
      setSaving(false);
    }
  }

  function handleDeleteAccount() {
    confirmAction(
      '계정 삭제',
      '계정과 함께 내 맛집·리뷰·사진·좋아요 기록이 모두 삭제됩니다.\n삭제 후에는 되돌릴 수 없어요.',
      () => {
        confirmAction(
          '정말 삭제할까요?',
          '마지막 확인이에요. 지금 삭제하면 복구할 수 없습니다.',
          async () => {
            setDeleting(true);
            try {
              await deleteAccount();
              notify('삭제 완료', '계정이 삭제됐어요. 그동안 이용해주셔서 감사합니다.');
            } catch (e: any) {
              notify('삭제 실패', e.message ?? '잠시 후 다시 시도해주세요.');
              setDeleting(false);
            }
          },
          '삭제',
          true,
        );
      },
      '계속',
      true,
    );
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
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.avatarArea}>
            <Pressable onPress={pickAvatar} disabled={uploadingAvatar}>
              <Avatar uri={avatarUrl} name={name} size={88} />
              <View style={styles.cameraBadge}>
                <Ionicons name={uploadingAvatar ? 'hourglass-outline' : 'camera'} size={16} color="#fff" />
              </View>
            </Pressable>
            <Text style={styles.avatarHint}>
              {uploadingAvatar ? '업로드 중...' : '탭하여 프로필 사진 변경'}
            </Text>
            {avatarUrl ? (
              <Pressable onPress={() => setAvatarUrl('')} hitSlop={6}>
                <Text style={styles.avatarRemove}>사진 제거</Text>
              </Pressable>
            ) : null}
          </View>

          {/* 인플루언서 지표 */}
          {influence && (
            <View style={styles.influCard}>
              <Text style={styles.influTitle}>📊 내 영향력</Text>
              <View style={styles.influStats}>
                <View style={styles.influStat}>
                  <Text style={styles.influNum}>{influence.adopterCount}</Text>
                  <Text style={styles.influLabel}>명이 담아감</Text>
                </View>
                <View style={styles.influDivider} />
                <View style={styles.influStat}>
                  <Text style={styles.influNum}>{influence.totalAdoptions}</Text>
                  <Text style={styles.influLabel}>총 담긴 횟수</Text>
                </View>
              </View>
              {influence.topRestaurants.length > 0 ? (
                <View style={styles.influList}>
                  <Text style={styles.influListTitle}>🔥 가장 많이 담긴 내 맛집</Text>
                  {influence.topRestaurants.map((r, i) => (
                    <View key={i} style={styles.influRow}>
                      <Text style={styles.influRank}>{i + 1}</Text>
                      <Text style={styles.influName} numberOfLines={1}>
                        {r.name}
                        {r.area ? <Text style={styles.influArea}>  📍{r.area}</Text> : null}
                      </Text>
                      <Text style={styles.influCount}>{r.othersCount}명</Text>
                    </View>
                  ))}
                </View>
              ) : (
                <Text style={styles.influEmpty}>아직 담아간 사람이 없어요. 리스트를 공유해보세요! 🔗</Text>
              )}
            </View>
          )}

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

          <Text style={styles.label}>📍 관심 지역 (홈에 추천 맛집이 떠요)</Text>
          <TextInput
            style={styles.input}
            value={preferredRegion}
            onChangeText={setPreferredRegion}
            placeholder="예: 제주  /  성수, 연남  /  강릉"
            placeholderTextColor="#bbb"
          />
          <Text style={styles.regionHint}>
            여행 갈 곳이나 자주 가는 동네를 적어두세요. 쉼표로 여러 곳도 가능해요.
          </Text>

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

          {/* 앱 사용법 가이드 */}
          <Pressable style={styles.guideRow} onPress={() => router.push('/guide' as any)}>
            <View style={styles.guideIcon}>
              <Ionicons name="book-outline" size={20} color="#fff" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.guideTitle}>📖 앱 사용법 가이드</Text>
              <Text style={styles.guideSub}>맛담 200% 활용법, 3분이면 끝!</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </Pressable>

          {/* 차단 관리 */}
          {blockedList.length > 0 && (
            <View style={styles.blockedCard}>
              <Text style={styles.blockedTitle}>🚫 차단한 사용자 ({blockedList.length})</Text>
              {blockedList.map((b) => (
                <View key={b.id} style={styles.blockedRow}>
                  <Text style={styles.blockedName} numberOfLines={1}>{b.display_name}</Text>
                  <Pressable onPress={() => handleUnblock(b.id, b.display_name)} hitSlop={6}>
                    <Text style={styles.unblockText}>차단 해제</Text>
                  </Pressable>
                </View>
              ))}
            </View>
          )}

          {/* 정책 링크 */}
          <View style={styles.policyRow}>
            <Text style={styles.policyLink} onPress={() => router.push('/policy/terms' as any)}>
              이용약관
            </Text>
            <Text style={styles.policyDivider}>·</Text>
            <Text style={styles.policyLink} onPress={() => router.push('/policy/privacy' as any)}>
              개인정보처리방침
            </Text>
          </View>

          {/* 계정 삭제 (관리자 계정은 대시보드에서만 삭제 가능) */}
          {!isAdmin && (
            <Pressable style={styles.deleteRow} onPress={handleDeleteAccount} disabled={deleting}>
              <Text style={styles.deleteText}>
                {deleting ? '계정 삭제 중...' : '계정 삭제'}
              </Text>
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
  content: { padding: 16, paddingBottom: 96 },
  avatarArea: { alignItems: 'center', marginBottom: 20, marginTop: 8, gap: 6 },
  cameraBadge: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#FF7A45',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#F5F5F5',
  },
  avatarHint: { fontSize: 12, color: '#999' },
  avatarRemove: { fontSize: 12, color: '#FF7A45', fontWeight: '600' },
  influCard: {
    backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 8,
    borderWidth: 1, borderColor: '#FFE4D6',
  },
  influTitle: { fontSize: 15, fontWeight: '800', color: '#FF7A45', marginBottom: 12 },
  influStats: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  influStat: { flex: 1, alignItems: 'center' },
  influDivider: { width: 1, height: 36, backgroundColor: '#eee' },
  influNum: { fontSize: 26, fontWeight: '800', color: '#1a1a1a' },
  influLabel: { fontSize: 12, color: '#999', marginTop: 2 },
  influList: { marginTop: 14, borderTopWidth: 1, borderTopColor: '#f5f5f5', paddingTop: 12, gap: 8 },
  influListTitle: { fontSize: 13, fontWeight: '700', color: '#666', marginBottom: 2 },
  influRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  influRank: {
    fontSize: 12, fontWeight: '800', color: '#FF7A45', width: 18, textAlign: 'center',
  },
  influName: { flex: 1, fontSize: 14, color: '#333' },
  influArea: { fontSize: 12, color: '#aaa' },
  influCount: { fontSize: 13, fontWeight: '700', color: '#FF7A45' },
  influEmpty: { fontSize: 13, color: '#aaa', marginTop: 12, textAlign: 'center', lineHeight: 18 },
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
  regionHint: { fontSize: 11, color: '#aaa', marginTop: 6, lineHeight: 15 },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FF7A45',
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
  guideRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#FFE4D6',
  },
  guideIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#FF7A45',
    alignItems: 'center',
    justifyContent: 'center',
  },
  guideTitle: { fontSize: 15, fontWeight: '700', color: '#1a1a1a' },
  guideSub: { fontSize: 12, color: '#999', marginTop: 2 },
  policyRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: 20,
    marginBottom: 8,
  },
  policyLink: { fontSize: 12, color: '#aaa', textDecorationLine: 'underline' },
  policyDivider: { fontSize: 12, color: '#ddd' },
  deleteRow: { alignItems: 'center', marginTop: 4, paddingVertical: 8 },
  deleteText: { fontSize: 12, color: '#E74C3C', textDecorationLine: 'underline' },
  blockedCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#eee',
    gap: 10,
  },
  blockedTitle: { fontSize: 14, fontWeight: '700', color: '#555' },
  blockedRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  blockedName: { flex: 1, fontSize: 14, color: '#333' },
  unblockText: { fontSize: 13, color: '#6C5CE7', fontWeight: '600' },
});
