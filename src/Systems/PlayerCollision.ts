import { Engine, System, Entity, CommonComponents, Utility } from "../WorldEngine";
import { C } from "../Components";
import { CONTINUE, FOOD_STAMINA, MAX_STAMINA, PLAYER_LOST, PLAYER_WON } from "../constants";
import { Global } from "../Global";


export class PlayerCollision extends System {
  componentsRequired = new Set<Function>([]);

  update(engine: Engine, entities: Set<Entity>): void {
    const id = this.ecs.getBB('player id');
    const components = this.ecs.getComponents(id);
    const pos = components.get(CommonComponents.Position2d);
    if (!pos.updated()) {
      return;
    }

    // if the player is out of stamina, they've lost unless the player
    // has hit a portal or food, which is handled below.
    const player = components.get(C.Player);
    if (player.stamina <= 0) {
      Global.diedFrom = 'Stamina';
      Global.staminaLeft = 0;

      this.ecs.setBB('game over', PLAYER_LOST);
    }

    // if no collision was found, the player can move
    const gc: Utility.GridCollisions = this.ecs.getBB('grid collisions');
    const locID = gc.get(pos);

    if (locID == undefined) {
      gc.acceptChange(pos, id);
      return;
    }

    // if the player ran into a switch
    const locComponents = this.ecs.getComponents(locID);
    if (locComponents.has(C.Switch)) {
      const switchCount = this.ecs.getBB('switch count') - 1;
      this.ecs.setBB('switch count', switchCount);
      this.ecs.removeEntity(locID);
      gc.acceptChange(pos, id);
      return;
    }

    // if the player ran into an enemy... uh oh!
    if (locComponents.has(C.Enemy)) {
      Global.diedFrom = locComponents.get(C.Enemy).type;
      Global.staminaLeft = player.stamina;

      this.ecs.setBB('game over', PLAYER_LOST);
      return;
    }

    // player ran into the portal.
    if (locComponents.has(C.Portal)) {
      if (this.ecs.getBB('switch count') == 0) {
        Global.diedFrom = "";
        Global.playerWon = true;
        Global.staminaLeft = player.stamina;
        
        this.ecs.setBB('game over', PLAYER_WON);
      } else {
        pos.rejectChange();
      }

      return;
    }

    // player has ran into food
    if (locComponents.has(C.Food)) {
      player.stamina = Math.min(player.stamina + FOOD_STAMINA, MAX_STAMINA);
      this.ecs.removeEntity(locID);
      gc.acceptChange(pos, id);

      this.ecs.setBB('game over', CONTINUE);

      return;
    }

    // otherwise, we've run into a collider and we reject the change
    pos.rejectChange();
  }
}
