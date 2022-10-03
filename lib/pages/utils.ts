import type { PageType } from '@prisma/client';

export function getPagePath () {
  return `page-${Math.random().toString().replace('0.', '')}`;
}

export function canReceiveManualPermissionUpdates ({ pageType }: { pageType: PageType }): boolean {
  if (pageType === 'card_template' || pageType === 'proposal') {
    return false;
  }
  return true;
}

