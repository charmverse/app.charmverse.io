import { useCharmRouter } from 'hooks/useCharmRouter';
import { useSpaceFeatures } from 'hooks/useSpaceFeatures';
import type { MappedFeature } from 'lib/features/constants';

import { PageIcon } from '../../../../PageIcon';

import { AddIconButton } from './AddIconButton';
import { SidebarLink } from './SidebarButton';

export function FeatureLink({ feature, onClick }: { feature: MappedFeature; onClick?: VoidFunction }) {
  const { navigateToSpacePath, router } = useCharmRouter();
  const { getFeatureTitle } = useSpaceFeatures();
  return (
    <SidebarLink
      href={`/${feature.path}`}
      active={router.pathname.startsWith(`/[domain]/${feature.path}`)}
      icon={<PageIcon icon={null} pageType={feature.path} />}
      label={feature.title}
      onClick={onClick}
      data-test={`sidebar-link-${feature.path}`}
    >
      {feature.id === 'forum' && <AddIconButton tooltip='Add a post' />}
      {feature.id === 'rewards' && <AddIconButton tooltip={`Add a ${getFeatureTitle('reward')}`} />}
      {feature.id === 'proposals' && <AddIconButton tooltip={`Add a ${getFeatureTitle('proposal')}`} />}
    </SidebarLink>
  );
}
