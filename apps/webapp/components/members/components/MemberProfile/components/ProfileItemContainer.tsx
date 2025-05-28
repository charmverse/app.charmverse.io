import { styled } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { Box } from '@mui/material';

export const ProfileItemContainer = styled(Box)`
  position: relative;

  &:hover .icons {
    opacity: 1;
    transition: opacity 150ms ease-in-out;
  }

  & .icons {
    position: absolute;
    opacity: 0;
    z-index: 1;
    right: -10px;
    top: -5px;
    cursor: pointer;
    transition: opacity 150ms ease-in-out;
  }
`;

const NonPinnedBox = styled(Box)`
  width: 54px;
  height: 54px;
  display: flex;
  justify-content: center;
  align-items: center;
  ${({ theme }) => `border: 2px solid ${theme.palette.secondary.dark}`};
  cursor: pointer;
`;

export function NonPinnedItem({ onClick }: { onClick: VoidFunction }) {
  return (
    <NonPinnedBox onClick={onClick}>
      <AddIcon color='secondary' />
    </NonPinnedBox>
  );
}
