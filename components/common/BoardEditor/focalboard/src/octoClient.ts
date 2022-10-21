import type { Block } from './blocks/block';
import type { ISharing } from './blocks/sharing';
import type { ClientConfig } from './config/clientConfig';
import { OctoUtils } from './octoUtils';
import type { IUser } from './user';
import { UserSettings } from './userSettings';
import { Utils } from './utils';

//
// OctoClient is the client interface to the server APIs
//
class OctoClient {
  readonly serverUrl: string | undefined;

  private logged = false;

  // this need to be a function rather than a const because
  // one of the global variable (`window.baseURL`) is set at runtime
  // after the first instance of OctoClient is created.
  // Avoiding the race condition becomes more complex than making
  // the base URL dynamic though a function
  private getBaseURL (): string {
    const baseURL = (this.serverUrl || Utils.getBaseURL(true)).replace(/\/$/, '');

    // Logging this for debugging.
    // Logging just once to avoid log noise.
    if (!this.logged) {
      Utils.log(`OctoClient baseURL: ${baseURL}`);
      this.logged = true;
    }

    return baseURL;
  }

  constructor (serverUrl?: string, public workspaceId = '0') {
    this.serverUrl = serverUrl;
  }

  private async getJson (response: Response, defaultValue: unknown): Promise<any> {
    // The server may return null or malformed json
    try {
      const value = await response.json();
      return value || defaultValue;
    }
    catch {
      return defaultValue;
    }
  }

  async getClientConfig (): Promise<ClientConfig | null> {
    const path = '/api/focalboard/clientConfig';
    const response = await fetch(this.getBaseURL() + path, {
      method: 'GET',
      headers: this.headers()
    });
    if (response.status !== 200) {
      return null;
    }

    const json = (await this.getJson(response, {})) as ClientConfig;
    return json;
  }

  async register (email: string, username: string, password: string, token?: string): Promise<{ code: number, json: { error?: string } }> {
    const path = '/api/focalboard/register';
    const body = JSON.stringify({ email, username, password, token });
    const response = await fetch(this.getBaseURL() + path, {
      method: 'POST',
      headers: this.headers(),
      body
    });
    const json = (await this.getJson(response, {})) as { error?: string };
    return { code: response.status, json };
  }

  async changePassword (userId: string, oldPassword: string, newPassword: string): Promise<{ code: number, json: { error?: string } }> {
    const path = `/api/focalboard/users/${encodeURIComponent(userId)}/changepassword`;
    const body = JSON.stringify({ oldPassword, newPassword });
    const response = await fetch(this.getBaseURL() + path, {
      method: 'POST',
      headers: this.headers(),
      body
    });
    const json = (await this.getJson(response, {})) as { error?: string };
    return { code: response.status, json };
  }

  private headers () {
    return {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'X-Requested-With': 'XMLHttpRequest'
    };
  }

  /**
     * Generates workspace's path.
     * Uses workspace ID from `workspaceId` param is provided,
     * Else uses Client's workspaceID if available, else the user's last visited workspace ID.
     */
  private workspacePath (workspaceId?: string) {
    let workspaceIdToUse = workspaceId;
    if (!workspaceId) {
      workspaceIdToUse = this.workspaceId === '0' ? UserSettings.lastWorkspaceId || this.workspaceId : this.workspaceId;
    }

    return `/api/focalboard/workspaces/${workspaceIdToUse}`;
  }

  async getMe (): Promise<IUser | undefined> {
    const path = '/api/focalboard/users/me';
    const response = await fetch(this.getBaseURL() + path, { headers: this.headers() });
    if (response.status !== 200) {
      return undefined;
    }
    const user = (await this.getJson(response, {})) as IUser;
    return user;
  }

  async getUser (userId: string): Promise<IUser | undefined> {
    const path = `/api/focalboard/users/${encodeURIComponent(userId)}`;
    const response = await fetch(this.getBaseURL() + path, { headers: this.headers() });
    if (response.status !== 200) {
      return undefined;
    }
    const user = (await this.getJson(response, {})) as IUser;
    return user;
  }

  async getSubtree (rootId?: string, levels?: number, workspaceID?: string): Promise<Block[]> {
    levels ||= 2;
    let path = `${this.workspacePath(workspaceID)}/blocks/${encodeURIComponent(rootId || '')}/subtree?l=${levels}`;
    const readToken = Utils.getReadToken();
    if (readToken) {
      path += `&read_token=${readToken}`;
    }
    const response = await fetch(this.getBaseURL() + path, { headers: this.headers() });
    if (response.status !== 200) {
      return [];
    }
    const blocks = (await this.getJson(response, [])) as Block[];
    return this.fixBlocks(blocks);
  }

