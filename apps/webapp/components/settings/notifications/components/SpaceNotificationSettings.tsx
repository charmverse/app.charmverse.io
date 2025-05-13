import CircleIcon from '@mui/icons-material/Circle';
import { Box, Checkbox, FormControlLabel, Grid, Stack, Switch, Typography } from '@mui/material';
import type { ReactNode } from 'react';
import { Controller, useFormContext } from 'react-hook-form';

import FieldLabel from 'components/common/form/FieldLabel';
import { useIsAdmin } from 'hooks/useIsAdmin';
import { useSpaceFeatures } from 'hooks/useSpaceFeatures';
import type { NotificationGroup } from '@packages/lib/notifications/interfaces';
import type { NotificationToggleOption, NotificationToggles } from '@packages/lib/notifications/notificationToggles';

import type { FormValues } from '../NotificationSettings';

type NotificationType = { label: string; type?: NotificationToggleOption };

type ConfigurableGroups = Extract<NotificationGroup, 'rewards' | 'proposals' | 'polls' | 'forum'>;

const notificationTypes: Record<ConfigurableGroups, { title: string; types: NotificationType[][] }> = {
  rewards: {
    title: 'Rewards',
    types: [
      [
        { label: 'Application submitted (Reviewers only)' },
        { label: 'Application accepted (Applicants only)' },
        { label: 'Application rejected (Applicants only)' },
        { label: 'Work submitted (Reviewers only)' }
      ],
      [
        { label: 'Submission approved (Applicants only)' },
        { label: 'Payment needed (Reviewers only)' },
        { label: 'Payment completed (Applicants only)' },
        { label: 'Issued Credentials' }
      ]
    ]
  },
  proposals: {
    title: 'Proposals',
    types: [
      [
        { label: 'Proposal submitted (Authors)', type: 'proposals__proposal_published' },
        { label: 'Feedback ready (All members)', type: 'proposals__start_discussion' },
        { label: 'Review ready (Reviewers)', type: 'proposals__review_required' },
        { label: 'Review completed (Authors)', type: 'proposals__step_passed' },
        { label: 'Vote ready (Authors and Voters)', type: 'proposals__vote' }
      ],
      [
        { label: 'Vote passed (Authors and Voters)', type: 'proposals__vote_passed' },
        { label: 'Proposal declined (Authors)', type: 'proposals__proposal_failed' },
        { label: 'Proposal passed (Authors)', type: 'proposals__proposal_passed' },
        { label: 'Rewards published (Authors)', type: 'proposals__reward_published' },
        { label: 'Issued Credentials', type: 'proposals__credential_created' }
      ]
    ]
  },
  polls: {
    title: 'Polls',
    types: [[{ label: 'Poll created (All members)' }]]
  },
  forum: {
    title: 'Forum',
    types: [[{ label: 'Post created (All members)' }]]
  }
};

// set all notifications to true by default
export function getDefaultNotificationValues(toggles: NotificationToggles): NotificationToggles {
  const defaultValues: NotificationToggles = {
    rewards: toggles.rewards ?? true,
    proposals: toggles.proposals ?? true,
    polls: toggles.polls ?? true,
    forum: toggles.forum ?? true
  };
  Object.entries(notificationTypes).forEach(([, settings]) => {
    settings.types.forEach((typeColumn) => {
      typeColumn.forEach((type) => {
        if (type.type) {
          defaultValues[type.type] = toggles[type.type] ?? true;
        }
      });
    });
  });
  return defaultValues;
}

function ToggleInput({
  disabled,
  name,
  label
}: {
  disabled?: boolean;
  name: `notificationToggles.${NotificationToggleOption}`;
  label: ReactNode;
}) {
  const { control, setValue } = useFormContext<FormValues>();
  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { onChange, value } }) => {
        return (
          <FormControlLabel
            disableTypography
            sx={{ alignItems: 'flex-start' }}
            control={
              <Switch
                disabled={disabled}
                checked={value}
                onChange={(event, val) => {
                  if (val) {
                    setValue(name, val);
                  }
                  return onChange(val);
                }}
              />
            }
            label={label}
          />
        );
      }}
    />
  );
}

