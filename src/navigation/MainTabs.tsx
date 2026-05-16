import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { colors } from '../constants/colors';
import { fontFamily, fontWeight } from '../constants/typography';
import { HomeScreen } from '../screens/home/HomeScreen';
import { ClosetScreen } from '../screens/closet/ClosetScreen';
import { ProfileScreen } from '../screens/profile/ProfileScreen';
import type { MainTabParamList } from '../types/navigation';
import { RecommendNavigator } from './RecommendNavigator';

const Tab = createBottomTabNavigator<MainTabParamList>();

export function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.subText,
        tabBarStyle: {
          height: 76,
          paddingTop: 8,
          paddingBottom: 18,
          borderTopWidth: 0,
          backgroundColor: colors.white,
          shadowColor: colors.canvasDark,
          shadowOpacity: 0.05,
          shadowOffset: { width: 0, height: -8 },
          shadowRadius: 18,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontFamily: fontFamily.bold,
          fontWeight: fontWeight.bold,
        },
        tabBarIcon: ({ color, size }) => {
          const iconName =
            route.name === 'Home'
              ? 'home'
              : route.name === 'Recommend'
                ? 'sparkles'
                : route.name === 'Closet'
                  ? 'shirt'
                  : 'person';

          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: '홈' }} />
      <Tab.Screen name="Recommend" component={RecommendNavigator} options={{ title: '추천' }} />
      <Tab.Screen name="Closet" component={ClosetScreen} options={{ title: '옷장' }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: '내 정보' }} />
    </Tab.Navigator>
  );
}
