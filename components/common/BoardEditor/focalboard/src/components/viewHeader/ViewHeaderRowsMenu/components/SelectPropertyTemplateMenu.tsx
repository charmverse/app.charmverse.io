import Box from '@mui/material/Box';

import type { TagSelectProps } from 'components/common/BoardEditor/components/properties/TagSelect/TagSelect';
import { TagSelect } from 'components/common/BoardEditor/components/properties/TagSelect/TagSelect';
import type { Board, IPropertyTemplate, PropertyType } from 'lib/databases/board';
import type { Card } from 'lib/databases/card';

import mutator from '../../../../mutator';

import { PropertyMenu } from './PropertyMenu';

export function SelectPropertyTemplateMenu({
  board,
  cards,
  propertyTemplate,
  onChange,
  lastChild
}: {
  board: Board;
  cards: Card[];
  propertyTemplate: IPropertyTemplate<PropertyType>;
  onChange?: VoidFunction;
  lastChild: boolean;
}) {
  const propertyValue = cards[0].fields.properties[propertyTemplate.id];

  const tagSelectProps: TagSelectProps = {
    canEditOptions: true,
    multiselect: propertyTemplate.type === 'multiSelect',
    propertyValue: propertyValue as string,
    options: propertyTemplate.options,
    onChange: async (newValue) => {
      await mutator.changePropertyValues(cards, propertyTemplate.id, newValue);
      onChange?.();
    },
    onUpdateOption: (option) => {
      mutator.changePropertyOption(board, propertyTemplate, option);
    },
    onDeleteOption: (option) => {
      mutator.deletePropertyOption(board, propertyTemplate, option);
    },
    onCreateOption: (newValue) => {
      mutator.insertPropertyOption(board, propertyTemplate, newValue, 'add property option');
    },
    displayType: 'table'
  };

  return (
    <PropertyMenu lastChild={lastChild} propertyTemplate={propertyTemplate}>
      <Box display='flex' py='2px' px='4px' minHeight={25} minWidth={100}>
        <TagSelect {...tagSelectProps} showEmpty />
      </Box>
    </PropertyMenu>
  );
}
