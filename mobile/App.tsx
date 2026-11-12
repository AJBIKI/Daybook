import React from 'react';
import {StatusBar, StyleSheet, Text, useColorScheme, View} from 'react-native';
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

function App() {
  const isDarkMode = useColorScheme() === 'dark';

  return (
    <SafeAreaProvider>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
      />
      <BootCheck isDarkMode={isDarkMode} />
    </SafeAreaProvider>
  );
}

function BootCheck({isDarkMode}: {isDarkMode: boolean}) {
  const insets = useSafeAreaInsets();
  const bg = isDarkMode ? '#121110' : '#F5F1EA';
  const ink = isDarkMode ? '#F2EEE6' : '#16130F';
  const muted = isDarkMode ? '#A29B90' : '#6B655C';
  const accent = isDarkMode ? '#7CCBA3' : '#1E5A46';

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: bg,
          paddingTop: insets.top + 32,
          paddingBottom: insets.bottom + 24,
        },
      ]}>
      <Text style={[styles.eyebrow, {color: accent}]}>PHASE 0 BOOT CHECK</Text>
      <Text style={[styles.display, {color: ink}]}>Daybook</Text>
      <Text style={[styles.body, {color: muted}]}>
        Fraunces SemiBold display with Inter Regular body copy.
      </Text>
      <Text style={[styles.bodyStrong, {color: ink}]}>
        Inter Medium strong line for labels and controls.
      </Text>
      <Text style={[styles.heading, {color: ink}]}>
        Inter SemiBold heading sample.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: 'center',
    gap: 12,
  },
  eyebrow: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.6,
  },
  display: {
    fontFamily: 'Fraunces-SemiBold',
    fontSize: 34,
    lineHeight: 40,
  },
  heading: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 17,
    lineHeight: 24,
  },
  body: {
    fontFamily: 'Inter-Regular',
    fontSize: 15,
    lineHeight: 22,
  },
  bodyStrong: {
    fontFamily: 'Inter-Medium',
    fontSize: 15,
    lineHeight: 22,
  },
});

export default App;
