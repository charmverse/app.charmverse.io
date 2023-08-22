import styled from '@emotion/styled';
import { Tooltip } from '@mui/material';
import MaterialButton from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import MuiLink from '@mui/material/Link';
import NextLink from 'next/link';
import type { ComponentProps, ElementType, MouseEventHandler } from 'react';
import { forwardRef } from 'react';

import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { getSubdomainPath } from 'lib/utilities/browser';

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

  const buttonComponent = (
    <StyledButton ref={ref} {...props} disabled={loading || disabled}>
      {loading && loadingMessage ? loadingMessage : children}
      {loading && <StyledSpinner color='inherit' size={15} />}
    </StyledButton>
  );
  if (disabledTooltip) {
    return (
      <Tooltip title={disabled ? disabledTooltip : ''}>
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
