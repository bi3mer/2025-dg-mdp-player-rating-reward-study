import { MAX_TIME, START_TIME } from "../constants";
import { Engine, Scene, Key } from "../WorldEngine";

export class PlayerLost extends Scene {
  public gameSceneIndex: number = 0;
  public surveySceneIndex: number = 0;
  public timer: number = 0;

  constructor() {
    super();
  }

  public onEnter(engine: Engine): void {
    this.timer = 0;
  }

  public onExit(engine: Engine): void {}

  public update(engine: Engine): number {
    // Time limit
    const currentTime = performance.now();
    if (currentTime - START_TIME > MAX_TIME) {
      return this.surveySceneIndex;
    }

    // if time has not been reached, the player can keep going
    this.timer += engine.delta;
    if (this.timer > 2 || engine.keyDown.has(Key.ENTER)) {
      return this.gameSceneIndex;
    } else {
      engine.setFont(40);
      engine.drawText(360, 240, "You lost! :/", "red");
      return -1;
    }
  }
}
