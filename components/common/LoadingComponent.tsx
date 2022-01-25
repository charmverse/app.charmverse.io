
import React from 'react';
import CircularProgress from '@mui/material/CircularProgress';
import styled from '@emotion/styled';

export const LoadingIcon = styled(CircularProgress)`
  color: #ccc;
`;

type CSSValue = number | string;

export const LoadingCard = styled.div<{ height?: CSSValue, minHeight?: CSSValue }>`
  align-items: center;
  display: flex;
  justify-content: center;
  height: 100%;
  min-height: ${props => (props.hasOwnProperty('minHeight') && props.minHeight) ? `min-height: ${props.minHeight}px;` : 'inherit'};
  ${props => props.height && `min-height: ${props.height}`};
`;

interface LoadingProps {
  component?: JSX.Element;
  height?: CSSValue;
  label?: string;
  minHeight?: CSSValue;
  isLoading: boolean;
  size?: number;
}

const LoadingComponent: React.FC<LoadingProps> = ({ height, isLoading, component, label, children, minHeight, size = 40 }) => {
  if (!isLoading) return component ? component : <>{children}</>;
  return <LoadingCard height={height} minHeight={minHeight}>
    <LoadingIcon style={{ height: size, width: size }} />
    {label ? <span style={{ color: '#aaa', paddingLeft: 8 }}>{label}</span> : null}
  </LoadingCard>;
};

export default LoadingComponent;
