import { Stack } from '@mui/material';
import { defaultProposalProperties, defaultProposalPropertyTypes } from '@packages/databases/proposalDbProperties';
import type { SelectedProposalProperties } from '@packages/databases/proposalsSource/interfaces';

import { PropertySelector } from './PropertiesListSelector';
import { SelectedPropertiesList } from './SelectedPropertiesList';

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
      <PropertySelector
        isChecked={isAllChecked}
        label='Select All'
        bold
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
      />
      {defaultProposalProperties.map((property) => {
        return (
          <PropertySelector
            key={property.id}
            isChecked={selectedProperties.defaults.includes(property.type)}
            label={property.name}
            onClick={() => {
              if (selectedProperties.defaults.includes(property.type)) {
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
        );
      })}
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
    <SelectedPropertiesList
      title='Proposal Defaults'
      titleVariant='h6'
      items={selectedDefaultProperties.map((property) => property.name)}
    />
  );
}
