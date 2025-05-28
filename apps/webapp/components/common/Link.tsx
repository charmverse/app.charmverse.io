import { styled } from '@mui/material';
import type { LinkProps } from '@mui/material';
import Box from '@mui/material/Box';
import MuiLink from '@mui/material/Link';
import { getSubdomainPath } from '@packages/lib/utils/browser';
import { isExternalUrl } from '@packages/lib/utils/isExternalUrl';
import NextLink from 'next/link';
import type { MouseEvent, MouseEventHandler } from 'react';

import { usePageDialog } from 'components/common/PageDialog/hooks/usePageDialog';
import { useCurrentSpace } from 'hooks/useCurrentSpace';

const hoverStyle: { [key: string]: string } = {
  blue: 'color: #111',
  white: 'color: #ccc',
  primary: 'opacity: 0.8',
  inherit: 'inherit'
};

const StyledMuiLink = styled(MuiLink)`
  ${(props) =>
    props.color
      ? // @ts-ignore
        `color: ${props.theme.palette[props.color]?.main};`
      : ''}
  // disable hover UX on ios which converts first click to a hover event
  @media (pointer: fine) {
    &:hover {
      color: ${(props) =>
        typeof props.color === 'string'
          ? // @ts-ignore
            hoverStyle[props.color] || props.theme.palette[props.color]?.main
          : // @ts-ignore
            props.theme.palette[props.color]?.main};
    }
  }
`;

interface Props extends Omit<LinkProps, 'href'> {
  external?: boolean;
  href?: string;
  space?: { customDomain: string | null; domain: string };
  'data-test'?: string;
}

export default function Link({ external, href, onClick, children, color = 'primary', space, ...restProps }: Props) {
  const { space: currentSpace } = useCurrentSpace();

  if (!href) {
    return (
      <Box
        className={restProps.className}
        onClick={onClick as unknown as MouseEventHandler<HTMLDivElement>}
        data-test={restProps['data-test']}
        color={color}
        sx={restProps.sx}
      >
        {children}
      </Box>
    );
  }

  const isExternal = external || isExternalUrl(href);

  return isExternal ? (
    <StyledMuiLink href={href} color={color} onClick={onClick} rel='noreferrer' underline='none' {...restProps}>
      {children}
    </StyledMuiLink>
  ) : (
    <StyledMuiLink
      href={getSubdomainPath(href, space ?? currentSpace ?? undefined)}
      // Enables test to use the link after space is resolved
      data-test-resolved={Boolean(space || currentSpace)}
      // @ts-ignore
      component={NextLink}
      onClick={onClick}
      color={color}
      {...restProps}
    >
      {children}
    </StyledMuiLink>
  );
}

interface PageLinkProps extends Props {
  bountyId?: string;
  pageId?: string;
}

// use this link component to display a page inside a modal
export function PageLink({ bountyId, pageId, ...props }: PageLinkProps) {
  const { showPage } = usePageDialog();

  function onClickInternalLink(e: MouseEvent<HTMLAnchorElement>) {
    if (bountyId || pageId) {
      showPage({ bountyId, pageId });
      e.preventDefault();
    }
  }

  return <Link onClick={onClickInternalLink} {...props} />;
}
