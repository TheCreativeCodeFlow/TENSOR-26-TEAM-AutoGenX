import React from 'react';
import { View, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NAV_HEIGHT } from '../constants/layout';

interface ScreenLayoutProps {
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
  contentStyle?: ViewStyle | ViewStyle[];
  withBottomPadding?: boolean;
}

const ScreenLayout: React.FC<ScreenLayoutProps> = ({
  children,
  style,
  contentStyle,
  withBottomPadding = true,
}) => {
  return (
    <SafeAreaView style={[{ flex: 1 }, style]} edges={['top', 'left', 'right', 'bottom']}>
      <View style={[{ flex: 1, paddingBottom: withBottomPadding ? NAV_HEIGHT : 0 }, contentStyle]}>{children}</View>
    </SafeAreaView>
  );
};

export default ScreenLayout;
