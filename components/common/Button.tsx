import styled from '@emotion/styled';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import NextLink from 'next/link';
import MuiLink from '@mui/material/Link';
import { ComponentProps, ElementType } from 'react';

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

function PimpedButtonWithNextLink<C extends ElementType>
({ href, external, children, target, ...props }: InputProps<C>) {
  if (href) {
    if (external) {
      return <PimpedButton href={href} {...props}>{children}</PimpedButton>;
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

  return <PimpedButton {...props}>{children}</PimpedButton>;
}

export function PimpedButton<C extends ElementType> (props: InputProps<C>) {
  const { children, loading, loadingMessage, ...rest } = props;
  return (
    <StyledButton disabled={loading} {...rest}>
      {(loading && loadingMessage) ? loadingMessage : children}
      {loading && <StyledSpinner color='inherit' size={15} />}
    </StyledButton>
  );
}

export default PimpedButtonWithNextLink;
