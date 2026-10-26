import { Eye, EyeOff, X } from "lucide-react-native";
import { useRef, useState, type ComponentRef } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { KueColors } from "@/constants/kue-theme";
import { LandingButton } from "@/features/landing/components/landing-button";
import { useAuth } from "@/lib/auth/auth-context";

export function SignInSheet({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const { signIn } = useAuth();
  const insets = useSafeAreaInsets();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const passwordRef = useRef<ComponentRef<typeof TextInput>>(null);

  const close = () => {
    setError(null);
    setPassword("");
    setPasswordVisible(false);
    onClose();
  };

  const canSubmit = email.trim().length > 0 && password.length > 0 && !busy;

  const submit = async () => {
    if (!canSubmit) return;

    setBusy(true);
    setError(null);

    try {
      await signIn(email.trim(), password);
      // AuthGate swaps to the signed-in shell once the user lands in context.
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not sign in.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={close}>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior="padding">
        <Pressable
          style={styles.backdrop}
          onPress={close}
          accessibilityRole="button"
          accessibilityLabel="Close sign in"
        />

        <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
          <View style={styles.grabber} />

          <View style={styles.header}>
            <Text style={styles.title}>
              Welcome back<Text style={styles.accent}>.</Text>
            </Text>
            <Pressable
              onPress={close}
              hitSlop={8}
              style={({ pressed }) => [styles.close, pressed && styles.pressed]}
              accessibilityRole="button"
              accessibilityLabel="Close sign in">
              <X size={20} color={KueColors.ink2} strokeWidth={2} />
            </Pressable>
          </View>

          <ScrollView
            style={styles.formScroll}
            contentContainerStyle={styles.form}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              placeholderTextColor={KueColors.ink3}
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              inputMode="email"
              returnKeyType="next"
              onSubmitEditing={() => passwordRef.current?.focus()}
              style={styles.input}
            />

            <Text style={styles.label}>Password</Text>
            <View style={styles.passwordRow}>
              <TextInput
                ref={passwordRef}
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                placeholderTextColor={KueColors.ink3}
                secureTextEntry={!passwordVisible}
                autoComplete="current-password"
                returnKeyType="go"
                onSubmitEditing={submit}
                style={[styles.input, styles.passwordInput]}
              />
              <Pressable
                onPress={() => setPasswordVisible((value) => !value)}
                hitSlop={8}
                style={styles.eye}
                accessibilityRole="button"
                accessibilityLabel={passwordVisible ? "Hide password" : "Show password"}>
                {passwordVisible ? (
                  <EyeOff size={18} color={KueColors.ink3} strokeWidth={1.8} />
                ) : (
                  <Eye size={18} color={KueColors.ink3} strokeWidth={1.8} />
                )}
              </Pressable>
            </View>

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <View style={styles.submit}>
              <LandingButton
                label="Sign in"
                onPress={submit}
                size="lg"
                fullWidth
                busy={busy}
                disabled={!canSubmit}
              />
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: "rgba(0,0,0,0.64)",
  },
  sheet: {
    maxHeight: "92%",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    backgroundColor: KueColors.surface2,
    paddingTop: 10,
    paddingHorizontal: 20,
  },
  grabber: {
    alignSelf: "center",
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: KueColors.line2,
    marginBottom: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
  },
  title: {
    flex: 1,
    color: KueColors.foreground,
    fontSize: 27,
    fontWeight: "800",
    letterSpacing: -0.8,
  },
  accent: {
    color: KueColors.accent,
  },
  close: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: KueColors.surface3,
    alignItems: "center",
    justifyContent: "center",
  },
  pressed: {
    opacity: 0.7,
  },
  formScroll: {
    flexGrow: 0,
    flexShrink: 1,
  },
  form: {
    paddingTop: 4,
    paddingBottom: 4,
  },
  label: {
    color: KueColors.ink2,
    fontSize: 13,
    fontWeight: "600",
    marginTop: 14,
    marginBottom: 6,
  },
  input: {
    height: 52,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: KueColors.line2,
    backgroundColor: KueColors.background,
    borderRadius: 14,
    paddingHorizontal: 14,
    color: KueColors.foreground,
    fontSize: 15,
  },
  passwordRow: {
    position: "relative",
    justifyContent: "center",
  },
  passwordInput: {
    paddingRight: 48,
  },
  eye: {
    position: "absolute",
    right: 4,
    width: 44,
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  error: {
    color: KueColors.danger,
    fontSize: 12.5,
    lineHeight: 18,
    marginTop: 8,
  },
  submit: {
    marginTop: 14,
  },
});
