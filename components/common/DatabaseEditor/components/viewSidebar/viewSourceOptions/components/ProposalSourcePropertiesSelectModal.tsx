import CloseIcon from '@mui/icons-material/Close';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import WidgetsOutlinedIcon from '@mui/icons-material/WidgetsOutlined';
import { Checkbox, Dialog, IconButton, ListItemIcon, ListItemText, MenuItem, Stack, Typography } from '@mui/material';
import { useMemo, useState } from 'react';
import { FaBriefcase } from 'react-icons/fa';

import { Button } from 'components/common/Button';
import { SectionName } from 'components/common/PageLayout/components/Sidebar/components/SectionName';
import { useProposalTemplates } from 'components/proposals/hooks/useProposalTemplates';
import { useSmallScreen } from 'hooks/useMediaScreens';
import { projectFieldProperties, projectMemberFieldProperties } from 'lib/projects/formField';

export type SelectedProperties = {
  projectMember: string[];
  project: string[];
  templates: {
    id: string;
    formFields: string[];
  }[];
};

type SelectedGroup =
  | {
      group: 'project_profile';
    }
  | {
      group: 'templates';
      templateId: string;
    };

const projectMemberFields = projectMemberFieldProperties.map((propertyFieldProperty) => propertyFieldProperty.field);
const projectFields = projectFieldProperties.map((propertyFieldProperty) => propertyFieldProperty.field);

function ProjectProfilePropertiesReadOnlyList({ selectedProperties }: { selectedProperties: SelectedProperties }) {
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
    <Stack mt={1} pl={2}>
      <Typography fontWeight='bold' mb={0.5} variant='subtitle1'>
        Project Profile
      </Typography>
      <Stack gap={0.5} ml={2}>
        {selectedProjectFields.map((propertyFieldProperty) => (
          <Typography variant='subtitle2' key={propertyFieldProperty.field}>
            {propertyFieldProperty.columnTitle}
          </Typography>
        ))}
        {selectedProjectMemberFields.length === 0 ? null : (
          <>
            <Typography fontWeight='bold' variant='subtitle1'>
              Project Member
            </Typography>
            <Stack gap={0.5} ml={2}>
              {selectedProjectMemberFields.map((projectMemberFieldProperty) => (
                <Typography variant='subtitle2' key={projectMemberFieldProperty.field}>
                  {projectMemberFieldProperty.label}
                </Typography>
              ))}
            </Stack>
          </>
        )}
      </Stack>
    </Stack>
  );
}

