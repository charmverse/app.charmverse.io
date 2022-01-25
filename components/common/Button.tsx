import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import NextLink from 'next/link';
import Link from '@mui/material/Link';
import styled from '@emotion/styled';

const StyledButton = styled(Button)`
  white-space: nowrap;
  &.Mui-disabled {
    color: rgba(255, 255, 255, 0.5);
  }
`;

export const StyledSpinner = styled(CircularProgress)`
  margin-left: 5px;
`;

type ButtonProps = React.ComponentProps<typeof Button>;
export type InputProps<C extends React.ElementType> = ButtonProps
  // Omit 'variant' because it gets overridden sometimes by component
  & Omit<React.ComponentProps<C>, 'variant'>
  & {
    component?: C;
    external?: boolean;
    loading?: boolean;
    loadingMessage?: string;
  };


function PimpedButtonWithNextLink<C extends React.ElementType> ({ href, external, children, target, ...props }: InputProps<C>) {
  return (
    href
      ? (external
        ? <PimpedButton href={href} {...props}>{children}</PimpedButton>
        : <NextLink href={href} passHref>
            {/** use an anchor tag to catch the ref passed down by NextLink. see https://github.com/vercel/next.js/issues/7915 */}
            <a target={target}>
              <PimpedButton {...props}>{children}</PimpedButton>
            </a>
          </NextLink>
      )
      : <PimpedButton {...props}>{children}</PimpedButton>
  );
};

export function PimpedButton<C extends React.ElementType> (props: InputProps<C>)  {
  const { children, loading, loadingMessage, ...rest } = props;
  return (
    <StyledButton disabled={loading} {...rest}>
      {(loading && loadingMessage) ? loadingMessage : children}
      {loading && <StyledSpinner color='inherit' size={15} />}
    </StyledButton>
  );
}

export default PimpedButtonWithNextLink;