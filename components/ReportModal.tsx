import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { notify } from '@/lib/confirm';
import { useRestaurants } from '@/context/RestaurantContext';
import { ReportTargetType } from '@/types/restaurant';

const REASONS = [
  '스팸 · 광고',
  '욕설 · 혐오 표현',
  '음란물 · 부적절한 콘텐츠',
  '허위 정보',
  '개인정보 노출',
  '기타',
];

interface Props {
  visible: boolean;
  onClose: () => void;
  targetType: ReportTargetType;
  targetId: string;
  targetOwnerId?: string;
  targetLabel?: string; // 예: 맛집 이름, 리뷰 작성자
}

export default function ReportModal({ visible, onClose, targetType, targetId, targetOwnerId, targetLabel }: Props) {
  const { reportContent } = useRestaurants();
  const [reason, setReason] = useState<string | null>(null);
  const [detail, setDetail] = useState('');
  const [sending, setSending] = useState(false);

  function reset() {
    setReason(null);
    setDetail('');
    setSending(false);
  }

  async function handleSubmit() {
    if (!reason) {
      notify('신고 사유를 선택해주세요');
      return;
    }
    setSending(true);
    try {
      await reportContent({
        target_type: targetType,
        target_id: targetId,
        target_owner_id: targetOwnerId,
        reason,
        detail,
      });
      notify('신고 접수 완료', '검토 후 필요한 조치를 취할게요. 알려주셔서 감사합니다.');
      reset();
      onClose();
    } catch (e: any) {
      notify('신고 실패', e.message ?? '잠시 후 다시 시도해주세요.');
      setSending(false);
    }
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>🚩 신고하기</Text>
            <Pressable onPress={() => { reset(); onClose(); }} hitSlop={8}>
              <Ionicons name="close" size={22} color="#888" />
            </Pressable>
          </View>
          {targetLabel ? <Text style={styles.target}>대상: {targetLabel}</Text> : null}

          {REASONS.map((r) => (
            <Pressable key={r} style={styles.reasonRow} onPress={() => setReason(r)}>
              <Ionicons
                name={reason === r ? 'radio-button-on' : 'radio-button-off'}
                size={18}
                color={reason === r ? '#FF7A45' : '#ccc'}
              />
              <Text style={[styles.reasonText, reason === r && styles.reasonTextActive]}>{r}</Text>
            </Pressable>
          ))}

          <TextInput
            style={styles.detailInput}
            value={detail}
            onChangeText={setDetail}
            placeholder="상세 내용 (선택)"
            placeholderTextColor="#bbb"
            multiline
          />

          <Pressable
            onPress={handleSubmit}
            disabled={sending}
            style={({ pressed }) => [styles.submitBtn, pressed && { opacity: 0.85 }, sending && { opacity: 0.6 }]}
          >
            <Text style={styles.submitText}>{sending ? '접수 중...' : '신고 접수'}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  sheet: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 18,
    gap: 8,
  },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 },
  title: { fontSize: 17, fontWeight: '800', color: '#1a1a1a' },
  target: { fontSize: 12, color: '#999', marginBottom: 6 },
  reasonRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 7 },
  reasonText: { fontSize: 14, color: '#555' },
  reasonTextActive: { color: '#FF7A45', fontWeight: '600' },
  detailInput: {
    backgroundColor: '#f8f8f8',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#222',
    minHeight: 64,
    marginTop: 6,
    borderWidth: 1,
    borderColor: '#eee',
  },
  submitBtn: {
    backgroundColor: '#FF7A45',
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
    marginTop: 8,
  },
  submitText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
