'use client';

import styled from '@emotion/styled';
import { Tooltip } from '@mui/material';
import MaterialButton from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import MuiLink from '@mui/material/Link';
import NextLink from 'next/link';
import type { ComponentProps, ElementType, MouseEventHandler } from 'react';
import { forwardRef, useEffect, useRef, useState } from 'react';

import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { getSubdomainPath } from '@packages/lib/utils/browser';

const StyledButton = styled(MaterialButton)`
  white-space: nowrap;
`;

export const StyledSpinner = styled(CircularProgress)`
  margin-left: 5px;
`;

type ButtonProps = ComponentProps<typeof MaterialButton>;
export type InputProps<C extends ElementType = ElementType> = ButtonProps &
  // Omit 'variant' because it gets overridden sometimes by component
  Omit<ComponentProps<C>, 'variant'> & {
    component?: C;
    external?: boolean;
    loading?: boolean;
    loadingMessage?: string;
  };

export const CharmedButton = forwardRef<HTMLButtonElement, InputProps<ElementType>>((_props, ref) => {
  const { children, loading, loadingMessage, disabledTooltip, disabled, ...props } = _props;

  // add a small delay so we dont show and hide loading immediately
  const [delayedLoading, setDelayedLoading] = useState(false);
  const loadingTimeout = useRef<NodeJS.Timeout | undefined>();

  useEffect(() => {
    clearTimeout(loadingTimeout.current);
    if (loading) {
      loadingTimeout.current = setTimeout(() => {
        setDelayedLoading(true);
      }, 300);
    } else {
      setDelayedLoading(false);
    }
    return () => clearTimeout(loadingTimeout.current);
  }, [loading, setDelayedLoading]);

  if (delayedLoading && props?.endIcon) {
    props.endIcon = <StyledSpinner color='inherit' size={15} />;
  }
  if (delayedLoading && props?.startIcon) {
    props.startIcon = <StyledSpinner color='inherit' size={15} />;
  }

  const buttonComponent = (
    <StyledButton ref={ref} {...props} disabled={delayedLoading || disabled}>
      {delayedLoading && loadingMessage ? loadingMessage : children}
      {delayedLoading && !props.endIcon && !props.startIcon && <StyledSpinner color='inherit' size={15} />}
    </StyledButton>
  );
  if (disabledTooltip) {
    // wrap the tooltip in a span so we can add support for line breaks in the tooltip
    return (
      <Tooltip title={disabled ? <div style={{ whiteSpace: 'pre-line' }}>{disabledTooltip}</div> : ''} enterDelay={100}>
        <span>{buttonComponent}</span>
      </Tooltip>
    );
  }
  return buttonComponent;
});

// make sure teh id prop is on the same element as onClick
export const Button = forwardRef<HTMLButtonElement, InputProps<ElementType>>((_props, ref) => {
  const { space: currentSpace } = useCurrentSpace();

  const { href, external, children, id, onClick, target, 'data-test': dataTest, ...props } = _props;
  if (href && !_props.disabled) {
    if (external) {
      return (
        <CharmedButton ref={ref} href={href} id={id} onClick={onClick} target={target} {...props}>
          {children}
        </CharmedButton>
      );
    }
    // @ts-ignore
    const mouseOnClick = onClick as MouseEventHandler<HTMLAnchorElement>;
    return (
      <MuiLink
        component={NextLink}
        color={props.color === 'inherit' ? 'inherit !important' : undefined}
        href={getSubdomainPath(href, currentSpace ?? undefined)}
        target={target}
        id={id}
        onClick={mouseOnClick}
        data-test={dataTest}
      >
        <CharmedButton {...props}>{children}</CharmedButton>
      </MuiLink>
    );
  }

  return (
    <CharmedButton ref={ref} id={id} onClick={onClick} data-test={dataTest} {...props}>
      {children}
    </CharmedButton>
  );
});
