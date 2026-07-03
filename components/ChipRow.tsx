import React from 'react';
import { Platform, ScrollView, StyleProp, View, ViewStyle, useWindowDimensions } from 'react-native';

/**
 * 필터 칩 줄.
 * - 모바일: 가로 스크롤 (스와이프)
 * - 넓은 화면(PC 웹, 768px+): 줄바꿈으로 전부 표시 (마우스 스크롤 불편 해소)
 */
export default function ChipRow({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const { width } = useWindowDimensions();
  const wide = Platform.OS === 'web' && width >= 768;

  if (wide) {
    return (
      <View style={[{ flexDirection: 'row', flexWrap: 'wrap' }, style]}>{children}</View>
    );
  }
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={style}>
      {children}
    </ScrollView>
  );
}
