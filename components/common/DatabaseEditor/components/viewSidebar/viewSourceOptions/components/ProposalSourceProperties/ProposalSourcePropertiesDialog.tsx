import CloseIcon from '@mui/icons-material/Close';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import WidgetsOutlinedIcon from '@mui/icons-material/WidgetsOutlined';
import {
  Box,
  Checkbox,
  Dialog,
  IconButton,
  ListItemIcon,
  ListItemText,
  MenuItem,
  Stack,
  Typography
} from '@mui/material';
import { useMemo, useState } from 'react';
import { FaBriefcase } from 'react-icons/fa';

import { Button } from 'components/common/Button';
import { SectionName } from 'components/common/PageLayout/components/Sidebar/components/SectionName';
import { useProposalTemplates } from 'components/proposals/hooks/useProposalTemplates';
import { useSmallScreen } from 'hooks/useMediaScreens';

import { ProjectProfilePropertiesList, ProjectProfilePropertiesReadOnlyList } from './ProjectProfilePropertiesList';
import { TemplatePropertiesList } from './TemplatePropertiesList';

export type SelectedProperties = {
  projectMember: string[];
  project: string[];
  customProperties: string[];
  templates: {
    pageId: string;
    rubricEvaluations: {
      id: string;
      average?: boolean;
      total?: boolean;
      reviewers?: boolean;
      criteriasTotal?: boolean;
    }[];
    formFields: string[];
  }[];
};

type SelectedGroup =
  | {
      group: 'project_profile';
    }
  | {
      group: 'templates';
      pageId: string;
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
    templates: [],
    customProperties: []
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
              key={template.pageId}
              dense
              onClick={() => {
                setSelectedProperties({
                  ...selectedProperties,
                  templates: [
                    ...selectedProperties.templates,
                    {
                      pageId: template.pageId,
                      rubricEvaluations: [],
                      formFields: []
                    }
                  ]
                });
                setSelectedGroup({
                  group: 'templates',
                  pageId: template.pageId
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
          {selectedGroup?.group === 'project_profile' && (
            <>
              <Typography variant='h6'>Project profile properties</Typography>
              <ProjectProfilePropertiesList
                selectedProperties={selectedProperties}
                setSelectedProperties={setSelectedProperties}
              />
            </>
          )}
          {selectedGroup.group === 'templates' && (
            <>
              <Typography variant='h6'>Template properties</Typography>
              <TemplatePropertiesList
                selectedProperties={selectedProperties}
                setSelectedProperties={setSelectedProperties}
                templatePageId={selectedGroup.pageId}
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
            <Box mt={1} pl={2}>
              <ProjectProfilePropertiesReadOnlyList selectedProperties={selectedProperties} />
              {noPropertiesSelected && <Typography variant='caption'>No properties selected</Typography>}
            </Box>
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
