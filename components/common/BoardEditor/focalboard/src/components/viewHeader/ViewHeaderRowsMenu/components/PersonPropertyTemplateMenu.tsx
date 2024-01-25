import { Box } from '@mui/material';

import type { UserSelectProps } from 'components/common/BoardEditor/components/properties/UserSelect';
import { UserSelect } from 'components/common/BoardEditor/components/properties/UserSelect';
import type { IPropertyTemplate, PropertyType } from 'lib/focalboard/board';
import type { Card } from 'lib/focalboard/card';

import { PropertyMenu } from './PropertyMenu';

export function PersonPropertyTemplateMenu({
  cards,
  propertyTemplate,
  onChange,
  lastChild
}: {
  cards: Card[];
  propertyTemplate: IPropertyTemplate<PropertyType>;
  onChange: (userIds: string[]) => void;
  lastChild: boolean;
}) {
  const propertyValue = cards[0].fields.properties[propertyTemplate.id];

  const userSelectProps: UserSelectProps = {
    memberIds: typeof propertyValue === 'string' ? [propertyValue] : (propertyValue as string[]) ?? [],
    onChange,
    displayType: 'table',
    showEmptyPlaceholder: true
  };

  return (
    <PropertyMenu lastChild={lastChild} propertyTemplate={propertyTemplate}>
      {({ isPropertyOpen }) => (
        <Box display='flex' py='2px' px='4px'>
          {isPropertyOpen ? <UserSelect defaultOpened {...userSelectProps} /> : <UserSelect {...userSelectProps} />}
        </Box>
      )}
    </PropertyMenu>
  );
}