function ProjectProfilePropertiesList({
  selectedProperties,
  setSelectedProperties
}: {
  setSelectedProperties: (selectedProperties: SelectedProperties) => void;
  selectedProperties: SelectedProperties;
}) {
  const isAllProjectMemberPropertiesSelected =
    selectedProperties.projectMember.length === projectMemberFieldProperties.length;

  const isAllProjectPropertiesSelected =
    selectedProperties.project.length === projectFieldProperties.length && isAllProjectMemberPropertiesSelected;

  return (
    <Stack>
      <Stack direction='row' alignItems='center'>
        <Checkbox
          size='small'
          checked={isAllProjectPropertiesSelected}
          onChange={() => {
            setSelectedProperties(
              isAllProjectPropertiesSelected
                ? {
                    projectMember: [],
                    project: [],
                    templates: []
                  }
                : {
                    projectMember: [...projectMemberFields],
                    project: [...projectFields],
                    templates: selectedProperties.templates
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
            alignItems='center'
            direction='row'
            sx={{
              cursor: 'pointer'
            }}
            key={propertyFieldProperty.field}
          >
            <Checkbox size='small' checked={selectedProperties.project.includes(propertyFieldProperty.field)} />
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
            setSelectedProperties({
              ...selectedProperties,
              projectMember: isAllProjectMemberPropertiesSelected ? [] : [...projectMemberFields]
            });
          }}
        >
          <Checkbox size='small' checked={isAllProjectMemberPropertiesSelected} />
          <Typography fontWeight='bold'>Project Member</Typography>
        </Stack>
        <Stack gap={0} ml={2}>
          {projectMemberFieldProperties.map((projectMemberFieldProperty) => (
            <Stack
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
              alignItems='center'
              direction='row'
              sx={{
                cursor: 'pointer'
              }}
              key={projectMemberFieldProperty.field}
            >
              <Checkbox
                size='small'
                checked={selectedProperties.projectMember.includes(projectMemberFieldProperty.field)}
              />
              <Typography variant='subtitle1'>{projectMemberFieldProperty.label}</Typography>
            </Stack>
          ))}
        </Stack>
      </Stack>
    </Stack>
  );
}

export function ProposalSourcePropertiesSelectModal({
  onClose,
  onApply
}: {
  onApply: (selectedProperties: SelectedProperties) => void;
  onClose: VoidFunction;
}) {
  const [selectedProperties, setSelectedProperties] = useState<SelectedProperties>({
    projectMember: [],
    project: [],
    templates: []
  });
  const [selectedGroup, setSelectedGroup] = useState<SelectedGroup>({
    group: 'project_profile'
  });
  const noPropertiesSelected =
    selectedProperties.project.length === 0 &&
    selectedProperties.projectMember.length === 0 &&
    selectedProperties.templates.length === 0;

  const { proposalTemplates } = useProposalTemplates();

  const proposalTemplatePages = useMemo(() => {
    return (proposalTemplates || [])
      .filter((proposal) => !proposal.archived && !proposal.draft)
      .map((proposal) => ({
        id: proposal.pageId,
        title: proposal.title,
        proposalId: proposal.proposalId,
        isStructuredProposal: proposal.contentType === 'structured'
      }));
  }, [proposalTemplates]);

  const isMobile = useSmallScreen();

  return (
    <Dialog
      fullWidth
      maxWidth='lg'
      fullScreen={isMobile}
      PaperProps={{
        sx: {
          maxHeight: 800,
          height: { md: '90vh' },
          background: (theme) =>
            theme.palette.mode === 'dark' ? 'var(--background-dark)' : 'var(--background-default)',
          borderRadius: (theme) => theme.spacing(1)
        }
      }}
      open
      onClose={onClose}
    >
      <Stack gap={1} direction='row'>
        <Stack
          gap={1}
          sx={{
            width: '30%',
            pt: 3,
            backgroundColor: (theme) => theme.palette.sidebar.background
          }}
        >
          <SectionName>Groups</SectionName>
          <MenuItem
            dense
            onClick={() => {
              setSelectedGroup({
                group: 'project_profile'
              });
            }}
            sx={{ mb: 1 }}
          >
            <ListItemIcon>
              <FaBriefcase fontSize='small' />
            </ListItemIcon>
            <ListItemText>Project Profile</ListItemText>
          </MenuItem>
          <SectionName>Templates</SectionName>
          {proposalTemplatePages.map((template) => (
            <MenuItem
              key={template.id}
              dense
              onClick={() => {
                setSelectedGroup({
                  group: 'templates',
                  templateId: template.id
                });
              }}
            >
              <ListItemIcon>
                {template.isStructuredProposal ? <WidgetsOutlinedIcon /> : <DescriptionOutlinedIcon />}
              </ListItemIcon>
              <ListItemText>{template.title || 'Untitled'}</ListItemText>
            </MenuItem>
          ))}
          {proposalTemplatePages.length === 0 && (
            <Typography pl={2} variant='caption'>
              No proposal templates
            </Typography>
          )}
        </Stack>
        <Stack gap={1} p={2} overflow='auto' height='90vh' width='100%'>
          {selectedGroup?.group === 'project_profile' ? (
            <>
              <Typography variant='h6'>Project profile properties</Typography>
              <ProjectProfilePropertiesList
                selectedProperties={selectedProperties}
                setSelectedProperties={setSelectedProperties}
              />
            </>
          ) : null}
        </Stack>
        <Stack
          gap={1}
          sx={{
            width: '40%',
            pt: 3,
            height: '90vh',
            backgroundColor: (theme) => theme.palette.sidebar.background
          }}
        >
          <Stack
            sx={{
              overflow: 'auto',
              height: '80vh'
            }}
          >
            <SectionName>Selected Properties</SectionName>
            <ProjectProfilePropertiesReadOnlyList selectedProperties={selectedProperties} />
            {noPropertiesSelected && (
              <Typography pl={2} variant='caption'>
                No properties selected
              </Typography>
            )}
          </Stack>
          <Button
            sx={{
              position: 'absolute',
              bottom: 16,
              right: 16
            }}
            onClick={() => {
              onApply(selectedProperties);
            }}
          >
            Apply
          </Button>
        </Stack>
        <IconButton
          onClick={onClose}
          sx={{
            position: 'absolute',
            right: 15,
            top: 15,
            zIndex: 1
          }}
        >
          <CloseIcon color='secondary' fontSize='small' />
        </IconButton>
      </Stack>
    </Dialog>
  );
}
