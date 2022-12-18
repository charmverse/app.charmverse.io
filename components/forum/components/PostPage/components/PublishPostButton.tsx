import type { PostStatus } from '@prisma/client';

import Button from 'components/common/Button';

interface PostPropertiesProps {
  postStatus: PostStatus;
  onClick: () => void;
}

export function PublishPostButton({ postStatus, onClick }: PostPropertiesProps) {
  return (
    <Button
      sx={{
        width: 'fit-content'
      }}
      size='small'
      disabledTooltip='Post has already been published'
      onClick={onClick}
      disabled={postStatus === 'published'}
    >
      {postStatus === 'published' ? 'Published' : 'Publish Post'}
    </Button>
  );
}
