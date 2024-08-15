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

  const {
    control,
    formState: { isValid },
    handleSubmit
  } = useForm<FormValues>({
    defaultValues: {
      id: project.id,
      name: project.name,
      avatar: project.avatar ?? undefined,
      category: project.category as ProjectCategory,
      coverImage: project.coverImage ?? undefined,
      description: project.description ?? undefined,
      farcasterValues: project.farcasterValues,
      github: project.github ?? undefined,
      twitter: project.twitter ?? undefined,
      websites: project.websites,
      sunnyAwardsProjectType: project.sunnyAwardsProjectType ?? undefined,
      primaryContractChainId: project.primaryContractChainId?.toString() ?? undefined,
      primaryContractAddress: (project.primaryContractAddress as `0x${string}`) ?? undefined,
      primaryContractDeployTxHash: (project.primaryContractDeployTxHash as `0x${string}`) ?? undefined,
      primaryContractDeployer: (project.primaryContractDeployer as `0x${string}`) ?? undefined,
      mintingWalletAddress: (project.mintingWalletAddress as `0x${string}`) ?? undefined,
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
          execute(data);
        })}
      >
        <ProjectForm control={control} isExecuting={isExecuting} user={user} />
      </form>
    </PageWrapper>
  );
}
