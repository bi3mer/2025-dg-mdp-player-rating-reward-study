// ------------------------------------------------------------------------------
// Database stuff commented out. If you want to use it in your own work, then
// feel free to uncomment it. You may not want to use firebase, though. Your
// call. I use it because it is convenient except for when it comes time to
// pull the data down to a local machine for analysis, but oh well. 
// ------------------------------------------------------------------------------

// import { initializeApp } from "firebase/app";
// import { addDoc, getFirestore, collection, Firestore } from "firebase/firestore";

import { Global } from "./Global";

export class DB {
  // private static db: Firestore;

  public static init() {
    // Initialize Firebase, @NOTE: this is insecure and bad
  //   const app = initializeApp({
  //     "apiKey": "",
  //     "authDomain": "",
  //     "projectId": "",
  //     "storageBucket": "",
  //     "messagingSenderId": "",
  //     "appId": "",
  //     "measurementId": ""
  //   });

  //   DB.db = getFirestore(app);
  }

  public static submitAttempt() {
    const submission = {
      "diedFrom": Global.diedFrom,
      "stamina-left": Global.staminaLeft,
      "time": Global.time,
      "won": Global.playerWon,
      "order": Global.order,
      "playerID": Global.playerID,
      "levels": Global.levels,
      "director": Global.director
    };

    console.log(submission)

    // // Only log data to the server if there is a real participant.
    // if (Global.playerID === 'null') {
    //   console.log('Data not submitted:', submission);
    // } else {
    //   addDoc(collection(DB.db, `attempt_${Global.version}`), submission);
    // }
  }

  public static submitSurvey(survey: { [key: string]: any }) {
    survey['playerID'] = Global.playerID;
    survey['director'] = Global.director;

    // addDoc(collection(DB.db, `survey_${Global.version}`), survey);

    // console.log('Survey submitted.');
    console.log(survey)
  }
}
