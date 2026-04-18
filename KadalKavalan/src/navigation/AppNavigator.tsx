import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator, type BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, Text, StyleSheet, Platform, Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';

import { useUser } from '../context/UserContext';
import MainDashboard from '../screens/MainDashboard';
import NauticalMapScreen from '../screens/NauticalMapScreen';
import AlertsScreen from '../screens/AlertsScreen';
import SettingsScreen from '../screens/SettingsScreen';
import OnboardingScreen from '../screens/OnboardingScreen';
import { useAppTheme } from '../theme';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();
const AnimatedView = Animated.createAnimatedComponent(View);
const AnimatedBlurView = Animated.createAnimatedComponent(BlurView);
const TAB_GLASS_LINE_OFFSETS = [-12, -4, 4, 12];

function getPlaceTabLabel(placeName?: string): string {
  const cleaned = (placeName ?? '').trim();
  if (!cleaned) {
    return 'Home';
  }

  const firstWord = cleaned.split(/[\s,/-]+/).filter(Boolean)[0];
  return firstWord || 'Home';
}

const LiquidGlassTabBarBackground: React.FC<{
  isDark: boolean;
  colors: ReturnType<typeof useAppTheme>['colors'];
}> = ({ isDark, colors }) => {
  const drift = useSharedValue(0);
  const sheen = useSharedValue(0);

  React.useEffect(() => {
    if (isDark) {
      drift.value = withRepeat(
        withTiming(1, {
          duration: 3200,
          easing: Easing.inOut(Easing.quad),
        }),
        -1,
        true
      );
    } else {
      drift.value = withTiming(0, { duration: 220, easing: Easing.out(Easing.cubic) });
    }

    sheen.value = withRepeat(
      withTiming(1, {
        duration: 2600,
        easing: Easing.inOut(Easing.cubic),
      }),
      -1,
      true
    );
  }, [drift, isDark, sheen]);

  const flowStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: -16 + drift.value * 32 }],
  }));

  const sheenStyle = useAnimatedStyle(() => ({
    opacity: 0.14 + sheen.value * 0.14,
  }));

  const lineColor = isDark ? 'rgba(226,232,240,0.22)' : 'rgba(71,85,105,0.16)';

  return (
    <View style={styles.tabBarGlassRoot} pointerEvents="none">
      <AnimatedBlurView intensity={24} tint={isDark ? 'dark' : 'light'} style={styles.tabBarBlur} />

      <LinearGradient
        colors={
          isDark
            ? ['rgba(148,163,184,0.10)', 'rgba(30,41,59,0.25)']
            : ['rgba(255,255,255,0.42)', 'rgba(241,245,249,0.28)']
        }
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={styles.tabBarGlassTint}
      />

      {isDark ? (
        <AnimatedView style={[styles.tabBarFlowTrack, flowStyle]}>
          {TAB_GLASS_LINE_OFFSETS.map((offset, index) => (
            <View
              key={`glass-line-${offset}`}
              style={[
                styles.tabBarFlowLine,
                {
                  backgroundColor: lineColor,
                  opacity: 0.22 + index * 0.09,
                  transform: [{ translateY: offset }],
                },
              ]}
            />
          ))}
        </AnimatedView>
      ) : null}

      <AnimatedView style={[styles.tabBarSheen, sheenStyle]}>
        <LinearGradient
          colors={
            isDark
              ? ['rgba(248,250,252,0.20)', 'rgba(248,250,252,0)']
              : ['rgba(255,255,255,0.62)', 'rgba(255,255,255,0)']
          }
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />
      </AnimatedView>

      <View
        style={[
          styles.tabBarInnerRim,
          { borderColor: isDark ? 'rgba(255,255,255,0.10)' : `${colors.border}` },
        ]}
      />
    </View>
  );
};

const LiquidGlassTabBar: React.FC<
  BottomTabBarProps & {
    isDark: boolean;
    colors: ReturnType<typeof useAppTheme>['colors'];
    tabShadow: ReturnType<typeof useAppTheme>['tabShadow'];
  }
