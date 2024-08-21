import { C } from "../Components";
import { S } from "../Systems";
import { idToLevel } from "../levels";


import { Engine, ECSScene, Key, CommonComponents, Utility } from "../WorldEngine";
import { Collider } from "../Components/Collider";
import { MAX_STAMINA, NUM_ROWS } from "../constants";
import { LevelDirector } from "../levelDirector";
import { Player } from "../Components/Player";
import { DB } from "../Database";
import { Global } from "../Global";

export class Game extends ECSScene {
  public playerWonIndex = 0;
  public playerLostIndex = 0;
  public selfIndex = 0;
  public mainMenuIndex = 0;

  private director: LevelDirector;
  private start: number = 0;

  constructor() {
    super();

    this.director = new LevelDirector();
    this.setBB('game over', 0);
    this.setBB('restart', false)
  }

  public onEnter(engine: Engine): void {
    const xMod = 20;
    const yMod = 20;
    const offsetX = 8;
    const offsetY = 7;
    let xMin = 1000;
    let xMax = 0;
    let yMin = 1000;
    let yMax = 0;

    const gc = new Utility.GridCollisions();

    let switchCount = 0;
    const lvl = this.director.get(2);

    const columns = lvl[0].length;
    const modColumns = columns + 4;
    for (let y = 0; y < NUM_ROWS; ++y) {
      // add start values to both ends of the row
      let row = [...`--${lvl[y]}--`];
      if (y == 0) {
        row[0] = '@';
      } else if (y == NUM_ROWS - 1) {
        row[modColumns - 1] = 'O';
      }

      /// place into map
      for (let x = 0; x < modColumns; ++x) {
        const char = row[x];
        const id = this.addEntity();

        const xPos = offsetX + x;
        const yPos = offsetY + y;

        xMin = Math.min(xMin, xPos);
        xMax = Math.max(xMax, xPos);
        yMin = Math.min(yMin, yPos);
        yMax = Math.max(yMax, yPos);

        if (char == '-') {
          continue;
        }

        this.addComponent(id, new C.Render(char));
        const pos = new CommonComponents.Position2d(xPos, yPos);
        this.addComponent(id, pos);
        gc.set(pos, id);

        if (char == 'O') {
          this.addComponent(id, new C.Portal());
          this.setBB('portal id', id);
        } else if (char == '@') {
          this.addComponent(id, new C.Player(MAX_STAMINA, 0));
          this.addComponent(id, new C.Movable());
          this.setBB('player id', id);
        } else if (char == '*') {
          this.addComponent(id, new C.Switch());
          switchCount += 1;
        } else if (char == '#') {
          this.addComponent(id, new C.Movable());
          this.addComponent(id, new C.Enemy("Enemy", new CommonComponents.Position2d(xPos, yPos)));
          this.addComponent(id, new C.Territory(pos));
        } else if (char == '^') {
          this.addComponent(id, new C.Enemy("Spike", new CommonComponents.Position2d(xPos, yPos)));
        } else if (char == '/' || char == '\\' || char == 'X') {
          this.addComponent(id, new Collider());
        } else if (char == '&') {
          this.addComponent(id, new C.Food());
        }
      }
    }

    for (let y = 3; y < engine.height / yMod - 1; ++y) {
      for (let x = 1; x < engine.width / xMod - 1; ++x) {
        if (x < xMin || x > xMax || y < yMin || y > yMax) {
          const id = this.addEntity();
          this.addComponent(id, new C.Render('X'));
          const pos = new CommonComponents.Position2d(x, y);
          this.addComponent(id, pos);

          if (x == xMin - 1 || y == yMin - 1 || x == xMax + 1 || y == yMax + 1) {
            gc.set(pos, id);
            this.addComponent(id, new C.Collider());
          }
        }
      }
    }

    this.setBB('switch count', switchCount);
    this.setBB('offset x', offsetX);
    this.setBB('offset y', offsetY);
    this.setBB('x mod', xMod);
    this.setBB('y mod', yMod);
    this.setBB('grid collisions', gc);
    this.setBB('time step', 0);

    this.addSystem(0, new S.PlayerMovement());
    this.addSystem(10, new S.PlayerCollision());
    this.addSystem(20, new S.EnemyAI());
    this.addSystem(90, new S.PortalSystem());
    this.addSystem(95, new S.RenderEnemyTerritory());
    this.addSystem(100, new S.RenderSystem());
    this.addSystem(110, new S.RenderGameInfo());
    this.addSystem(900, new S.UpdatePlayerTurn());

    Global.diedFrom = "";
    Global.playerWon = false;
    Global.levels = this.director.keys;

    this.start = Date.now();
  }

  public onExit(engine: Engine): void {
    const gameOver = this.getBB('game over');
    const playerID = this.getBB('player id');
    const furthestColumn = this.getComponents(playerID).get(Player).furthestColumn;
    this.director.update(gameOver === 1.0, furthestColumn);

    ++Global.order;

    this.clear();
  }

  public customUpdate(engine: Engine): number {
    const gameOver = this.getBB('game over')
    if (gameOver == -1 || gameOver == 1) {
      const end = Date.now();
      const elapsed = (end - this.start) / 1000;
      Global.time = elapsed;
      DB.submitAttempt();

      return gameOver == 1 ? this.playerWonIndex : this.playerLostIndex;
    } else if (engine.keyDown.has(Key.R)) {
      return this.selfIndex;
    } else if (engine.keyDown.has(Key.Q)) {
      return this.mainMenuIndex;
    }

    return -1;
  }
}
