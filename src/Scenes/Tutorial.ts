import { CommonComponents, ECSScene, Engine } from "../WorldEngine";
import { C } from "../Components";
import { S } from "../Systems";
import { MAX_STAMINA } from "../constants";

export class Tutorial extends ECSScene {
  public gameSceneIndex: number = 0;

  constructor() {
    super();
    this.setBB('x mod', 20);
    this.setBB('y mod', 20);
    this.setBB('turn', 0);
    this.setBB('tutorial over', false);
    this.setBB('time step', 0);

    const playerID = this.addEntity();
    this.setBB('player id', playerID);
    this.addComponent(playerID, new CommonComponents.Position2d(25, 5));
    this.addComponent(playerID, new C.Movable());
    this.addComponent(playerID, new C.Player(MAX_STAMINA, 0));
    this.addComponent(playerID, new C.Render('@'));

    const instructions = this.addEntity();
    this.addComponent(instructions, new CommonComponents.Position2d(5, 20));
    this.addComponent(instructions, new C.Text("Press 'A' to move left."));

    // this.addSystem(10, new S.PlayerCollision());
    // this.addSystem(20, new S.EnemyAI());
    // this.addSystem(90, new S.PortalSystem());
    // this.addSystem(95, new S.RenderEnemyTerritory());
    this.addSystem(0, new S.TutorialSystem(playerID, instructions));
    this.addSystem(90, new S.TutorialRenderSystem());
    this.addSystem(100, new S.RenderSystem());
    // this.addSystem(110, new S.RenderGameInfo());
  }

  public customUpdate(engine: Engine): number {
    // TODO: set cookie so that the player doesn't have to replay the tutorial on reload
    if (this.getBB('tutorial over')) {
      console.log(this.gameSceneIndex, 'done');
      return this.gameSceneIndex;
    }

    return -1;
  }
  public onEnter(engine: Engine): void {
  }

  public onExit(engine: Engine): void {
  }
}
