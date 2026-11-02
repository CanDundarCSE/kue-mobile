import { useState } from "react";

import { ForgotPasswordSheet } from "@/features/landing/forgot-password-sheet";
import { LandingTour } from "@/features/landing/landing-tour";
import { RegisterSheet } from "@/features/landing/register-sheet";
import { SignInSheet } from "@/features/landing/sign-in-sheet";

/**
 * The public, signed-out experience. Sign-in and registration open as native
 * bottom sheets, so the landing stays visible behind them instead of becoming
 * a separate page.
 */
export function LandingExperience() {
  const [signInOpen, setSignInOpen] = useState(false);
  const [registerOpen, setRegisterOpen] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);

  return (
    <>
      <LandingTour
        onSignIn={() => setSignInOpen(true)}
        onRegister={() => setRegisterOpen(true)}
      />
      <SignInSheet
        visible={signInOpen}
        onClose={() => setSignInOpen(false)}
        onForgotPassword={() => {
          setSignInOpen(false);
          setForgotOpen(true);
        }}
      />
      <RegisterSheet visible={registerOpen} onClose={() => setRegisterOpen(false)} />
      <ForgotPasswordSheet
        visible={forgotOpen}
        onClose={() => setForgotOpen(false)}
        onSignIn={() => {
          setForgotOpen(false);
          setSignInOpen(true);
        }}
      />
    </>
  );
}
