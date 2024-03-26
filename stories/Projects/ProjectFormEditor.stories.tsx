import { useState } from 'react';
import { GlobalContext } from 'stories/lib/GlobalContext';

import { ProjectFormEditor } from 'components/settings/projects/ProjectForm';
import type { ProjectEditorFieldConfig } from 'lib/projects/interfaces';

export function ProjectFormEditorComponent() {
  const [projectRequiredValues, setProjectRequiredValues] = useState<ProjectEditorFieldConfig>({
    projectMember: {}
  });

  return (
    <GlobalContext>
      <ProjectFormEditor values={projectRequiredValues} onChange={setProjectRequiredValues} />
    </GlobalContext>
  );
}

export default {
  title: 'Projects/ProjectFormEditor',
  component: ProjectFormEditorComponent
};
