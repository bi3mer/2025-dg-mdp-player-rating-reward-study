import { initializeApp } from "firebase/app";
import {
  addDoc,
  collection,
  Firestore,
  getFirestore,
} from "firebase/firestore";
import { Global } from "./Global";

export class DB {
  private static db: Firestore;

  public static init() {
    // Initialize Firebase, @NOTE: this is insecure and bad
    const app = initializeApp({
      apiKey: "AIzaSyD6v26BmHUqqngOx7Bu6REP2t5mJNJlhlk",
      authDomain: "exag-dungeongrams-study.firebaseapp.com",
      projectId: "exag-dungeongrams-study",
      storageBucket: "exag-dungeongrams-study.appspot.com",
      messagingSenderId: "970729390672",
      appId: "1:970729390672:web:c6231d60bdd477c7dec755",
      measurementId: "G-VEPF12WK7P",
    });

    DB.db = getFirestore(app);
  }

  public static submitAttempt() {
    const submission = {
      diedFrom: Global.diedFrom,
      "stamina-left": Global.staminaLeft,
      time: Global.time,
      won: Global.playerWon,
      order: Global.order,
      playerID: Global.playerID,
      levels: Global.levels,
    };

    // Only log data to the server if there is a real participant.
    if (Global.playerID === "null") {
      console.log("Data not submitted:", submission);
    } else {
      addDoc(
        collection(DB.db, `rq2.2_play_${Global.director}_${Global.version}`),
        submission,
      );
    }
  }

  public static submitSurvey(survey: { [key: string]: any }) {
    // only log to the server if this is a real participant
    if (Global.playerID === "null") {
      console.log("Data not submitted:", survey);
    } else {
      survey["playerID"] = Global.playerID;
      addDoc(
        collection(DB.db, `rq2.2_survey_${Global.director}_${Global.version}`),
        survey,
      );

      console.log("Survey submitted.");
    }
  }

  public static submitTutorial() {
    const submission = {
      diedToEnemy: Global.tutorialDiedToEnemy,
      diedToStamina: Global.tutorialDiedToStamina,
      playerID: Global.playerID,
    };

    // only log to the server if this is a real participant
    if (Global.playerID === "null") {
      console.log("Data not submitted:", submission);
    } else {
      addDoc(
        collection(
          DB.db,
          `rq2.2_tutorial_${Global.director}_${Global.version}`,
        ),
        submission,
      );

      console.log("Tutorial data submitted.");
    }
  }
}
