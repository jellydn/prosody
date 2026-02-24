import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import TabBarIcon, { type IconName } from "../components/TabBarIcon";
import DashboardScreen from "../screens/DashboardScreen";
import ExerciseScreen, {
	type HomeStackParamList,
} from "../screens/ExerciseScreen";
import HomeScreen from "../screens/HomeScreen";
import LibraryScreen, {
	type LibraryStackParamList,
} from "../screens/LibraryScreen";
import ProgramOverviewScreen from "../screens/ProgramOverviewScreen";
import SessionCompletionScreen from "../screens/SessionCompletionScreen";
import SettingsScreen from "../screens/SettingsScreen";

const Tab = createBottomTabNavigator();

const HomeStack = createNativeStackNavigator<HomeStackParamList>();
const DashboardStack = createNativeStackNavigator();
const LibraryStack = createNativeStackNavigator<LibraryStackParamList>();
const SettingsStack = createNativeStackNavigator();

function HomeStackScreen() {
	return (
		<HomeStack.Navigator>
			<HomeStack.Screen
				name="HomeMain"
				component={HomeScreen}
				options={{ headerShown: false }}
			/>
			<HomeStack.Screen
				name="ExerciseScreen"
				component={ExerciseScreen}
				options={{ headerShown: false }}
			/>
			<HomeStack.Screen
				name="SessionCompletion"
				component={SessionCompletionScreen}
				options={{ headerShown: false }}
			/>
			<HomeStack.Screen
				name="ProgramOverview"
				component={ProgramOverviewScreen}
				options={{ headerShown: false }}
			/>
		</HomeStack.Navigator>
	);
}

function LibraryStackScreen() {
	return (
		<LibraryStack.Navigator>
			<LibraryStack.Screen
				name="LibraryMain"
				component={LibraryScreen}
				options={{ headerShown: false }}
			/>
			<LibraryStack.Screen
				name="ExerciseScreen"
				component={ExerciseScreen}
				options={{ headerShown: false }}
			/>
		</LibraryStack.Navigator>
	);
}

function DashboardStackScreen() {
	return (
		<DashboardStack.Navigator>
			<DashboardStack.Screen
				name="DashboardMain"
				component={DashboardScreen}
				options={{ headerShown: false }}
			/>
		</DashboardStack.Navigator>
	);
}

function SettingsStackScreen() {
	return (
		<SettingsStack.Navigator>
			<SettingsStack.Screen
				name="SettingsMain"
				component={SettingsScreen}
				options={{ headerShown: false }}
			/>
		</SettingsStack.Navigator>
	);
}

export default function TabNavigator() {
	return (
		<Tab.Navigator
			screenOptions={({ route }) => ({
				tabBarIcon: ({ focused }) => {
					let iconName: IconName;
					switch (route.name) {
						case "Home":
							iconName = "home";
							break;
						case "Dashboard":
							iconName = "bar-chart";
							break;
						case "Library":
							iconName = "book";
							break;
						case "Settings":
							iconName = "settings";
							break;
						default:
							iconName = "home";
					}
					return <TabBarIcon name={iconName} focused={focused} />;
				},
				tabBarActiveTintColor: "#007AFF",
				tabBarInactiveTintColor: "#8E8E93",
			})}
		>
			<Tab.Screen name="Home" component={HomeStackScreen} />
			<Tab.Screen name="Dashboard" component={DashboardStackScreen} />
			<Tab.Screen name="Library" component={LibraryStackScreen} />
			<Tab.Screen name="Settings" component={SettingsStackScreen} />
		</Tab.Navigator>
	);
}
