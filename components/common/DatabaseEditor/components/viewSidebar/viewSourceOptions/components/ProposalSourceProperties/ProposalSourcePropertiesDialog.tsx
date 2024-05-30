import CloseIcon from '@mui/icons-material/Close';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import WidgetsOutlinedIcon from '@mui/icons-material/WidgetsOutlined';
import { Dialog, IconButton, ListItemIcon, ListItemText, MenuItem, Stack, Typography } from '@mui/material';
import { useMemo, useState } from 'react';

import { Button } from 'components/common/Button';
import { SectionName } from 'components/common/PageLayout/components/Sidebar/components/SectionName';
import { useProposalTemplates } from 'components/proposals/hooks/useProposalTemplates';
import { useSmallScreen } from 'hooks/useMediaScreens';

import { FormFieldPropertiesList, FormFieldPropertiesReadonlyList } from './FormFieldPropertiesList';
import { ProjectProfilePropertiesList, ProjectProfilePropertiesReadOnlyList } from './ProjectProfilePropertiesList';
import {
  RubricEvaluationPropertiesList,
  RubricEvaluationPropertiesReadonlyList
} from './RubricEvaluationPropertiesList';

export type SelectedProperties = {
  projectMember: string[];
  project: string[];
  customProperties: string[];
  rubricEvaluations: {
    title: string;
    average?: boolean;
    total?: boolean;
    reviewers?: boolean;
    criteriaTotal?: boolean;
  }[];
  formFields: string[];
};

type SelectedGroup =
  | {
      group: 'projectProfile';
    }
  | {
      group: 'formFields';
      pageId: string;
    }
  | {
      group: 'rubricEvaluations';
    };

export function ProposalSourcePropertiesDialog({
  onClose,
  onApply
}: {
  onApply: (selectedProperties: SelectedProperties) => void;
  onClose: VoidFunction;
}) {
  const [selectedProperties, setSelectedProperties] = useState<SelectedProperties>({
    projectMember: [],
    project: [],
    formFields: [],
    rubricEvaluations: [],
    customProperties: []
  });
  const [selectedGroup, setSelectedGroup] = useState<SelectedGroup>({
    group: 'projectProfile'
  });

  const noPropertiesSelected =
    selectedProperties.project.length === 0 &&
    selectedProperties.projectMember.length === 0 &&
    selectedProperties.formFields.length === 0 &&
    selectedProperties.customProperties.length === 0 &&
    selectedProperties.rubricEvaluations.length === 0;

  const { proposalTemplates } = useProposalTemplates();

  const proposalTemplatePages = useMemo(() => {
    return (proposalTemplates || [])
      .filter(
        (proposal) =>
          !proposal.archived &&
          !proposal.draft &&
          proposal.formFields &&
          proposal.formFields.filter((formField) => formField.type !== 'project_profile' && formField.type !== 'label')
            .length > 0
      )
      .map((proposal) => ({
        pageId: proposal.pageId,
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
            width: '40%',
            pt: 3,
            backgroundColor: (theme) => theme.palette.sidebar.background
          }}
        >
          <SectionName>Groups</SectionName>
          <Stack>
            <MenuItem
              dense
              onClick={() => {
                setSelectedGroup({
                  group: 'projectProfile'
                });
              }}
            >
              <ListItemText>Project Profile</ListItemText>
            </MenuItem>
            <MenuItem
              dense
              onClick={() => {
                setSelectedGroup({
                  group: 'rubricEvaluations'
                });
              }}
            >
              <ListItemText>Rubric Evaluations</ListItemText>
            </MenuItem>
          </Stack>
          <SectionName>Templates</SectionName>
          <Stack>
            {proposalTemplatePages.length ? (
              proposalTemplatePages.map((template) => (
                <MenuItem
                  key={template.pageId}
                  dense
                  onClick={() => {
                    setSelectedGroup({
                      group: 'formFields',
                      pageId: template.pageId
                    });
                  }}
                >
                  <ListItemIcon>
                    {template.isStructuredProposal ? <WidgetsOutlinedIcon /> : <DescriptionOutlinedIcon />}
                  </ListItemIcon>
                  <ListItemText>{template.title || 'Untitled'}</ListItemText>
                </MenuItem>
              ))
            ) : (
              <Typography pl={2} variant='caption'>
                No proposal templates
              </Typography>
            )}
          </Stack>
        </Stack>
        <Stack gap={1} p={2} overflow='auto' height='90vh' width='100%'>
          {selectedGroup?.group === 'projectProfile' && (
            <>
              <Typography variant='h6'>Project profile properties</Typography>
              <ProjectProfilePropertiesList
                selectedProperties={selectedProperties}
                setSelectedProperties={setSelectedProperties}
              />
            </>
          )}
          {selectedGroup.group === 'rubricEvaluations' && (
            <>
              <Typography variant='h6'>Rubric evaluations properties</Typography>
              <RubricEvaluationPropertiesList
                selectedProperties={selectedProperties}
                setSelectedProperties={setSelectedProperties}
              />
            </>
          )}
          {selectedGroup.group === 'formFields' && (
            <>
              <Typography variant='h6'>Form field properties</Typography>
              <FormFieldPropertiesList
                templatePageId={selectedGroup.pageId}
                selectedProperties={selectedProperties}
                setSelectedProperties={setSelectedProperties}
              />
            </>
          )}
        </Stack>
        <Stack
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
            <Stack p={2}>
              <ProjectProfilePropertiesReadOnlyList selectedProperties={selectedProperties} />
              <RubricEvaluationPropertiesReadonlyList selectedProperties={selectedProperties} />
              <FormFieldPropertiesReadonlyList selectedProperties={selectedProperties} />
              {noPropertiesSelected && <Typography variant='caption'>No properties selected</Typography>}
            </Stack>
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
