import { useTheme } from '@emotion/react';
import styled from '@emotion/styled';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import { ListItemButton } from '@mui/material';
import type { ReactNode, MouseEvent } from 'react';
import { memo, forwardRef } from 'react';

interface BlockAlignerProps {
  children: ReactNode;
  onDelete: () => void;
  onEdit?: () => void;
  readOnly?: boolean;
  onDragStart?: () => void;
}

const StyledBlockAligner = styled.div`
  line-height: 0; // hide margin that appears underneath iframe
  position: relative;
  max-width: 100%;
  text-align: center;
  padding: ${({ theme }) => theme.spacing(0.5, 0)}; // add some vertical spacing around block elements
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
  const { children, onDelete, onEdit, readOnly, onDragStart } = props;
  const theme = useTheme();

  function handleEdit(e: MouseEvent) {
    e.stopPropagation();
    onEdit?.();
  }

  function handleDelete(e: MouseEvent) {
    e.stopPropagation();
    onDelete();
  }

  return (
    <StyledBlockAligner onDragStart={onDragStart} ref={ref}>
      {children}
      {!readOnly && (
        <Controls className='controls'>
          {onEdit && (
            <ListItemButton
              onClick={handleEdit}
              sx={{
                padding: 1,
                backgroundColor: 'inherit',
                color: 'secondary'
              }}
            >
              <EditOutlinedIcon sx={{ fontSize: 14, color: theme.palette.text.primary }} />
            </ListItemButton>
          )}
          <ListItemButton
            onClick={handleDelete}
            sx={{
              padding: 1,
              backgroundColor: 'inherit',
              color: 'secondary'
            }}
          >
            <DeleteOutlinedIcon sx={{ fontSize: 14, color: theme.palette.text.primary }} />
          </ListItemButton>
        </Controls>
      )}
    </StyledBlockAligner>
  );
});

export default memo(BlockAligner);
