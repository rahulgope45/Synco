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
  z.strictObject({ ...base, type: z.literal('PING'), t0: time }),
  z.strictObject({ ...base, type: z.literal('PONG'), t0: time, t1: time, t2: time }),
  z.strictObject({ ...base, type: z.literal('PLAY_AT'), hostTime: time, positionMs: time }),
  z.strictObject({ ...base, type: z.literal('PAUSE'), hostTime: time }),
  z.strictObject({ ...base, type: z.literal('BYE') }),
]);
// Phase-0 subset only. WELCOME / CHUNK / STATE await the streaming framing decision.
export type Message = z.infer<typeof messageSchema>;
export type JoinPayload = z.infer<typeof joinPayloadSchema>;
export function decodeMessage(json: string): Message {
  if (json.length > 4096) throw new Error('Control message too large');
  return messageSchema.parse(JSON.parse(json));
}
