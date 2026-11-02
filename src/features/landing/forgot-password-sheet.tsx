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

import { KueColors, KueTextScale } from "@/constants/kue-theme";
import { LandingButton } from "@/features/landing/components/landing-button";
import { requestPasswordReset, resetPassword } from "@/lib/auth/session";

type Step = "email" | "reset" | "done";

export function ForgotPasswordSheet({
  visible,
  onClose,
  onSignIn,
}: {
  visible: boolean;
  onClose: () => void;
  onSignIn: () => void;
}) {
  const insets = useSafeAreaInsets();

  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const codeRef = useRef<ComponentRef<typeof TextInput>>(null);
  const passwordRef = useRef<ComponentRef<typeof TextInput>>(null);
  const confirmRef = useRef<ComponentRef<typeof TextInput>>(null);

  const reset = () => {
    setStep("email");
    setEmail("");
    setCode("");
    setPassword("");
    setConfirmPassword("");
    setPasswordVisible(false);
    setBusy(false);
    setError(null);
  };

  const close = () => {
    reset();
    onClose();
  };

  const emailOk = /\S+@\S+\.\S+/.test(email.trim());
  const codeOk = code.replace(/[^A-Za-z0-9]/g, "").length === 8;
  const passwordOk =
    password.length >= 8 && /[A-Z]/.test(password) && /[^A-Za-z0-9]/.test(password);
  const confirmOk = confirmPassword.length > 0 && confirmPassword === password;
  const canRequest = emailOk && !busy;
  const canReset = codeOk && passwordOk && confirmOk && !busy;

  const request = async () => {
    if (!canRequest) return;

    setBusy(true);
    setError(null);

    try {
      await requestPasswordReset(email);
      setStep("reset");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not request a reset code.");
    } finally {
      setBusy(false);
    }
  };

  const submit = async () => {
    if (!canReset) return;

    setBusy(true);
    setError(null);

    try {
      await resetPassword(email, code, password);
      setStep("done");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not reset your password.");
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
      <KeyboardAvoidingView style={styles.overlay} behavior="padding">
        <Pressable
          style={styles.backdrop}
          onPress={close}
          accessibilityRole="button"
          accessibilityLabel="Close password reset"
        />

        <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
          <View style={styles.grabber} />

          <View style={styles.header}>
            <Text style={styles.title}>
              {step === "done" ? "Password updated" : "Reset password"}
              <Text style={styles.accent}>.</Text>
            </Text>
            <Pressable
              onPress={close}
              hitSlop={8}
              style={({ pressed }) => [styles.close, pressed && styles.pressed]}
              accessibilityRole="button"
              accessibilityLabel="Close password reset">
              <X size={20} color={KueColors.ink2} strokeWidth={2} />
            </Pressable>
          </View>

          <ScrollView
            style={styles.formScroll}
            contentContainerStyle={styles.form}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>
            {step === "email" ? (
              <>
                <Text style={styles.body}>
                  Enter your account email and we will send an 8-character reset code. It
                  expires after 15 minutes.
                </Text>

                <Text maxFontSizeMultiplier={KueTextScale.control} style={styles.label}>
                  Email
                </Text>
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="you@example.com"
                  placeholderTextColor={KueColors.ink3}
                  maxFontSizeMultiplier={KueTextScale.control}
                  autoCapitalize="none"
                  autoComplete="email"
                  keyboardType="email-address"
                  inputMode="email"
                  returnKeyType="go"
                  onSubmitEditing={request}
                  style={styles.input}
                />

                {error ? <Text style={styles.error}>{error}</Text> : null}

                <View style={styles.submit}>
                  <LandingButton
                    label="Send reset code"
                    onPress={request}
                    size="lg"
                    fullWidth
                    busy={busy}
                    disabled={!canRequest}
                  />
                </View>
              </>
            ) : null}

            {step === "reset" ? (
              <>
                <Text style={styles.body}>
                  Enter the code sent to{" "}
                  <Text style={styles.strong}>{email.trim()}</Text> and choose a new
                  password.
                </Text>

                <Text maxFontSizeMultiplier={KueTextScale.control} style={styles.label}>
                  Reset code
                </Text>
                <TextInput
                  ref={codeRef}
                  value={code}
                  onChangeText={setCode}
                  placeholder="XXXX-XXXX"
                  placeholderTextColor={KueColors.ink3}
                  maxFontSizeMultiplier={KueTextScale.control}
                  autoCapitalize="characters"
                  autoComplete="one-time-code"
                  autoCorrect={false}
                  maxLength={9}
                  returnKeyType="next"
                  onSubmitEditing={() => passwordRef.current?.focus()}
                  style={[styles.input, styles.codeInput]}
                />

                <Text maxFontSizeMultiplier={KueTextScale.control} style={styles.label}>
                  New password
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
                    returnKeyType="next"
                    onSubmitEditing={() => confirmRef.current?.focus()}
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

                <Text maxFontSizeMultiplier={KueTextScale.control} style={styles.label}>
                  Confirm password
                </Text>
                <TextInput
                  ref={confirmRef}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="Repeat your new password"
                  placeholderTextColor={KueColors.ink3}
                  maxFontSizeMultiplier={KueTextScale.control}
                  secureTextEntry={!passwordVisible}
                  autoComplete="new-password"
                  returnKeyType="go"
                  onSubmitEditing={submit}
                  style={styles.input}
                />

                {error ? <Text style={styles.error}>{error}</Text> : null}

                <View style={styles.submit}>
                  <LandingButton
                    label="Reset password"
                    onPress={submit}
                    size="lg"
                    fullWidth
                    busy={busy}
                    disabled={!canReset}
                  />
                </View>

                <View style={styles.links}>
                  <Pressable
                    onPress={() => {
                      setStep("email");
                      setCode("");
                      setPassword("");
                      setConfirmPassword("");
                      setError(null);
                    }}
                    hitSlop={8}
                    accessibilityRole="button"
                    accessibilityLabel="Use a different email">
                    <Text style={styles.linkMuted}>Use a different email</Text>
                  </Pressable>
                </View>
              </>
            ) : null}

            {step === "done" ? (
              <>
                <Text style={styles.body}>
                  Your password changed. All other sessions were signed out. Sign in with
                  the new password.
                </Text>

                <View style={styles.submit}>
                  <LandingButton
                    label="Back to sign in"
                    onPress={() => {
                      reset();
                      onSignIn();
                    }}
                    size="lg"
                    fullWidth
                  />
                </View>
              </>
            ) : null}
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
  formScroll: { flexGrow: 0, flexShrink: 1 },
  form: { paddingTop: 4, paddingBottom: 4 },
  body: {
    color: KueColors.ink2,
    fontSize: 14,
    lineHeight: 21,
    marginTop: 8,
  },
  strong: { color: KueColors.foreground, fontWeight: "600" },
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
  codeInput: {
    fontVariant: ["tabular-nums"],
    letterSpacing: 3,
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
  error: {
    color: KueColors.danger,
    fontSize: 12.5,
    lineHeight: 18,
    marginTop: 8,
  },
  submit: { marginTop: 14 },
  links: { flexDirection: "row", justifyContent: "center", marginTop: 16 },
  linkMuted: { color: KueColors.ink2, fontSize: 13 },
});
