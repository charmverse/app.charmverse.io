import { Box } from '@mui/material';
import type { DateTime } from 'luxon';

import { usePages } from 'hooks/usePages';
import type { IPropertyTemplate, PropertyType } from 'lib/databases/board';
import type { Card } from 'lib/databases/card';

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
  const { pages } = usePages();
  const propertyValue = cards[0].fields.properties[propertyTemplate.id] || '';
  const rewardId = pages[cards[0]?.id]?.bountyId;

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
