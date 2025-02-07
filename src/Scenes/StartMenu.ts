import { MAX_TIME, START_TIME } from "../constants";
import { Engine, Key, Scene } from "../WorldEngine";
import { Cookie } from "../WorldEngine/src/Utility";

export class StartMenu extends Scene {
  public sceneIndex: number = 0;
  public gameIndex: number = 0;
  public tutorialIndex: number = 0;
  public surveyIndex: number = 0;
  public timer: number = 0;

  constructor() {
    super();
  }

  public onEnter(engine: Engine): void { }

  public onExit(engine: Engine): void { }

  public update(engine: Engine): number {
    // Time limit
    // const currentTime = performance.now();
    // if (currentTime - START_TIME > MAX_TIME) {
    //   return this.surveyIndex;
    // }

    if (engine.keyDown.has(Key.ENTER)) {
      engine.keyDown.clear();

      if (Cookie.get('completed tutorial')) {
        return this.gameIndex;
      }
      return this.tutorialIndex;
    } else {
      engine.setFont(40);
      engine.drawText(360, 100, 'DungeonGrams')

      engine.setFont(20);
      engine.drawText(385, 150, 'Press Enter to Start')

      engine.drawText(250, 200, '& gives you stamina', 'yellow');
      engine.drawText(250, 222, 'Collect all * to open the portal.', 'yellow');
      engine.drawText(250, 244, 'Step through the portal O to win!', 'yellow');
      engine.drawText(250, 266, 'But make sure to avoid the enemies # and traps ^', 'yellow');

      engine.drawText(250, 350, 'WASD or Arrows to move', 'green');
      engine.drawText(250, 375, 'Space to do nothing for a turn', 'green');
      engine.drawText(250, 400, 'R to restart', 'green');
      engine.drawText(250, 425, 'Q to quit', 'green');

      return -1;
    }
  }
}
