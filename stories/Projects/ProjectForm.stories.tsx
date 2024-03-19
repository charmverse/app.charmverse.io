import { useState } from 'react';
import { GlobalContext } from 'stories/lib/GlobalContext';

import type { ProjectValues } from 'components/projects/interfaces';
import { projectDefaultValues } from 'components/projects/ProjectFields';
import { ProjectForm } from 'components/projects/ProjectForm';
import { projectMemberDefaultValues } from 'components/projects/ProjectMemberFields';

export function ProjectFormComponent() {
  const [project, setProject] = useState<ProjectValues>({
    ...projectDefaultValues,
    members: [projectMemberDefaultValues]
  });

  return (
    <GlobalContext>
      <ProjectForm onChange={setProject} values={project} />
    </GlobalContext>
  );
}

export default {
  title: 'Projects/ProjectForm',
  component: ProjectFormComponent
};
