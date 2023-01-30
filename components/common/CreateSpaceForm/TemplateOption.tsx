import styled from '@emotion/styled';

import Button from 'components/common/Button';
import type { SpaceCreateTemplate } from 'lib/spaces/utils';
import { spaceCreateTemplates } from 'lib/spaces/utils';

const ButtonContent = styled.div`
  display: block;
  text-align: center;
  width: 100%;
`;

type TemplateOptionProps = {
  option: SpaceCreateTemplate;
  currentSelection: SpaceCreateTemplate;
  onSelect: (option: SpaceCreateTemplate) => void;
};

export function TemplateOption({ option, onSelect, currentSelection }: TemplateOptionProps) {
  const isSelected = option === currentSelection;

  return (
    <Button
      data-test={`space-template-${option}`}
      onClick={() => onSelect(option)}
      color={isSelected ? 'primary' : 'secondary'}
      variant='outlined'
      sx={{
        width: '100%',
        justifyContent: 'space-between',
        display: 'flex'
      }}
      fullWidth
      size='large'
    >
      <ButtonContent>{spaceCreateTemplates[option]}</ButtonContent>
    </Button>
  );
}
