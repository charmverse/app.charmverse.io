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

export type SelectedVariables = {
  projectMember: string[];
  project: string[];
  templates: {
    id: string;
  }[];
};

const projectMemberFields = projectMemberFieldProperties.map((propertyFieldProperty) => propertyFieldProperty.field);
const projectFields = projectFieldProperties.map((propertyFieldProperty) => propertyFieldProperty.field);

export function ProposalSourcePropertiesSelectModal({
  onClose,
  onApply
}: {
  onApply: (selectedVariables: SelectedVariables) => void;
  onClose: VoidFunction;
}) {
  const [selectedVariables, setSelectedVariables] = useState<SelectedVariables>({
    projectMember: [],
    project: [],
    templates: []
  });

  const { isLoadingTemplates, proposalTemplates } = useProposalTemplates();

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

  const isProjectMemberChecked = selectedVariables.projectMember.length === projectMemberFieldProperties.length;

  const isAllProjectProfilePropertiesSelected =
    selectedVariables.project.length === projectFieldProperties.length && isProjectMemberChecked;

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
            width: {
              xs: '100%',
              sm: '30%'
            },
            pt: 3,
            backgroundColor: (theme) => theme.palette.sidebar.background
          }}
        >
          <SectionName>Groups</SectionName>
          <MenuItem
            dense
            onClick={() => {
              setSelectedVariables({
                projectMember: [...projectMemberFields],
                project: [...projectFields],
                templates: selectedVariables.templates
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
            <MenuItem key={template.id} dense>
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
                          project: [],
                          templates: []
                        }
                      : {
                          projectMember: [...projectMemberFields],
                          project: [...projectFields],
                          templates: selectedVariables.templates
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
                      ...selectedVariables,
                      project: isChecked
                        ? selectedVariables.project.filter(
                            (selectedProperty) => selectedProperty !== propertyFieldProperty.field
                          )
                        : [...selectedVariables.project, propertyFieldProperty.field]
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
                    ...selectedVariables,
                    projectMember: isProjectMemberChecked ? [] : [...projectMemberFields]
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
                        ...selectedVariables,
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
          <Button
            sx={{
              position: 'absolute',
              bottom: 16,
              right: 16
            }}
            onClick={() => {
              onApply(selectedVariables);
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
