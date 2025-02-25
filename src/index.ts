import { Engine } from "./WorldEngine";
import { Scene } from "./Scenes";
import { Global } from "./Global";
import { DB } from "./Database";
import { QUESTIONS } from "./questions";
import { fischerYatesShuffle } from "./Random";

DB.init();

// -------------- Set up player id ---------------
if (
  location.hostname === "localhost" ||
  location.hostname === "127.0.0.1" ||
  location.hostname === ""
) {
  Global.playerID = "-1";
} else {
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.has("id")) {
    Global.playerID = crypto.randomUUID();
  } else {
    Global.playerID = "-1";
  }

  console.log(Global.playerID);
}

console.log(`Player ID: ${Global.playerID}`);
// -------------- Set up the engine --------------
const engine = new Engine();
engine.displayFPS = false;

const startScene = new Scene.StartMenu();
const gameScene = new Scene.Game();
const playerLostScene = new Scene.PlayerLost();
const playerWonScene = new Scene.PlayerWon();
const tutorialScene = new Scene.Tutorial();
const surveyScene = new Scene.Survey();
const beatGameScene = new Scene.PlayerBeatGame();

const startIndex = engine.addScene(startScene);
const gameIndex = engine.addScene(gameScene);
const lostIndex = engine.addScene(playerLostScene);
const wonIndex = engine.addScene(playerWonScene);
const tutorialIndex = engine.addScene(tutorialScene);
const surveyIndex = engine.addScene(surveyScene);
const beatGameIndex = engine.addScene(beatGameScene);

startScene.tutorialIndex = tutorialIndex;
startScene.gameIndex = gameIndex;
startScene.surveyIndex = surveyIndex;

gameScene.playerBeatGameIndex = beatGameIndex;
gameScene.playerLostIndex = lostIndex;
gameScene.playerWonIndex = wonIndex;
gameScene.selfIndex = gameIndex;
gameScene.mainMenuIndex = startIndex;

playerLostScene.gameSceneIndex = gameIndex;
playerLostScene.surveySceneIndex = surveyIndex;

playerWonScene.gameSceneIndex = gameIndex;
playerWonScene.surveySceneIndex = surveyIndex;

tutorialScene.gameSceneIndex = gameIndex;

beatGameScene.surveySceneIndex = surveyIndex;

engine.start();

// -------------- Set up survey ------------------
// double shuffle because why not
fischerYatesShuffle(QUESTIONS);
fischerYatesShuffle(QUESTIONS);

// get where we are going to place the survey
const questionnaire = document.getElementById("questionnaire");

// populate HTML with the questions
let i = 0;
for (; i < QUESTIONS.length; ++i) {
  const q = QUESTIONS[i];
  const id = q.split(" ").join("_");

  const formElement = `<fieldset id="${id}" style="margin-left:15%; margin-right:15%">
  <label for="${id}" required><b>${q}</b></label>
    <br/>
    <br/>
    <table>
      <tr>
        <td></td>
        <td>-3</td>
        <td>-2</td>
        <td>-1</td>
        <td>&#20;0</td>
        <td>&#20;1</td>
        <td>&#20;2</td>
        <td>&#20;3</td>
        <td></td>
      </tr>
      <tr>
        <td>Strongly disagree</td>
        <td><input type="radio" name="${id}" value="-3"/></td>
        <td><input type="radio" name="${id}" value="-2"/></td>
        <td><input type="radio" name="${id}" value="-1"/></td>
        <td><input type="radio" name="${id}" value="0"/></td>
        <td><input type="radio" name="${id}" value="1"/></td>
        <td><input type="radio" name="${id}" value="2"/></td>
        <td><input type="radio" name="${id}" value="3"/></td>
        <td>Strongly agree</td>
      </tr>
    </table>
  </fieldset>
  <br/>`;

  questionnaire!.innerHTML += formElement;
}

// create the submit button
var submitButton = document.createElement("button");
submitButton.type = "submit";
submitButton.innerText = "Submit";
questionnaire!.appendChild(submitButton);

