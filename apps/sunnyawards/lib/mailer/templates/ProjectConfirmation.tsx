import type { Project, ProjectMember } from '@charmverse/core/prisma-client';
import { baseUrl } from '@root/config/constants';
import { EmailWrapper, Link, Text } from '@root/lib/mailer/emails/templates/components';
import React from 'react';

function ProjectField({ label, value }: { label: string; value: string | number }) {
  return (
    <>
      <Text
        variant='subtitle1'
        style={{
          lineHeight: 1
        }}
      >
        {label}
      </Text>
      <Text
        style={{
          lineHeight: 1,
          marginBottom: 30
        }}
      >
        {value}
      </Text>
    </>
  );
}

export function ProjectConfirmation({
  project
}: {
  project: Project & {
    projectMembers: ProjectMember[];
  };
}) {
  const projectType = project.sunnyAwardsProjectType;
  return (
    <EmailWrapper
      title='Congratulations you just entered the Sunnys'
      emailBranding={{
        artwork: `${baseUrl}/images/sunnys-landscape.png`,
        color: '#000000'
      }}
      hideFooter
    >
      <Text>
        Congratulations you just entered the Sunnys, a celebration of everything you have accomplished on the
        Superchain. Learn more about the Sunnys <Link href='https://www.thesunnyawards.fun/'>here</Link>
      </Text>

      <Text>
        You can still change your entry <Link href={`${baseUrl}/p/${project.path}/edit`}>here</Link>
      </Text>

      <Text>The details of your application</Text>

      <Text variant='h3'>Project</Text>
      <ProjectField label='Name' value={project.name} />
      <ProjectField label='Description' value={project.description || 'N/A'} />
      {projectType === 'creator' ? (
        <ProjectField label='Minting wallet address' value={project.mintingWalletAddress || 'N/A'} />
      ) : projectType === 'app' ? (
        <>
          <ProjectField label='Chain ID' value={project.primaryContractChainId || 'N/A'} />
          <ProjectField label='Contract Address' value={project.primaryContractAddress || 'N/A'} />
          <ProjectField label='Deployer Address' value={project.primaryContractDeployer || 'N/A'} />
          <ProjectField label='Deployment Transaction Hash' value={project.primaryContractDeployTxHash || 'N/A'} />
        </>
      ) : null}
      <ProjectField label='Websites' value={project.websites.join(', ') || 'N/A'} />
      <ProjectField label='Category' value={project.category || 'N/A'} />
      <ProjectField label='Farcaster profiles' value={project.farcasterValues.join(', ') || 'N/A'} />
      <ProjectField label='X' value={project.twitter || 'N/A'} />
      <ProjectField label='Github' value={project.github || 'N/A'} />

      <Text variant='h3'>Project Members</Text>
      {project.projectMembers.map((member, index) => (
        <>
          <Text bold>Member {index + 1}</Text>
          <ProjectField key={member.id} label='Name' value={member.name} />
          <ProjectField label='FID' value={member.farcasterId as number} />
        </>
      ))}
    </EmailWrapper>
  );
}
