import type { SendTestEmailPayload } from 'pages/api/email/send-test';

import { usePOST } from './helpers';

export function useSendTestEmail() {
  return usePOST<SendTestEmailPayload>('/api/email/send-test');
}
