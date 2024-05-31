import { Engine, Scene, Key, Utility } from "../WorldEngine";

export class PlayerWon extends Scene {
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
      Utility.Cookie.set(engine.getBB('level'), 'b');
      return this.sceneIndex;
    } else {
      engine.setFont(40);
      engine.drawText(420, 240, 'You won!', 'green')
      return -1;
    }
  }
}
