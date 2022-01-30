import { useState } from 'react';
import styled from '@emotion/styled';
import AddIcon from '@mui/icons-material/Add';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import SettingsIcon from '@mui/icons-material/Settings';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import MuiLink from '@mui/material/Link';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import Modal from '@mui/material/Modal';
import Typography from '@mui/material/Typography';
import TreeView from '@mui/lab/TreeView';
import TreeItem, { treeItemClasses } from '@mui/lab/TreeItem';
import NextLink from 'next/link';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { useRouter } from 'next/router';
import Avatar from '../Avatar';
import Link from '../Link';
import WorkspaceAvatar from '../WorkspaceAvatar';
import Header from './Header';
import { isTruthy } from 'lib/types';
import { useUser } from 'hooks/useUser';
import { useSpace } from 'hooks/useSpace';
import { useSpaces } from 'hooks/useSpaces';
import { usePages } from 'hooks/usePages';
import { pages as seedPages } from 'seedData';
import { Contributor, Page, Space } from 'models';
import { getKey } from 'hooks/useLocalStorage';
import { shortenedWeb3Address } from 'lib/strings';
import EmojiCon from '../Emoji';
import ModalContainer from '../ModalContainer';
import CreateWorkspaceForm from './CreateWorkspaceForm';

type MenuNode = Page & {
  children: MenuNode[];
}

const AvatarLink = styled(NextLink)`
  cursor: pointer;
`;

const WorkspacesContainer = styled.div`
  float: left;
  height: 100%;
  border-right: 1px solid ${({ theme }) => theme.palette.divider};
  padding: ${({ theme }) => theme.spacing(1)};
`;

interface SidebarProps {
  closeSidebar: () => void;
  favorites: Contributor['favorites'];
}

export default function Sidebar({ closeSidebar, favorites }: SidebarProps) {

  const router = useRouter();
  const [user] = useUser();
  const [space] = useSpace();
  const [spaces, setSpaces] = useSpaces();
  const [pages] = usePages();
  const [spaceFormOpen, setSpaceFormOpen] = useState(false);
  const favoritePages = favorites.map(fav => pages.find(page => page.id === fav.pageId)).filter(isTruthy);

  function showSpaceForm () {
    setSpaceFormOpen(true);
  }

  function closeSpaceForm () {
    setSpaceFormOpen(false);
  }

  function addSpace (space: Space) {
    if (spaces.some(s => s.id === space.id)) {
      throw new Error('Space with that id already exists: ' + space.id);
    }
    if (spaces.some(s => s.domain === space.domain)) {
      throw new Error('Space with that domain already exists');
    }
    setSpaces([...spaces, space]);

    // add a first page - note that usePages is for the current space, so we can't use setPages here
    const firstPage: Page = { ...seedPages[0], id: Math.random().toString().replace('0.', ''), spaceId: space.id };
    const key = getKey(`spaces.${space.id}.pages`);
    localStorage.setItem(key, JSON.stringify([firstPage]));

    router.push(`/${space.domain}`);
  }

  // find children
  const noParent = 'NO_PARENT';
  const grouped = pages.reduce<{ [pid: string | typeof noParent]: MenuNode[] }>((acc, page: any) => {
    const pid = page.parentPageId || noParent;
    acc[pid] ||= [];
    acc[pid].push({
      children: [],
      ...page
    });
    return acc;
  }, {});
  console.log('grouped', grouped)
  // add children
  for (const pid in grouped) {
    grouped[pid].map(page => {
      if (grouped[page.id]) {
        page.children = grouped[page.id];
      }
    });
  }
  // top pages don't have a parent
  const menuNodes = grouped[noParent] || [];
  console.log('menu nodes', menuNodes);
  return (<Box display='flex' sx={{ bgcolor: 'sidebar.background', height: '100%' }}>
    <WorkspacesContainer>
      <Grid container spacing={2} flexDirection='column'>
        {spaces.map(workspace => (
          <Grid item key={workspace.domain}>
            <AvatarLink href={`/${workspace.domain}`} passHref>
              <MuiLink>
                <WorkspaceAvatar active={space.domain === workspace.domain} name={workspace.name} />
              </MuiLink>
            </AvatarLink>
          </Grid>
        ))}
        <Grid item>
          <IconButton sx={{ borderRadius: '8px' }} onClick={showSpaceForm}><AddIcon /></IconButton>
        </Grid>
      </Grid>
      <Modal open={spaceFormOpen} onClose={closeSpaceForm}>
        <ModalContainer onClose={closeSpaceForm}>
          <CreateWorkspaceForm onSubmit={addSpace} onCancel={closeSpaceForm} />
        </ModalContainer>
      </Modal>
    </WorkspacesContainer>
    <Box display='flex' flexDirection='column' sx={{ height: '100%', flexGrow: 1 }}>
      <Box sx={{ flexGrow: 1 }}>
        <Header>
          <Typography><strong>{space.name}</strong></Typography>
          <IconButton onClick={closeSidebar}>
            <ChevronLeftIcon />
          </IconButton>
        </Header>
        <Divider sx={{ mb: 3 }} />
        {/* <Box>
          <List>
            <NextLink href='' passHref>
              <ListItem button component='a' disableRipple sx={{ py: 1, color: greyColor + ' !important' }}>
                <ListItemText disableTypography>
                    <Box sx={{ fontSize: 14, fontWeight: 500 }}>Settings</Box>
                </ListItemText>
              </ListItem>
            </NextLink>
          </List>
        </Box> */}
        {favoritePages.length > 0 && <>
          <Typography sx={{ color: '#777', fontSize: 12, letterSpacing: '0.03em', fontWeight: 600, px: 2 }}>
            FAVORITES
          </Typography>
          <List>
            {favoritePages.map(page => (
              <NextLink href={`/${space.domain}/${page.path}`} key={page.id} passHref>
                <ListItem button component='a' disableRipple sx={{ py: 0 }}>
                  <ListItemText disableTypography>
                    <Box sx={{ fontSize: 14, fontWeight: 500, ml: 2 }}>
                      <EmojiCon sx={{ display: 'inline-block', width: 20 }}>{page.icon || '📄 '}</EmojiCon> {page.title}
                    </Box>
                  </ListItemText>
                </ListItem>
              </NextLink>
            ))}
          </List>
        </>}
        <Typography sx={{ color: '#777', fontSize: 12, letterSpacing: '0.03em', fontWeight: 600, px: 2 }}>
          WORKSPACE
        </Typography>
        {/* <List>
          {pages.map(page => (
            <NextLink href={`/${space.domain}/${page.path}`} key={page.id} passHref>
              <ListItem button component='a' disableRipple sx={{ py: 0 }}>
                <ListItemText disableTypography>
                  <Box sx={{ fontSize: 14, fontWeight: 500, ml: 2 }}>
                    <EmojiCon sx={{ display: 'inline-block', width: 20 }}>{page.icon || '📄 '}</EmojiCon> {page.title}
                  </Box>
                </ListItemText>
              </ListItem>
            </NextLink>
          ))}
        </List> */}
        <TreeView
          defaultCollapseIcon={<ExpandMoreIcon />}
          defaultExpandIcon={<ChevronRightIcon />}
          sx={{ height: 240, flexGrow: 1, maxWidth: 400, overflowY: 'auto' }}
        >
          {menuNodes.map(node => (<>
            <StyledTreeItem
              key={node.id}
              labelIcon={node.icon}
              nodeId={node.id}
              label={node.title}>
              {node.children.map(childNode => (
                <StyledTreeItem nodeId={childNode.id} labelIcon={childNode.icon} label={childNode.title} />
              ))}
            </StyledTreeItem>
          </>))}
        </TreeView>
      </Box>
      <Box>
        <Divider />
        <Box p={1} display='flex' alignItems='center' justifyContent='space-between'>
          {user && <Box display='flex' alignItems='center'>
            <Avatar name={user.username} />
            <Box pl={1}>
              <Typography variant='caption' sx={{ display: 'block' }}>
                <strong>{user.username}</strong><br />
                {shortenedWeb3Address(user.address)}
              </Typography>
            </Box>
          </Box>}
          <Link href={`/${space.domain}/settings/account`}>
            <IconButton>
              <SettingsIcon color='secondary' />
            </IconButton>
          </Link>
        </Box>
      </Box>
    </Box>
  </Box>);
}

