import styled from '@emotion/styled';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import { ListItemButton } from '@mui/material';
import type { ReactNode, MouseEvent } from 'react';
import { memo, forwardRef } from 'react';

interface BlockAlignerProps {
  children: ReactNode;
  onDelete: () => void;
}

const StyledBlockAligner = styled.div`
  line-height: 0; // hide margin that appears underneath iframe
  position: relative;
  max-width: 100%;
  text-align: center;
  // disable hover UX on ios which converts first click to a hover event
  @media (pointer: fine) {
    &:hover .controls {
      opacity: 1;
      transition: opacity 250ms ease-in-out;
    }
  }
`;

const Controls = styled.div`
  position: absolute;
  background: ${({ theme }) => theme.palette.background.light};
  border-radius: ${({ theme }) => theme.spacing(0.5)};
  display: flex;
  right: 0;
  top: 0;
  opacity: 0;
  transition: opacity 250ms ease-in-out;
`;

const BlockAligner = forwardRef<HTMLDivElement, BlockAlignerProps>((props, ref) => {
  const { children, onDelete } = props;

  function handleDelete(e: MouseEvent) {
    onDelete();
    e.stopPropagation();
  }

  return (
    <StyledBlockAligner draggable={false}>
      {children}
      <Controls className='controls'>
        <ListItemButton
          onClick={handleDelete}
          sx={{
            padding: 1,
            backgroundColor: 'inherit'
          }}
        >
          <DeleteOutlinedIcon sx={{ fontSize: 14 }} />
        </ListItemButton>
      </Controls>
    </StyledBlockAligner>
  );
});

export default memo(BlockAligner);
