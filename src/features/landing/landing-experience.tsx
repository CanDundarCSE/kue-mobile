import { useState } from "react";

import { LandingScreen } from "@/features/landing/landing-screen";
import { SignInSheet } from "@/features/landing/sign-in-sheet";

/**
 * The public, signed-out experience. Sign-in opens as a native bottom sheet,
 * so the landing stays visible behind it instead of becoming a separate page.
 */
export function LandingExperience() {
  const [signInOpen, setSignInOpen] = useState(false);

  return (
    <>
      <LandingScreen onSignIn={() => setSignInOpen(true)} />
      <SignInSheet visible={signInOpen} onClose={() => setSignInOpen(false)} />
    </>
  );
}
