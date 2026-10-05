import { requireNativeModule } from 'expo';
export type CaptureStatus = { running: boolean; message: string; peak: number; samples: number };
type ProbeModule = {
  start(stream: boolean): void; stop(): void; status(): CaptureStatus;
  addListener(event: 'onCaptureEnded', listener: () => void): { remove(): void };
};
export const captureProbe = {
  start: (stream = false) => requireNativeModule<ProbeModule>('CaptureProbe').start(stream),
  stop: () => requireNativeModule<ProbeModule>('CaptureProbe').stop(),
  status: () => requireNativeModule<ProbeModule>('CaptureProbe').status(),
  ended: (listener: () => void) => requireNativeModule<ProbeModule>('CaptureProbe').addListener('onCaptureEnded', listener),
};
