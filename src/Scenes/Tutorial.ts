import { Movable } from "../Components/Movable";
import { Player } from "../Components/Player";
import { Render } from "../Components/Render";
import { VisibleText } from "../Components/VisibleText";
import { RenderSystem } from "../Systems/RenderSystem";
import { TutorialRenderSystem } from "../Systems/TutorialRenderSystem";
import { TutorialSystem } from "../Systems/TutorialSystem";
import { CommonComponents, ECSScene, Engine } from "../WorldEngine/index";
import { MAX_STAMINA } from "../constants";

export class Tutorial extends ECSScene {
  public gameSceneIndex: number = 0;

  constructor() {
    super();
    this.setBB("x mod", 20);
    this.setBB("y mod", 20);
    this.setBB("turn", 0);
    this.setBB("tutorial over", false);
    this.setBB("time step", 0);

    const playerID = this.addEntity();
    this.setBB("player id", playerID);
    this.addComponent(playerID, new CommonComponents.Position2d(25, 5));
    this.addComponent(playerID, new Movable());
    this.addComponent(playerID, new Player(MAX_STAMINA, 0));
    this.addComponent(playerID, new Render("@"));

    const instructions = this.addEntity();
    this.addComponent(instructions, new CommonComponents.Position2d(5, 20));
    this.addComponent(instructions, new VisibleText("Press 'A' to move left."));

    this.addSystem(0, new TutorialSystem(playerID, instructions));
    this.addSystem(90, new TutorialRenderSystem());
    this.addSystem(100, new RenderSystem());
  }

  public customUpdate(engine: Engine): number {
    // TODO: set cookie so that the player doesn't have to replay the tutorial on reload
    if (this.getBB("tutorial over")) {
      console.log(this.gameSceneIndex, "done");
      return this.gameSceneIndex;
    }

    return -1;
  }
  public onEnter(engine: Engine): void {}

  public onExit(engine: Engine): void {}
}
