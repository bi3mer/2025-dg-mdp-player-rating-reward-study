
import { Engine, Scene } from "../WorldEngine";

export class Survey extends Scene {

  constructor() {
    super();
  }

  public onEnter(engine: Engine): void {
    console.log('survey!');
  }

  public onExit(engine: Engine): void { }

  public update(engine: Engine): number {

    return -1;
  }
}
