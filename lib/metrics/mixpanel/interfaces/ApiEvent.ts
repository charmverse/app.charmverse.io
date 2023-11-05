import type { BaseEvent } from './BaseEvent';

/**
 * @type key refers to the API Endpoint
 * @method - the HTTP method
 */
type ApiEvent = BaseEvent & {
  endpoint: string;
  method: string;
  pageId?: string;
};

type PartnerApiEvent = ApiEvent & {
  partnerKey: string;
};

export interface ApiEventMap {
  space_api_call: ApiEvent;
  partner_api_call: PartnerApiEvent;
}
