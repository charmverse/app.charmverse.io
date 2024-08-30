import type { NewProductUpdateResponse } from './createProductUpdate';
import { DIVIDER } from './schema';

export function getCastMessage(data: NewProductUpdateResponse) {
  const lines = data.productUpdatesFrame.text
    .split(DIVIDER)
    .filter((line) => line.trim().length)
    .slice(0, 10);
  return `${data.project.name}\n${data.productUpdatesFrame.createdAtLocal}\n\n${lines
    .map((line) => `• ${line}`)
    .join('\n')}`;
}
