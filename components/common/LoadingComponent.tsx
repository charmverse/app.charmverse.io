
import styled from '@emotion/styled';
import CircularProgress from '@mui/material/CircularProgress';
import React from 'react';

export const LoadingIcon = styled(CircularProgress)`
  color: #ccc;
`;

type CSSValue = number | string;

export const LoadingCard = styled.div<{ height?: CSSValue, minHeight?: CSSValue }>`
  align-items: center;
  display: flex;
  justify-content: center;
  height: 100%;
  min-height: ${props => (props.minHeight) ? `${props.minHeight}px;` : 'inherit'};
  ${props => props.height && `min-height: ${props.height}`};
`;

interface LoadingProps {
  component?: JSX.Element;
  height?: CSSValue;
  label?: string;
  minHeight?: CSSValue;
  isLoading: boolean;
  size?: number;
  children?: React.ReactNode;
}

export default function LoadingComponent ({ height, isLoading, component, label, children, minHeight, size = 40 }: LoadingProps): JSX.Element {
  if (!isLoading) return component || <span>{children}</span>;
  return (
    <LoadingCard height={height} minHeight={minHeight}>
      <LoadingIcon style={{ height: size, width: size }} />
      {label ? <span style={{ color: '#aaa', paddingLeft: 8 }}>{label}</span> : null}
    </LoadingCard>
  );
}
