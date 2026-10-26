import { Check, Eye, EyeOff, X } from "lucide-react-native";
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

import { KueColors, KueTextScale } from "@/constants/kue-theme";
import { LandingButton } from "@/features/landing/components/landing-button";
import { useAuth } from "@/lib/auth/auth-context";

export function RegisterSheet({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const { register } = useAuth();
  const insets = useSafeAreaInsets();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const emailRef = useRef<ComponentRef<typeof TextInput>>(null);
  const passwordRef = useRef<ComponentRef<typeof TextInput>>(null);

  const close = () => {
    setError(null);
    setPassword("");
    setPasswordVisible(false);
    setAccepted(false);
    onClose();
  };

  const usernameOk = username.trim().length >= 3 && username.trim().length <= 50;
  const emailOk = /\S+@\S+\.\S+/.test(email.trim());
  const passwordOk =
    password.length >= 8 && /[A-Z]/.test(password) && /[^A-Za-z0-9]/.test(password);
  const canSubmit = usernameOk && emailOk && passwordOk && accepted && !busy;

  const submit = async () => {
    if (!canSubmit) return;

    setBusy(true);
    setError(null);

    try {
      await register(username.trim(), email.trim(), password);
      // AuthGate swaps to the signed-in shell once the user lands in context.
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not create your account.");
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
          accessibilityLabel="Close registration"
        />

        <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
          <View style={styles.grabber} />

          <View style={styles.header}>
            <Text style={styles.title}>
              Start your index<Text style={styles.accent}>.</Text>
            </Text>
            <Pressable
              onPress={close}
              hitSlop={8}
              style={({ pressed }) => [styles.close, pressed && styles.pressed]}
              accessibilityRole="button"
              accessibilityLabel="Close registration">
              <X size={20} color={KueColors.ink2} strokeWidth={2} />
            </Pressable>
          </View>

          <Text style={styles.body}>
            Create one account for every format. The same profile works on the web and on this
            device.
          </Text>

          <ScrollView
            style={styles.formScroll}
            contentContainerStyle={styles.form}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>
            <Text maxFontSizeMultiplier={KueTextScale.control} style={styles.label}>
              Username
            </Text>
            <TextInput
              value={username}
              onChangeText={setUsername}
              placeholder="yourname"
              placeholderTextColor={KueColors.ink3}
              maxFontSizeMultiplier={KueTextScale.control}
              autoCapitalize="none"
              autoComplete="username-new"
              returnKeyType="next"
              onSubmitEditing={() => emailRef.current?.focus()}
              style={styles.input}
            />

            <Text maxFontSizeMultiplier={KueTextScale.control} style={styles.label}>
              Email
            </Text>
            <TextInput
              ref={emailRef}
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              placeholderTextColor={KueColors.ink3}
              maxFontSizeMultiplier={KueTextScale.control}
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              inputMode="email"
              returnKeyType="next"
              onSubmitEditing={() => passwordRef.current?.focus()}
              style={styles.input}
            />

            <Text maxFontSizeMultiplier={KueTextScale.control} style={styles.label}>
              Password
            </Text>
            <View style={styles.passwordRow}>
              <TextInput
                ref={passwordRef}
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                placeholderTextColor={KueColors.ink3}
                maxFontSizeMultiplier={KueTextScale.control}
                secureTextEntry={!passwordVisible}
                autoComplete="new-password"
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
            <Text maxFontSizeMultiplier={KueTextScale.control} style={styles.requirements}>
              8+ characters, one uppercase letter and one symbol.
            </Text>

            <Pressable
              onPress={() => setAccepted((value) => !value)}
              style={styles.terms}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: accepted }}
              accessibilityLabel="Accept the Privacy Policy and Terms of Service">
              <View style={[styles.checkbox, accepted && styles.checkboxOn]}>
                {accepted ? <Check size={12} color={KueColors.background} strokeWidth={3} /> : null}
              </View>
              <Text
                maxFontSizeMultiplier={KueTextScale.control}
                style={styles.termsText}>
                I accept the Privacy Policy and Terms of Service.
              </Text>
            </Pressable>

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <View style={styles.submit}>
              <LandingButton
                label="Create account"
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
  overlay: { flex: 1, justifyContent: "flex-end" },
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
  accent: { color: KueColors.accent },
  close: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: KueColors.surface3,
    alignItems: "center",
    justifyContent: "center",
  },
  pressed: { opacity: 0.7 },
  body: {
    color: KueColors.ink2,
    fontSize: 14,
    lineHeight: 21,
    marginTop: 8,
  },
  formScroll: { flexGrow: 0, flexShrink: 1 },
  form: { paddingTop: 4, paddingBottom: 4 },
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
  passwordRow: { position: "relative", justifyContent: "center" },
  passwordInput: { paddingRight: 48 },
  eye: {
    position: "absolute",
    right: 4,
    width: 44,
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  requirements: {
    color: KueColors.ink3,
    fontSize: 11.5,
    lineHeight: 17,
    marginTop: 6,
  },
  terms: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 16,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: KueColors.line2,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxOn: {
    borderColor: KueColors.accent,
    backgroundColor: KueColors.accent,
  },
  termsText: {
    flex: 1,
    color: KueColors.ink2,
    fontSize: 12.5,
    lineHeight: 18,
  },
  error: {
    color: KueColors.danger,
    fontSize: 12.5,
    lineHeight: 18,
    marginTop: 8,
  },
  submit: { marginTop: 14 },
});
