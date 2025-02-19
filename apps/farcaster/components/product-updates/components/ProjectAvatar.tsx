import { Avatar } from '@packages/connect-shared/components/common/Avatar';

export function ProjectAvatar({ src }: { src?: string | null }) {
  return <Avatar avatar={src || `/images/default-project-avatar.png`} size='small' />;
}
