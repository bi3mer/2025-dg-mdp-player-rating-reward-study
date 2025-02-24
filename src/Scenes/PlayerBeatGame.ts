import { MAX_TIME, START_TIME } from "../constants";
import { DB } from "../Database";
import { Engine, Scene, Key, Utility } from "../WorldEngine";

export class PlayerBeatGame extends Scene {
  public surveySceneIndex: number = 0;
  public timer: number = 0;

  constructor() {
    super();
  }

  public onEnter(engine: Engine): void {
    this.timer = 0;
    DB.submitBeatGame();
  }

  public onExit(engine: Engine): void {}

  public update(engine: Engine): number {
    this.timer += engine.delta;

    if (this.timer > 2 || engine.keyDown.has(Key.ENTER)) {
      Utility.Cookie.set(engine.getBB("level"), "b");
      return this.surveySceneIndex;
    }

    engine.setFont(40);
    engine.drawText(310, 240, "You beat the game!", "#19f00a");

    return -1;
  }
}
