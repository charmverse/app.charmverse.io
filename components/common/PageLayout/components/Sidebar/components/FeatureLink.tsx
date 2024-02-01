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
      sx={{ pr: '8px !important' }}
    >
      {feature.id === 'forum' && <AddIconButton className='add-a-page' tooltip='Add a post' />}
      {feature.id === 'rewards' && (
        <AddIconButton className='add-a-page' tooltip={`Add a ${getFeatureTitle('reward')}`} />
      )}
      {feature.id === 'proposals' && (
        <AddIconButton className='add-a-page' tooltip={`Add a ${getFeatureTitle('proposal')}`} />
      )}
    </SidebarLink>
  );
}
