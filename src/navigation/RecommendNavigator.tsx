import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { colors } from '../constants/colors';
import { RecommendationResultScreen } from '../screens/recommend/RecommendationResultScreen';
import { StyleRecommendScreen } from '../screens/recommend/StyleRecommendScreen';
import type { RecommendStackParamList } from '../types/navigation';

const Stack = createNativeStackNavigator<RecommendStackParamList>();

export function RecommendNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="StyleRecommend" component={StyleRecommendScreen} />
      <Stack.Screen name="RecommendationResult" component={RecommendationResultScreen} />
    </Stack.Navigator>
  );
}
