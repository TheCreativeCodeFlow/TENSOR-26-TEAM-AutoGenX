import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';

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

const TabIcon: React.FC<{ name: string; focused: boolean; color: string }> = ({ name, focused, color }) => {
  const { colors } = useAppTheme();
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

  const activeCircleStyle = useAnimatedStyle(() => ({
    opacity: glow.value,
    transform: [{ scale: 0.85 + glow.value * 0.15 }],
  }));
  
  return (
    <AnimatedView style={[styles.tabIconContainer, iconWrapStyle]}>
      <AnimatedView
        style={[
          styles.activeIconCircle,
          { backgroundColor: `${colors.safe}55` },
          activeCircleStyle,
        ]}
      />
      <Feather
        name={iconName}
        size={19}
        color={focused ? colors.textPrimary : colors.iconMuted}
      />
    </AnimatedView>
  );
};

const MainTabs: React.FC = () => {
  const { t, zone } = useUser();
  const { colors, isDark, tabShadow } = useAppTheme();
  const tabBarStyle = React.useMemo(
    () => [
      styles.tabBar,
      tabShadow,
      {
        backgroundColor: isDark ? '#111827D8' : '#FFFFFFE8',
        borderColor: colors.border,
      },
    ],
    [colors.border, isDark, tabShadow]
  );
  
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color }) => (
          <TabIcon name={route.name} focused={focused} color={color} />
        ),
        tabBarActiveTintColor: colors.textPrimary,
        tabBarInactiveTintColor: colors.iconMuted,
        tabBarStyle: tabBarStyle,
        tabBarLabelStyle: styles.tabBarLabel,
        tabBarItemStyle: styles.tabBarItem,
        headerStyle: styles.header,
        headerTitleStyle: styles.headerTitle,
        headerTintColor: colors.textPrimary,
        headerTitleAlign: 'center',
        tabBarBackground: () => (
          <AnimatedBlurView intensity={20} tint={isDark ? 'dark' : 'light'} style={styles.tabBarBlur} />
        ),
      })}
    >
      <Tab.Screen
        name="Dashboard"
        component={MainDashboard}
        options={{
          title: zone?.name_en || 'Dashboard',
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
  tabBarItem: {
    borderRadius: 22,
  },
  tabBarLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: Platform.OS === 'ios' ? 2 : 4,
  },
  tabIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeIconCircle: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 18,
  },
});

export default AppNavigator;