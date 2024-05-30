import { Engine, System, Entity, CommonComponents } from "../WorldEngine";

export class UpdatePlayerTurn extends System {
  componentsRequired = new Set<Function>([]);

  update(engine: Engine, entities: Set<Entity>): void {
      this.ecs.setBB('player turn', true);
  }
}