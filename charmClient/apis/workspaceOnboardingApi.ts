import * as http from 'adapters/http';

export class WorkspaceOnboardingApi {
  getWorkspaceOnboarding({ spaceId }: { spaceId: string }) {
    return http.GET<boolean>(`/api/spaces/${spaceId}/get-onboarding`);
  }

  completeOnboarding({ spaceId }: { spaceId: string }) {
    return http.PUT(`/api/spaces/${spaceId}/complete-onboarding`);
  }
}