> = ({ state, descriptors, navigation, isDark, colors, tabShadow }) => {
  const [barWidth, setBarWidth] = React.useState(0);
  const indicatorX = useSharedValue(0);
  const hasPositioned = React.useRef(false);

  const tabCount = state.routes.length;
  const slotWidth = barWidth > 0 && tabCount > 0 ? barWidth / tabCount : 0;
  const indicatorWidth = slotWidth > 0 ? Math.max(90, slotWidth + 4) : 0;

  React.useEffect(() => {
    if (!slotWidth || !indicatorWidth) {
      return;
    }

    const rawX = state.index * slotWidth + (slotWidth - indicatorWidth) / 2;
    const maxX = Math.max(0, barWidth - indicatorWidth);
    const targetX = Math.min(Math.max(rawX, 0), maxX);

    if (!hasPositioned.current) {
      indicatorX.value = targetX;
      hasPositioned.current = true;
      return;
    }

    indicatorX.value = withSpring(targetX, {
      damping: 16,
      stiffness: 220,
      mass: 0.55,
      overshootClamping: false,
      restDisplacementThreshold: 0.2,
      restSpeedThreshold: 0.2,
    });
  }, [barWidth, indicatorWidth, indicatorX, slotWidth, state.index]);

  const selectorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: indicatorX.value }],
  }));

  return (
    <View
      style={[
        styles.tabBar,
        tabShadow,
        {
          backgroundColor: 'transparent',
          borderColor: colors.border,
        },
      ]}
      onLayout={(event) => {
        setBarWidth(event.nativeEvent.layout.width);
      }}
    >
      <LiquidGlassTabBarBackground isDark={isDark} colors={colors} />

      {indicatorWidth > 0 ? (
        <AnimatedView style={[styles.tabSelector, { width: indicatorWidth }, selectorStyle]} pointerEvents="none">
          <AnimatedBlurView intensity={30} tint={isDark ? 'dark' : 'light'} style={styles.tabSelectorBlur} />
          <LinearGradient
            colors={
              isDark
                ? ['rgba(134,239,172,0.28)', 'rgba(34,197,94,0.14)']
                : ['rgba(187,247,208,0.62)', 'rgba(134,239,172,0.34)']
            }
            start={{ x: 0.2, y: 0 }}
            end={{ x: 0.8, y: 1 }}
            style={styles.tabSelectorTint}
          />
          <View
            style={[
              styles.tabSelectorRim,
              { borderColor: isDark ? '#22C55E66' : '#22C55E88' },
            ]}
          />
        </AnimatedView>
      ) : null}

      <View style={styles.tabItemsRow}>
        {state.routes.map((route, index) => {
          const focused = state.index === index;
          const descriptor = descriptors[route.key];
          const { options } = descriptor;

          const label =
            typeof options.tabBarLabel === 'string'
              ? options.tabBarLabel
              : typeof options.title === 'string'
                ? options.title
                : route.name;

          const tint = focused ? colors.textPrimary : colors.iconMuted;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!focused && !event.defaultPrevented) {
              navigation.navigate(route.name, route.params);
            }
          };

          const onLongPress = () => {
            navigation.emit({
              type: 'tabLongPress',
              target: route.key,
            });
          };

          const icon = options.tabBarIcon?.({
            focused,
            color: tint,
            size: 19,
          });

          return (
            <Pressable
              key={route.key}
              accessibilityRole="button"
              accessibilityState={focused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel}
              testID={options.tabBarTestID}
              onPress={onPress}
              onLongPress={onLongPress}
              style={styles.tabPressable}
            >
              <View style={styles.tabButtonInner}>
                {icon}
                <Text numberOfLines={1} style={[styles.tabButtonLabel, { color: tint }]}>
                  {label}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
};

const TabIcon: React.FC<{ name: string; focused: boolean; color: string }> = ({ name, focused, color }) => {
  let iconName: React.ComponentProps<typeof Feather>['name'] = 'circle';
  switch (name) {
    case 'Dashboard':
      iconName = 'home';
      break;
    case 'Map':
      iconName = 'map';
      break;
    case 'Alerts':
    case 'Toolkit':
      iconName = 'navigation';
      break;
    case 'Compass':
      iconName = 'compass';
      break;
    case 'Settings':
      iconName = 'settings';
      break;
  }

  const scale = useSharedValue(focused ? 1 : 0.94);
  const glow = useSharedValue(focused ? 1 : 0);

  React.useEffect(() => {
    scale.value = withTiming(focused ? 1 : 0.94, {
      duration: 300,
      easing: Easing.out(Easing.cubic),
    });
    glow.value = withTiming(focused ? 1 : 0, {
      duration: 280,
      easing: Easing.out(Easing.cubic),
    });
  }, [focused, glow, scale]);

  const iconWrapStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  const iconGlowStyle = useAnimatedStyle(() => ({
    opacity: 0.8 + glow.value * 0.2,
  }));
  
  return (
    <AnimatedView style={[styles.tabIconContainer, iconWrapStyle, iconGlowStyle]}>
      <Feather name={iconName} size={19} color={color} />
    </AnimatedView>
  );
};

const MainTabs: React.FC = () => {
  const { t, zone } = useUser();
  const { colors, isDark, tabShadow } = useAppTheme();
  
  return (
    <Tab.Navigator
      tabBar={(props) => (
        <LiquidGlassTabBar
          {...props}
          isDark={isDark}
          colors={colors}
          tabShadow={tabShadow}
        />
      )}
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color }) => (
          <TabIcon name={route.name} focused={focused} color={color} />
        ),
        headerStyle: styles.header,
        headerTitleStyle: styles.headerTitle,
        headerTintColor: colors.textPrimary,
        headerTitleAlign: 'center',
      })}
    >
      <Tab.Screen
        name="Dashboard"
        component={MainDashboard}
        options={{
          title: zone?.name_en || 'Dashboard',
          tabBarLabel: getPlaceTabLabel(zone?.name_en),
          headerShown: false,
        }}
      />
      <Tab.Screen
        name="Map"
        component={NauticalMapScreen}
        options={{
          title: t?.fishing_zones || 'Map',
          headerShown: false,
        }}
      />
      <Tab.Screen
        name="Toolkit"
        component={AlertsScreen}
        options={{
          title: 'Toolkit',
          headerShown: false,
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          title: t?.settings || 'Settings',
          headerShown: false,
        }}
      />
    </Tab.Navigator>
  );
};

