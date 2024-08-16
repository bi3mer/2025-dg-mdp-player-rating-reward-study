import { initializeApp } from "firebase/app";
import { addDoc, getFirestore, collection, Firestore } from "firebase/firestore";

import { Global } from "./Global";

export class DB {
  private static db: Firestore;

  public static init() {
    // Initialize Firebase, @NOTE: this is insecure and bad
    const app = initializeApp({
      "apiKey": "AIzaSyD6v26BmHUqqngOx7Bu6REP2t5mJNJlhlk",
      "authDomain": "exag-dungeongrams-study.firebaseapp.com",
      "projectId": "exag-dungeongrams-study",
      "storageBucket": "exag-dungeongrams-study.appspot.com",
      "messagingSenderId": "970729390672",
      "appId": "1:970729390672:web:c6231d60bdd477c7dec755",
      "measurementId": "G-VEPF12WK7P"
    });

    DB.db = getFirestore(app);
  }

  public static submitAttempt() {
    const submission = {
      "diedFrom": Global.diedFrom,
      "stamina-left": Global.staminaLeft,
      "time": Global.time,
      "won": Global.playerWon,
      "attemptID": Global.attempts,
      "playerID": Global.playerID,
      "levels": Global.levels
    };

    if (Global.playerID === 'null') {
      console.log('Data not submitted:', submission);
    } else {
      addDoc(collection(DB.db, `attempt_${Global.version}`), submission);
    }
  }

  public static submitSurvey(survey: { [key: string]: string }) {
    survey['playerID'] = Global.playerID;

    addDoc(collection(DB.db, `survey_${Global.version}`), survey);

    console.log('Survey submitted.');
  }
}
