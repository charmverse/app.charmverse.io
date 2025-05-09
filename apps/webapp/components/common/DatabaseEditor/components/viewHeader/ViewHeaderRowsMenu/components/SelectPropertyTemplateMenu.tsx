import Box from '@mui/material/Box';

import type { Board, IPropertyTemplate, PropertyType } from '@packages/databases/board';
import type { Card } from '@packages/databases/card';

import mutator from '../../../../mutator';
import { TagSelect } from '../../../properties/TagSelect/TagSelect';
import type { TagSelectProps } from '../../../properties/TagSelect/TagSelect';

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
