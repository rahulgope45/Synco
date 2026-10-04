import { z } from 'zod';
export const PROTOCOL_VERSION = 1 as const;
const time = z.number().finite().nonnegative();
const base = { v: z.literal(PROTOCOL_VERSION) };
export const joinPayloadSchema = z.strictObject({
  ip: z.ipv4(), port: z.number().int().min(1).max(65535),
  token: z.string().min(16).max(256), protocolVersion: z.literal(PROTOCOL_VERSION),
});
export const messageSchema = z.discriminatedUnion('type', [
  z.strictObject({ ...base, type: z.literal('HELLO'), token: z.string().min(16).max(256), deviceName: z.string().min(1).max(80) }),
  z.strictObject({ ...base, type: z.literal('WELCOME'), sessionId: z.string().min(1).max(80), hostTime: time,
    trackMeta: z.strictObject({ title: z.string().max(200), durationMs: time }) }),
  // Phase-0 readiness acknowledgment; not an audio accuracy claim.
  z.strictObject({ ...base, type: z.literal('READY'), ready: z.boolean() }),
  z.strictObject({ ...base, type: z.literal('PING'), t0: time }),
  z.strictObject({ ...base, type: z.literal('PONG'), t0: time, t1: time, t2: time }),
  z.strictObject({ ...base, type: z.literal('PLAY_AT'), hostTime: time, positionMs: time }),
  z.strictObject({ ...base, type: z.literal('PAUSE'), hostTime: time }),
  z.strictObject({ ...base, type: z.literal('BYE') }),
  // Experimental live mode: 20 ms of 48 kHz mono signed PCM16 little-endian.
  // Exactly 1920 bytes => 2560 base64 characters. No clock alignment claim.
  z.strictObject({ ...base, type: z.literal('AUDIO_PCM'), seq: z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER),
    pcm: z.string().length(2560).regex(/^[A-Za-z0-9+/]+$/) }),
  z.strictObject({ ...base, type: z.literal('AUDIO_STOP') }),
]);
// Phase-0 subset only. CHUNK / STATE await the streaming framing decision.
export type Message = z.infer<typeof messageSchema>;
export type JoinPayload = z.infer<typeof joinPayloadSchema>;
export function decodeMessage(json: string): Message {
  if (json.length > 4096) throw new Error('Control message too large');
  return messageSchema.parse(JSON.parse(json));
}

export function encodeJoinCode(payload: JoinPayload): string {
  const value = joinPayloadSchema.parse(payload);
  return `synco://join?ip=${value.ip}&port=${value.port}&token=${encodeURIComponent(value.token)}&v=${value.protocolVersion}`;
}
export function decodeJoinCode(code: string): JoinPayload {
  if (code.length > 1024) throw new Error('Join code too long');
  const url = new URL(code.trim());
  if (url.protocol !== 'synco:' || url.hostname !== 'join') throw new Error('Invalid Synco join code');
  const value = joinPayloadSchema.parse({ ip: url.searchParams.get('ip'), port: Number(url.searchParams.get('port')),
    token: url.searchParams.get('token'), protocolVersion: Number(url.searchParams.get('v')) });
  const octets = value.ip.split('.').map(Number);
  if (!(octets[0] === 10 || (octets[0] === 192 && octets[1] === 168) || (octets[0] === 172 && octets[1]! >= 16 && octets[1]! <= 31))) {
    throw new Error('Join a phone on your local Wi-Fi/hotspot');
  }
  return value;
}
