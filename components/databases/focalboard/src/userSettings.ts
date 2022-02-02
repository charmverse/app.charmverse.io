// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {notifySettingsChanged} from './nativeApp'
import {Utils} from './utils'

// eslint-disable-next-line no-shadow
enum UserSettingKey {
    Language = 'language',
    Theme = 'theme',
    LastWorkspaceId = 'lastWorkspaceId',
    LastBoardId = 'lastBoardId',
    LastViewId = 'lastViewId',
    EmojiMartSkin = 'emoji-mart.skin',
    EmojiMartLast = 'emoji-mart.last',
    EmojiMartFrequently = 'emoji-mart.frequently',
    RandomIcons = 'randomIcons',
    MobileWarningClosed = 'mobileWarningClosed',
    WelcomePageViewed = 'welcomePageViewed',
    DashboardShowEmpty = 'dashboardShowEmpty'
}

export class UserSettings {
    static get(key: UserSettingKey): string | null {
        return localStorage.getItem(key)
    }

    static set(key: UserSettingKey, value: string | null): void {
        if (!Object.values(UserSettingKey).includes(key)) {
            return
        }
        if (value === null) {
            localStorage.removeItem(key)
        } else {
            localStorage.setItem(key, value)
        }
        notifySettingsChanged(key)
    }

    static get language(): string | null {
        return UserSettings.get(UserSettingKey.Language)
    }

    static set language(newValue: string | null) {
        UserSettings.set(UserSettingKey.Language, newValue)
    }

    static get welcomePageViewed(): string | null {
        return UserSettings.get(UserSettingKey.WelcomePageViewed)
    }

    static set welcomePageViewed(newValue: string | null) {
        UserSettings.set(UserSettingKey.WelcomePageViewed, newValue)
    }

    static get theme(): string | null {
        return UserSettings.get(UserSettingKey.Theme)
    }

    static set theme(newValue: string | null) {
        UserSettings.set(UserSettingKey.Theme, newValue)
    }

    static get lastWorkspaceId(): string | null {
        return UserSettings.get(UserSettingKey.LastWorkspaceId)
    }

    static set lastWorkspaceId(newValue: string | null) {
        UserSettings.set(UserSettingKey.LastWorkspaceId, newValue)
    }

    static get lastBoardId(): string | null {
        return UserSettings.get(UserSettingKey.LastBoardId)
    }

    static set lastBoardId(newValue: string | null) {
        UserSettings.set(UserSettingKey.LastBoardId, newValue)
    }

    static get lastViewId(): string | null {
        return UserSettings.get(UserSettingKey.LastViewId)
    }

    static set lastViewId(newValue: string | null) {
        UserSettings.set(UserSettingKey.LastViewId, newValue)
    }

    static get prefillRandomIcons(): boolean {
        return UserSettings.get(UserSettingKey.RandomIcons) !== 'false'
    }

    static set prefillRandomIcons(newValue: boolean) {
        UserSettings.set(UserSettingKey.RandomIcons, JSON.stringify(newValue))
    }

    static get dashboardShowEmpty(): boolean {
        return localStorage.getItem(UserSettingKey.DashboardShowEmpty) !== 'false'
    }

    static set dashboardShowEmpty(newValue: boolean) {
        localStorage.setItem(UserSettingKey.DashboardShowEmpty, JSON.stringify(newValue))
    }

    static getEmojiMartSetting(key: string): any {
        const prefixed = `emoji-mart.${key}`
        Utils.assert((Object as any).values(UserSettingKey).includes(prefixed))
        const json = UserSettings.get(prefixed as UserSettingKey)
        return json ? JSON.parse(json) : null
    }

    static setEmojiMartSetting(key: string, value: any): void {
        const prefixed = `emoji-mart.${key}`
        Utils.assert((Object as any).values(UserSettingKey).includes(prefixed))
        UserSettings.set(prefixed as UserSettingKey, JSON.stringify(value))
    }

    static get mobileWarningClosed(): boolean {
        return UserSettings.get(UserSettingKey.MobileWarningClosed) === 'true'
    }

    static set mobileWarningClosed(newValue: boolean) {
        UserSettings.set(UserSettingKey.MobileWarningClosed, String(newValue))
    }
}

export function exportUserSettingsBlob(): string {
    return window.btoa(exportUserSettings())
}

function exportUserSettings(): string {
    const keys = Object.values(UserSettingKey)
    const settings = Object.fromEntries(keys.map((key) => [key, localStorage.getItem(key)]))
    settings.timestamp = `${Date.now()}`
    return JSON.stringify(settings)
}

export function importUserSettingsBlob(blob: string): string[] {
    return importUserSettings(window.atob(blob))
}

function importUserSettings(json: string): string[] {
    const settings = parseUserSettings(json)
    if (!settings) {
        return []
    }
    const timestamp = settings.timestamp
    const lastTimestamp = localStorage.getItem('timestamp')
    if (!timestamp || (lastTimestamp && Number(timestamp) <= Number(lastTimestamp))) {
        return []
    }
    const importedKeys = []
    for (const [key, value] of Object.entries(settings)) {
        if (Object.values(UserSettingKey).includes(key as UserSettingKey)) {
            if (value) {
                localStorage.setItem(key, value as string)
            } else {
                localStorage.removeItem(key)
            }
            importedKeys.push(key)
        }
    }
    return importedKeys
}

function parseUserSettings(json: string): any {
    try {
        return JSON.parse(json)
    } catch (e) {
        return undefined
    }
}
