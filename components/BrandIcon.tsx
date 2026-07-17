// =============================================================
// 맛담 공용 브랜드 아이콘 (기본 이모지 대체)
// - 24×24 그리드, 둥근 획(strokeWidth 2)의 플랫 라인 스타일로 통일
// - 강조형(불꽃·별·하트·왕관·반짝임 등)만 면 채움
// - 사용: <BrandIcon name="fire" size={14} color="#FF7A45" />
// =============================================================
import React from 'react';
import Svg, { Circle, Ellipse, Line, Path, Rect } from 'react-native-svg';

export type BrandIconName =
  | 'bowl' | 'pin' | 'price' | 'fire' | 'star' | 'steps' | 'heart' | 'check'
  | 'eye' | 'crown' | 'compass' | 'map' | 'link' | 'clipboard' | 'sparkle'
  | 'chat' | 'bug' | 'flag' | 'block' | 'key' | 'lock' | 'mail' | 'chart'
  | 'person' | 'people' | 'warning' | 'bookmark' | 'plus';

interface Props {
  name: BrandIconName;
  size?: number;
  color?: string;
  style?: object;
}

// 획 공통 속성
const S = (color: string) => ({
  stroke: color,
  strokeWidth: 2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  fill: 'none',
});

function draw(name: BrandIconName, c: string): React.ReactNode {
  switch (name) {
    case 'bowl': // 김이 나는 밥그릇 (브랜드 마크의 그릇)
      return (
        <>
          <Path {...S(c)} d="M4 12h16a8 8 0 0 1-4.6 6.6l.3 1.9H8.3l.3-1.9A8 8 0 0 1 4 12z" />
          <Path {...S(c)} d="M9.5 8c0-1.1 1-1.3 1-2.4M14 8c0-1.1 1-1.3 1-2.4" />
        </>
      );
    case 'pin':
      return (
        <>
          <Path {...S(c)} d="M12 21s-6.5-5.3-6.5-10.3a6.5 6.5 0 0 1 13 0C18.5 15.7 12 21 12 21z" />
          <Circle cx={12} cy={10.5} r={2.3} fill={c} />
        </>
      );
    case 'price': // 원화 동전
      return (
        <>
          <Circle {...S(c)} cx={12} cy={12} r={8.5} />
          <Path {...S(c)} strokeWidth={1.8} d="M8.2 9l1.5 6L12 9.6 14.3 15l1.5-6M7.8 11.7h8.4" />
        </>
      );
    case 'fire':
      return (
        <Path
          fill={c}
          d="M12 2.8c.6 3.2-1.4 4.9-2.6 6.4a6.2 6.2 0 0 0-1.6 4.2A6.3 6.3 0 0 0 14 19.4c2.4-.9 4.2-3.2 4.2-6 0-2.6-1.5-4.2-2.6-5.7-.4 1-.9 1.9-1.9 2.5.2-2.3-.2-5.3-1.7-7.4z"
        />
      );
    case 'star':
      return (
        <Path
          fill={c}
          d="M12 3.4l2.5 5.1 5.6.8-4 4 .9 5.6-5-2.7-5 2.7.9-5.6-4-4 5.6-.8z"
        />
      );
    case 'steps': // 발자국 두 개
      return (
        <>
          <Ellipse fill={c} cx={8.3} cy={7.8} rx={2.6} ry={3.6} transform="rotate(-14 8.3 7.8)" />
          <Ellipse fill={c} cx={9.6} cy={13.4} rx={1.2} ry={1.5} transform="rotate(-14 9.6 13.4)" />
          <Ellipse fill={c} cx={15.7} cy={13.2} rx={2.6} ry={3.6} transform="rotate(14 15.7 13.2)" />
          <Ellipse fill={c} cx={14.4} cy={18.8} rx={1.2} ry={1.5} transform="rotate(14 14.4 18.8)" />
        </>
      );
    case 'heart':
      return (
        <Path
          fill={c}
          d="M12 20.3S4 15.4 4 9.9A4.4 4.4 0 0 1 12 7.2a4.4 4.4 0 0 1 8 2.7c0 5.5-8 10.4-8 10.4z"
        />
      );
    case 'check':
      return <Path {...S(c)} strokeWidth={2.6} d="M5 12.6l4.4 4.4L19 7.4" />;
    case 'eye':
      return (
        <>
          <Path {...S(c)} d="M2.8 12S6.4 5.8 12 5.8 21.2 12 21.2 12 17.6 18.2 12 18.2 2.8 12 2.8 12z" />
          <Circle cx={12} cy={12} r={2.4} fill={c} />
        </>
      );
    case 'crown':
      return (
        <Path
          fill={c}
          d="M4.2 17.5L3 7.8l4.9 3.4L12 4.8l4.1 6.4L21 7.8l-1.2 9.7H4.2zM4.6 19.2h14.8v1.6H4.6z"
        />
      );
    case 'compass':
      return (
        <>
          <Circle {...S(c)} cx={12} cy={12} r={8.8} />
          <Path fill={c} d="M15.5 8.5l-2.1 5.9-3.8 2.1 2.1-5.9z" />
        </>
      );
    case 'map':
      return (
        <>
          <Path {...S(c)} d="M9 4.5L4 6.3v13.2l5-1.8 6 1.8 5-1.8V4.5l-5 1.8-6-1.8z" />
          <Path {...S(c)} strokeWidth={1.6} d="M9 4.5v13.2M15 6.3v13.2" />
        </>
      );
    case 'link':
      return (
        <>
          <Path {...S(c)} d="M10.2 13.8a4.6 4.6 0 0 0 6.9.5l2.6-2.6a4.6 4.6 0 0 0-6.5-6.5l-1.5 1.5" />
          <Path {...S(c)} d="M13.8 10.2a4.6 4.6 0 0 0-6.9-.5l-2.6 2.6a4.6 4.6 0 0 0 6.5 6.5l1.5-1.5" />
        </>
      );
    case 'clipboard':
      return (
        <>
          <Path {...S(c)} d="M8.5 4.5H7a2 2 0 0 0-2 2V19a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V6.5a2 2 0 0 0-2-2h-1.5" />
          <Rect {...S(c)} x={8.5} y={2.8} width={7} height={3.4} rx={1} />
          <Path {...S(c)} strokeWidth={1.6} d="M8.5 11h7M8.5 15h5" />
        </>
      );
    case 'sparkle':
      return (
        <>
          <Path fill={c} d="M11 3.8l1.6 4.6 4.6 1.6-4.6 1.6L11 16.2l-1.6-4.6-4.6-1.6 4.6-1.6z" />
          <Path fill={c} d="M18 14.5l.9 2.6 2.6.9-2.6.9-.9 2.6-.9-2.6-2.6-.9 2.6-.9z" />
        </>
      );
    case 'chat':
      return (
        <Path {...S(c)} d="M4 6.5a3 3 0 0 1 3-3h10a3 3 0 0 1 3 3v6.8a3 3 0 0 1-3 3H9.6L4.8 20V6.5z" />
      );
    case 'bug':
      return (
        <>
          <Path {...S(c)} d="M8.5 10h7v4.4a3.5 3.5 0 0 1-7 0z" />
          <Path {...S(c)} d="M9.5 9.5a2.5 2.5 0 0 1 5 0" />
          <Path {...S(c)} strokeWidth={1.7} d="M8.5 12H5.2M18.8 12h-3.3M9 15.5l-2.6 2M15 15.5l2.6 2M9.6 7.2L8 5.2M14.4 7.2L16 5.2" />
        </>
      );
    case 'flag':
      return (
        <>
          <Path {...S(c)} d="M6 21V4" />
          <Path fill={c} d="M6 4.6c3.8-1.9 5.8 1.7 9.6.2l1.4-.5v8.2l-1.4.5c-3.8 1.5-5.8-2.1-9.6-.2z" />
        </>
      );
    case 'block':
      return (
        <>
          <Circle {...S(c)} cx={12} cy={12} r={8.6} />
          <Path {...S(c)} d="M6.2 6.2l11.6 11.6" />
        </>
      );
    case 'key':
      return (
        <>
          <Circle {...S(c)} cx={8} cy={15.5} r={3.6} />
          <Path {...S(c)} d="M10.7 12.8L19.5 4M16.3 7.2l3 3" />
        </>
      );
    case 'lock':
      return (
        <>
          <Rect {...S(c)} x={5} y={10.8} width={14} height={9.4} rx={2} />
          <Path {...S(c)} d="M8.2 10.8V8a3.8 3.8 0 0 1 7.6 0v2.8" />
          <Circle cx={12} cy={15.5} r={1.5} fill={c} />
        </>
      );
    case 'mail':
      return (
        <>
          <Rect {...S(c)} x={3.5} y={5.5} width={17} height={13} rx={2} />
          <Path {...S(c)} d="M4.5 7.5l7.5 5.6 7.5-5.6" />
        </>
      );
    case 'chart':
      return (
        <Path {...S(c)} strokeWidth={2.8} d="M5.5 20v-6.5M12 20V5.5M18.5 20v-9.5" />
      );
    case 'person':
      return (
        <>
          <Circle {...S(c)} cx={12} cy={8} r={3.7} />
          <Path {...S(c)} d="M4.8 20a7.2 7.2 0 0 1 14.4 0" />
        </>
      );
    case 'people':
      return (
        <>
          <Circle {...S(c)} cx={9} cy={8.5} r={3.2} />
          <Path {...S(c)} d="M3.2 19.5a5.8 5.8 0 0 1 11.6 0" />
          <Path {...S(c)} d="M15.5 5.9a3.2 3.2 0 0 1 0 5.2M17.4 14.2a5.8 5.8 0 0 1 3.4 5.3" />
        </>
      );
    case 'warning':
      return (
        <>
          <Path {...S(c)} d="M12 4.2L2.9 19.8h18.2z" />
          <Line x1={12} y1={10} x2={12} y2={14} stroke={c} strokeWidth={2} strokeLinecap="round" />
          <Circle cx={12} cy={16.8} r={1.2} fill={c} />
        </>
      );
    case 'bookmark':
      return (
        <Path {...S(c)} d="M7 3.5h10a1 1 0 0 1 1 1V20.5l-6-3.9-6 3.9V4.5a1 1 0 0 1 1-1z" />
      );
    case 'plus':
      return <Path {...S(c)} strokeWidth={2.6} d="M12 5v14M5 12h14" />;
    default:
      return null;
  }
}

export default function BrandIcon({ name, size = 14, color = '#FF7A45', style }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" style={style}>
      {draw(name, color)}
    </Svg>
  );
}

// 텍스트 옆에 나란히 놓을 때 쓰는 정렬 래퍼 스타일 힌트:
// <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
//   <BrandIcon name="fire" size={13} color="#FF7A45" /><Text>인기순</Text>
// </View>
