import 'react-native-gesture-handler';
import React, {useEffect, useState} from 'react';
import {ActivityIndicator, StyleSheet, useColorScheme, View} from 'react-native';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {ThemeProvider} from 'styled-components/native';
import RootLayout from './src/app/_layout';
import {makeTheme} from './src/config/theme';
import {useDB} from './src/store/db';
import {usePrefs} from './src/store/prefs';
import {useSession} from './src/store/session';

/** Wait until the stored sample data, session and preferences are read from the phone. */
function useHydrated() {
  const [ready, setReady] = useState(() => useDB.persist.hasHydrated() && usePrefs.persist.hasHydrated() && useSession.persist.hasHydrated());
  useEffect(() => {
    const check = () => setReady(useDB.persist.hasHydrated() && usePrefs.persist.hasHydrated() && useSession.persist.hasHydrated());
    const subs = [useDB.persist.onFinishHydration(check), usePrefs.persist.onFinishHydration(check), useSession.persist.onFinishHydration(check)];
    check();
    return () => subs.forEach(u => u());
  }, []);
  return ready;
}

/** Light or dark follows the phone unless the member picks one; Text size scales everything. */
function App(): React.JSX.Element {
  const phone = useColorScheme();
  const pref = usePrefs(s => s.theme);
  const textSize = usePrefs(s => s.textSize);
  const ready = useHydrated();
  const theme = makeTheme(pref === 'system' ? phone : pref, textSize);
  return (
    <GestureHandlerRootView style={[styles.root, {backgroundColor: theme.colors.ground}]}>
      <SafeAreaProvider>
        <ThemeProvider theme={theme}>
          {ready ? (
            <RootLayout />
          ) : (
            <View style={[styles.root, styles.center]} accessibilityLabel="Loading PS-ACCESS">
              <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
          )}
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({root: {flex: 1}, center: {alignItems: 'center', justifyContent: 'center'}});

export default App;
