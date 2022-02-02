import { NodeViewProps } from '@bangle.dev/core';
import { useTheme } from '@emotion/react';
import styled from '@emotion/styled';
import AlignHorizontalCenterIcon from '@mui/icons-material/AlignHorizontalCenter';
import AlignHorizontalLeftIcon from '@mui/icons-material/AlignHorizontalLeft';
import AlignHorizontalRightIcon from '@mui/icons-material/AlignHorizontalRight';
import { ListItem } from '@mui/material';
import { useState } from 'react';

const StyledImage = styled.div<{ align?: string }>`
  display: flex;
  justify-content: ${props => props.align};
`;

const Controls = styled.div`
  position: absolute;
  background: ${({ theme }) => theme.palette.background.light};
  border-radius: ${({ theme }) => theme.spacing(0.5)};
`;

export function Image ({ node }: NodeViewProps) {
  const [align, setAlign] = useState('center');
  const theme = useTheme();

  return (
    <StyledImage align={align}>
      <div className='content'>
        <Controls>
          {[
            [
              'start', <AlignHorizontalLeftIcon fontSize='small' />
            ], [
              'center', <AlignHorizontalCenterIcon fontSize='small' />
            ], [
              'end', <AlignHorizontalRightIcon fontSize='small' />
            ]
          ].map(([alignLabel, alignIcon]) => (
            <ListItem
              key={alignLabel as string}
              sx={{
                padding: theme.spacing(1),
                borderRadius: theme.spacing(0.5),
                backgroundColor: align === alignLabel ? theme.palette.background.dark : 'inherit'
              }}
              button
              disableRipple
              onClick={() => {
                setAlign(alignLabel as string);
              }}
            >
              {alignIcon}
            </ListItem>
          ))}
        </Controls>
        { /* eslint-disable-next-line */}
        <img width={500} contentEditable={false} draggable src={node.attrs.src} alt={node.attrs.alt} />

      </div>
    </StyledImage>
  );
}
