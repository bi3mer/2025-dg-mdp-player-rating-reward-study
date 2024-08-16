import { Engine } from "./WorldEngine";
import { Scene } from "./Scenes";
import { Global } from "./Global";
import { DB } from "./Database";

// init db
DB.init();

// set up player id
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

// set up the engine
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
