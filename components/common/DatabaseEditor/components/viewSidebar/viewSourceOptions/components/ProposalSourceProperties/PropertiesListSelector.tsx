import styled from '@emotion/styled';
import { Checkbox, Stack, Typography } from '@mui/material';

const StyledStack = styled(Stack)`
  cursor: pointer;
  align-items: center;
  flex-direction: row;
  width: fit-content;
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
