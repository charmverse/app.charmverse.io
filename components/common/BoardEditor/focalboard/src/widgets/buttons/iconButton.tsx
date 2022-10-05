import React from 'react';

type Props = {
    onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
    title?: string;
    icon?: React.ReactNode;
    className?: string;
    onMouseDown?: (e: React.MouseEvent<HTMLButtonElement>) => void;
    style?: React.CSSProperties;
}

function IconButton (props: Props): JSX.Element {
  let className = 'Button IconButton';
  if (props.className) {
    className += ` ${props.className}`;
  }
  return (
    <button
      type='button'
      onClick={props.onClick}
      onMouseDown={props.onMouseDown}
      className={className}
      title={props.title}
      aria-label={props.title}
      style={props.style}
    >
      {props.icon}
    </button>
  );
}

export default React.memo(IconButton);
