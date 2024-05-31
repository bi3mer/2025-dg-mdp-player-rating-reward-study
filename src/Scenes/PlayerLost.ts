import { Engine, Scene, Key } from "../WorldEngine";

export class PlayerLost extends Scene {
  public sceneIndex: number = 0;
  public timer: number = 0;

  constructor() {
    super();
  }

  public onEnter(engine: Engine): void {
    this.timer = 0;
  }

  public onExit(engine: Engine): void { }

  public update(engine: Engine): number {
    this.timer += engine.delta
    if (this.timer > 2 || engine.keyDown.has(Key.ENTER)) {
      return this.sceneIndex;
    } else {
      engine.setFont(40);
      engine.drawText(360, 240, 'You lost! :/', 'red')
      return -1;
    }
  }
}
