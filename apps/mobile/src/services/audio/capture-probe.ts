import { requireNativeModule } from 'expo';
export type CaptureStatus = { running: boolean; message: string; peak: number; samples: number };
type ProbeModule = {
  start(stream: boolean): void; stop(): void; status(): CaptureStatus;
  playFrame(pcm: string): void; stopPlayback(): void;
  addListener(event: 'onPcm', listener: (frame: { seq: number; pcm: string }) => void): { remove(): void };
  addListener(event: 'onCaptureEnded', listener: () => void): { remove(): void };
};
export const captureProbe = {
  start: (stream = false) => requireNativeModule<ProbeModule>('CaptureProbe').start(stream),
  stop: () => requireNativeModule<ProbeModule>('CaptureProbe').stop(),
  status: () => requireNativeModule<ProbeModule>('CaptureProbe').status(),
  frames: (listener: (frame: { seq: number; pcm: string }) => void) => requireNativeModule<ProbeModule>('CaptureProbe').addListener('onPcm', listener),
  ended: (listener: () => void) => requireNativeModule<ProbeModule>('CaptureProbe').addListener('onCaptureEnded', listener),
  play: (pcm: string) => requireNativeModule<ProbeModule>('CaptureProbe').playFrame(pcm),
  stopPlayback: () => requireNativeModule<ProbeModule>('CaptureProbe').stopPlayback(),
};
