import {create} from 'zustand';
import {persist} from 'zustand/middleware';
import {appStorage} from './storage';

export interface SessionUser {
  id: string;
  name: string;
  title: string;
  /** The member ID. */
  scope: string;
}

interface SessionState {
  user: SessionUser | null;
  /** Fingerprint sign-in turned on for a member on this phone (simulated in the prototype). */
  biometric: Record<string, boolean>;
  /** The sample member's PIN (changeable in the demo). */
  pin: string;
  signIn: (u: SessionUser) => void;
  signOut: () => void;
  setBiometric: (id: string, on: boolean) => void;
  setPin: (pin: string) => void;
}

export const useSession = create<SessionState>()(
  persist(
    set => ({
      user: null,
      biometric: {'PSM-2012-004512': true},
      pin: '123456',
      signIn: user => set({user}),
      signOut: () => set({user: null}),
      setBiometric: (id, on) => set(s => ({biometric: {...s.biometric, [id]: on}})),
      setPin: pin => set({pin}),
    }),
    {name: 'psaccess.session', version: 1, storage: appStorage},
  ),
);

/** The sample member used for the demo. PIN and one-time code are shown on screen as sample values. */
export const DEMO_MEMBER = {
  id: 'PSM-2012-004512',
  name: 'Rowena D. Bautista',
  title: 'PMSg · Philippine National Police',
  scope: 'PSM-2012-004512',
  mobile: '0917 482 1196',
};
export const SAMPLE_OTP = '482913';

export function demoUser(): SessionUser {
  const {mobile: _m, ...u} = DEMO_MEMBER;
  return u;
}
