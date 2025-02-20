import type { PageType } from '@charmverse/core/prisma';
import { stringToValidPath } from '@packages/utils/strings';

export function getPagePath() {
  return `page-${Math.random().toString().replace('0.', '')}`;
}

export function generatePagePathFromPathAndTitle({
  existingPagePath,
  title
}: {
  existingPagePath?: string;
  title: string;
}) {
  const split = (existingPagePath || '').split('-');
  let suffix = split[split.length - 1]?.trim();

  if (!suffix || !suffix.match(/^\d{8,}$/)) {
    suffix = Math.random().toString().replace('0.', '');
  }
  const titleToPath = stringToValidPath({ input: title ?? '', wordSeparator: '-', autoReplaceEmpty: false });

  return `${titleToPath}-${suffix}`;
}

export function canReceiveManualPermissionUpdates({ pageType }: { pageType: PageType }): boolean {
  if (pageType === 'card_template' || pageType === 'proposal') {
    return false;
  }
  return true;
}
