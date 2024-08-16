'use client';

import { log } from '@charmverse/core/log';
import { PageWrapper } from '@connect-shared/components/common/PageWrapper';
import type { LoggedInUser } from '@connect-shared/lib/profile/getCurrentUserAction';
import type { ConnectProjectDetails } from '@connect-shared/lib/projects/findProject';
import { yupResolver } from '@hookform/resolvers/yup';
import { useRouter } from 'next/navigation';
import { useAction } from 'next-safe-action/hooks';
import { useForm } from 'react-hook-form';

import { editProjectAction } from 'lib/projects/editProjectAction';
import { schema } from 'lib/projects/form';
import type { FormValues, ProjectCategory } from 'lib/projects/form';

import { ProjectForm } from '../components/ProjectForm';

export function EditProjectPage({ user, project }: { user: LoggedInUser; project: ConnectProjectDetails }) {
  const router = useRouter();

  const { execute, isExecuting } = useAction(editProjectAction, {
    onSuccess: () => {
      router.push(`/p/${project.path}`);
    },
    onError(err) {
      log.error(err.error.serverError?.message || 'Something went wrong', err.error.serverError);
    }
  });

  const { control, handleSubmit } = useForm<FormValues>({
    defaultValues: {
      id: project.id,
      name: project.name,
      avatar: project.avatar ?? '',
      category: project.category as ProjectCategory,
      coverImage: project.coverImage ?? '',
      description: project.description ?? '',
      farcasterValues: project.farcasterValues,
      github: project.github ?? '',
      twitter: project.twitter ?? '',
      websites: project.websites,
      sunnyAwardsProjectType: project.sunnyAwardsProjectType ?? 'other',
      primaryContractChainId: project.primaryContractChainId?.toString() ?? '',
      primaryContractAddress: (project.primaryContractAddress as `0x${string}`) ?? '',
      primaryContractDeployTxHash: (project.primaryContractDeployTxHash as `0x${string}`) ?? '',
      primaryContractDeployer: (project.primaryContractDeployer as `0x${string}`) ?? '',
      mintingWalletAddress: (project.mintingWalletAddress as `0x${string}`) ?? '',
      projectMembers:
        project.projectMembers.map(
          (member) =>
            ({
              farcasterId: member.farcasterUser.fid,
              name: member.farcasterUser.displayName
            } as FormValues['projectMembers'][0])
        ) ?? []
    },
    resolver: yupResolver(schema),
    mode: 'onChange'
  });

  return (
    <PageWrapper bgcolor='transparent'>
      <form
        onSubmit={handleSubmit((data) => {
          execute({
            ...data,
            projectMembers: data.projectMembers.filter((m) => m.farcasterId !== user.farcasterUser?.fid)
          });
        })}
      >
        <ProjectForm control={control} isExecuting={isExecuting} user={user} projectMembers={project.projectMembers} />
      </form>
    </PageWrapper>
  );
}
