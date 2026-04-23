// src/navigation/RootNavigator.tsx
import React from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { ChatScreen } from '../screens/Chat/ChatScreen';
import { ModelSelectScreen } from '../screens/ModelSelect/ModelSelectScreen';

export type RootStackParamList = {
  Chat: undefined;
  ModelSelect: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const DarkTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: '#0D0D1A',
    card: '#12121F',
    text: '#FFFFFF',
    border: '#1E1E2E',
    primary: '#7C3AED',
    notification: '#7C3AED',
  },
};

export function RootNavigator(): React.JSX.Element {
  return (
    <NavigationContainer theme={DarkTheme}>
      <Stack.Navigator
        initialRouteName="Chat"
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen name="Chat" component={ChatScreen} />
        <Stack.Screen
          name="ModelSelect"
          component={ModelSelectScreen}
          options={{
            animation: 'slide_from_bottom',
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