  // If no boardID is provided, it will export the entire archive
  async exportArchive (boardID = ''): Promise<Block[]> {
    const path = `${this.workspacePath()}/blocks/export?root_id=${boardID}`;
    const response = await fetch(this.getBaseURL() + path, { headers: this.headers() });
    if (response.status !== 200) {
      return [];
    }
    const blocks = (await this.getJson(response, [])) as Block[];
    return this.fixBlocks(blocks);
  }

  async importFullArchive (blocks: readonly Block[]): Promise<Response> {
    Utils.log(`importFullArchive: ${blocks.length} blocks(s)`);

    // blocks.forEach((block) => {
    //     Utils.log(`\t ${block.type}, ${block.id}`)
    // })
    const body = JSON.stringify(blocks);
    return fetch(`${this.getBaseURL() + this.workspacePath()}/blocks/import`, {
      method: 'POST',
      headers: this.headers(),
      body
    });
  }

  fixBlocks (blocks: Block[]): Block[] {
    if (!blocks) {
      return [];
    }

    // Hydrate is important, as it ensures that each block is complete to the current model
    const fixedBlocks = OctoUtils.hydrateBlocks(blocks);

    return fixedBlocks;
  }

  // Sharing

  async getSharing (rootId: string): Promise<ISharing | undefined> {
    const path = `${this.workspacePath()}/sharing/${rootId}`;
    const response = await fetch(this.getBaseURL() + path, { headers: this.headers() });
    if (response.status !== 200) {
      return undefined;
    }
    const sharing = (await this.getJson(response, undefined)) as ISharing;
    return sharing;
  }

  async setSharing (sharing: ISharing): Promise<boolean> {
    const path = `${this.workspacePath()}/sharing/${sharing.id}`;
    const body = JSON.stringify(sharing);
    const response = await fetch(
      this.getBaseURL() + path,
      {
        method: 'POST',
        headers: this.headers(),
        body
      }
    );
    if (response.status !== 200) {
      return false;
    }

    return true;
  }

  // Workspace

  async regenerateWorkspaceSignupToken (): Promise<boolean> {
    const path = `${this.workspacePath()}/regenerate_signup_token`;
    const response = await fetch(this.getBaseURL() + path, {
      method: 'POST',
      headers: this.headers()
    });
    if (response.status !== 200) {
      return false;
    }

    return true;
  }

  // Files

  // Returns fileId of uploaded file, or undefined on failure
  async uploadFile (rootID: string, file: File): Promise<string | undefined> {
    // IMPORTANT: We need to post the image as a form. The browser will convert this to a application/x-www-form-urlencoded POST
    const formData = new FormData();
    formData.append('file', file);

    try {
      const headers = this.headers() as Record<string, string>;

      // TIPTIP: Leave out Content-Type here, it will be automatically set by the browser
      delete headers['Content-Type'];

      const response = await fetch(`${this.getBaseURL() + this.workspacePath()}/${rootID}/files`, {
        method: 'POST',
        headers,
        body: formData
      });
      if (response.status !== 200) {
        return undefined;
      }

      try {
        const text = await response.text();
        Utils.log(`uploadFile response: ${text}`);
        const json = JSON.parse(text);

        return json.fileId;
      }
      catch (e) {
        Utils.logError(`uploadFile json ERROR: ${e}`);
      }
    }
    catch (e) {
      Utils.logError(`uploadFile ERROR: ${e}`);
    }

    return undefined;
  }

  async getFileAsDataUrl (rootId: string, fileId: string): Promise<string> {
    let path = `/files/workspaces/${this.workspaceId}/${rootId}/${fileId}`;
    const readToken = Utils.getReadToken();
    if (readToken) {
      path += `?read_token=${readToken}`;
    }
    const response = await fetch(this.getBaseURL() + path, { headers: this.headers() });
    if (response.status !== 200) {
      return '';
    }
    const blob = await response.blob();
    return URL.createObjectURL(blob);
  }

  async getGlobalTemplates (): Promise<Block[]> {
    // const path = this.workspacePath('0') + '/blocks?type=board'
    return [];
  }

}

const octoClient = new OctoClient();

export { OctoClient };
export default octoClient;
