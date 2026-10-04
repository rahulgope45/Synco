import { create } from 'zustand';
export type SessionStatus = 'Disconnected' | 'Connected' | 'Syncing' | 'Drifting';
type SessionState = { status: SessionStatus; setStatus: (status: SessionStatus) => void };
// Future actions orchestrate services; never expose audio chunks through UI state.
export const useSessionStore = create<SessionState>(set => ({
  status: 'Disconnected', setStatus: status => set({ status }),
}));
