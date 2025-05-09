import type { Post } from '@charmverse/core/prisma';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import MessageOutlinedIcon from '@mui/icons-material/MessageOutlined';
import { List, ListItemButton, ListItemIcon, ListItemText, Stack, Typography } from '@mui/material';
import type { KeyedMutator } from 'swr';

import charmClient from 'charmClient';
import { useForumCategories } from 'hooks/useForumCategories';
import { relativeTime } from '@packages/lib/utils/dates';

import { usePostDialog } from '../PostDialog/hooks/usePostDialog';

export function DraftPostList({
  openPostId,
  draftPosts,
  onClick,
  deletePost
}: {
  openPostId?: string;
  draftPosts: Post[];
  onClick: (post: Post) => void;
  deletePost: (postId: string) => void;
}) {
  const { categories } = useForumCategories();
  async function deleteDraftPost(draftPost: Post) {
    deletePost(draftPost.id);
  }
  return (
    <List>
      {draftPosts.map((draftPost) => {
        const postCategory = categories.find((cat) => cat.id === draftPost.categoryId);
        return (
          <ListItemButton
            sx={{
              px: {
                md: 1,
                xs: 0
              }
            }}
            selected={openPostId === draftPost.id}
            key={draftPost.id}
            onClick={() => onClick(draftPost)}
          >
            <ListItemIcon sx={{ mr: 2, display: { xs: 'none', md: 'initial' } }}>
              <MessageOutlinedIcon fontSize='large' />
            </ListItemIcon>
            <ListItemText secondary={relativeTime(draftPost.updatedAt)}>
              <Stack
                flexDirection={{ xs: 'column', sm: 'row', md: 'row' }}
                alignItems={{ xs: 'flex-start', md: 'center' }}
                gap={{ xs: 0, md: 1 }}
              >
                <Typography>
                  {openPostId === draftPost.id && <strong>EDITING: </strong>}
                  {draftPost.title}
                </Typography>
                {postCategory && (
                  <Typography color='secondary' variant='subtitle1' component='div' fontWeight={500}>
                    ({postCategory.name})
                  </Typography>
                )}
              </Stack>
            </ListItemText>
            <ListItemIcon>
              <DeleteOutlinedIcon
                fontSize='medium'
                color='error'
                onClick={(e) => {
                  e.stopPropagation();
                  deleteDraftPost(draftPost);
                }}
              />
            </ListItemIcon>
          </ListItemButton>
        );
      })}
    </List>
  );
}
