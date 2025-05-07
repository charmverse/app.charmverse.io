import type { DatabaseObjectResponse, PageObjectResponse } from '@notionhq/client/build/src/api-endpoints';

import { convertToPlainText } from './convertToPlainText';

export function getPageTitleText(page: PageObjectResponse | DatabaseObjectResponse) {
  let title = '';
  // Database
  if (page.object === 'database') {
    title = convertToPlainText(page.title);
  } else if (page.parent.type === 'database_id') {
    // db cards
    title = convertToPlainText(
      (Object.values(page.properties).find((property) => property.type === 'title') as any).title
    );
  }
  // Regular page
  else {
    title = convertToPlainText((page.properties.title as any)[page.properties.title.type]);
  }

  return title;
}
