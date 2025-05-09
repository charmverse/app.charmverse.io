import { googleWebClientConfig } from '@packages/config/constants';
import firebase from 'firebase-admin';
import { v4 } from 'uuid';

class FirebaseApp {
  app: firebase.app.App;

  constructor() {
    // Random name is useful to avoid throwing an error in localhost where multiple conflicting named instances exist due to hot module load
    this.app = firebase.initializeApp(googleWebClientConfig, v4());
  }
}

export type DecodedIdToken = Awaited<ReturnType<ReturnType<firebase.app.App['auth']>['verifyIdToken']>>;

// This enables us to import the firebase app as a singleton across the app and avoid errors linked to multiple initialisations
export const firebaseApp = new FirebaseApp().app;
