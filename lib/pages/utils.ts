import type { PageType } from '@charmverse/core/dist/prisma';

export function getPagePath() {
  return `page-${Math.random().toString().replace('0.', '')}`;
}

export function canReceiveManualPermissionUpdates({ pageType }: { pageType: PageType }): boolean {
  if (pageType === 'card_template' || pageType === 'proposal') {
    return false;
  }
  return true;
}
