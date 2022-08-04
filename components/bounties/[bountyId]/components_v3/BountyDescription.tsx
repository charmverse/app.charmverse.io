import Box from '@mui/material/Box';
import { BountyWithDetails, PageContent } from 'models';
import { useMemo } from 'react';
import { AssignedBountyPermissions } from 'lib/bounties';
import dynamic from 'next/dynamic';

const CharmEditor = dynamic(() => import('components/common/CharmEditor'), {
  ssr: false
});

interface Props {
  bounty: BountyWithDetails;
  permissions: AssignedBountyPermissions
}

export default function BountyDescription ({ bounty, permissions }: Props) {
  const CharmEditorMemoized = useMemo(() => {
    // Only show the editor if the description exist
    // Otherwise it shows the `Type / for commands` placeholder
    return bounty && bounty.page?.contentText ? (
      <CharmEditor
        readOnly
        key={bounty.page?.contentText}
        content={bounty.page?.content as PageContent}
      />
    ) : null;
  }, [bounty]);

  return (
    <Box my={2}>
      {CharmEditorMemoized}
    </Box>
  );

}
