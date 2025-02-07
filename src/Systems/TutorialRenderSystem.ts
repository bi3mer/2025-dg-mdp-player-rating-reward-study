import { Engine, System, Entity, CommonComponents } from "../WorldEngine";
import { VisibleText } from "../Components/VisibleText";

export class TutorialRenderSystem extends System {
  componentsRequired = new Set<Function>([
    CommonComponents.Position2d,
    VisibleText,
  ]);

  update(engine: Engine, entities: Set<Entity>): void {
    const xMod: number = this.ecs.getBB("x mod");
    const yMod: number = this.ecs.getBB("y mod");
    engine.setFont(20);

    for (let entity of entities.values()) {
      const components = this.ecs.getComponents(entity);
      const text = components.get(VisibleText);
      const pos = components.get(CommonComponents.Position2d);

      engine.drawText(pos.getX() * xMod, pos.getY() * yMod, text.text);
    }
  }
}
