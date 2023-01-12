import type { IPropertyTemplate } from 'lib/focalboard/board';
import { isTruthy } from 'lib/utilities/types';

import { Constants } from '../focalboard/src/constants';

export function filterPropertyTemplates(visiblePropertyIds: string[], cardProperties: IPropertyTemplate[]) {
  const titleProperty: IPropertyTemplate = { id: Constants.titleColumnId, name: 'Title', type: 'text', options: [] };
  const titleCardProperty = cardProperties.find((cardProperty) => cardProperty.id === Constants.titleColumnId);
  if (!visiblePropertyIds.includes(Constants.titleColumnId)) {
    visiblePropertyIds = [Constants.titleColumnId, ...visiblePropertyIds];
  }
  return visiblePropertyIds
    .map((id) =>
      id === Constants.titleColumnId ? titleCardProperty || titleProperty : cardProperties.find((t) => t.id === id)
    )
    .filter(isTruthy);
}
