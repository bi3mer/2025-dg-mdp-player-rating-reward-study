import { Engine, System, Entity, CommonComponents } from "../WorldEngine";

export class RenderLevel extends System {
  componentsRequired = new Set<Function>([]);

  update(engine: Engine, entities: Set<Entity>): void {
    const level: string = engine.getBB('level');
    engine.setFont(20);
    engine.drawText(300, 30, `Level: ${level}`, 'white');
  }
}