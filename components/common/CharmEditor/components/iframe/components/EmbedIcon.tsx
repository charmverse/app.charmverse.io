import type { ElementType } from 'react';

export function EmbedIcon({
  icon: Icon,
  iconUrl,
  size = 'small'
}: {
  icon?: ElementType;
  iconUrl?: string;
  size?: 'small' | 'large';
}) {
  if (Icon) {
    return <Icon style={{ fontSize: size === 'small' ? 20 : 30 }} />;
  }

  return <img src={iconUrl} height={size === 'small' ? 20 : 30} width='auto' />;
}
