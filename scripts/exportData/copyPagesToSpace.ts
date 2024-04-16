/* eslint-disable no-console */
import { exportWorkspacePages } from 'lib/templates/exportWorkspacePages';
import { importWorkspacePages } from 'lib/templates/importWorkspacePages';

async function exportImport({
  sourceSpaceIdOrDomain,
  targetSpaceIdOrDomain
}: {
  sourceSpaceIdOrDomain: string;
  targetSpaceIdOrDomain: string;
}): Promise<true> {
  const data = await exportWorkspacePages({
    sourceSpaceIdOrDomain,
    skipBounties: true,
    skipProposals: true,
    skipBountyTemplates: true,
    skipProposalTemplates: true
  });

  const result = await importWorkspacePages({
    targetSpaceIdOrDomain,
    importingToDifferentSpace: true,
    exportData: data
  });

  console.log('Success ! Imported ', result.pages);

  return true;
}

exportImport({
  sourceSpaceIdOrDomain: 'rare-dao',
  targetSpaceIdOrDomain: 'rare-dao-grants'
}).then(() => {
  console.log('Job done');
});

// exportWorkspacePages({
//   sourceSpaceIdOrDomain: 'deafening-apricot-crane',
//   exportName: 'test-stub'
// }).then(() => console.log('Complete'))

// importWorkspacePages({
//   exportName: 'cvt-nft-community-template',
//   targetSpaceIdOrDomain: 'forthepeopledao'
// }).then(() => console.log('Complete'));
