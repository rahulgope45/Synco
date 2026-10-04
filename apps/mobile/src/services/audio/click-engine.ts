import { AudioContext, type AudioBufferSourceNode } from 'react-native-audio-api';

/** Phase-0 generated click track; not the file/streaming adapter. */
export class ClickEngine {
  private context?: AudioContext;
  private source?: AudioBufferSourceNode;
  async prepare(): Promise<void> {
    this.context ??= new AudioContext();
    if (this.context.state !== 'running') await this.context.resume();
  }
  schedule(localTimeMs: number, onEnded: () => void): { leadMs: number; audioTime: number } {
    const context = this.context;
    if (!context || context.state !== 'running') throw new Error('Prepare the audio engine first');
    this.stop();
    // Eight quiet 15 ms pulses, one each second, generated identically on every phone.
    const buffer = context.createBuffer(1, context.sampleRate * 8, context.sampleRate);
    const samples = buffer.getChannelData(0);
    const pulseLength = Math.floor(context.sampleRate * 0.015);
    for (let beat = 0; beat < 8; beat++) {
      for (let i = 0; i < pulseLength; i++) {
        samples[beat * context.sampleRate + i] = 0.15 * Math.sin(2 * Math.PI * 1000 * i / context.sampleRate) * (1 - i / pulseLength);
      }
    }
    // Read both clocks together after buffer preparation. Audio clock runs in seconds.
    // This mapping is an estimate; output latency still needs acoustic measurement.
    const before = performance.now();
    const audioNow = context.currentTime;
    const after = performance.now();
    const leadMs = localTimeMs - (before + after) / 2;
    if (leadMs < 100 || after - before > 10) throw new Error('Start arrived late or clock mapping was interrupted; retry');
    const source = context.createBufferSource();
    source.buffer = buffer;
    source.connect(context.destination);
    source.onEnded = () => {
      source.disconnect();
      if (this.source === source) { this.source = undefined; onEnded(); }
    };
    const audioTime = audioNow + leadMs / 1000;
    source.start(audioTime);
    this.source = source;
    return { leadMs, audioTime };
  }
  stop(): void {
    if (!this.source) return;
    const source = this.source;
    this.source = undefined;
    source.onEnded = null;
    source.stop(); source.disconnect();
  }
  async dispose(): Promise<void> {
    this.stop();
    const context = this.context; this.context = undefined;
    await context?.close();
  }
}
