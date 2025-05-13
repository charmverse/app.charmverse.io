import { Box } from '@mui/material';
import type { DateTime } from 'luxon';

import type { IPropertyTemplate, PropertyType } from '@packages/databases/board';
import type { Card } from '@packages/databases/card';

import { RewardsDueDatePicker } from '../../../properties/RewardsDueDatePicker';

import { PropertyMenu } from './PropertyMenu';

export function RewardsDueDatePropertyTemplateMenu({
  cards,
  propertyTemplate,
  onAccept,
  lastChild
}: {
  cards: Card[];
  propertyTemplate: IPropertyTemplate<PropertyType>;
  onAccept: (value: DateTime | null) => void;
  lastChild: boolean;
}) {
  const propertyValue = cards[0].fields.properties[propertyTemplate.id] || '';
  const rewardId = cards[0].bountyId;

  if (!rewardId) {
    return null;
  }

  return (
    <PropertyMenu lastChild={lastChild} propertyTemplate={propertyTemplate}>
      <Box display='flex' py='2px' px='4px'>
        <RewardsDueDatePicker value={propertyValue as string | number} onAccept={onAccept} />
      </Box>
    </PropertyMenu>
  );
}
