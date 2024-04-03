import { App as OctoKitApp } from '@octokit/app';
import { Octokit } from 'octokit';

export const App = OctoKitApp.defaults({
  Octokit
});
