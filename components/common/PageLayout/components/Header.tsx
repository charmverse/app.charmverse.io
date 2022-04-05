import { BangleEditorState } from '@bangle.dev/core';
import { markdownSerializer } from '@bangle.dev/markdown';
import { Node } from '@bangle.dev/pm';
import { useTheme } from '@emotion/react';
import styled from '@emotion/styled';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import GetAppIcon from '@mui/icons-material/GetApp';
import MenuIcon from '@mui/icons-material/Menu';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import FavoritedIcon from '@mui/icons-material/Star';
import NotFavoritedIcon from '@mui/icons-material/StarBorder';
import { Box, CircularProgress } from '@mui/material';
import IconButton from '@mui/material/IconButton';
import Link from 'components/common/Link';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Popover from '@mui/material/Popover';
import Toolbar from '@mui/material/Toolbar';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { Page } from '@prisma/client';
import charmClient from 'charmClient';
import { charmEditorPlugins, specRegistry } from 'components/common/CharmEditor/CharmEditor';
import { useColorMode } from 'context/color-mode';
import { LinkedPage, usePages } from 'hooks/usePages';
import { useUser } from 'hooks/useUser';
import { PageContent } from 'models';
import { useRouter } from 'next/router';
import { Fragment, useMemo, useRef, useState } from 'react';
import { useBounties } from 'hooks/useBounties';
import Account from './Account';
import ShareButton from './ShareButton';
import { StyledPageIcon } from './PageNavigation';

export const headerHeight = 56;

const StyledToolbar = styled(Toolbar)`
  background-color: ${({ theme }) => theme.palette.background.default};
  height: ${headerHeight}px;
  min-height: ${headerHeight}px;
`;

const BreadCrumb = styled.span`
  & .breadcrumb-slash {
    opacity: .5;
    margin: 0em 0.5em;
  }
  display: flex;
  padding-right: 0em;
  a {
    color: inherit;
  }
`;

function BreadCrumbs ({ items }: {items: {
  link: null | string,
  icon: string | null,
  title: string,
  id: string
}[]}) {
  return (
    <BreadCrumb>
      {items.map((item, itemIndex) => {
        const itemTitle = item.title || 'Untitled';
        const currentPageCrumb = (
          <Box display='flex'>
            {item.icon && <StyledPageIcon icon={item.icon} />}
            {itemTitle}
          </Box>
        );

        // Last item doesn't have any /
        if (itemIndex !== items.length - 1) {
          return (
            <Fragment key={item.id}>
              {item.link ? (
                <Link href={item.link}>
                  {currentPageCrumb}
                </Link>
              ) : <div>{currentPageCrumb}</div>}
              <span className='breadcrumb-slash'>/</span>
            </Fragment>
          );
        }

        return <div key={item.id}>{currentPageCrumb}</div>;
      })}
    </BreadCrumb>
  );
}

function BountyBreadcrumbs () {
  const router = useRouter();
  const bountyId = router.query.bountyId as string;
  const { bounties } = useBounties();
  const bounty = bounties.find(_bounty => _bounty.id === bountyId);

  return (
    <BreadCrumbs items={[{
      icon: null,
      id: 'bounties',
      link: `/${router.query.domain}/bounties`,
      title: 'Bounties'
    }, {
      icon: null,
      id: router.query.bountyId as string,
      link: null,
      title: bounty?.title ?? `Bounty (${bountyId})`
    }]}
    />
  );
}

function PageBreadcrumbs ({ pages }: {pages: Page[]}) {
  const router = useRouter();
  const trimTrails = pages.length > 3;
  const collapsedCrumb = {
    title: '...',
    path: null,
    icon: null,
    id: '123'
  };
  const displayedCrumbs = (trimTrails ? [pages[0], collapsedCrumb, pages[pages.length - 2], pages[pages.length - 1]] : pages).map(page => ({
    title: page.title,
    link: page.path ? `/${router.query.domain}/${page.path}` : null,
    icon: page.icon,
    id: page.id
  }));

  return <BreadCrumbs items={displayedCrumbs} />;
}

