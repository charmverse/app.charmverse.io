import { useState } from 'react';
import { GlobalContext } from 'stories/lib/GlobalContext';

import { ProjectFormEditor } from 'components/settings/projects/ProjectForm';
import type { ProjectFieldConfig } from 'lib/projects/interfaces';

export function ProjectFormEditorComponent() {
  const [projectRequiredValues, setProjectRequiredValues] = useState<ProjectFieldConfig>({
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
