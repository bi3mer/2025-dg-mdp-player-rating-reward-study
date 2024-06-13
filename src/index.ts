import { Engine } from "./WorldEngine";
import { Scene } from "./Scenes";
import { Cookie } from "./WorldEngine/src/Utility";

const engine = new Engine();
engine.displayFPS = false;

const startScene = new Scene.StartMenu();
const gameScene = new Scene.Game();
const playerLostScene = new Scene.PlayerLost();
const playerWonScene = new Scene.PlayerWon();
const tutorialScene = new Scene.Tutorial();

const startIndex = engine.addScene(startScene);
const gameIndex = engine.addScene(gameScene);
const lostIndex = engine.addScene(playerLostScene);
const wonIndex = engine.addScene(playerWonScene);
const tutorialIndex = engine.addScene(tutorialScene)

if (Cookie.get('completed tutorial') == 'true') {
  startScene.sceneIndex = gameIndex;
} else {
  startScene.sceneIndex = tutorialIndex;
}

gameScene.playerLostIndex = lostIndex;
gameScene.playerWonIndex = wonIndex;
gameScene.selfIndex = gameIndex;
gameScene.mainMenuIndex = startIndex;

playerLostScene.sceneIndex = gameIndex;
playerWonScene.sceneIndex = startIndex;

tutorialScene.gameSceneIndex = gameIndex;

engine.start();