export default function Header ({ open, openSidebar }: { open: boolean, openSidebar: () => void }) {
  const router = useRouter();
  const colorMode = useColorMode();
  const { pages, currentPageId, isEditing } = usePages();
  const [user, setUser] = useUser();
  const theme = useTheme();
  const [pageMenuOpen, setPageMenuOpen] = useState(false);
  const [pageMenuAnchorElement, setPageMenuAnchorElement] = useState<null | Element>(null);
  const pageMenuAnchor = useRef();

  const currentPage = currentPageId ? pages[currentPageId] : undefined;

  const currentPageChain = useMemo(() => {
    const currentPageParentChain: Page[] = [];
    let currentPageInChain: Page | null | undefined = pages[currentPageId];
    while (currentPageInChain) {
      currentPageParentChain.push(currentPageInChain);
      if (currentPageInChain.parentId) {
        currentPageInChain = pages[currentPageInChain.parentId];
      }
      else {
        currentPageInChain = null;
      }
    }
    return currentPageParentChain.reverse();
  }, [pages, currentPage]);

  const isFavorite = currentPage && user?.favorites.some(({ pageId }) => pageId === currentPage.id);

  const isPage = router.route.includes('pageId');

  const isExportablePage = (currentPage as Page)?.type === 'page';

  async function toggleFavorite () {
    if (!currentPage || !user) return;
    const pageId = currentPage.id;
    const updatedFields = isFavorite
      ? await charmClient.unfavoritePage(pageId)
      : await charmClient.favoritePage(pageId);
    setUser({ ...user, ...updatedFields });
  }

  function generateMarkdown () {

    if (currentPage && currentPage.type === 'page') {

      const serializer = markdownSerializer(specRegistry);

      const state = new BangleEditorState({
        specRegistry,
        plugins: charmEditorPlugins(),
        initialValue: currentPage.content ? Node.fromJSON(specRegistry.schema, currentPage.content as PageContent) : ''
      });

      let markdown = serializer.serialize(state.pmState.doc);

      if (currentPage.title) {
        const pageTitleAsMarkdown = `# ${currentPage.title}`;

        markdown = `${pageTitleAsMarkdown}\r\n\r\n${markdown}`;
      }

      const data = new Blob([markdown], { type: 'text/plain' });

      const linkElement = document.createElement('a');

      linkElement.download = `${currentPage.title || 'page'}.md`;

      const downloadLink = URL.createObjectURL(data);

      linkElement.href = downloadLink;

      linkElement.click();

      URL.revokeObjectURL(downloadLink);
    }

  }

  return (
    <StyledToolbar variant='dense'>
      <IconButton
        color='inherit'
        onClick={openSidebar}
        edge='start'
        sx={{
          marginRight: '36px',
          ...(open && { display: 'none' })
        }}
      >
        <MenuIcon />
      </IconButton>
      <Box sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 1,
        width: '100%'
      }}
      >
        <Box sx={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          gap: 2
        }}
        >
          <Typography noWrap component='div' sx={{ fontWeight: 500, maxWidth: 500, textOverflow: 'ellipsis' }}>
            {router.route === '/[domain]/bounties/[bountyId]' ? <BountyBreadcrumbs /> : router.route === '/[domain]/[pageId]' ? <PageBreadcrumbs pages={currentPageChain} /> : null}
          </Typography>
          {isEditing && (
            <Box sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1
            }}
            >
              <CircularProgress size={12} />
              <Typography variant='subtitle2'>
                Saving
              </Typography>
            </Box>
          )}
        </Box>
        <Box display='flex' alignItems='center'>
          {isPage && (
            <>
              <ShareButton headerHeight={headerHeight} />

              <Tooltip title={isFavorite ? 'Remove from Favorites' : 'Add to Favorites'} arrow placement='bottom'>
                <IconButton size='small' sx={{ ml: 1 }} onClick={toggleFavorite} color='inherit'>
                  {isFavorite ? <FavoritedIcon color='secondary' /> : <NotFavoritedIcon color='secondary' />}
                </IconButton>
              </Tooltip>
            </>
          )}

          {isPage && isExportablePage && (
            <Box sx={{ ml: 1 }} ref={pageMenuAnchor}>
              <IconButton
                size='small'
                onClick={() => {
                  setPageMenuOpen(!pageMenuOpen);
                  setPageMenuAnchorElement(pageMenuAnchor.current || null);
                }}
              >
                <MoreHorizIcon />
              </IconButton>
              <Popover
                anchorEl={pageMenuAnchorElement}
                open={pageMenuOpen}
                onClose={() => setPageMenuOpen(false)}
                anchorOrigin={{
                  vertical: 'bottom',
                  horizontal: 'left'
                }}
              >
                <List dense>
                  <ListItemButton onClick={() => {
                    generateMarkdown();
                    setPageMenuOpen(false);
                  }}
                  >
                    <ListItemIcon>
                      <GetAppIcon fontSize='small' />
                    </ListItemIcon>
                    <ListItemText primary='Export to markdown' />
                  </ListItemButton>
                </List>
              </Popover>
            </Box>
          )}

          {/** context menu */}
          {/* <IconButton size='small' sx={{ mx: 1 }} color='inherit'>
            <MoreHorizIcon />
          </IconButton> */}
          {/** dark mode toggle */}
          <Tooltip title={theme.palette.mode === 'dark' ? 'Light mode' : 'Dark mode'} arrow placement='bottom'>
            <IconButton sx={{ mx: 1 }} onClick={colorMode.toggleColorMode} color='inherit'>
              {theme.palette.mode === 'dark' ? <Brightness7Icon color='secondary' /> : <Brightness4Icon color='secondary' />}
            </IconButton>
          </Tooltip>
          {/** user account */}
          <Account />
        </Box>
      </Box>
    </StyledToolbar>
  );
}
