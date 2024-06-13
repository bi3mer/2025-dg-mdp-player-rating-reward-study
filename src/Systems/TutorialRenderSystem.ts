
import { Engine, System, Entity, CommonComponents } from "../WorldEngine";
import { C } from "../Components";

export class TutorialRenderSystem extends System {
  componentsRequired = new Set<Function>([CommonComponents.Position2d, C.Text]);

  update(engine: Engine, entities: Set<Entity>): void {
    const xMod: number = this.ecs.getBB('x mod');
    const yMod: number = this.ecs.getBB('y mod');
    engine.setFont(20);

    for (let entity of entities.values()) {
      const components = this.ecs.getComponents(entity);
      const text = components.get(C.Text);
      const pos = components.get(CommonComponents.Position2d);

      engine.drawText(pos.getX() * xMod, pos.getY() * yMod, text.text);
      // // get components
      // const render = this.ecs.getComponents(entity).get(C.Render)
      // const pos = this.ecs.getComponents(entity).get(CommonComponents.Position2d);
      //
      // // render
      // const char = render.character;
      // const color = this.charToColor[char];
      // engine.drawText(pos.getX() * xMod, pos.getY() * yMod, char, color);
    }
  }
}
