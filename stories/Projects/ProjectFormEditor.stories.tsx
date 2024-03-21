import { useState } from 'react';
import { GlobalContext } from 'stories/lib/GlobalContext';

import type { ProjectEditorFieldConfig } from 'components/projects/interfaces';
import { ProjectFormEditor } from 'components/projects/ProjectForm';

export function ProjectFormEditorComponent() {
  const [projectRequiredValues, setProjectRequiredValues] = useState<ProjectEditorFieldConfig>({
    projectMembers: [{}]
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
