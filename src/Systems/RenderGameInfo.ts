import { Engine, System, Entity, CommonComponents } from "../WorldEngine";
import { C } from "../Components";
import { MAX_STAMINA } from "../constants";

export class RenderGameInfo extends System {
  componentsRequired = new Set<Function>([C.Player]);

  update(engine: Engine, entities: Set<Entity>): void {
    const [id] = entities;
    const stamina = this.ecs.getComponents(id).get(C.Player).stamina;

    // stamina
    let color: string;
    if (stamina > 20) {
      color = 'green';
    } else if (stamina > 10) {
      color = '#8B8000';
    } else {
      color = 'red';
    }

    engine.drawRect(20, 20, stamina * 8, 20, color);

    const maxStamina = MAX_STAMINA * 8;
    engine.drawRectOutline(19, 18, maxStamina + 2, 22, 2, 'gray');
    engine.drawText(MAX_STAMINA * 4, 35, `${stamina}`, 'white')

    // turn index
    const time = this.ecs.getBB('time step');
    let x = time < 10 ? 890 : 875;
    engine.drawText(x, 30, `Turn: ${time}`);
  }
}
