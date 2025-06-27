// A permission mapping is a mapping of a permission group to a list of operations
// Example is page permission {editor: ['view', 'edit', 'comment']}
export type OperationGroupMapping<G extends string, O extends string> = { [key in G]: readonly O[] };
