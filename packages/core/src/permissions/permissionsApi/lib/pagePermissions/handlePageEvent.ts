import { InvalidInputError } from '@packages/core/errors';
import type { PageEventTriggeringPermissions } from '@packages/core/permissions';

import { handlePageCreated } from './handlePageCreated';
import { handlePageRepositioned } from './handlePageRespositioned';

export async function handlePageEvent({ event, pageId }: PageEventTriggeringPermissions): Promise<void> {
  if (event === 'created') {
    await handlePageCreated(pageId);
  } else if (event === 'repositioned') {
    await handlePageRepositioned({ pageId });
  } else {
    throw new InvalidInputError(`Invalid page lifecycle event: ${event}`);
  }
}
