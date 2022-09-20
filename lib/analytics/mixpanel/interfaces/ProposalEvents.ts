
export type ProposalEvents= {
  proposalCreated: { id: string; workspaceId: string; userId: string; }
  proposalStageCreated: { id: string; workspaceId: string; userId: string; stageName: string }
}

