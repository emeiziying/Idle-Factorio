import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createStackNavigator} from '@react-navigation/stack';
import {SafeAreaProvider} from 'react-native-safe-area-context';

import MainScreen from './screens/MainScreen';
import ItemDetailScreen from './screens/ItemDetailScreen';
import {GameProvider} from './context/GameContext';

const Stack = createStackNavigator();

const App = () => {
  return (
    <SafeAreaProvider>
      <GameProvider>
        <NavigationContainer>
          <Stack.Navigator
            initialRouteName="Main"
            screenOptions={{
              headerStyle: {
                backgroundColor: '#2563EB',
              },
              headerTintColor: '#fff',
              headerTitleStyle: {
                fontWeight: 'bold',
              },
            }}>
            <Stack.Screen
              name="Main"
              component={MainScreen}
              options={{title: '异星工厂'}}
            />
            <Stack.Screen
              name="ItemDetail"
              component={ItemDetailScreen}
              options={({route}: any) => ({
                title: route.params?.itemName || '物品详情',
              })}
            />
          </Stack.Navigator>
        </NavigationContainer>
      </GameProvider>
    </SafeAreaProvider>
  );
};

export default App; 