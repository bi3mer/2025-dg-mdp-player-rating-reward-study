import { Engine, Scene } from "../WorldEngine";

export class Survey extends Scene {
  constructor() {
    super();
  }

  public onEnter(engine: Engine): void {
    // hide game and make the survey visible
    document.getElementById("game")!.style.display = "none";
    document.getElementById("demographic")!.style.display = "block";

    // Engine isn't needed anymore at this point in the game
    engine.shutoff();
  }

  // Never called functions
  public onExit(engine: Engine): void {}
  public update(engine: Engine): number {
    return -1;
  }
}
