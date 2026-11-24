import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface SessionUser {
  portal: "member";
  id: string;
  name: string;
  title: string;
  /** The member ID. */
  scope: string;
}

interface SessionState {
  user: SessionUser | null;
  /** Fingerprint/face sign-in turned on for a member on this device (simulated). */
  biometric: Record<string, boolean>;
  /** The sample member's PIN (changeable in the demo). */
  pin: string;
  setPin: (pin: string) => void;
  signIn: (u: SessionUser) => void;
  signOut: () => void;
  setBiometric: (id: string, on: boolean) => void;
}

export const useSession = create<SessionState>()(
  persist(
    (set) => ({
      user: null,
      biometric: { "PSM-2012-004512": true },
      pin: "123456",
      setPin: (pin) => set({ pin }),
      signIn: (user) => set({ user }),
      signOut: () => set({ user: null }),
      setBiometric: (id, on) => set((s) => ({ biometric: { ...s.biometric, [id]: on } })),
    }),
    { name: "psaccess.session", version: 3, migrate: () => ({ user: null, biometric: { "PSM-2012-004512": true }, pin: "123456" }) as unknown as SessionState },
  ),
);

/** The sample member used for the demo. PIN and OTP are shown on screen as sample values. */
export const DEMO_MEMBER: SessionUser & { mobile: string; pin: string } = {
  portal: "member",
  id: "PSM-2012-004512",
  name: "Rowena D. Bautista",
  title: "PMSg · Philippine National Police",
  scope: "PSM-2012-004512",
  mobile: "0917 482 1196",
  pin: "123456",
};
