import Box from '@mui/material/Box';
import CharmEditor from 'components/common/CharmEditor/CharmEditor';
import { BountyWithDetails, PageContent } from 'models';
import { useMemo } from 'react';
import { AssignedBountyPermissions } from 'lib/bounties';

interface Props {
  bounty: BountyWithDetails;
  permissions: AssignedBountyPermissions
}

export default function BountyDescription ({ bounty, permissions }: Props) {

  const CharmEditorMemoized = useMemo(() => {
    // Only show the editor if the description exist
    // Otherwise it shows the `Type / for commands` placeholder
    return bounty && bounty.page?.content ? (
      <CharmEditor
        readOnly
        key={bounty.page.contentText}
        content={bounty.page.content as PageContent}
      />
    ) : null;
  }, [bounty]);

  return (
    <Box my={2}>
      {CharmEditorMemoized}
    </Box>
  );

}
