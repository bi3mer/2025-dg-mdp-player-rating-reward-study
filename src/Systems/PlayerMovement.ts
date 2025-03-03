import { Player } from "../Components/Player";
import { Render } from "../Components/Render";
import { OFFSET_COL, PLAYER_LOST } from "../constants";
import { Global } from "../Global";
import { Engine, Entity, Key, System } from "../WorldEngine/index";
import { Position2d } from "../WorldEngine/src/Components/Position2d";

export class PlayerMovement extends System {
  componentsRequired = new Set<Function>([Position2d, Render, Player]);

  private updateTimeStep(): void {
    const timeStep: number = this.ecs.getBB("time step");
    this.ecs.setBB("time step", timeStep + 1);
  }

  update(engine: Engine, entities: Set<Entity>): void {
    const playerID = entities.values().next().value as Entity;
    const components = this.ecs.getComponents(playerID);
    const player = components.get(Player);
    let pos = components.get(Position2d);
    const x = pos.getX();
    const y = pos.getY();

    for (let key of engine.keyPress) {
      let playerMoved = false;
      switch (key) {
        case Key.A:
        case Key.LEFT:
          this.updateTimeStep();
          playerMoved = true;
          player.stamina -= 1;
          pos.setX(x - 1);
          break;
        case Key.S:
        case Key.DOWN:
          this.updateTimeStep();
          playerMoved = true;
          pos.setY(y + 1);
          player.stamina -= 1;
          break;
        case Key.D:
        case Key.RIGHT:
          this.updateTimeStep();
          playerMoved = true;
          pos.setX(x + 1);
          player.stamina -= 1;
          break;
        case Key.W:
        case Key.UP:
          this.updateTimeStep();
          playerMoved = true;
          pos.setY(y - 1);
          player.stamina -= 1;
          break;
        case Key.SPACE:
          this.updateTimeStep();
          player.stamina -= 1;
          playerMoved = true;

          if (player.stamina <= 0) {
            Global.diedFrom = "Stamina";
            this.ecs.setBB("game over", PLAYER_LOST);
          }
          break;
        // nothing to do in the default case
      }

      if (playerMoved) {
        Global.playerPathX.push(pos.x);
        Global.playerPathY.push(pos.y);
        player.furthestColumn = Math.max(
          player.furthestColumn,
          pos.getX() - OFFSET_COL,
        );
        break;
      }
    }
  }
}
