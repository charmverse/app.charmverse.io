import CircleIcon from '@mui/icons-material/Circle';
import { Box, Checkbox, FormControlLabel, Grid, Stack, Switch, Typography } from '@mui/material';
import type { ReactNode } from 'react';
import type { Control, UseFormRegister } from 'react-hook-form';
import { Controller } from 'react-hook-form';

import { useSpaceFeatures } from 'hooks/useSpaceFeatures';
import type { NotificationGroup } from 'lib/notifications/interfaces';
import type { NotificationToggles, NotificationToggleOption } from 'lib/notifications/notificationToggles';

import type { FormValues } from '../SpaceSettings';

type NotificationType = { label: string; type?: NotificationToggleOption };

type ConfigurableGroups = Extract<NotificationGroup, 'rewards' | 'proposals' | 'polls'>;

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
        { label: 'Feedback ready (All members)', type: 'proposals__start_discussion' },
        { label: 'Review ready (Reviewers)', type: 'proposals__review_required' },
        { label: 'Review completed (Authors)', type: 'proposals__step_passed' },
        { label: 'Rewards published (Authors)', type: 'proposals__reward_published' },
        { label: 'Issued Credentials', type: 'proposals__credential_created' }
      ],
      [
        { label: 'Vote ready (Authors and Voters)', type: 'proposals__vote' },
        { label: 'Vote passed (Authors and Voters)', type: 'proposals__vote_passed' },
        { label: 'Proposal declined (Authors)', type: 'proposals__proposal_failed' },
        { label: 'Proposal passed (Authors)', type: 'proposals__proposal_passed' },
        { label: 'Proposal published (Authors)', type: 'proposals__proposal_published' }
      ]
    ]
  },
  polls: {
    title: 'Polls',
    types: [[{ label: 'Poll created (All members)' }]]
  }
};

// set all notifications to true by default
export function getDefaultValues(toggles: NotificationToggles): NotificationToggles {
  const defaultValues: NotificationToggles = {
    rewards: toggles.rewards ?? true,
    proposals: toggles.proposals ?? true,
    polls: toggles.polls ?? true
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

export function NotificationTogglesInput({
  isAdmin,
  control,
  watch,
  register,
  setValue
}: {
  isAdmin: boolean;
  control: Control<FormValues>;
  watch: () => FormValues;
  register: UseFormRegister<FormValues>;
  setValue: (name: `notificationToggles.${NotificationToggleOption}`, value: any) => void;
}) {
  const { getFeatureTitle } = useSpaceFeatures();
  const formValues = watch();
  // console.log(formValues);
  return (
    <Stack>
      <ToggleInput
        name='notificationToggles.rewards'
        label={
          <NotificationRuleComponent
            control={control}
            disabled={!isAdmin}
            enabled={formValues.notificationToggles?.rewards}
            title={getFeatureTitle('Rewards')}
            types={notificationTypes.rewards.types}
          />
        }
        disabled={!isAdmin}
        control={control}
        setValue={setValue}
      />
      <ToggleInput
        name='notificationToggles.proposals'
        label={
          <NotificationRuleComponent
            control={control}
            disabled={!isAdmin}
            enabled={formValues.notificationToggles?.proposals}
            title={getFeatureTitle('Proposals')}
            types={notificationTypes.proposals.types}
          />
        }
        disabled={!isAdmin}
        control={control}
        setValue={setValue}
      />
      <ToggleInput
        name='notificationToggles.polls'
        label={
          <NotificationRuleComponent
            control={control}
            disabled={!isAdmin}
            enabled={formValues.notificationToggles?.polls}
            title={notificationTypes.polls.title}
            types={notificationTypes.polls.types}
          />
        }
        disabled={!isAdmin}
        control={control}
        setValue={setValue}
      />
    </Stack>
  );
}

function ToggleInput({
  disabled,
  name,
  label,
  control,
  setValue
}: {
  disabled?: boolean;
  name: `notificationToggles.${NotificationToggleOption}`;
  label: ReactNode;
  control: any;
  setValue: (name: `notificationToggles.${NotificationToggleOption}`, value: any) => void;
}) {
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
  control,
  enabled,
  title,
  disabled,
  types: typeColumns
}: {
  disabled: boolean;
  control: any;
  enabled?: boolean;
  title: string;
  types: (typeof notificationTypes)['rewards']['types'];
}) {
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
