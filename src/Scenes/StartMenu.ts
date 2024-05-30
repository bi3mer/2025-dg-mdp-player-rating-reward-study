import { Engine, Key, Scene } from "../WorldEngine";

export class StartMenu extends Scene {
  public sceneIndex: number = 0;
  public timer: number = 0;

  constructor() {
    super();
  }

  public onEnter(engine: Engine): void { }
  
  public onExit(engine: Engine): void { }

  public update(engine: Engine): number {
    if(engine.keyDown.has(Key.ENTER)) {
      engine.keyDown.clear();
      return this.sceneIndex;
    } else {
      engine.setFont(40);
      engine.drawText(220, 100, 'DungeonGrams')

      engine.setFont(20);
      engine.drawText(245, 150, 'Press Enter to Start')

      engine.drawText(40, 200,'& gives you stamina', 'yellow');
      engine.drawText(40, 222, 'Collect all * to open the portal.', 'yellow');
      engine.drawText(40, 244, 'Step through the portal O to win!', 'yellow');
      engine.drawText( 40, 266, 'But make sure to avoid the enemies # and traps ^', 'yellow');

      engine.drawText(40, 350, 'WASD or Arrows to move', 'green');
      engine.drawText(40, 375, 'Space to do nothing for a turn', 'green');
      engine.drawText(40, 400, 'R to restart', 'green');
      engine.drawText(40, 425, 'Q to quit', 'green');


      return -1;
    }
  }
}