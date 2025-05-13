import { formScopes } from './config';

export function validateFormScopes(scope: string): boolean {
  return formScopes.split(' ').every((requiredScope) => {
    return scope.includes(requiredScope);
  });
}
