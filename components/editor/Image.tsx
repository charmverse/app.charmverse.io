import { NodeViewProps } from '@bangle.dev/core';
import styled from '@emotion/styled';
import AlignHorizontalCenterIcon from '@mui/icons-material/AlignHorizontalCenter';
import AlignHorizontalLeftIcon from '@mui/icons-material/AlignHorizontalLeft';
import AlignHorizontalRightIcon from '@mui/icons-material/AlignHorizontalRight';
import { ListItem } from '@mui/material';
import { useState } from 'react';

const StyledImage = styled.div<{align?: string}>`
  display: flex;
  justify-content: ${props => props.align};
  &:hover .controls {
    display: flex;
  }
`;

const Controls = styled.div`
  display: none;
  position: absolute;
`;

export function Image ({ node }: NodeViewProps) {
  const [align, setAlign] = useState('center');

  return (
    <StyledImage align={align}>
      <Controls className='controls'>
        <ListItem
          button
          disableRipple
          onClick={() => {
            setAlign('start');
          }}
        >
          <AlignHorizontalLeftIcon fontSize='small' />
        </ListItem>
        <ListItem
          button
          disableRipple
          onClick={() => {
            setAlign('center');
          }}
        >
          <AlignHorizontalCenterIcon fontSize='small' />
        </ListItem>
        <ListItem
          button
          disableRipple
          onClick={() => {
            setAlign('end');
          }}
        >
          <AlignHorizontalRightIcon fontSize='small' />
        </ListItem>
      </Controls>
      { /* eslint-disable-next-line */}
      <img width={500} contentEditable={false} draggable src={node.attrs.src} alt={node.attrs.alt} />
    </StyledImage>
  );
}
