import { useTheme, styled, Box } from '@mui/material';
import Grid from '@mui/material/Grid';
import type { PageMeta } from '@packages/core/pages';

import { BackIcon } from 'components/common/Icons/BackIcon';
import { DocumentPageIcon } from 'components/common/Icons/DocumentPageIcon';
import Link from 'components/common/Link';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { usePages } from 'hooks/usePages';

const StyledPageTemplateBanner = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'card'
})<{ card?: boolean }>`
  top: ${({ card }) => (card ? '50px' : '55px')};
  width: '100%';
  z-index: var(--z-index-appBar);
  display: flex;
  justify-content: center;
  color: ${({ theme }) => theme.palette.templateBanner.text};
  background-color: ${({ theme }) => theme.palette.templateBanner.background};
  padding: ${({ theme }) => theme.spacing(1.4)};
`;

type Props = {
  isNewPage?: boolean;
  parentId?: string | null;
  pageType?: PageMeta['type'];
  customTitle?: string;
};

export function PageTemplateBanner({ isNewPage, pageType, parentId, customTitle }: Props) {
  const { space } = useCurrentSpace();
  const theme = useTheme();
  const { pages } = usePages();
  const parentPage = parentId ? pages[parentId] : undefined;

  const isShowingCard = pageType?.match('card') !== null;
  const board = isShowingCard ? parentPage : undefined;

  const boardPath = board ? `/${space?.domain}/${board?.path}` : undefined;

  if (customTitle) {
    return (
      <StyledPageTemplateBanner card={isShowingCard}>
        <Grid size={8} display='flex' justifyContent='center'>
          <span>{customTitle}</span>
        </Grid>
      </StyledPageTemplateBanner>
    );
  }

  if (!pageType?.match('template')) {
    return null;
  }

  return (
    <StyledPageTemplateBanner card={isShowingCard} data-test='template-page-banner'>
      <Grid container display='flex' gap={1} alignItems='center' fontSize={theme.palette.templateBanner.fontSize}>
        <Grid size={2}>
          {isShowingCard && (
            <Link href={boardPath as string} color={theme.palette.secondary.main}>
              <BackIcon label='Back' iconSize='small' fontSize='14px' />
            </Link>
          )}
        </Grid>
        <Grid size={8} display='flex' justifyContent='center'>
          {!isShowingCard ? (
            <span>You're {isNewPage ? 'creating' : 'editing'} a template</span>
          ) : (
            <>
              <span>You're editing a template in</span>

              <Link
                href={boardPath as string}
                sx={{
                  textDecoration: 'underline',
                  textDecorationThickness: '0.1rem',
                  marginBottom: '1px',
                  marginLeft: 1
                }}
                color={theme.palette.templateBanner.highlightedText}
              >
                <DocumentPageIcon
                  iconSize='small'
                  fontSize={theme.palette.templateBanner.fontSize}
                  label={board?.title || 'Untitled'}
                />
              </Link>
            </>
          )}
        </Grid>
      </Grid>
    </StyledPageTemplateBanner>
  );
}
