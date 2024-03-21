import { useState } from 'react';
import { GlobalContext } from 'stories/lib/GlobalContext';

import type { ProjectValues } from 'components/projects/interfaces';
import { projectDefaultValues } from 'components/projects/ProjectFields';
import { ProjectFormAnswers } from 'components/projects/ProjectForm';
import { projectMemberDefaultValues } from 'components/projects/ProjectMemberFields';

export function ProjectFormAnswersComponent() {
  const [project, setProject] = useState<ProjectValues>({
    ...projectDefaultValues,
    projectMembers: [projectMemberDefaultValues]
  });

  return (
    <GlobalContext>
      <ProjectFormAnswers onChange={setProject} values={project} />
    </GlobalContext>
  );
}

export default {
  title: 'Projects/ProjectFormAnswers',
  component: ProjectFormAnswersComponent
};