export const AppNavigator: React.FC = () => {
  const { isOnboarded, isFirstLaunch } = useUser();
  const { colors } = useAppTheme();
  const navigationTheme = React.useMemo(
    () => ({
      dark: false,
      colors: {
        primary: colors.safe,
        background: colors.background,
        card: colors.surface,
        text: colors.textPrimary,
        border: colors.border,
        notification: colors.warning,
      },
    }),
    [colors]
  );
  console.log('[Navigator] isOnboarded:', isOnboarded, 'isFirstLaunch:', isFirstLaunch);
  
  return (
    <NavigationContainer theme={navigationTheme}>
      <Stack.Navigator
        screenOptions={{
          headerStyle: [styles.header, { backgroundColor: colors.background }],
          headerTitleStyle: [styles.headerTitle, { color: colors.textPrimary }],
          headerTintColor: colors.textPrimary,
          headerTitleAlign: 'center',
          headerBackTitleVisible: false,
        }}
      >
        {!isOnboarded ? (
          <Stack.Screen
            name="Onboarding"
            component={OnboardingScreen}
            options={{ headerShown: false }}
          />
        ) : (
          <Stack.Screen
            name="Main"
            component={MainTabs}
            options={{ headerShown: false }}
          />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  header: {
    backgroundColor: 'transparent',
  },
  headerTitle: {
    color: '#0F172A',
    fontWeight: '600',
    fontSize: 18,
  },
  tabBar: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: Platform.OS === 'ios' ? 24 : 14,
    borderRadius: 30,
    borderTopWidth: 0,
    borderWidth: 1,
    height: Platform.OS === 'ios' ? 76 : 70,
    paddingBottom: Platform.OS === 'ios' ? 14 : 10,
    paddingTop: 8,
    paddingHorizontal: 8,
    overflow: 'hidden',
  },
  tabBarBlur: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 30,
  },
  tabBarGlassRoot: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 30,
    overflow: 'hidden',
  },
  tabBarGlassTint: {
    ...StyleSheet.absoluteFillObject,
  },
  tabBarFlowTrack: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: '50%',
    height: 56,
    marginTop: -28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBarFlowLine: {
    position: 'absolute',
    width: 54,
    height: 2,
    borderRadius: 999,
  },
  tabBarSheen: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: '62%',
  },
  tabBarInnerRim: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 30,
    borderWidth: 1,
  },
  tabSelector: {
    position: 'absolute',
    top: 2,
    bottom: Platform.OS === 'ios' ? 4 : 3,
    borderRadius: 24,
    overflow: 'hidden',
  },
  tabSelectorBlur: {
    ...StyleSheet.absoluteFillObject,
  },
  tabSelectorTint: {
    ...StyleSheet.absoluteFillObject,
  },
  tabSelectorRim: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 24,
    borderWidth: 1,
  },
  tabItemsRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  tabPressable: {
    flex: 1,
    borderRadius: 22,
  },
  tabButtonInner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 1,
    paddingTop: Platform.OS === 'ios' ? 4 : 2,
  },
  tabButtonLabel: {
    fontSize: 11,
    fontWeight: '600',
    lineHeight: 14,
  },
  tabIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default AppNavigator;