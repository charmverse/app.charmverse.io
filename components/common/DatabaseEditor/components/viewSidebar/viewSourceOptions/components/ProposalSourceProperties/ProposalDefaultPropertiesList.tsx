import { Checkbox, Stack, Typography } from '@mui/material';

import { defaultProposalProperties, defaultProposalPropertyTypes } from 'lib/databases/proposalDbProperties';

import type { SelectedProposalProperties } from './ProposalSourcePropertiesDialog';

export function ProposalDefaultPropertiesList({
  selectedProperties,
  setSelectedProperties
}: {
  selectedProperties: SelectedProposalProperties;
  setSelectedProperties: (selectedProperties: SelectedProposalProperties) => void;
}) {
  const isAllChecked = defaultProposalPropertyTypes.length === selectedProperties.defaults.length;
  return (
    <Stack>
      <Stack direction='row' alignItems='center'>
        <Checkbox
          size='small'
          onClick={() => {
            if (isAllChecked) {
              setSelectedProperties({
                ...selectedProperties,
                defaults: []
              });
            } else {
              setSelectedProperties({
                ...selectedProperties,
                defaults: [...defaultProposalPropertyTypes]
              });
            }
          }}
          checked={isAllChecked}
        />
        <Typography fontWeight='bold'>Select All</Typography>
      </Stack>
      <Stack>
        {defaultProposalProperties.map((property) => {
          const isSelected = selectedProperties.defaults.includes(property.type);
          return (
            <Stack key={property.id} direction='row' alignItems='center'>
              <Checkbox
                size='small'
                checked={isSelected}
                onClick={() => {
                  if (isSelected) {
                    setSelectedProperties({
                      ...selectedProperties,
                      defaults: selectedProperties.defaults.filter((p) => p !== property.type)
                    });
                  } else {
                    setSelectedProperties({
                      ...selectedProperties,
                      defaults: [...selectedProperties.defaults, property.type]
                    });
                  }
                }}
              />
              <Typography>{property.name}</Typography>
            </Stack>
          );
        })}
      </Stack>
    </Stack>
  );
}

export function ProposalDefaultPropertiesReadonlyList({
  selectedProperties
}: {
  selectedProperties: SelectedProposalProperties;
}) {
  if (selectedProperties.defaults.length === 0) {
    return null;
  }

  const selectedDefaultProperties = defaultProposalProperties.filter((property) =>
    selectedProperties.defaults.includes(property.type)
  );

  return (
    <Stack>
      <Typography fontWeight='bold' variant='subtitle1'>
        Default Properties
      </Typography>
      <Stack gap={0.5} mt={0.5}>
        {selectedDefaultProperties.map((property) => {
          return (
            <Typography variant='subtitle2' key={property.id}>
              {property.name}
            </Typography>
          );
        })}
      </Stack>
    </Stack>
  );
}
