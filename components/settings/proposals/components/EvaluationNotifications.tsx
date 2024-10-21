import type { WorkflowEvaluationJson } from '@charmverse/core/proposals';
import { Box, Card, Stack, TextField, Typography } from '@mui/material';

import { useSpaceFeatures } from 'hooks/useSpaceFeatures';
import { getActionButtonLabels } from 'lib/proposals/getActionButtonLabels';

import { evaluationIcons } from '../constants';

export function EvaluationNotificationsRow({
  evaluation,
  readOnly,
  nextEvaluationTitle,
  onChange
}: {
  evaluation: WorkflowEvaluationJson;
  onChange: (evaluation: WorkflowEvaluationJson) => void;
  readOnly: boolean;
  nextEvaluationTitle?: string;
}) {
  const { getFeatureTitle } = useSpaceFeatures();
  const proposalFeatureTitle = getFeatureTitle('proposal');
  const actionLabels = getActionButtonLabels(evaluation);

  return (
    <Card variant='outlined' sx={{ mb: 1 }}>
      <Stack gap={1} p={2}>
        <Box display='flex' alignItems='center' gap={1} justifyContent='space-between'>
          {evaluationIcons[evaluation.type]()}
          <Typography variant='h6' sx={{ flexGrow: 1 }}>
            {evaluation.title}
          </Typography>
        </Box>
        <Typography>Message sent when</Typography>
        <Stack gap={1}>
          <Stack direction='row' gap={1} alignItems='center'>
            <Typography fontWeight='bold' variant='subtitle1' minWidth={75}>
              Pass
            </Typography>
            <TextField
              placeholder={
                evaluation.type === 'vote'
                  ? 'The vote on {pageTitle} has passed. View results.'
                  : nextEvaluationTitle
                    ? `Your ${proposalFeatureTitle} has successfully completed the ${evaluation.title} step and is now moving to the ${nextEvaluationTitle} step`
                    : `The status of your ${proposalFeatureTitle} has changed to: ${actionLabels.approve}`
              }
              onChange={(e) => {
                onChange({
                  ...evaluation,
                  notificationLabels: {
                    ...evaluation.notificationLabels,
                    approve: e.target.value
                  }
                });
              }}
              fullWidth
              value={evaluation.notificationLabels?.approve ?? ''}
              disabled={readOnly}
            />
          </Stack>
          <Stack direction='row' gap={1} alignItems='center'>
            <Typography fontWeight='bold' variant='subtitle1' minWidth={75}>
              Decline
            </Typography>
            <TextField
              placeholder={`The status of your ${proposalFeatureTitle} has changed to: ${actionLabels.reject}`}
              onChange={(e) => {
                onChange({
                  ...evaluation,
                  notificationLabels: {
                    ...evaluation.notificationLabels,
                    reject: e.target.value
                  }
                });
              }}
              fullWidth
              value={evaluation.notificationLabels?.reject ?? ''}
              disabled={readOnly}
            />
          </Stack>
        </Stack>
      </Stack>
    </Card>
  );
}
