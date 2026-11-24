import {createNavigationContainerRef, NavigationContainer} from '@react-navigation/native';
import {CardStyleInterpolators, createStackNavigator} from '@react-navigation/stack';
import React from 'react';
import {useTheme} from 'styled-components/native';
import {ToastHost} from '../components/ui';
import {navTheme} from '../config/theme';
import * as Screens from '../navigations';
import {routeForLink} from '../navigations/linking';
import {Tabs} from '../navigations/Tabs';
import type {RootStackParamList} from '../navigations/types';
import {useSession} from '../store/session';
import {HelpSheet} from './shared/Help';
import {PresenterTools} from './shared/Presenter';

export const navigationRef = createNavigationContainerRef<RootStackParamList>();
const Stack = createStackNavigator<RootStackParamList>();

/** Open the screen a notification points at (the paths are shared with the web version). */
export function openLink(link: string | null | undefined) {
  if (!navigationRef.isReady()) return;
  const r = routeForLink(link);
  (navigationRef.navigate as (name: string, params?: object) => void)(r.name, r.params);
}

/** Signed out: welcome, sign-in, code, enrolment. Signed in: the tabs and every detail screen. */
export default function RootLayout() {
  const {colors} = useTheme();
  const user = useSession(s => s.user);
  return (
    <NavigationContainer ref={navigationRef} theme={navTheme(colors)}>
      <Stack.Navigator screenOptions={{headerShown: false, cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS, cardStyle: {backgroundColor: colors.ground}}}>
        {user ? (
          <>
            <Stack.Screen name="Main" component={Tabs} />
            <Stack.Screen name="LoanApply" component={Screens.LoanApply} />
            <Stack.Screen name="LoanDetail" component={Screens.LoanDetail} />
            <Stack.Screen name="ClaimNew" component={Screens.ClaimNew} />
            <Stack.Screen name="ClaimDetail" component={Screens.ClaimDetail} />
            <Stack.Screen name="Payouts" component={Screens.Payouts} />
            <Stack.Screen name="Assist" component={Screens.Assist} />
            <Stack.Screen name="Branches" component={Screens.Branches} />
            <Stack.Screen name="Profile" component={Screens.Profile} />
            <Stack.Screen name="Notifications" component={Screens.Notifications} />
          </>
        ) : (
          <>
            <Stack.Screen name="Welcome" component={Screens.Welcome} />
            <Stack.Screen name="SignIn" component={Screens.SignIn} />
            <Stack.Screen name="Verify" component={Screens.Verify} />
            <Stack.Screen name="Enrol" component={Screens.Enrol} />
          </>
        )}
      </Stack.Navigator>
      <HelpSheet />
      {user ? <PresenterTools /> : null}
      <ToastHost />
    </NavigationContainer>
  );
}
