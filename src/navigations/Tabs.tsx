import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import React from 'react';
import Claims from '../app/claims/Claims';
import Equity from '../app/equity/Equity';
import Home from '../app/home/Home';
import Loans from '../app/loans/Loans';
import More from '../app/more/More';
import {TabBar} from './TabBar';
import type {TabParamList} from './types';

const Tab = createBottomTabNavigator<TabParamList>();

export function Tabs() {
  return (
    <Tab.Navigator screenOptions={{headerShown: false}} tabBar={props => <TabBar {...props} />}>
      <Tab.Screen name="Home" component={Home} />
      <Tab.Screen name="Equity" component={Equity} />
      <Tab.Screen name="Loans" component={Loans} />
      <Tab.Screen name="Claims" component={Claims} />
      <Tab.Screen name="More" component={More} />
    </Tab.Navigator>
  );
}
