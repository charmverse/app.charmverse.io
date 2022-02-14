// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

export interface ISharing {
    id: string,
    enabled: boolean,
    token: string,
    updatedBy?: string,
    updatedAt?: number,
}
