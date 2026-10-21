import { FragmentMono_400Regular } from '@expo-google-fonts/fragment-mono';
import { InstrumentSerif_400Regular } from '@expo-google-fonts/instrument-serif';
import {
  Montserrat_400Regular,
  Montserrat_500Medium,
  Montserrat_600SemiBold,
  Montserrat_700Bold,
} from '@expo-google-fonts/montserrat';
import { useFonts } from 'expo-font';
import { DarkTheme, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import AppTabs from '@/components/app-tabs';
import { BootScreen } from '@/components/boot-screen';
import { LandingExperience } from '@/features/landing/landing-experience';
import { AuthProvider, useAuth } from '@/lib/auth/auth-context';
import { AppQueryProvider } from '@/lib/query/query-provider';

SplashScreen.preventAutoHideAsync().catch(() => undefined);

function RootContent() {
  const { user, loading } = useAuth();
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

  return user ? <AppTabs /> : <LandingExperience />;
}

export default function RootLayout() {
  return (
    <AppQueryProvider>
      <AuthProvider>
        <SafeAreaProvider>
          <ThemeProvider value={DarkTheme}>
            <RootContent />
          </ThemeProvider>
        </SafeAreaProvider>
      </AuthProvider>
    </AppQueryProvider>
  );
}
