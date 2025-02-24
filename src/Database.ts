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
      apiKey: "AIzaSyBsy1sNYcvbKYhD6evfTc-AE9MtgJIVX7I",
      authDomain: "biemer-rq2-2.firebaseapp.com",
      projectId: "biemer-rq2-2",
      storageBucket: "biemer-rq2-2.firebasestorage.app",
      messagingSenderId: "455291545423",
      appId: "1:455291545423:web:ff1fb29b0f2aa6146c873a",
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
      pathX: Global.playerPathX,
      pathY: Global.playerPathY,
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

  public static submitBeatGame() {
    addDoc(collection(DB.db, `rq2.2_beatgame_${Global.version}`), {
      playerID: Global.playerID,
      director: Global.director,
    });
  }

  public static submitSurvey(survey: { [key: string]: any }) {
    // add difficulty to survey
    survey["difficulty"] = Global.difficultyScore;

    // add demogrpahics to survey
    const keys = Object.keys(Global.demographicSurveyData);
    for (let i = 0; i < keys.length; ++i) {
      const k = keys[i];
      survey[k] = Global.demographicSurveyData[k];
    }

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
