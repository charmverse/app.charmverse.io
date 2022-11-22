import type { SuperApiToken } from '@prisma/client';

declare module 'http' {
  interface IncomingMessage {
    authorizedSpaceId: string;
    superApiToken: SuperApiToken | null;
    botUser: User;
  }
}
