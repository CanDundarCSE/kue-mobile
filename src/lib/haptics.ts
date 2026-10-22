import { requireOptionalNativeModule } from "expo";
import * as Haptics from "expo-haptics";

/**
 * Expo Go builds do not always link the native haptics module on Android. When
 * it is missing, calling the JS wrapper rejects with an `UnavailabilityError`
 * that surfaces as an uncaught promise in LogBox. Probe the module once and
 * skip the call entirely when the method is not there.
 */
type ExpoHapticsModule = {
  selectionAsync?: (...args: never[]) => Promise<void>;
  impactAsync?: (...args: never[]) => Promise<void>;
};

const nativeHaptics = requireOptionalNativeModule<ExpoHapticsModule>("ExpoHaptics");

function supports(method: keyof ExpoHapticsModule) {
  return typeof nativeHaptics?.[method] === "function";
}

function run(result: Promise<void>) {
  // Even when the module is linked, feedback is best-effort.
  result.catch(() => {});
}

export function selectionHaptic() {
  if (!supports("selectionAsync")) return;

  try {
    run(Haptics.selectionAsync());
  } catch {
    // Native module disappeared between the probe and the call.
  }
}

export function lightHaptic() {
  if (!supports("impactAsync")) return;

  try {
    run(Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light));
  } catch {
    // Native module disappeared between the probe and the call.
  }
}
