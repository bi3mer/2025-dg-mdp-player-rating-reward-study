import { Engine, System, Entity, CommonComponents } from "../WorldEngine";
import { C } from "../Components";

export class RenderSystem extends System {
  componentsRequired = new Set<Function>([CommonComponents.Position2d, C.Render]);
  private charToColor: { [id: string]: string } = {
    '@': 'white',
    '-': '#d9d1d0',
    'X': '#636363',
    '*': '#0ccef0',
    '\\': '#c300d1',
    '/': '#c300d1',
    'o': '#414d42',
    'O': '#19f00a',
    '#': 'red',
    '^': '#f0cd0a',
    '&': '#259c2b',
  };

  update(engine: Engine, entities: Set<Entity>): void {
    const xMod: number = this.ecs.getBB('x mod');
    const yMod: number = this.ecs.getBB('y mod');
    engine.setFont(20);

    for (let entity of entities.values()) {
      // get components
      const components = this.ecs.getComponents(entity);
      const render = components.get(C.Render)
      const pos = components.get(CommonComponents.Position2d);

      // render
      const char = render.character;
      const color = this.charToColor[char];
      engine.drawText(pos.getX() * xMod, pos.getY() * yMod, char, color);
    }
  }
}
