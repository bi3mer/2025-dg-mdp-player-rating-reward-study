import { Engine, System, Entity, Utility, CommonComponents } from "../WorldEngine";
import { C } from "../Components";
import { Enemy } from "../Components/Enemy";
import { PLAYER_LOST } from "../constants";

export class EnemyAI extends System {
  componentsRequired = new Set<Function>([CommonComponents.Position2d, C.Enemy, C.Movable]);
  constructor() {
    super();

  }

  update(engine: Engine, entities: Set<Entity>): void {
    // enemy can only move during their turn
    if (this.ecs.getBB('time step') % 3 != 0) return;

    // get the player position and grid collision tool
    const playerID = this.ecs.getBB('player id');
    const playerPos = this.ecs.getComponents(playerID).get(CommonComponents.Position2d);
    const gc: Utility.GridCollisions = this.ecs.getBB('grid collisions');

    for (let id of entities) {
      const components = this.ecs.getComponents(id);
      const currentPos = components.get(CommonComponents.Position2d);
      const startPos = components.get(Enemy).startPosition;
      let target: CommonComponents.Position2d;

      const distanceToPlayer = currentPos.euclideanDistance(playerPos);
      const distanceToStart = currentPos.euclideanDistance(startPos);

      if (distanceToPlayer <= 3 && distanceToStart <= 3) {
        target = playerPos; // go towards the player
      } else {
        target = startPos // go towards start position
      }

      // move the enemy towards the player if the player is in range
      const moves = this.getMoves(currentPos, target);
      if (moves.length == 0) {
        continue;
      }

      const size = moves.length;
      for (let i = 0; i < size; ++i) {
        const newPosition = currentPos.add(moves[i]);
        if (gc.get(newPosition) === undefined) {
          currentPos.setPos(newPosition);
          gc.acceptChange(newPosition, id);
          if (newPosition.equals(playerPos)) {
            this.ecs.setBB('game over', PLAYER_LOST);
          }

          break;
        }
      }
    }

    const time = this.ecs.getBB('time step');
    this.ecs.setBB('time step', time + 1);
  }


  private getMoves(
    currentPos: CommonComponents.Position2d,
    target: CommonComponents.Position2d): Array<CommonComponents.Position2d> {

    let moves = new Array<CommonComponents.Position2d>();
    const err = currentPos.getY();
    const ecc = currentPos.getX();

    const edr = target.getY() - err;
    const edc = target.getX() - ecc;

    if (edr == 0 && edc == 0) {
      return moves;
    }

    if (Math.abs(edr) > Math.abs(edc)) {
      if (edr > 0) {
        moves.push(new CommonComponents.Position2d(0, 1));
      } else if (edr < 0) {
        moves.push(new CommonComponents.Position2d(0, -1));
      }

      if (edc > 0) {
        moves.push(new CommonComponents.Position2d(1, 0));
      } else if (edc < 0) {
        moves.push(new CommonComponents.Position2d(-1, 0));
      }
    } else if (Math.abs(edc) > Math.abs(edr)) {
      if (edc > 0) {
        moves.push(new CommonComponents.Position2d(1, 0));
      } else if (edc < 0) {
        moves.push(new CommonComponents.Position2d(-1, 0));
      }

      if (edr > 0) {
        moves.push(new CommonComponents.Position2d(0, 1));
      } else if (edr < 0) {
        moves.push(new CommonComponents.Position2d(0, -1));
      }
    } else if ((ecc + err) % 2 == 0) {
      if (edr > 0) {
        moves.push(new CommonComponents.Position2d(0, 1));
      } else if (edr < 0) {
        moves.push(new CommonComponents.Position2d(0, -1));
      }

      if (edc > 0) {
        moves.push(new CommonComponents.Position2d(1, 0));
      } else if (edc < 0) {
        moves.push(new CommonComponents.Position2d(-1, 0));
      }
    } else {
      if (edc > 0) {
        moves.push(new CommonComponents.Position2d(1, 0));
      } else if (edc < 0) {
        moves.push(new CommonComponents.Position2d(-1, 0));
      }

      if (edr > 0) {
        moves.push(new CommonComponents.Position2d(0, 1));
      } else if (edr < 0) {
        moves.push(new CommonComponents.Position2d(0, -1));
      }
    }

    return moves;
  }
}
