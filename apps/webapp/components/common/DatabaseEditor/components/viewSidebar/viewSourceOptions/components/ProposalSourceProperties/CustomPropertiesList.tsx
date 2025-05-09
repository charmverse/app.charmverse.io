import { Divider, Stack, Typography } from '@mui/material';

import { useProposalsBoardAdapter } from 'components/proposals/ProposalPage/components/ProposalProperties/hooks/useProposalsBoardAdapter';

import type { SelectedProposalProperties } from './interfaces';
import { PropertySelector } from './PropertiesListSelector';

export function CustomPropertiesList({
  selectedProperties,
  setSelectedProperties
}: {
  selectedProperties: SelectedProposalProperties;
  setSelectedProperties: (selectedProperties: SelectedProposalProperties) => void;
}) {
  const { boardCustomProperties } = useProposalsBoardAdapter();
  const isAllChecked =
    boardCustomProperties.fields.cardProperties.length === selectedProperties.customProperties.length;

  if (boardCustomProperties.fields.cardProperties.length === 0) {
    return <Typography>No custom properties available</Typography>;
  }

  return (
    <Stack>
      <PropertySelector
        isChecked={isAllChecked}
        label='Select All'
        bold
        onClick={() => {
          setSelectedProperties(
            isAllChecked
              ? {
                  ...selectedProperties,
                  customProperties: []
                }
              : {
                  ...selectedProperties,
                  customProperties: boardCustomProperties.fields.cardProperties.map((p) => p.id)
                }
          );
        }}
      />
      <Stack>
        {boardCustomProperties.fields.cardProperties.map((property) => {
          return (
            <PropertySelector
              key={property.id}
              isChecked={selectedProperties.customProperties.includes(property.id)}
              label={property.name}
              onClick={() => {
                if (selectedProperties.customProperties.includes(property.id)) {
                  setSelectedProperties({
                    ...selectedProperties,
                    customProperties: selectedProperties.customProperties.filter((p) => p !== property.id)
                  });
                } else {
                  setSelectedProperties({
                    ...selectedProperties,
                    customProperties: [...selectedProperties.customProperties, property.id]
                  });
                }
              }}
            />
          );
        })}
      </Stack>
    </Stack>
  );
}

export function CustomPropertiesReadonlyList({
  selectedProperties
}: {
  selectedProperties: SelectedProposalProperties;
}) {
  const { boardCustomProperties } = useProposalsBoardAdapter();

  if (selectedProperties.customProperties.length === 0) {
    return null;
  }

  const selectedCustomProperties = boardCustomProperties.fields.cardProperties.filter((property) =>
    selectedProperties.customProperties.includes(property.id)
  );

  return (
    <Stack>
      <Typography fontWeight='bold' variant='h6'>
        Custom Properties
      </Typography>
      <Stack gap={0.5} mt={0.5}>
        {selectedCustomProperties.map((property) => {
          return (
            <Typography fontWeight={500} color='secondary' variant='subtitle1' key={property.id}>
              {property.name}
            </Typography>
          );
        })}
      </Stack>
      <Divider
        sx={{
          my: 2
        }}
      />
    </Stack>
  );
}
