import { useState } from 'react';
import { GlobalContext } from 'stories/lib/GlobalContext';

import { ProjectFieldEditor } from 'components/common/ProjectForm/components/ProjectField/ProjectFieldEditor';
import type { ProjectAndMembersFieldConfig } from '@packages/lib/projects/formField';

export function ProjectFormEditorComponent() {
  const [projectRequiredValues, setProjectRequiredValues] = useState<ProjectAndMembersFieldConfig>({
    projectMember: {}
  });

  return (
    <GlobalContext>
      <ProjectFieldEditor fieldConfig={projectRequiredValues} onChange={setProjectRequiredValues} />
    </GlobalContext>
  );
}

export default {
  title: 'Projects/ProjectFormEditor',
  component: ProjectFormEditorComponent
};
