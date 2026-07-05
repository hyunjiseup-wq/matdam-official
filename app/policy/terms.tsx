import React from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const UPDATED = '2026년 7월 5일';
const CONTACT = 'hyunjiseup@gmail.com';

function H({ children }: { children: React.ReactNode }) {
  return <Text style={styles.h}>{children}</Text>;
}
function P({ children }: { children: React.ReactNode }) {
  return <Text style={styles.p}>{children}</Text>;
}

export default function TermsScreen() {
  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>이용약관</Text>
        <Text style={styles.updated}>시행일: {UPDATED}</Text>

        <H>1. 서비스 소개</H>
        <P>
          맛담(이하 &quot;서비스&quot;)은 이용자가 맛집을 저장·정리·공유하고 다른 이용자의 맛집을
          탐색할 수 있는 맛집 리스트 서비스입니다. 회원 가입 및 서비스 이용 시 본 약관과
          개인정보처리방침에 동의한 것으로 봅니다.
        </P>

        <H>2. 계정</H>
        <P>
          - 계정은 본인이 직접 생성·관리해야 하며, 타인에게 양도할 수 없습니다.{'\n'}
          - 비밀번호 관리 책임은 이용자에게 있습니다.{'\n'}
          - 이용자는 언제든지 계정 삭제를 요청할 수 있습니다.
        </P>

        <H>3. 이용자 콘텐츠 (UGC)</H>
        <P>
          - 이용자가 등록한 맛집 정보·사진·리뷰·메모 등(이하 &quot;콘텐츠&quot;)의 권리는 이용자에게 있습니다.{'\n'}
          - 이용자는 콘텐츠를 서비스 내에서 표시·공유하는 데 필요한 범위의 이용을 서비스에 허락합니다.{'\n'}
          - 타인의 저작권·초상권 등 권리를 침해하는 콘텐츠를 등록해서는 안 됩니다.{'\n'}
          - 서비스에 표시되는 식당 정보(메뉴·가격 등)는 실제와 다를 수 있으며, 서비스는 그 정확성을 보증하지 않습니다.
        </P>

        <H>4. 금지 행위</H>
        <P>
          다음 행위는 금지되며, 위반 시 콘텐츠 삭제(블라인드), 이용 제한, 계정 정지 조치가 이루어질 수 있습니다.{'\n'}
          - 허위 정보, 명예훼손, 모욕, 혐오 표현{'\n'}
          - 음란물, 불법 정보, 스팸·광고성 도배{'\n'}
          - 타인의 개인정보 무단 게시{'\n'}
          - 서비스의 정상 운영을 방해하는 행위 (자동화 수집, 취약점 악용 등)
        </P>

        <H>5. 신고 및 조치</H>
        <P>
          이용자는 부적절한 콘텐츠를 신고할 수 있으며, 운영자는 신고 내용을 확인해
          블라인드·삭제·계정 제재 등의 조치를 할 수 있습니다.
        </P>

        <H>6. 광고 및 협찬</H>
        <P>
          서비스에는 광고 또는 협찬 콘텐츠가 포함될 수 있으며, 이 경우 &quot;광고&quot; 또는
          &quot;협찬&quot; 표시로 일반 콘텐츠와 구분합니다.
        </P>

        <H>7. 책임의 한계</H>
        <P>
          - 서비스는 이용자 간 공유된 정보의 정확성·신뢰성을 보증하지 않습니다.{'\n'}
          - 무료로 제공되는 서비스의 특성상, 서비스는 천재지변·시스템 장애 등 불가항력으로 인한
          손해에 대해 책임을 지지 않습니다.
        </P>

        <H>8. 약관의 변경</H>
        <P>
          본 약관이 변경되는 경우 앱 내 공지 또는 본 페이지를 통해 안내하며,
          변경 후 서비스를 계속 이용하면 변경 약관에 동의한 것으로 봅니다.
        </P>

        <H>9. 문의처</H>
        <P>서비스 관련 문의: {CONTACT}</P>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F5F5F5' },
  content: { padding: 20, paddingBottom: 60 },
  title: { fontSize: 22, fontWeight: '800', color: '#1a1a1a', marginBottom: 4 },
  updated: { fontSize: 12, color: '#aaa', marginBottom: 16 },
  h: { fontSize: 15, fontWeight: '700', color: '#333', marginTop: 18, marginBottom: 6 },
  p: { fontSize: 13.5, color: '#555', lineHeight: 21 },
});
