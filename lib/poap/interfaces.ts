import { ExtendedPoap } from 'models';

export interface GetPoapsResponse {
    visiblePoaps: Array<Partial<ExtendedPoap>>;
    hiddenPoaps: Array<Partial<ExtendedPoap>>;
}

export interface UpdatePoapsResponse {
    newShownPoaps: Array<ExtendedPoap>;
    newHiddenPoaps: Array<ExtendedPoap>;
}
