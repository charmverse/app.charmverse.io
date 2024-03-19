import { GlobalContext } from 'stories/lib/GlobalContext';

import { ProjectMemberFields } from 'components/projects/ProjectMemberFields';

export function ProjectMemberFieldsStory() {
  return (
    <GlobalContext>
      <ProjectMemberFields onChange={() => {}} />
    </GlobalContext>
  );
}

export default {
  title: 'Projects/ProjectMemberFields',
  component: ProjectMemberFieldsStory
};
