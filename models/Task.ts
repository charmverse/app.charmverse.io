
export interface Link {
    id: string;
    name: string;
    url:string;
}

export enum TaskType {
    bounty = 'Bounty',
    multisig = 'Multisig',
}

export interface Task {
    id: string;
    date: Date;
    description: string;
    links: Link[];
    type: TaskType;
    workspace: string;
}
