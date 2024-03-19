import { GlobalContext } from 'stories/lib/GlobalContext';

import { ProjectForm } from 'components/projects/ProjectForm';

export function ProjectFormComponent() {
  return (
    <GlobalContext>
      <ProjectForm />
    </GlobalContext>
  );
}

export default {
  title: 'Projects/ProjectForm',
  component: ProjectFormComponent
};
