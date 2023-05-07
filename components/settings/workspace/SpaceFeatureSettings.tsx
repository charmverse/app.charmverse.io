import { Feature } from '@charmverse/core/prisma';
import { yupResolver } from '@hookform/resolvers/yup';
import Box from '@mui/material/Box';
import FormControlLabel from '@mui/material/FormControlLabel';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import Typography from '@mui/material/Typography';
import { useForm } from 'react-hook-form';
import type { BooleanSchema } from 'yup';
import * as yup from 'yup';

import charmClient from 'charmClient';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useIsAdmin } from 'hooks/useIsAdmin';
import { useSpaces } from 'hooks/useSpaces';
import { uniqueValues } from 'lib/utilities/array';
import { typedKeys } from 'lib/utilities/objects';

const featureLabels: Record<Feature, string> = {
  bounties: 'Bounties',
  forum: 'Forum',
  member_directory: 'Member Directory',
  proposals: 'Proposals'
};

const fields: Record<Feature, BooleanSchema> = typedKeys(Feature).reduce(
  (_schema: Record<Feature, BooleanSchema>, op) => {
    _schema[op] = yup.boolean();
    return _schema;
  },
  {} as any
);

export const schema = yup.object(fields);

type FormValues = yup.InferType<typeof schema>;
export function SpaceFeatureSettings() {
  const { setSpace } = useSpaces();
  const isAdmin = useIsAdmin();
  const space = useCurrentSpace();

  const { setValue, getValues } = useForm<FormValues>({
    mode: 'onChange',
    defaultValues: {
      bounties: !space?.hiddenFeatures.includes('bounties'),
      forum: !space?.hiddenFeatures.includes('forum'),
      member_directory: !space?.hiddenFeatures.includes('member_directory'),
      proposals: !space?.hiddenFeatures.includes('proposals')
    } as FormValues,
    resolver: yupResolver(schema)
  });

  function updateSpace() {
    if (space) {
      const values = getValues();
      const toSet = typedKeys(values).reduce((acc, key) => {
        if (!values[key as Feature]) {
          acc.push(key as Feature);
        }

        return acc;
      }, [] as Feature[]);

      const settingsChanged =
        uniqueValues(toSet).length !== space.hiddenFeatures.length ||
        toSet.some((feature) => !space.hiddenFeatures.includes(feature)) ||
        space.hiddenFeatures.some((feature) => !toSet.includes(feature));

      if (settingsChanged) {
        charmClient.spaces.setHiddenFeatures({ hiddenFeatures: toSet, spaceId: space.id }).then(setSpace);
      }
    }
  }

  return (
    <Box>
      <Typography variant='caption'>
        Admins can turn on and off the visibility of the following modules in the sidebar. The functionality will still
        exist, but it won't be visible in the sidebar.
      </Typography>
      <Stack>
        {typedKeys(featureLabels).map((feature) => (
          <FormControlLabel
            key={feature}
            control={
              <Switch
                data-test={`space-feature-toggle-${feature}`}
                disabled={!isAdmin}
                checked={!space?.hiddenFeatures.includes(feature)}
                onChange={(ev) => {
                  const { checked } = ev.target;
                  setValue(feature, !!checked);

                  updateSpace();
                }}
              />
            }
            label={featureLabels[feature]}
          />
        ))}
      </Stack>
    </Box>
  );
}
