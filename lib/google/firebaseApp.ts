import firebase from 'firebase-admin';
import { v4 } from 'uuid';

import { googleWebClientConfig } from 'config/constants';

class FirebaseApp {
  app: firebase.app.App;

  constructor() {
    this.app = firebase.initializeApp(googleWebClientConfig, v4());
  }
}

// This enables us to import the firebase app as a singleton across the app and avoid errors linked to multiple initialisations
export const firebaseApp = new FirebaseApp().app;
