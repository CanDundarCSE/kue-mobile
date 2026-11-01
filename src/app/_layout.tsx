import '@/theme/styles';

import { FragmentMono_400Regular } from '@expo-google-fonts/fragment-mono';
import { InstrumentSerif_400Regular } from '@expo-google-fonts/instrument-serif';
import {
  Montserrat_400Regular,
  Montserrat_500Medium,
  Montserrat_600SemiBold,
  Montserrat_700Bold,
} from '@expo-google-fonts/montserrat';
import { useFonts } from 'expo-font';
import {
  DarkTheme,
  DefaultTheme,
  Slot,
  ThemeProvider as NavigationThemeProvider,
} from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { BottomNav } from '@/components/bottom-nav';
import { NotificationsRealtime } from '@/features/notifications/notifications-realtime';
import { AppUpdatePrompt } from '@/features/updates/app-update-prompt';
import { BootScreen } from '@/components/boot-screen';
import { KueColors } from '@/constants/kue-theme';
import { LandingExperience } from '@/features/landing/landing-experience';
import { AuthProvider, useAuth } from '@/lib/auth/auth-context';
import { AppQueryProvider } from '@/lib/query/query-provider';
import { ThemeProvider as AppThemeProvider, useTheme } from '@/theme/theme-provider';

SplashScreen.preventAutoHideAsync().catch(() => undefined);

function RootContent() {
  const { user, loading } = useAuth();
  const { resolved } = useTheme();
  const [fontsLoaded, fontError] = useFonts({
    Montserrat_400Regular,
    Montserrat_500Medium,
    Montserrat_600SemiBold,
    Montserrat_700Bold,
    InstrumentSerif_400Regular,
    FragmentMono_400Regular,
  });

  const ready = (fontsLoaded || fontError) && !loading;

  useEffect(() => {
    if (ready) {
      SplashScreen.hideAsync().catch(() => undefined);
    }
  }, [ready]);

  if (!ready) {
    return <BootScreen />;
  }

  return (
    <View style={styles.shell}>
      <NotificationsRealtime />
      <AppUpdatePrompt />
      {user ? (
        <>
          <View key={resolved} style={styles.content}>
            <Slot key={resolved} />
          </View>
          <BottomNav />
        </>
      ) : (
        <LandingExperience />
      )}
    </View>
  );
}

function ThemeSwitch() {
  const { resolved } = useTheme();
  return <ThemedNavigation key={resolved} />;
}

function ThemedNavigation() {
  const { resolved } = useTheme();

  return (
    <NavigationThemeProvider value={resolved === 'dark' ? DarkTheme : DefaultTheme}>
      <RootContent />
    </NavigationThemeProvider>
  );
}

const styles = StyleSheet.create({
  shell: {
    flex: 1,
    backgroundColor: KueColors.background,
  },
  content: {
    flex: 1,
  },
});

export default function RootLayout() {
  return (
    <AppQueryProvider>
      <AuthProvider>
        <SafeAreaProvider>
          <AppThemeProvider>
            <ThemeSwitch />
          </AppThemeProvider>
        </SafeAreaProvider>
      </AuthProvider>
    </AppQueryProvider>
  );
}
