import ArticleOutlinedIcon from '@mui/icons-material/ArticleOutlined';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import { List, ListItemButton, ListItemIcon, ListItemText, Stack, Typography } from '@mui/material';
import type { Post } from '@prisma/client';
import type { KeyedMutator } from 'swr';

import charmClient from 'charmClient';
import { useForumCategories } from 'hooks/useForumCategories';
import { relativeTime } from 'lib/utilities/dates';

import { usePostDialog } from '../PostDialog/hooks/usePostDialog';

export function DraftPostList({
  draftPosts,
  onClick,
  mutateDraftPosts
}: {
  draftPosts: Post[];
  onClick: (post: Post) => void;
  mutateDraftPosts: KeyedMutator<Post[]>;
}) {
  const { categories } = useForumCategories();
  const { showPost } = usePostDialog();
  async function deleteDraftPost(draftPost: Post) {
    try {
      await charmClient.forum.deleteForumPost(draftPost.id);
      showPost({
        postId: null
      });
      mutateDraftPosts(
        (currentDraftPosts) =>
          currentDraftPosts?.filter((currentDraftPost) => currentDraftPost.id !== draftPost.id) ?? [],
        { revalidate: false }
      );
    } catch (err) {
      //
    }
  }

  return (
    <List>
      {draftPosts.map((draftPost) => {
        const postCategory = categories.find((cat) => cat.id === draftPost.categoryId);
        return (
          <ListItemButton key={draftPost.id} onClick={() => onClick(draftPost)}>
            <ListItemIcon sx={{ mr: 2 }}>
              <ArticleOutlinedIcon fontSize='large' />
            </ListItemIcon>
            <ListItemText secondary={relativeTime(draftPost.updatedAt)}>
              <Stack flexDirection='row' alignItems='center' gap={1}>
                <Typography>{draftPost.title}</Typography>
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
