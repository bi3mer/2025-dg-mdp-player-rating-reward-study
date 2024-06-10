import { CommonComponents, Engine, System, Entity } from "../WorldEngine";
import { C } from "../Components";
import { ENEMY_PAUSE_COLOR, ENEMY_TURN_NEXT_COLOR } from "../constants";

export class RenderEnemyTerritory extends System {
  componentsRequired = new Set<Function>([C.Territory]);

  update(engine: Engine, entities: Set<Entity>): void {
    const bg = ((this.ecs.getBB('time step') + 1) % 3) === 0 ? ENEMY_TURN_NEXT_COLOR : ENEMY_PAUSE_COLOR;

    const xMod: number = this.ecs.getBB('x mod');
    const yMod: number = this.ecs.getBB('y mod');

    const playerID = this.ecs.getBB('player id');
    const playerPos = this.ecs.getComponents(playerID).get(CommonComponents.Position2d);

    for (let entity of entities.values()) {
      const components = this.ecs.getComponents(entity);

      if (components.get(CommonComponents.Position2d).euclideanDistance(playerPos) > 4) {
        continue;
      }

      const territory = components.get(C.Territory).territory;
      const size = territory.length;
      for (let i = 0; i < size; ++i) {
        const pos = territory[i];

        engine.drawText(pos.getX() * xMod, pos.getY() * yMod, ' ', '#000000', true, bg);
      }
    }
  }
}
