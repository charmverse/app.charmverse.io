import { Checkbox, Stack, Typography } from '@mui/material';
import { useState } from 'react';

import { Button } from 'components/common/Button';
import Modal from 'components/common/Modal';
import { projectFieldProperties, projectMemberFieldProperties } from 'lib/projects/formField';

export type SelectedVariables = {
  projectMember: string[];
  project: string[];
};

export function ProposalSourcePropertiesSelectModal({
  onClose,
  onApply
}: {
  onApply: (selectedVariables: SelectedVariables) => void;
  onClose: VoidFunction;
}) {
  const [selectedVariables, setSelectedVariables] = useState<SelectedVariables>({
    projectMember: [],
    project: []
  });

  const isProjectMemberChecked = selectedVariables.projectMember.length === projectMemberFieldProperties.length;

  const isAllProjectProfilePropertiesSelected =
    selectedVariables.project.length === projectFieldProperties.length && isProjectMemberChecked;

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
                    setSelectedVariables(
                      isAllProjectProfilePropertiesSelected
                        ? {
                            projectMember: [],
                            project: []
                          }
                        : {
                            projectMember: projectMemberFieldProperties.map(
                              (propertyFieldProperty) => propertyFieldProperty.field
                            ),
                            project: projectFieldProperties.map((propertyFieldProperty) => propertyFieldProperty.field)
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
                      const isChecked = selectedVariables.project.includes(propertyFieldProperty.field);
                      setSelectedVariables({
                        project: isChecked
                          ? selectedVariables.project.filter(
                              (selectedProperty) => selectedProperty !== propertyFieldProperty.field
                            )
                          : [...selectedVariables.project, propertyFieldProperty.field],
                        projectMember: selectedVariables.projectMember
                      });
                    }}
                    alignItems='center'
                    direction='row'
                    sx={{
                      cursor: 'pointer'
                    }}
                    key={propertyFieldProperty.field}
                  >
                    <Checkbox size='small' checked={selectedVariables.project.includes(propertyFieldProperty.field)} />
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
                    setSelectedVariables({
                      project: selectedVariables.project,
                      projectMember: isProjectMemberChecked
                        ? []
                        : projectMemberFieldProperties.map((propertyFieldProperty) => propertyFieldProperty.field)
                    });
                  }}
                >
                  <Checkbox size='small' checked={isProjectMemberChecked} />
                  <Typography fontWeight='bold'>Project Member</Typography>
                </Stack>
                <Stack gap={0} ml={2}>
                  {projectMemberFieldProperties.map((projectMemberFieldProperty) => (
                    <Stack
                      onClick={() => {
                        const isChecked = selectedVariables.projectMember.includes(projectMemberFieldProperty.field);
                        setSelectedVariables({
                          project: selectedVariables.project,
                          projectMember: isChecked
                            ? selectedVariables.projectMember.filter(
                                (selectedProperty) => selectedProperty !== projectMemberFieldProperty.field
                              )
                            : [...selectedVariables.projectMember, projectMemberFieldProperty.field]
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
                        checked={selectedVariables.projectMember.includes(projectMemberFieldProperty.field)}
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
              onApply(selectedVariables);
            }}
          >
            Apply
          </Button>
        </Stack>
      </Stack>
    </Modal>
  );
}
