import { create } from 'zustand';
import { captureProbe, type CaptureStatus } from '../services/audio/capture-probe';
import { useSpikeStore } from './spike-store';
type State = CaptureStatus & { start(): Promise<void>; stop(): void; refresh(): void };
export const useCaptureStore = create<State>(set => ({
  running: false, message: 'Test the installed ReVanced Music app', peak: 0, samples: 0,
  start: async () => {
    try { await useSpikeStore.getState().disconnect(); captureProbe.start(); set(captureProbe.status()); }
    catch (error) { set({ running: false, message: error instanceof Error ? error.message : 'Capture unavailable' }); }
  },
  stop: () => { try { captureProbe.stop(); } finally { set({ running: false, message: 'Capture stopped' }); } },
  refresh: () => { try { set(captureProbe.status()); } catch { /* Older builds can still run the click test. */ } },
}));
