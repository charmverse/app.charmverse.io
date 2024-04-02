import { useState } from 'react';
import { GlobalContext } from 'stories/lib/GlobalContext';

import { ProjectFormEditor } from 'components/settings/projects/ProjectForm';
import type { ProjectAndMembersFieldConfig } from 'lib/projects/interfaces';

export function ProjectFormEditorComponent() {
  const [projectRequiredValues, setProjectRequiredValues] = useState<ProjectAndMembersFieldConfig>({
    projectMember: {}
  });

  return (
    <GlobalContext>
      <ProjectFormEditor fieldConfig={projectRequiredValues} onChange={setProjectRequiredValues} />
    </GlobalContext>
  );
}

export default {
  title: 'Projects/ProjectFormEditor',
  component: ProjectFormEditorComponent
};
