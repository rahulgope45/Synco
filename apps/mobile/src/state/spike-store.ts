import { create } from 'zustand';
import { SpikeSession, type SpikeSnapshot } from '../services/sync/spike-session';

type SpikeState = SpikeSnapshot & {
  busy: boolean; localClick: () => Promise<void>; connect: () => Promise<void>;
  disconnect: () => Promise<void>; stopAudio: () => void;
  shareMusic: () => Promise<void>;
  addresses: string[]; loadAddresses: () => void; host: (ip: string) => Promise<void>; join: (code: string) => Promise<void>; groupClick: () => Promise<void>;
};
let session: SpikeSession | undefined;
let generation = 0;
const initial: SpikeSnapshot = { connected: false, ready: false, rttMs: null, offsetMs: null, audio: 'Ready for local test', error: null, role: 'none', joinCode: null, guests: 0, readyGuests: 0 };
export const useSpikeStore = create<SpikeState>((set, get) => {
  const ensureSession = () => {
    if (!session) {
      const current = ++generation;
      session = new SpikeSession(patch => {
        if (current !== generation) return;
        if (patch.role === 'none') {
          const ended = session; session = undefined; generation++;
          set({ ...initial, ...patch, busy: false });
          void ended?.dispose().catch(() => {});
        } else set(patch);
      });
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
        set({ ...initial, busy: false, error: error instanceof Error ? error.message : 'Device test failed' });
        session = undefined; generation++;
        await current.dispose();
      }
    } finally { if (started === generation) set({ busy: false }); }
  };
  return {
    ...initial, busy: false, addresses: [],
    loadAddresses: () => {
      try { set({ addresses: SpikeSession.addresses(), error: null }); }
      catch { set({ error: 'Phone hosting needs the updated Android development build' }); }
    },
    host: async ip => {
      if (get().busy) return;
      await get().disconnect(); await run(current => current.hostSession(ip));
    },
    join: async code => {
      if (get().busy) return;
      await get().disconnect(); await run(current => current.connect(code));
    },
    groupClick: () => run(current => current.groupClick()),
    shareMusic: () => run(async current => { current.startMusicSharing(); }),
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
