import styled from '@emotion/styled';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import NextLink from 'next/link';
import MuiLink from '@mui/material/Link';
import { ComponentProps, ElementType, forwardRef } from 'react';

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

  const { children, loading, loadingMessage, ...props } = _props;

  return (
    <StyledButton ref={ref} disabled={loading} {...props}>
      {(loading && loadingMessage) ? loadingMessage : children}
      {loading && <StyledSpinner color='inherit' size={15} />}
    </StyledButton>
  );
});

const PimpedButtonWithNextLink = forwardRef<HTMLButtonElement, InputProps<ElementType>>((_props, ref) => {
  const { href, external, children, target, ...props } = _props;
  if (href) {
    if (external) {
      return <PimpedButton ref={ref} href={href} {...props}>{children}</PimpedButton>;
    }
    return (
      <NextLink href={href} passHref>
        {/** use an anchor tag to catch the ref passed down by NextLink.
       *  see https://github.com/vercel/next.js/issues/7915 */}
        <MuiLink target={target}>
          <PimpedButton {...props}>{children}</PimpedButton>
        </MuiLink>
      </NextLink>
    );
  }

  return <PimpedButton ref={ref} {...props}>{children}</PimpedButton>;
});

export default PimpedButtonWithNextLink;