// form submission behavior
questionnaire!.onsubmit = (event) => {
  event.preventDefault();

  let answers: { [key: string]: Number } = {};

  for (i = 0; i < QUESTIONS.length; ++i) {
    const Q = QUESTIONS[i];
    const N = Q.split(" ").join("_");
    let elements = document.getElementsByName(N);

    let found = false;
    for (let j = 0; j < 7; ++j) {
      // size will always be 7, look at radio buttons above
      const E = elements[j] as HTMLInputElement;
      if (E.checked) {
        answers[Q] = Number(E.value);
        found = true;
        break;
      }
    }

    document.getElementById(N)!.style.borderColor = found ? "white" : "red";
  }

  if (Object.keys(answers).length == QUESTIONS.length) {
    DB.submitSurvey(answers);

    document.getElementById("survey")!.style.display = "none";
    document.getElementById("complete")!.style.display = "block";
  } else {
    document.getElementById("errorText")!.innerText =
      "Please fill in the whole questionnaire. Red boxes indicate missed answers.";
  }
};

// -------------- Demographic Survey Behavior ---------------
const checkBoxID = "demo-games";
const demoButton = document.getElementById("demo-submit");
const demoIDs = ["demo-age", "demo-time"];

demoButton!.onclick = () => {
  const responses = {};
  for (let i = 0; i < demoIDs.length; ++i) {
    const id = demoIDs[i];
    const elements = document.getElementsByName(id);

    for (let jj = 0; jj < elements.length; ++jj) {
      if (elements[jj].checked) {
        responses[id] = elements[jj].value;
        break;
      }
    }

    if (id in responses) {
      document.getElementById(id)!.style.borderColor = "white";
    } else {
      document.getElementById(id)!.style.borderColor = "red";
    }
  }

  const elements = document.getElementsByName(checkBoxID);
  const selected = [];
  for (let i = 0; i < elements.length; ++i) {
    const e = elements[i];

    if (e.checked) {
      selected.push(e.value);
    }
  }

  if (selected.length > 0) {
    responses[checkBoxID] = selected;
    document.getElementById(checkBoxID)!.style.borderColor = "white";
  } else {
    document.getElementById(checkBoxID)!.style.borderColor = "red";
    document.getElementById("demoErrorText")!.innerText =
      "Please fill in the whole questionnaire. Red boxes indicate missed answers.";
  }

  if (Object.keys(responses).length === 3) {
    Global.customData = responses;
    document.getElementById("demographic")!.style.display = "none";
    document.getElementById("difficulty")!.style.display = "block";
  }
};

/// @NOTE: the implementation below is lazy. Should be one for loop
// if none is pressed, we don't want it possible for the other checkboxes to be selected
document.getElementById("demo-none")!.onclick = () => {
  const elements = document.getElementsByName(checkBoxID);
  for (let i = 0; i < elements.length; ++i) {
    elements[i].checked = elements[i].value === "None of the above";
  }
};

// if none is checked, it should be unchecked if another one is selected
const elements = document.getElementsByName(checkBoxID);
const selected = [];
for (let i = 0; i < elements.length; ++i) {
  if (elements[i].value !== "None of the above") {
    elements[i].onclick = () => {
      document.getElementById("demo-none")!.checked = false;
    };
  }
}

// -------------- Difficulty Survey Behavior ---------------
document.getElementById("diff-submit")!.onclick = () => {
  const names = ["difficulty", "bored"];
  let allValid = true;
  for (let i = 0; i < names.length; ++i) {
    const name = names[i];
    const responses = document.getElementsByName(`${name}-answer`);
    let found = false;

    for (let i = 0; i < responses.length; ++i) {
      if (responses[i].checked) {
        Global.customData[name] = Number(responses[i].value);
        found = true;
        break;
      }
    }

    if (!found) {
      document.getElementById(`${name}-q`)!.style.borderColor = "red";
      document.getElementById("difficultyErrorText")!.innerText =
        "Please fill in the whole questionnaire. Red boxes indicate missed answers.";

      allValid = false;
    } else {
      document.getElementById(`${name}-q`)!.style.borderColor = "white";
    }
  }

  if (allValid) {
    console.log(Global.customData);
    document.getElementById("difficulty")!.style.display = "none";
    document.getElementById("survey")!.style.display = "block";
  }
};

// -------------- Button Behavior ---------------
document.getElementById("done")!.onclick = () => {
  engine.shutoff();

  document.getElementById("game")!.style.display = "none";
  document.getElementById("demographic")!.style.display = "block";
};
