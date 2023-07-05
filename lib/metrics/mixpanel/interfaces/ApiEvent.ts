import type { BaseEvent } from './BaseEvent';

/**
 * @type key refers to the API Endpoint
 * @method - the HTTP method
 */
type ApiEvent = BaseEvent & {
  type: string;
  method: string;
};
export interface ApiEventMap {
  space_api_call: ApiEvent;
  partner_api_call: ApiEvent;
}