function NotificationRuleComponent({
  enabled,
  title,
  disabled,
  types: typeColumns
}: {
  disabled: boolean;
  enabled?: boolean;
  title: string;
  types: (typeof notificationTypes)['rewards']['types'];
}) {
  const { control } = useFormContext<FormValues>();

  return (
    <Box width='100%'>
      <Typography sx={{ my: 1 }}>{title}</Typography>
      <Grid container sx={{ mb: 2, maxWidth: 600 }}>
        {typeColumns.map((types) => (
          <Grid xs={12} md={6} item key={types.map((e) => e.label).join()}>
            <Typography variant='caption'>
              <Stack ml={1}>
                {types.map((event) =>
                  event.type ? (
                    <Controller
                      key={event.label}
                      control={control}
                      name={`notificationToggles.${event.type}`}
                      defaultValue={false}
                      render={({ field: { onChange, value } }) => (
                        <FormControlLabel
                          sx={{ ml: -2 }}
                          control={
                            <Checkbox
                              checked={value}
                              onChange={onChange}
                              disabled={disabled || !enabled}
                              sx={{ p: 1, '& .MuiSvgIcon-root': { fontSize: 12 } }}
                            />
                          }
                          label={<Typography variant='caption'>{event.label}</Typography>}
                        />
                      )}
                    />
                  ) : (
                    <FormControlLabel
                      key={event.label}
                      sx={{ ml: -2 }}
                      control={
                        <Checkbox
                          checkedIcon={<CircleIcon />}
                          icon={<CircleIcon />}
                          disabled
                          checked={enabled}
                          sx={{ p: 1, '& .MuiSvgIcon-root': { fontSize: 6, fill: 'inherit', marginLeft: '3px' } }}
                        />
                      }
                      label={<Typography variant='caption'>{event.label}</Typography>}
                    />
                  )
                )}
              </Stack>
            </Typography>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}

export function NotificationTogglesInput({ isAdmin }: { isAdmin: boolean }) {
  const { watch } = useFormContext<FormValues>();
  const { getFeatureTitle } = useSpaceFeatures();
  const formValues = watch();
  return (
    <Stack>
      <ToggleInput
        name='notificationToggles.rewards'
        label={
          <NotificationRuleComponent
            disabled={!isAdmin}
            enabled={formValues.notificationToggles?.rewards}
            title={getFeatureTitle('Rewards')}
            types={notificationTypes.rewards.types}
          />
        }
        disabled={!isAdmin}
      />
      <ToggleInput
        name='notificationToggles.proposals'
        label={
          <NotificationRuleComponent
            disabled={!isAdmin}
            enabled={formValues.notificationToggles?.proposals}
            title={getFeatureTitle('Proposals')}
            types={notificationTypes.proposals.types}
          />
        }
        disabled={!isAdmin}
      />
      <ToggleInput
        name='notificationToggles.polls'
        label={
          <NotificationRuleComponent
            disabled={!isAdmin}
            enabled={formValues.notificationToggles?.polls}
            title={notificationTypes.polls.title}
            types={notificationTypes.polls.types}
          />
        }
        disabled={!isAdmin}
      />
      <ToggleInput
        name='notificationToggles.forum'
        label={
          <NotificationRuleComponent
            disabled={!isAdmin}
            enabled={formValues.notificationToggles?.forum}
            title={notificationTypes.forum.title}
            types={notificationTypes.forum.types}
          />
        }
        disabled={!isAdmin}
      />
    </Stack>
  );
}

export function SpaceNotificationSettings() {
  const isAdmin = useIsAdmin();

  return (
    <Grid item>
      <FieldLabel>Enabled Notifications</FieldLabel>
      <Typography variant='caption' mb={1} component='p'>
        Control notifications for your members.
      </Typography>
      <NotificationTogglesInput isAdmin={isAdmin} />
    </Grid>
  );
}
