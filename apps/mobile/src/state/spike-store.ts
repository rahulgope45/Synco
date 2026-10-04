import { create } from 'zustand';
import { SpikeSession, type SpikeSnapshot } from '../services/sync/spike-session';

type SpikeState = SpikeSnapshot & {
  busy: boolean; localClick: () => Promise<void>; connect: () => Promise<void>;
  disconnect: () => Promise<void>; stopAudio: () => void;
};
let session: SpikeSession | undefined;
let generation = 0;
const initial: SpikeSnapshot = { connected: false, ready: false, rttMs: null, offsetMs: null, audio: 'Ready for local test', error: null };
export const useSpikeStore = create<SpikeState>((set, get) => {
  const ensureSession = () => {
    if (!session) {
      const current = ++generation;
      session = new SpikeSession(patch => { if (current === generation) set(patch); });
    }
    return session;
  };
  const run = async (action: (current: SpikeSession) => Promise<void>) => {
    if (get().busy) return;
    set({ busy: true, error: null });
    const current = ensureSession();
    const started = generation;
    try { await action(current); }
    catch (error) {
      if (started === generation) {
        set({ error: error instanceof Error ? error.message : 'Device test failed', connected: false, ready: false });
        session = undefined; generation++;
        await current.dispose();
      }
    } finally { set({ busy: false }); }
  };
  return {
    ...initial, busy: false,
    localClick: () => run(current => current.localClick()),
    connect: async () => {
      if (get().busy || get().connected) return;
      await get().disconnect();
      await run(current => current.connect());
    },
    disconnect: async () => {
      const current = session; session = undefined; generation++;
      set({ ...initial, busy: false });
      await current?.dispose();
    },
    stopAudio: () => session?.stopAudio(),
  };
});
