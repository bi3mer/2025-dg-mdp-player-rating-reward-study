import { Engine, System, Entity } from "../WorldEngine";
import { C } from "../Components";

export class RenderEnemyTerritory extends System {
  componentsRequired = new Set<Function>([C.Enemy]);

  update(engine: Engine, entities: Set<Entity>): void {
    const xMod: number = this.ecs.getBB('x mod');
    const yMod: number = this.ecs.getBB('y mod');

    for (let entity of entities.values()) {
      const t = this.ecs.getComponents(entity).get(C.Enemy).territory;
      const size = t.length;
      for (let i = 0; i < size; ++i) {
        const pos = t[i];

        engine.drawText(pos.getX() * xMod, pos.getY() * yMod, ' ', '#000000', true, '#FF000022');
      }
    }
  }
}
