import { useTheme } from '@emotion/react';
import styled from '@emotion/styled';
import DeleteIcon from '@mui/icons-material/Delete';
import { ListItem } from '@mui/material';
import { ReactNode, useState } from 'react';

interface BlockAlignerProps {
  children: ReactNode
  onDelete: () => void
}

const StyledBlockAligner = styled.div<{ align?: string }>`
  display: flex;
  justify-content: ${props => props.align};
  &:hover .controls {
    opacity: 1;
    transition: opacity 250ms ease-in-out;
  }
`;

const Controls = styled.div`
  position: absolute;
  background: ${({ theme }) => theme.palette.background.light};
  border-radius: ${({ theme }) => theme.spacing(0.5)};
  padding: ${({ theme }) => theme.spacing(0.5)};
  display: flex;
  right: 0;
  top: 0;
  opacity: 0;
  transition: opacity 250ms ease-in-out;
`;

export default function BlockAligner (props: BlockAlignerProps) {
  const { children, onDelete } = props;
  const [align, setAlign] = useState('center');
  const theme = useTheme();

  return (
    <StyledBlockAligner
      align={align}
      draggable={false}
    >
      <div className='content' style={{ position: 'relative' }}>
        {children}
        <Controls className='controls'>
          <ListItem
            button
            disableRipple
            onClick={() => {
              onDelete();
            }}
            sx={{
              padding: theme.spacing(1),
              backgroundColor: 'inherit'
            }}
          >
            <DeleteIcon sx={{
              fontSize: 14
            }}
            />
          </ListItem>
        </Controls>
      </div>
    </StyledBlockAligner>
  );
}
