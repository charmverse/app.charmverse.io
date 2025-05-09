import { useTheme } from '@emotion/react';
import styled from '@emotion/styled';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import { ListItemButton, Tooltip } from '@mui/material';
import type { ReactNode, MouseEvent } from 'react';
import { memo, forwardRef } from 'react';

interface BlockAlignerProps {
  children: ReactNode;
  onDelete: () => void;
  onEdit?: () => void;
  readOnly?: boolean;
  onDragStart?: () => void;
  extraControls?: { showOnReadonly?: boolean; onClick?: VoidFunction; Icon: React.ElementType; tooltip?: string }[];
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
  display: flex;
  right: 0;
  top: 0;
  opacity: 0;
  transition: opacity 250ms ease-in-out;
`;

function BlockItemButton(control: { tooltip?: string; onClick?: VoidFunction; Icon: React.ElementType }) {
  const theme = useTheme();
  return (
    <Tooltip title={control.tooltip}>
      <ListItemButton
        onClick={control.onClick}
        sx={{
          padding: 1,
          backgroundColor: 'inherit',
          color: 'secondary'
        }}
      >
        <control.Icon sx={{ fontSize: 14, color: theme.palette.text.primary }} />
      </ListItemButton>
    </Tooltip>
  );
}

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

  if (readOnly && props.extraControls) {
    const extraControls = props.extraControls.filter((control) => control.showOnReadonly);
    if (!extraControls.length) {
      return null;
    }
    return (
      <StyledBlockAligner onDragStart={onDragStart} ref={ref}>
        {children}
        <Controls className='controls'>
          {extraControls.map((control, index) => (
            <BlockItemButton {...control} key={`${index.toString()}`} />
          ))}
        </Controls>
      </StyledBlockAligner>
    );
  }

  return (
    <StyledBlockAligner onDragStart={onDragStart} ref={ref}>
      {children}
      {!readOnly && (
        <Controls className='controls'>
          {props.extraControls?.map((control, index) => <BlockItemButton {...control} key={`${index.toString()}`} />)}
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
