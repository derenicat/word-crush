import { Stack } from 'expo-router';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { store, persistor } from '../src/store';
import { StatusBar } from 'expo-status-bar';
import { View, Text } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

export default function RootLayout() {
  return (
    <Provider store={store}>
      <PersistGate 
        loading={<View className="flex-1 bg-wood-900 items-center justify-center"><Text className="text-white">Yükleniyor...</Text></View>} 
        persistor={persistor}>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#3E2723' } }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="gameConfig" options={{ presentation: 'modal' }} />
            <Stack.Screen name="scores" options={{ presentation: 'modal' }} />
            <Stack.Screen name="market" options={{ presentation: 'modal' }} />
            <Stack.Screen name="game" />
          </Stack>
          <StatusBar style="light" />
        </GestureHandlerRootView>
      </PersistGate>
    </Provider>
  );
}
