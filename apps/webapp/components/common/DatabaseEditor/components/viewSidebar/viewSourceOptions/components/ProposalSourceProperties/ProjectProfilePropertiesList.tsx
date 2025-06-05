import { Stack } from '@mui/material';
import type { SelectedProposalProperties } from '@packages/databases/proposalsSource/interfaces';
import { projectFieldProperties, projectMemberFieldProperties } from '@packages/lib/projects/formField';
import { useMemo } from 'react';

import { PropertySelector } from './PropertiesListSelector';
import { SelectedPropertiesList } from './SelectedPropertiesList';

const projectMemberFields = projectMemberFieldProperties.map((propertyFieldProperty) => propertyFieldProperty.field);
const projectFields = projectFieldProperties.map((propertyFieldProperty) => propertyFieldProperty.field);

export function ProjectProfilePropertiesList({
  selectedProperties,
  setSelectedProperties
}: {
  setSelectedProperties: (selectedProperties: SelectedProposalProperties) => void;
  selectedProperties: SelectedProposalProperties;
}) {
  const isAllProjectMemberPropertiesSelected =
    selectedProperties.projectMember.length === projectMemberFieldProperties.length;

  const isAllProjectPropertiesSelected =
    selectedProperties.project.length === projectFieldProperties.length && isAllProjectMemberPropertiesSelected;

  return (
    <Stack>
      <PropertySelector
        isChecked={isAllProjectPropertiesSelected}
        label='Project Profile'
        bold
        onClick={() => {
          setSelectedProperties(
            isAllProjectPropertiesSelected
              ? {
                  ...selectedProperties,
                  projectMember: [],
                  project: []
                }
              : {
                  ...selectedProperties,
                  projectMember: [...projectMemberFields],
                  project: [...projectFields]
                }
          );
        }}
      />
      <Stack ml={2}>
        {projectFieldProperties.map((propertyFieldProperty) => (
          <PropertySelector
            key={propertyFieldProperty.field}
            isChecked={selectedProperties.project.includes(propertyFieldProperty.field)}
            onClick={() => {
              const isChecked = selectedProperties.project.includes(propertyFieldProperty.field);
              setSelectedProperties({
                ...selectedProperties,
                project: isChecked
                  ? selectedProperties.project.filter(
                      (selectedProperty) => selectedProperty !== propertyFieldProperty.field
                    )
                  : [...selectedProperties.project, propertyFieldProperty.field]
              });
            }}
            label={propertyFieldProperty.columnTitle}
          />
        ))}
        <PropertySelector
          isChecked={isAllProjectMemberPropertiesSelected}
          label='Project Member'
          bold
          onClick={() => {
            setSelectedProperties({
              ...selectedProperties,
              projectMember: isAllProjectMemberPropertiesSelected ? [] : [...projectMemberFields]
            });
          }}
        />
        <Stack ml={2}>
          {projectMemberFieldProperties.map((projectMemberFieldProperty) => (
            <PropertySelector
              key={projectMemberFieldProperty.field}
              isChecked={selectedProperties.projectMember.includes(projectMemberFieldProperty.field)}
              onClick={() => {
                const isChecked = selectedProperties.projectMember.includes(projectMemberFieldProperty.field);
                setSelectedProperties({
                  ...selectedProperties,
                  projectMember: isChecked
                    ? selectedProperties.projectMember.filter(
                        (selectedProperty) => selectedProperty !== projectMemberFieldProperty.field
                      )
                    : [...selectedProperties.projectMember, projectMemberFieldProperty.field]
                });
              }}
              label={projectMemberFieldProperty.label}
            />
          ))}
        </Stack>
      </Stack>
    </Stack>
  );
}

export function ProjectProfilePropertiesReadonlyList({
  selectedProperties
}: {
  selectedProperties: SelectedProposalProperties;
}) {
  const { selectedProjectFields, selectedProjectMemberFields } = useMemo(() => {
    return {
      selectedProjectFields: projectFieldProperties.filter((propertyFieldProperty) =>
        selectedProperties.project.includes(propertyFieldProperty.field)
      ),
      selectedProjectMemberFields: projectMemberFieldProperties.filter((propertyFieldProperty) =>
        selectedProperties.projectMember.includes(propertyFieldProperty.field)
      )
    };
  }, [selectedProperties]);

  if (selectedProjectFields.length === 0 && selectedProjectMemberFields.length === 0) {
    return null;
  }

  return (
    <SelectedPropertiesList
      items={selectedProjectFields.map((propertyFieldProperty) => propertyFieldProperty.columnTitle)}
      title='Project Profile'
      titleVariant='h6'
    >
      {selectedProjectMemberFields.length === 0 ? null : (
        <SelectedPropertiesList
          itemsSx={{
            ml: 2
          }}
          items={selectedProjectMemberFields.map((projectMemberFieldProperty) => projectMemberFieldProperty.label)}
          title='Project Member'
          titleVariant='body2'
          hideDivider
        />
      )}
    </SelectedPropertiesList>
  );
}
