import type { AssignedPagePermission } from '@charmverse/core/permissions';
import type { PageType } from '@charmverse/core/prisma-client';
import Box from '@mui/material/Box';
import { useState } from 'react';

import { useGetPermissions } from 'charmClient/hooks/permissions';
import Loader from 'components/common/Loader';
import MultiTabs from 'components/common/MultiTabs';
import { useIsFreeSpace } from 'hooks/useIsFreeSpace';

import FreePagePermissions from './FreePagePermissions/FreePagePermissions';
import FreeShareToWeb from './FreePagePermissions/FreeShareToWeb';
import PaidPagePermissions from './PaidPagePermissions/PaidPagePermissions';
import PaidShareToWeb from './PaidPagePermissions/PaidShareToWeb';

type Props = {
  pageId: string;
  pageType: PageType;
  closePopup: VoidFunction;
};

export function ShareModal({ pageId, pageType, closePopup }: Props) {
  const [activeTab, setActiveTab] = useState(0);
  const { isFreeSpace } = useIsFreeSpace();

  const { data: pagePermissions, mutate: refreshPermissions } = useGetPermissions(!isFreeSpace ? pageId : null);

  if (!isFreeSpace && !pagePermissions) {
    return (
      <Box
        sx={{
          height: 100
        }}
      >
        <Loader size={20} sx={{ height: 100 }} />
      </Box>
    );
  }

  return (
    <Box p={2} pt={1}>
      <MultiTabs
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        tabPanelSx={{ p: '10px 0 0' }}
        tabs={
          pageType === 'proposal' || pageType === 'proposal_template'
            ? [
                [
                  'Publish',
                  <Box key='1'>
                    {isFreeSpace ? (
                      <FreeShareToWeb pageId={pageId} />
                    ) : (
                      <PaidShareToWeb
                        pageId={pageId}
                        pagePermissions={pagePermissions as AssignedPagePermission[]}
                        refreshPermissions={refreshPermissions}
                      />
                    )}
                  </Box>
                ]
              ]
            : [
                [
                  'Share',
                  <Box key='0'>
                    {isFreeSpace ? (
                      <FreePagePermissions pageId={pageId} onCopyLink={closePopup} />
                    ) : (
                      <PaidPagePermissions
                        pagePermissions={pagePermissions as AssignedPagePermission[]}
                        refreshPermissions={refreshPermissions}
                        pageId={pageId}
                        onCopyLink={closePopup}
                      />
                    )}
                  </Box>
                ],
                [
                  'Publish',
                  <Box key='1'>
                    {isFreeSpace ? (
                      <FreeShareToWeb pageId={pageId} />
                    ) : (
                      <PaidShareToWeb
                        pageId={pageId}
                        pagePermissions={pagePermissions as AssignedPagePermission[]}
                        refreshPermissions={refreshPermissions}
                      />
                    )}
                  </Box>
                ]
              ]
        }
      />
    </Box>
  );
}
