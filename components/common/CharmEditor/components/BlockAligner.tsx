import styled from '@emotion/styled';
import DeleteIcon from '@mui/icons-material/Delete';
import { ListItem } from '@mui/material';
import type { ReactNode } from 'react';
import { memo, forwardRef } from 'react';

interface BlockAlignerProps {
  children: ReactNode;
  onDelete: () => void;
}

const StyledBlockAligner = styled.div`
  position: relative;
  max-width: 100%;
  text-align: center;
  &:hover .controls {
    opacity: 1;
    transition: opacity 250ms ease-in-out;
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
  return (
    <StyledBlockAligner
      draggable={false}
    >
      {children}
      <Controls className='controls'>
        <ListItem
          button
          disableRipple
          onClick={() => {
            onDelete();
          }}
          sx={{
            padding: 1,
            backgroundColor: 'inherit'
          }}
        >
          <DeleteIcon sx={{ fontSize: 14 }} />
        </ListItem>
      </Controls>
    </StyledBlockAligner>
  );
});

export default memo(BlockAligner);
