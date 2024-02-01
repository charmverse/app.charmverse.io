import styled from '@emotion/styled';
import React from 'react';

type Props = {
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  title?: string;
  icon?: React.ReactNode;
  className?: string;
  onMouseDown?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  style?: React.CSSProperties;
};

const StyledButton = styled.button`
  &:hover {
    background: var(--button-text-hover);
  }
`;

function IconButton(props: Props): JSX.Element {
  let className = 'Button IconButton';
  if (props.className) {
    className += ` ${props.className}`;
  }
  return (
    <StyledButton
      type='button'
      onClick={props.onClick}
      onMouseDown={props.onMouseDown}
      className={className}
      title={props.title}
      aria-label={props.title}
      style={props.style}
    >
      {props.icon}
    </StyledButton>
  );
}

export default React.memo(IconButton);
