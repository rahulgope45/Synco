import type { JoinPayload } from '@synco/protocol';
export interface SessionService {
  host(): Promise<JoinPayload>;
  join(payload: JoinPayload): Promise<void>;
  leave(): Promise<void>;
}
