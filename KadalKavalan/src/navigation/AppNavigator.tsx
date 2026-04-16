import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, Text, StyleSheet, Platform } from 'react-native';

import { useUser } from '../context/UserContext';
import MainDashboard from '../screens/MainDashboard';
import NauticalMapScreen from '../screens/NauticalMapScreen';
import AlertsScreen from '../screens/AlertsScreen';
import SettingsScreen from '../screens/SettingsScreen';
import OnboardingScreen from '../screens/OnboardingScreen';
import { getRiskColor } from '../utils/riskEngine';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const TabIcon: React.FC<{ name: string; focused: boolean; color: string }> = ({ name, focused, color }) => {
  let icon = '';
  switch (name) {
    case 'Dashboard':
      icon = '⚓';
      break;
    case 'Map':
      icon = '🗺️';
      break;
    case 'Alerts':
      icon = '🔔';
      break;
    case 'Settings':
      icon = '⚙️';
      break;
  }
  
  return (
    <View style={styles.tabIconContainer}>
      <Text style={[styles.tabIcon, { opacity: focused ? 1 : 0.6 }]}>{icon}</Text>
    </View>
  );
};

const MainTabs: React.FC = () => {
  const { t, zone } = useUser();
  
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color }) => (
          <TabIcon name={route.name} focused={focused} color={color} />
        ),
        tabBarActiveTintColor: '#0B4F6C',
        tabBarInactiveTintColor: '#71787E',
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabBarLabel,
        headerStyle: styles.header,
        headerTitleStyle: styles.headerTitle,
        headerTintColor: '#fff',
        headerTitleAlign: 'center',
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
        name="Alerts"
        component={AlertsScreen}
        options={{
          title: t?.official_alerts || 'Alerts',
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
  console.log('[Navigator] isOnboarded:', isOnboarded, 'isFirstLaunch:', isFirstLaunch);
  
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerStyle: styles.header,
          headerTitleStyle: styles.headerTitle,
          headerTintColor: '#fff',
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
    backgroundColor: '#0B4F6C',
  },
  headerTitle: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 18,
  },
  tabBar: {
    backgroundColor: '#fff',
    borderTopWidth: 0,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    height: Platform.OS === 'ios' ? 85 : 65,
    paddingBottom: Platform.OS === 'ios' ? 25 : 8,
    paddingTop: 8,
  },
  tabBarLabel: {
    fontSize: 11,
    fontWeight: '500',
  },
  tabIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIcon: {
    fontSize: 22,
  },
});

export default AppNavigator;