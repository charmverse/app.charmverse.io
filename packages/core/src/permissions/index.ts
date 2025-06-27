// Space permission exports
export * from './hasAccessToSpace';
export * from './spaces/availableSpacePermissions';
export * from './spaces/client/interfaces';
export * from './spaces/interfaces';

// Forum permission exports
export * from './forums/availablePostCategoryPermissions.class';
export * from './forums/availablePostPermissions.class';
export * from './forums/client/interfaces';
export * from './forums/interfaces';
export * from './forums/policies/index';
export * from './forums/policies/interfaces';

// Proposal permission exports
export * from './proposals/availableProposalPermissions.class';
export * from './proposals/client/interfaces';
export * from './proposals/interfaces';
export * from './proposals/isProposalAuthor';

// Page permission exports
export * from './pages/availablePagePermissions.class';
export * from './pages/client/interfaces';
export * from './pages/copyPagePermissions';
export * from './pages/interfaces';

// Core and general permission exports
export { getPermissionAssignee } from './core/getPermissionAssignee';
export * from './core/interfaces';
export * from './core/policies';

export * from './getSpaceInfoViaResource';
export * from './permissionsApiClient.class';
