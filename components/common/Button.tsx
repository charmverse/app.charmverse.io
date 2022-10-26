import styled from '@emotion/styled';
import { Tooltip } from '@mui/material';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import MuiLink from '@mui/material/Link';
import NextLink from 'next/link';
import type { ComponentProps, ElementType, MouseEventHandler } from 'react';
import { forwardRef } from 'react';

const StyledButton = styled(Button)`
  white-space: nowrap;
`;

export const StyledSpinner = styled(CircularProgress)`
  margin-left: 5px;
`;

type ButtonProps = ComponentProps<typeof Button>;
export type InputProps<C extends ElementType> = ButtonProps
  // Omit 'variant' because it gets overridden sometimes by component
  & Omit<ComponentProps<C>, 'variant'>
  & {
    component?: C;
    external?: boolean;
    loading?: boolean;
    loadingMessage?: string;
  };

export const PimpedButton = forwardRef<HTMLButtonElement, InputProps<ElementType>>((_props, ref) => {

  const { children, loading, loadingMessage, disabledTooltip, ...props } = _props;

  const buttonComponent = (
    <StyledButton ref={ref} disabled={loading} {...props}>
      {(loading && loadingMessage) ? loadingMessage : children}
      {loading && <StyledSpinner color='inherit' size={15} />}
    </StyledButton>
  );

  if (disabledTooltip) {
    return (
      <Tooltip title={props.disabled ? disabledTooltip : ''}>
        <span>
          {buttonComponent}
        </span>
      </Tooltip>
    );
  }
  return buttonComponent;
});

// make sure teh id prop is on the same element as onClick
const PimpedButtonWithNextLink = forwardRef<HTMLButtonElement, InputProps<ElementType>>((_props, ref) => {
  const { href, external, children, id, onClick, target, 'data-test': dataTest, ...props } = _props;
  if (href && !_props.disabled) {
    if (external) {
      return <PimpedButton ref={ref} href={href} id={id} onClick={onClick} target={target} {...props}>{children}</PimpedButton>;
    }
    // @ts-ignore
    const mouseOnClick = onClick as MouseEventHandler<HTMLAnchorElement>;
    return (
      <NextLink
        href={href}
        passHref
      >
        {/** use an anchor tag to catch the ref passed down by NextLink.
       *  see https://github.com/vercel/next.js/issues/7915 */}
        <MuiLink
          target={target}
          id={id}
          onClick={mouseOnClick}
          data-test={dataTest}
        >
          <PimpedButton {...props}>{children}</PimpedButton>
        </MuiLink>
      </NextLink>
    );
  }

  return <PimpedButton ref={ref} id={id} onClick={onClick} data-test={dataTest} {...props}>{children}</PimpedButton>;
});

export default PimpedButtonWithNextLink;
