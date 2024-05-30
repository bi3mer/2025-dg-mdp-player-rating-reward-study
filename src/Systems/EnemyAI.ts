import { Engine, System, Entity, Utility, CommonComponents } from "../WorldEngine";
import { C } from "../Components";
import { Enemy } from "../Components/Enemy";

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

      if (currentPos.euclideanDistance(playerPos) <= 3 && 
          currentPos.euclideanDistance(startPos) <= 3) {
        target = playerPos; // go towards the player
      } else {
        target = startPos // go towards start position
      }

      // move the enemy towards the player if the player is in range
      const moves = this.getMoves(gc, currentPos, target);
      if (moves.length == 0) {
        continue;
      }

      let closestVal = 1000;
      let closestIndex = -1;

      for (let i = 0; i < moves.length; ++i) {
        const pos = currentPos.add(moves[i]);
        const id = gc.get(pos);
        if (id == undefined || this.ecs.getComponents(id!).has(C.Player)) {
          const val = pos.euclideanDistance(target);
          if (val < closestVal) {
            closestVal = val;
            closestIndex = i;
          }
        }
      }
      
      if (closestIndex != -1) {
        currentPos.setPos(currentPos.add(moves[closestIndex]));
        gc.acceptChange(currentPos, id);
        if (currentPos.equals(playerPos)) {
          this.ecs.setBB('game over', -1);
        }
      }
    }

    const time = this.ecs.getBB('time step');
    this.ecs.setBB('time step', time + 1);
  }


  private getMoves(
    gc: Utility.GridCollisions, 
    currentPos: CommonComponents.Position2d, 
    target: CommonComponents.Position2d): Array<CommonComponents.Position2d> {

    let moves = new Array<CommonComponents.Position2d>();
    const diff_x = currentPos.getX() - target.getX();
    const diff_y = currentPos.getY() - target.getY();

    if (diff_x == 0 && diff_y == 0) {
      return moves;
    }

    if (Math.abs(diff_y) > Math.abs(diff_x)) {
      if (diff_y > 0)      moves.push(new CommonComponents.Position2d(0, -1));
      else if (diff_y < 0) moves.push(new CommonComponents.Position2d(0, 1));
      if (diff_x > 0)      moves.push(new CommonComponents.Position2d(-1, 0));
      else if (diff_x < 0) moves.push(new CommonComponents.Position2d(1, 0));
    } else if (Math.abs(diff_x) > Math.abs(diff_y)) {
      if (diff_x > 0)      moves.push(new CommonComponents.Position2d(-1, 0));
      else if (diff_x < 0) moves.push(new CommonComponents.Position2d(1, 0));
      if (diff_y > 0)      moves.push(new CommonComponents.Position2d(0, -1));
      else if (diff_y < 0) moves.push(new CommonComponents.Position2d(0, 1));
    } else if ((diff_x + diff_y) % 2 == 0) {
      if (diff_y > 0)      moves.push(new CommonComponents.Position2d(0, -1));
      else if (diff_y < 0) moves.push(new CommonComponents.Position2d(0, 1));
      if (diff_x > 0)      moves.push(new CommonComponents.Position2d(-1, 0));
      else if (diff_x < 0) moves.push(new CommonComponents.Position2d(1, 0));
    } else {
      if (diff_x > 0)      moves.push(new CommonComponents.Position2d(-1, 0));
      else if (diff_x < 0) moves.push(new CommonComponents.Position2d(1, 0));
      if (diff_y > 0)      moves.push(new CommonComponents.Position2d(0, -1));
      else if (diff_y < 0) moves.push(new CommonComponents.Position2d(0, 1));
    }

    return moves;
  }
}