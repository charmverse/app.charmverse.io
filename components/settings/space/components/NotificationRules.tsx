import CircleIcon from '@mui/icons-material/Circle';
import { Box, Checkbox, FormControlLabel, Grid, Stack, Switch, Typography } from '@mui/material';
import type { ReactNode } from 'react';
import type { Control, UseFormRegister } from 'react-hook-form';
import { Controller } from 'react-hook-form';

import type { NotificationGroup } from 'lib/notifications/interfaces';
import type { NotificationRuleOption } from 'lib/notifications/notificationRules';

import type { FormValues } from '../SpaceSettings';

type NotificationType = { label: string; type?: NotificationRuleOption };

type ConfigurableGroups = Extract<NotificationGroup, 'rewards' | 'proposals' | 'polls'>;

const notifications: Record<ConfigurableGroups, { title: string; types: NotificationType[][] }> = {
  rewards: {
    title: 'Bounties',
    types: [
      [
        { label: 'Bounty suggested (Admins only)' },
        { label: 'Application submitted (Reviewers only)' },
        { label: 'Application accepted (Applicants only)' },
        { label: 'Application rejected (Applicants only)' }
      ],
      [
        { label: 'Work submitted (Reviewers only)' },
        { label: 'Submission approved (Applicants only)' },
        { label: 'Payment completed (Applicants only)' }
      ]
    ]
  },
  proposals: {
    title: 'Proposals',
    types: [
      [
        { label: 'Feedback ready (All members)', type: 'proposals__start_discussion' },
        { label: 'Review ready (Reviewers only)' },
        { label: 'Review completed (Authors only)' }
      ],
      [
        { label: 'Vote ready (All members)', type: 'proposals__vote' },
        { label: 'Evaluation ready (Reviewers only)' },
        { label: 'Evaluation completed (Authors only)' }
      ]
    ]
  },
  polls: {
    title: 'Polls',
    types: [[{ label: 'Poll created (All members)' }]]
  }
};

export function NotificationRulesInput({
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
  setValue: (name: `notificationRules.${NotificationRuleOption}`, value: any) => void;
}) {
  const formValues = watch();
  // console.log(formValues);
  return (
    <Stack>
      <ToggleInput
        name='notificationRules.rewards'
        label={
          <NotificationRuleComponent
            control={control}
            enabled={formValues.notificationRules?.rewards}
            title={notifications.rewards.title}
            types={notifications.rewards.types}
          />
        }
        disabled={!isAdmin}
        control={control}
        setValue={setValue}
      />
      <ToggleInput
        name='notificationRules.proposals'
        label={
          <NotificationRuleComponent
            control={control}
            enabled={formValues.notificationRules?.proposals}
            title={notifications.proposals.title}
            types={notifications.proposals.types}
          />
        }
        disabled={!isAdmin}
        control={control}
        setValue={setValue}
      />
      <ToggleInput
        name='notificationRules.polls'
        label={
          <NotificationRuleComponent
            control={control}
            enabled={formValues.notificationRules?.polls}
            title={notifications.polls.title}
            types={notifications.polls.types}
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
  name: `notificationRules.${NotificationRuleOption}`;
  label: ReactNode;
  control: any;
  setValue: (name: `notificationRules.${NotificationRuleOption}`, value: any) => void;
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
  types: listsOftypes
}: {
  control: any;
  enabled?: boolean;
  title: string;
  types: (typeof notifications)['rewards']['types'];
}) {
  return (
    <Box width='100%'>
      <Typography sx={{ my: 1 }}>{title}</Typography>
      <Grid container sx={{ mb: 2, maxWidth: 600 }}>
        {listsOftypes.map((types) => (
          <Grid xs={12} md={6} item key={types.map((e) => e.label).join()}>
            <Typography variant='caption'>
              <Stack ml={1}>
                {types.map((event) =>
                  event.type ? (
                    <Controller
                      key={event.label}
                      control={control}
                      name={`notificationRules.${event.type}`}
                      defaultValue={false}
                      render={({ field: { onChange, value } }) => (
                        <FormControlLabel
                          sx={{ ml: -2 }}
                          control={
                            <Checkbox
                              checked={value}
                              onChange={onChange}
                              disabled={!enabled}
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
