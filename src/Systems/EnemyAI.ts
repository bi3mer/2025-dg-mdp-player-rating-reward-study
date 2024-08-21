import { Engine, System, Entity, Utility, CommonComponents } from "../WorldEngine";
import { C } from "../Components";
import { Enemy } from "../Components/Enemy";
import { OFFSET_COL, OFFSET_ROW, PLAYER_LOST } from "../constants";
import { ENEMY_RANGE } from "../constants";
import { Global } from "../Global";
import { Player } from "../Components/Player";

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
    const player = this.ecs.getComponents(playerID);
    const playerPos = player.get(CommonComponents.Position2d);
    const gc: Utility.GridCollisions = this.ecs.getBB('grid collisions');

    enemyloop:
    for (let id of entities) {
      const components = this.ecs.getComponents(id);
      const currentPos = components.get(CommonComponents.Position2d);
      const startPos = components.get(Enemy).startPosition;
      let target: CommonComponents.Position2d;

      const distanceToPlayer = startPos.euclideanDistance(playerPos);
      const distanceToStart = currentPos.euclideanDistance(startPos);

      if (distanceToPlayer <= ENEMY_RANGE && distanceToStart <= ENEMY_RANGE) {
        target = playerPos;
      } else {
        target = startPos;
      }

      // move the enemy towards the player if the player is in range
      const moves = this.getMoves(currentPos, target);
      const size = moves.length;

      for (let i = 0; i < size; ++i) {
        const newPosition = currentPos.add(moves[i]);

        if (newPosition.equals(playerPos)) {
          Global.staminaLeft = player.get(Player).stamina;
          Global.diedFrom = components.get(Enemy).type;

          this.ecs.setBB('game over', PLAYER_LOST);
          break enemyloop;
        } else if (gc.get(newPosition) === undefined) {
          currentPos.setPos(newPosition);
          gc.acceptChange(currentPos, id);
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
    const rr = currentPos.getY() - OFFSET_ROW;
    const cc = currentPos.getX() - OFFSET_COL;

    const dr = target.getY() - rr - OFFSET_ROW;
    const dc = target.getX() - cc - OFFSET_COL;

    if (dr == 0 && dc == 0) {
      return moves;
    }

    if (Math.abs(dr) > Math.abs(dc)) {
      if (dr !== 0) {
        moves.push(new CommonComponents.Position2d(0, Math.sign(dr)));
      }
      if (dc !== 0) {
        moves.push(new CommonComponents.Position2d(Math.sign(dc), 0));
      }
    } else if (Math.abs(dc) > Math.abs(dr)) {
      if (dc !== 0) {
        moves.push(new CommonComponents.Position2d(Math.sign(dc), 0));
      }
      if (dr !== 0) {
        moves.push(new CommonComponents.Position2d(0, Math.sign(dr)));
      }
    } else if ((cc + rr) % 2 == 0) {
      if (dr !== 0) {
        moves.push(new CommonComponents.Position2d(0, Math.sign(dr)));
      }
      if (dc !== 0) {
        moves.push(new CommonComponents.Position2d(Math.sign(dc), 0));
      }
    } else {
      if (dc !== 0) {
        moves.push(new CommonComponents.Position2d(Math.sign(dc), 0));
      }
      if (dr !== 0) {
        moves.push(new CommonComponents.Position2d(0, Math.sign(dr)));
      }
    }

    return moves;
  }
}
