import { Checkbox, Stack, Typography } from '@mui/material';
import { useState } from 'react';

import { Button } from 'components/common/Button';
import Modal from 'components/common/Modal';
import { projectFieldProperties, projectMemberFieldProperties } from 'lib/projects/formField';

export function ProposalSourcePropertiesSelectModal({
  onClose,
  onApply
}: {
  onApply: (selectProperties: string[]) => void;
  onClose: VoidFunction;
}) {
  const [selectedProjectProfileProperties, setSelectedProjectProfileProperties] = useState<{
    projectMemberProperties: string[];
    projectProperties: string[];
  }>({
    projectMemberProperties: [],
    projectProperties: []
  });

  const isProjectMemberPropertiesChecked =
    selectedProjectProfileProperties.projectMemberProperties.length === projectMemberFieldProperties.length;

  const isAllProjectProfilePropertiesSelected =
    selectedProjectProfileProperties.projectProperties.length === projectFieldProperties.length &&
    isProjectMemberPropertiesChecked;

  return (
    <Modal size='large' open onClose={onClose} title='Select Proposal Source Properties'>
      <Stack gap={1}>
        <Stack gap={1} direction='row'>
          <Stack
            gap={1}
            sx={{
              width: {
                xs: '100%',
                sm: '30%'
              },
              padding: 2,
              backgroundColor: (theme) => theme.palette.sidebar.background
            }}
          >
            Sidebar
          </Stack>
          <Stack gap={1}>
            <Typography variant='h6'>Selected Variables</Typography>
            <Stack>
              <Stack direction='row' alignItems='center'>
                <Checkbox
                  size='small'
                  checked={isAllProjectProfilePropertiesSelected}
                  onChange={() => {
                    setSelectedProjectProfileProperties(
                      isAllProjectProfilePropertiesSelected
                        ? {
                            projectMemberProperties: [],
                            projectProperties: []
                          }
                        : {
                            projectMemberProperties: projectMemberFieldProperties.map(
                              (propertyFieldProperty) => propertyFieldProperty.field
                            ),
                            projectProperties: projectFieldProperties.map(
                              (propertyFieldProperty) => propertyFieldProperty.field
                            )
                          }
                    );
                  }}
                />
                <Typography fontWeight='bold'>Project Profile</Typography>
              </Stack>
              <Stack gap={0} ml={2}>
                {projectFieldProperties.map((propertyFieldProperty) => (
                  <Stack
                    onClick={() => {
                      const isChecked = selectedProjectProfileProperties.projectProperties.includes(
                        propertyFieldProperty.field
                      );
                      setSelectedProjectProfileProperties({
                        projectProperties: isChecked
                          ? selectedProjectProfileProperties.projectProperties.filter(
                              (selectedProperty) => selectedProperty !== propertyFieldProperty.field
                            )
                          : [...selectedProjectProfileProperties.projectProperties, propertyFieldProperty.field],
                        projectMemberProperties: selectedProjectProfileProperties.projectMemberProperties
                      });
                    }}
                    alignItems='center'
                    direction='row'
                    sx={{
                      cursor: 'pointer'
                    }}
                    key={propertyFieldProperty.field}
                  >
                    <Checkbox
                      size='small'
                      checked={selectedProjectProfileProperties.projectProperties.includes(propertyFieldProperty.field)}
                    />
                    <Typography variant='subtitle1'>{propertyFieldProperty.columnTitle}</Typography>
                  </Stack>
                ))}
                <Stack
                  direction='row'
                  alignItems='center'
                  sx={{
                    cursor: 'pointer'
                  }}
                  onClick={() => {
                    setSelectedProjectProfileProperties({
                      projectProperties: selectedProjectProfileProperties.projectProperties,
                      projectMemberProperties: isProjectMemberPropertiesChecked
                        ? []
                        : projectMemberFieldProperties.map((propertyFieldProperty) => propertyFieldProperty.field)
                    });
                  }}
                >
                  <Checkbox size='small' checked={isProjectMemberPropertiesChecked} />
                  <Typography fontWeight='bold'>Project Member</Typography>
                </Stack>
                <Stack gap={0} ml={2}>
                  {projectMemberFieldProperties.map((projectMemberFieldProperty) => (
                    <Stack
                      onClick={() => {
                        const isChecked = selectedProjectProfileProperties.projectMemberProperties.includes(
                          projectMemberFieldProperty.field
                        );
                        setSelectedProjectProfileProperties({
                          projectProperties: selectedProjectProfileProperties.projectProperties,
                          projectMemberProperties: isChecked
                            ? selectedProjectProfileProperties.projectMemberProperties.filter(
                                (selectedProperty) => selectedProperty !== projectMemberFieldProperty.field
                              )
                            : [
                                ...selectedProjectProfileProperties.projectMemberProperties,
                                projectMemberFieldProperty.field
                              ]
                        });
                      }}
                      alignItems='center'
                      direction='row'
                      sx={{
                        cursor: 'pointer'
                      }}
                      key={projectMemberFieldProperty.field}
                    >
                      <Checkbox
                        size='small'
                        checked={selectedProjectProfileProperties.projectMemberProperties.includes(
                          projectMemberFieldProperty.field
                        )}
                      />
                      <Typography variant='subtitle1'>{projectMemberFieldProperty.label}</Typography>
                    </Stack>
                  ))}
                </Stack>
              </Stack>
            </Stack>
          </Stack>
        </Stack>
        <Stack direction='row' justifyContent='flex-end'>
          <Button
            onClick={() => {
              onApply([]);
            }}
          >
            Apply
          </Button>
        </Stack>
      </Stack>
    </Modal>
  );
}
