import React from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const UPDATED = '2026년 7월 5일';
const CONTACT = 'matdamkr@naver.com';

function H({ children }: { children: React.ReactNode }) {
  return <Text style={styles.h}>{children}</Text>;
}
function P({ children }: { children: React.ReactNode }) {
  return <Text style={styles.p}>{children}</Text>;
}

export default function PrivacyScreen() {
  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>개인정보처리방침</Text>
        <Text style={styles.updated}>시행일: {UPDATED}</Text>

        <P>
          맛담(이하 &quot;서비스&quot;)은 이용자의 개인정보를 소중히 여기며, 관련 법령을 준수합니다.
          본 방침은 서비스가 어떤 정보를 수집하고 어떻게 이용·보관·삭제하는지를 설명합니다.
        </P>

        <H>1. 수집하는 정보</H>
        <P>
          ① 계정 정보: 아이디(내부적으로 이메일 형식으로 저장), 비밀번호(암호화 저장), 닉네임{'\n'}
          ② 프로필 정보(선택): 프로필 사진, 소개, SNS 링크, 관심 지역{'\n'}
          ③ 서비스 이용 정보: 등록한 맛집(이름·주소·메모·사진·태그 등), 리뷰·별점, 좋아요, 담기 기록, 피드백 내용{'\n'}
          ④ 기기 위치 정보(선택): &quot;가까운순 정렬&quot;과 &quot;지도 내 위치 표시&quot; 기능 사용 시에만
          기기에서 일시적으로 사용되며, 서버에 저장하지 않습니다.
        </P>

        <H>2. 수집 및 이용 목적</H>
        <P>
          - 맛집 리스트 저장·공유·추천 등 서비스 핵심 기능 제공{'\n'}
          - 계정 관리 및 본인 확인{'\n'}
          - 피드백 문의 대응 및 서비스 개선{'\n'}
          - 부정 이용 방지
        </P>

        <H>3. 위치정보의 처리</H>
        <P>
          서비스는 이용자가 해당 기능을 실행하고 기기 권한에 동의한 경우에만 위치정보를 이용합니다.
          위치정보는 가까운 맛집 정렬 및 지도 표시 목적으로 기기 내에서만 사용되며,
          서버에 전송·저장되지 않습니다. 권한은 기기 설정에서 언제든지 철회할 수 있으며,
          철회 시에도 위치 기반 기능 외 서비스 이용에는 제한이 없습니다.
        </P>

        <H>4. 처리 위탁 및 제3자 제공</H>
        <P>
          서비스는 개인정보를 제3자에게 판매하거나 마케팅 목적으로 제공하지 않습니다.
          서비스 운영을 위해 다음 인프라 제공자에게 처리를 위탁합니다.{'\n'}
          - Supabase: 데이터베이스, 인증, 파일 저장{'\n'}
          - Vercel: 웹 호스팅 및 서버리스 함수{'\n'}
          - OpenStreetMap: 지도 타일 표시(지도 화면 이용 시 IP가 타일 서버에 전달될 수 있음)
        </P>

        <H>5. 보관 및 삭제</H>
        <P>
          개인정보는 회원 탈퇴 시 지체 없이 삭제합니다. 다만 관련 법령에 따라 보존이 필요한 정보는
          해당 기간 동안 분리 보관 후 파기합니다. 계정 삭제는 앱 내 기능 또는 아래 문의처를 통해
          요청할 수 있습니다.
        </P>

        <H>6. 이용자의 권리</H>
        <P>
          이용자는 언제든지 자신의 개인정보를 열람·수정·삭제할 수 있습니다.
          프로필 및 등록 콘텐츠는 앱 내에서 직접 수정·삭제할 수 있으며,
          그 외 요청은 문의처로 연락해 주세요.
        </P>

        <H>7. 문의처</H>
        <P>개인정보 관련 문의: {CONTACT}</P>

        <H>8. 고지</H>
        <P>
          본 방침이 변경되는 경우 앱 내 공지 또는 본 페이지를 통해 안내합니다.
        </P>
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
