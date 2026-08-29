import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme';
import HomeScreen from '../screens/HomeScreen';
import StudySessionScreen from '../screens/StudySessionScreen';
import TestScreen from '../screens/TestScreen';
import QuizSessionScreen from '../screens/QuizSessionScreen';
import MyScreen from '../screens/MyScreen';
import { HomeStackParamList, TestStackParamList, MyStackParamList, RootTabParamList } from './types';

const Tab = createBottomTabNavigator<RootTabParamList>();
const HomeStack = createNativeStackNavigator<HomeStackParamList>();
const TestStack = createNativeStackNavigator<TestStackParamList>();
const MyStack = createNativeStackNavigator<MyStackParamList>();

function HomeStackNavigator() {
  return (
    <HomeStack.Navigator screenOptions={{ headerShown: false }}>
      <HomeStack.Screen name="HomeMain" component={HomeScreen} />
      <HomeStack.Screen name="StudySession" component={StudySessionScreen} />
    </HomeStack.Navigator>
  );
}

function TestStackNavigator() {
  return (
    <TestStack.Navigator screenOptions={{ headerShown: false }}>
      <TestStack.Screen name="TestMain" component={TestScreen} />
      <TestStack.Screen name="QuizSession" component={QuizSessionScreen} />
    </TestStack.Navigator>
  );
}

function MyStackNavigator() {
  return (
    <MyStack.Navigator screenOptions={{ headerShown: false }}>
      <MyStack.Screen name="MyMain" component={MyScreen} />
    </MyStack.Navigator>
  );
}

const ICONS: Record<keyof RootTabParamList, keyof typeof Ionicons.glyphMap> = {
  Home: 'home',
  Test: 'checkbox',
  My: 'person',
};

const LABELS: Record<keyof RootTabParamList, string> = {
  Home: '홈',
  Test: '테스트',
  My: '마이',
};

export default function RootNavigator() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: '#8a8a8e',
          tabBarLabel: LABELS[route.name as keyof RootTabParamList],
          tabBarIcon: ({ color, size }) => (
            <Ionicons name={ICONS[route.name as keyof RootTabParamList]} color={color} size={size} />
          ),
        })}
      >
        <Tab.Screen name="Home" component={HomeStackNavigator} />
        <Tab.Screen name="Test" component={TestStackNavigator} />
        <Tab.Screen name="My" component={MyStackNavigator} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
