import { ExtendedPoap } from 'models';

export interface GetPoapsResponse {
    poaps: Array<Partial<ExtendedPoap>>;
    hidden: Array<string>;
}

