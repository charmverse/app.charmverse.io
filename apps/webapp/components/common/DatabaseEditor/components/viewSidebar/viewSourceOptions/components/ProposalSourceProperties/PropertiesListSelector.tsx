import { styled } from '@mui/material';
import { Checkbox, Stack, Typography } from '@mui/material';

const StyledStack = styled(Stack)`
  cursor: pointer;
  align-items: flex-start;
  flex-direction: row;
  width: fit-content;

  & .MuiCheckbox-root {
    padding-top: 2px;
  }
`;

export function PropertySelector({
  onClick,
  isChecked,
  label,
  bold
}: {
  isChecked: boolean;
  onClick: () => void;
  label: string;
  bold?: boolean;
}) {
  return (
    <StyledStack onClick={onClick}>
      <Checkbox size='small' checked={isChecked} />
      <Typography fontWeight={bold ? 'bold' : undefined}>{label}</Typography>
    </StyledStack>
  );
}
