import { Engine } from "./WorldEngine";
import { Scene } from "./Scenes";
import { Global } from "./Global";
import { DB } from "./Database";
import { QUESTIONS } from "./questions";
import { fischerYatesShuffle } from "./Random";

DB.init();

// -------------- Set up player id --------------- 
if (location.hostname === "localhost" || location.hostname === "127.0.0.1" || location.hostname === '') {
  Global.playerID = "-1";
} else {
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.has('id')) {
    Global.playerID = crypto.randomUUID();
  } else {
    Global.playerID = "-1";
  }
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

const startIndex = engine.addScene(startScene);
const gameIndex = engine.addScene(gameScene);
const lostIndex = engine.addScene(playerLostScene);
const wonIndex = engine.addScene(playerWonScene);
const tutorialIndex = engine.addScene(tutorialScene)
const surveyIndex = engine.addScene(surveyScene);

startScene.tutorialIndex = tutorialIndex;
startScene.gameIndex = gameIndex;
startScene.surveyIndex = surveyIndex;

gameScene.playerLostIndex = lostIndex;
gameScene.playerWonIndex = wonIndex;
gameScene.selfIndex = gameIndex;
gameScene.mainMenuIndex = startIndex;

playerLostScene.sceneIndex = gameIndex;
playerWonScene.sceneIndex = startIndex;

tutorialScene.gameSceneIndex = gameIndex;

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
  const id = q.split(' ').join('_');

  const formElement = `<fieldset id="${id}">
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
var submitButton = document.createElement('button');
submitButton.type = 'submit';
submitButton.innerText = 'Submit';
questionnaire!.appendChild(submitButton);

// form submission behavior
questionnaire!.onsubmit = (event) => {
  event.preventDefault();

  let answers: { [key: string]: Number } = {};

  for (i = 0; i < QUESTIONS.length; ++i) {
    const Q = QUESTIONS[i];
    const N = Q.split(' ').join('_')
    let elements = document.getElementsByName(N);

    let found = false;
    for (let j = 0; j < 7; ++j) { // size will always be 7, look at radio buttons above
      const E = elements[j] as HTMLInputElement;
      if (E.checked) {
        answers[Q] = Number(E.value);
        found = true;
        break;
      }
    }

    document.getElementById(N)!.style.borderColor = found ? 'white' : 'red';
  }

  if (Object.keys(answers).length == QUESTIONS.length) {
    DB.submitSurvey(answers);
    console.log('Survey submitted');
    document.getElementById('survey')!.style.display = "none";
    document.getElementById('complete')!.style.display = "block";
  } else {
    document.getElementById('errorText')!.innerText = 'Please fill in the whole questionnaire. Red boxes indicate missed answers.';
  }
};

// -------------- Button Behavior --------------- 
document.getElementById('done')!.onclick = () => {
  engine.shutoff();

  document.getElementById('game')!.style.display = "none";
  document.getElementById('survey')!.style.display = "block";
};