const StyledTreeItemRoot = styled(TreeItem)(({ theme }) => ({
  color: theme.palette.text.secondary,
  [`& .${treeItemClasses.content}`]: {
    color: theme.palette.text.secondary,
    borderTopRightRadius: theme.spacing(2),
    borderBottomRightRadius: theme.spacing(2),
    paddingRight: theme.spacing(1),
    fontWeight: theme.typography.fontWeightMedium,
    '&.Mui-expanded': {
      fontWeight: theme.typography.fontWeightRegular,
    },
    '&:hover': {
      backgroundColor: theme.palette.action.hover,
    },
    '&.Mui-focused, &.Mui-selected, &.Mui-selected.Mui-focused': {
      backgroundColor: `var(--tree-view-bg-color, ${theme.palette.action.selected})`,
      color: 'var(--tree-view-color)',
    },
    [`& .${treeItemClasses.label}`]: {
      fontWeight: 'inherit',
      color: 'inherit',
    },
  },
  [`& .${treeItemClasses.group}`]: {
    marginLeft: 0,
    [`& .${treeItemClasses.content}`]: {
      paddingLeft: theme.spacing(2),
    },
  },
}));


type TreeItemProps = React.ComponentProps<typeof TreeItem> & {
  labelIcon?: string;
}

function StyledTreeItem (props: TreeItemProps) {
  const {
    color,
    labelIcon,
    label,
    ...other
  } = props;

  return (
    <StyledTreeItemRoot
      label={
        <Box sx={{ display: 'flex', alignItems: 'center', p: 0.5, pr: 0 }}>
          <EmojiCon sx={{ display: 'inline-block', width: 20 }}>
            {labelIcon || '📄 '}
          </EmojiCon>
          <Typography variant='body2' sx={{ fontWeight: 'inherit', flexGrow: 1 }}>
            {label}
          </Typography>
        </Box>
      }
      // style={{
      //   '--tree-view-color': color,
      //   //'--tree-view-bg-color': bgColor,
      // }}
      {...other}
    />
  );
}