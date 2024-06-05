import type { Space } from '@charmverse/core/prisma-client';
import { yupResolver } from '@hookform/resolvers/yup';
import { Box, Stack } from '@mui/material';
import { FormProvider, useForm } from 'react-hook-form';
import * as yup from 'yup';

import { useUpdateSpace } from 'charmClient/hooks/spaces';
import { useTrackPageView } from 'charmClient/hooks/track';
import { Button } from 'components/common/Button';
import Legend from 'components/settings/Legend';
import { useIsAdmin } from 'hooks/useIsAdmin';
import { usePreventReload } from 'hooks/usePreventReload';
import { useSpaces } from 'hooks/useSpaces';
import type { NotificationToggleOption, NotificationToggles } from 'lib/notifications/notificationToggles';
import { blueColor } from 'theme/colors';

import { SpaceEmailBrandingSettings } from './components/SpaceEmailBrandingSettings';
import { SpaceNotificationSettings, getDefaultNotificationValues } from './components/SpaceNotificationSettings';

export type FormValues = {
  emailBrandArtwork?: string | null;
  emailBrandColor?: string | null;
  notificationToggles: NotificationToggles;
};

const schema: yup.Schema<FormValues> = yup.object({
  notificationToggles: yup.object(),
  emailBrandArtwork: yup.string().nullable(),
  emailBrandColor: yup
    .string()
    .test(
      'isHexColor',
      'Please provide a valid hex color code',
      (value) => !value || /^#?([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(value)
    )
});

export function NotificationSettings({ space }: { space: Space }) {
  useTrackPageView({ type: 'settings/notifications' });
  const isAdmin = useIsAdmin();
  const { trigger: updateSpace, isMutating: updateSpaceLoading } = useUpdateSpace(space.id);
  const { setSpace } = useSpaces();

  const form = useForm<FormValues>({
    defaultValues: {
      notificationToggles: getDefaultNotificationValues(space.notificationToggles as NotificationToggles),
      emailBrandArtwork: space.emailBrandArtwork,
      emailBrandColor: space.emailBrandColor || blueColor
    },
    resolver: yupResolver(schema),
    reValidateMode: 'onChange'
  });

  const dataChanged = form.formState.isDirty;

  usePreventReload(dataChanged);

  async function onSubmit(values: FormValues) {
    if (!isAdmin) return;

    // remove 'true' values from notificationToggles
    const notificationToggles = { ...values.notificationToggles } as NotificationToggles;
    for (const key in notificationToggles) {
      if (notificationToggles[key as NotificationToggleOption] !== false) {
        delete notificationToggles[key as NotificationToggleOption];
      }
    }

    await updateSpace(
      {
        notificationToggles,
        emailBrandArtwork: values.emailBrandArtwork,
        emailBrandColor: values.emailBrandColor
      },
      {
        onSuccess: (updatedSpace) => {
          setSpace(updatedSpace);
          form.reset({
            emailBrandArtwork: updatedSpace.emailBrandArtwork,
            emailBrandColor: updatedSpace.emailBrandColor || blueColor,
            notificationToggles: getDefaultNotificationValues(updatedSpace.notificationToggles as NotificationToggles)
          });
        }
      }
    );
  }

  return (
    <>
      <Legend>Notifications</Legend>
      <FormProvider {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <Stack gap={2}>
            <SpaceEmailBrandingSettings />
            <SpaceNotificationSettings />
            {isAdmin && (
              <Box
                sx={{
                  py: 1,
                  px: { xs: 5, md: 3 },
                  position: 'sticky',
                  bottom: '0',
                  background: (theme) => theme.palette.background.paper,
                  borderTop: (theme) => `1px solid ${theme.palette.divider}`,
                  textAlign: 'right'
                }}
              >
                {dataChanged && (
                  <Button
                    disableElevation
                    variant='outlined'
                    data-test='reset-space-update'
                    disabled={updateSpaceLoading || !dataChanged}
                    onClick={() =>
                      form.reset({
                        emailBrandArtwork: space.emailBrandArtwork,
                        emailBrandColor: space.emailBrandColor || blueColor,
                        notificationToggles: getDefaultNotificationValues(
                          space.notificationToggles as NotificationToggles
                        )
                      })
                    }
                    sx={{ mr: 2 }}
                  >
                    Cancel
                  </Button>
                )}
                <Button
                  disableElevation
                  data-test='submit-space-update'
                  disabled={updateSpaceLoading || !dataChanged || !isAdmin || !form.formState.isValid}
                  type='submit'
                  loading={updateSpaceLoading}
                >
                  Save
                </Button>
              </Box>
            )}
          </Stack>
        </form>
      </FormProvider>
    </>
  );
}
