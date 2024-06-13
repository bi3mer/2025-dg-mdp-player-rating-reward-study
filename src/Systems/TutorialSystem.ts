
import { Engine, System, Entity, Key } from "../WorldEngine";
import { C } from "../Components";
import { Player } from "../Components/Player";
import { Position2d } from "../WorldEngine/src/Components";

export class TutorialSystem extends System {
  componentsRequired = new Set<Function>([]);

  private steps: Array<[string, (engine: Engine, player: Entity) => boolean]> = [];
  private index: number = 0;

  private playerID: Entity;
  private textID: Entity;

  constructor(player: Entity, text: Entity) {
    super();

    this.playerID = player;
    this.textID = text;

    // move left
    this.steps.push([
      "Press 'A' to move your character, the '@' symbol, left.",
      (engine: Engine, player: Entity) => {
        if (engine.isKeyDown(Key.A)) {
          const pos = this.ecs.getComponents(player).get(Position2d);
          pos.setX(pos.getX() - 1);
          return true;
        }

        return false;
      }
    ]);

    // move right 
    this.steps.push([
      "Press 'D' to move your character right.",
      (engine: Engine, player: Entity) => {
        if (engine.isKeyDown(Key.D)) {
          const pos = this.ecs.getComponents(player).get(Position2d);
          pos.setX(pos.getX() + 1);
          return true;
        }

        return false;
      }
    ]);

    // move down 
    this.steps.push([
      "Press 'S' to move your character down.",
      (engine: Engine, player: Entity) => {
        if (engine.isKeyDown(Key.S)) {
          const pos = this.ecs.getComponents(player).get(Position2d);
          pos.setY(pos.getY() + 1);
          return true;
        }

        return false;
      }
    ]);

    // move up 
    this.steps.push([
      "Press 'W' to move your character up.",
      (engine: Engine, player: Entity) => {
        if (engine.isKeyDown(Key.W)) {
          const pos = this.ecs.getComponents(player).get(Position2d);
          pos.setY(pos.getY() - 1);
          return true;
        }

        return false;
      }
    ]);


    // do nothing
    this.steps.push([
      "Press ' ' (space) to spend one turn and not move.",
      (engine: Engine, player: Entity) => {
        if (engine.isKeyDown(Key.SPACE)) {
          return true;
        }

        return false;
      }
    ]);
  }

  update(engine: Engine, entities: Set<Entity>): void {
    if (this.steps[this.index][1](engine, this.playerID)) {
      ++this.index;

      if (this.index >= this.steps.length) {
        this.ecs.setBB('tutorial over', true);
      } else {
        this.ecs.getComponents(this.textID).get(C.Text).text = this.steps[this.index][0];
      }
    }

  }
}
