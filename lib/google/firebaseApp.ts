import firebase from 'firebase-admin';

import { googleWebClientConfig } from 'config/constants';

class FirebaseApp {
  app: firebase.app.App;

  constructor() {
    this.app = firebase.initializeApp(googleWebClientConfig, 'google-verify');
  }
}

// This enables us to import the firebase app as a singleton across the app and avoid errors linked to multiple initialisations
export const firebaseApp = new FirebaseApp().app;
