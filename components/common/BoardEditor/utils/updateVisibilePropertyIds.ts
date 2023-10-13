import type { IPropertyTemplate } from 'lib/focalboard/board';
import { isTruthy } from 'lib/utilities/types';

export function filterPropertyTemplates(visiblePropertyIds: string[], cardProperties: IPropertyTemplate[]) {
  return visiblePropertyIds.map((id) => cardProperties.find((t) => t.id === id)).filter(isTruthy);
}
