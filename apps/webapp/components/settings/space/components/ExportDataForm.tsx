import { Box, Typography } from '@mui/material';
import { useEffect, useRef } from 'react';

import { useGetExportJobStatus, useRequestExportData } from 'charmClient/hooks/spaces';
import { Button } from 'components/common/Button';
import Legend from 'components/settings/components/Legend';
import { useConfirmationModal } from 'hooks/useConfirmationModal';
import { useUser } from 'hooks/useUser';

export function ExportDataForm({ spaceId, isAdmin }: { spaceId: string; isAdmin: boolean }) {
  const { user } = useUser();
  const { showConfirmation } = useConfirmationModal();
  const { data: exportData, isMutating: isExportDataLoading, trigger: exportSpaceData } = useRequestExportData(spaceId);
  const { data: job, mutate: refreshJob, isLoading: isJobLoading } = useGetExportJobStatus(spaceId, exportData?.jobId);
  const intervalRef = useRef<NodeJS.Timeout>(undefined);

  useEffect(() => {
    clearInterval(intervalRef.current);
    refreshJob();
    if (job?.status === 'pending') {
      intervalRef.current = setInterval(() => {
        refreshJob();
      }, 1000);
    }
    return () => clearInterval(intervalRef.current);
  }, [job, refreshJob]);

  async function clickExportData() {
    const { confirmed } = await showConfirmation({
      message: `This may take a few minutes.${user?.email ? ` When it is complete, a link will be sent to ${user.email}.` : ''}`
    });
    if (confirmed) {
      await exportSpaceData(null);
    }
  }

  return (
    <>
      <Legend>Export Data</Legend>
      <Typography variant='caption' sx={{ mb: 2 }}>
        Admins can download proposals, pages, and databases (TSV and Markdown format). We will email you a link when it
        is ready.
      </Typography>
      <Box display='flex' gap={1} flexDirection='row' alignItems='center'>
        <Button
          disabledTooltip='Only admins can export'
          disabled={!isAdmin}
          onClick={clickExportData}
          loading={isExportDataLoading || job?.status === 'pending'}
        >
          Export
        </Button>
        {job?.status === 'pending' && (
          <Typography variant='caption' component='em'>
            This may take a few minutes. We will email you a link when it is ready.
          </Typography>
        )}
        {job?.status === 'completed' && (
          <Typography variant='caption'>
            Export complete: <a href={job.downloadLink!}>Click to download</a>
          </Typography>
        )}
      </Box>
    </>
  );
}
