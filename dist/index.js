var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, {
      get: all[name],
      enumerable: true,
      configurable: true,
      set: (newValue) => all[name] = () => newValue
    });
};

// src/WorldEngine/src/Key.ts
function keyCodeToKey(key) {
  switch (key) {
    case "Down":
    case "ArrowDown":
      return 2 /* DOWN */;
    case "Up":
    case "ArrowUp":
      return 3 /* UP */;
    case "Right":
    case "ArrowRight":
      return 1 /* RIGHT */;
    case "Left":
    case "ArrowLeft":
      return 0 /* LEFT */;
    case " ":
    case "Space":
      return 10 /* SPACE */;
    case "Escape":
      return 11 /* ESCAPE */;
    case "a":
    case "A":
      return 5 /* A */;
    case "s":
    case "S":
      return 6 /* S */;
    case "d":
    case "D":
      return 7 /* D */;
    case "w":
    case "W":
      return 4 /* W */;
    case "r":
    case "R":
      return 9 /* R */;
    case "q":
    case "Q":
      return 8 /* Q */;
    case "Enter":
      return 12 /* ENTER */;
    default:
      console.warn(`Unhandled key: ${key}.`);
      return 13 /* INVALID */;
  }
}

// src/WorldEngine/src/Engine.ts
class Engine {
  keyDown = new Set;
  keyPress = new Set;
  width;
  height;
  delta;
  clearBackground = true;
  displayFPS = true;
  scenes = new Array;
  sceneIndex = 0;
  ctx;
  blackBoard = new Map;
  fontSize = 20;
  font = "Courier New";
  running = true;
  constructor() {
    window.addEventListener("keydown", (e) => {
      const k = keyCodeToKey(e.key);
      if (k == 2 /* DOWN */ || k == 3 /* UP */ || k == 0 /* LEFT */ || k == 1 /* RIGHT */) {
        e.preventDefault();
      }
      if (!this.keyDown.has(k)) {
        this.keyDown.add(k);
      }
      this.keyPress.add(k);
    });
    window.addEventListener("keyup", (e) => {
      const k = keyCodeToKey(e.key);
      this.keyDown.delete(k);
    });
    const canvas = document.getElementById("canvas");
    this.ctx = canvas.getContext("2d");
    this.setFont();
    this.width = canvas.width;
    this.height = canvas.height;
    this.delta = 0;
  }
  isKeyDown(key) {
    return this.keyDown.has(key);
  }
  setBB(key, val) {
    this.blackBoard.set(key, val);
  }
  getBB(key) {
    return this.blackBoard.get(key);
  }
  addScene(scene) {
    this.scenes.push(scene);
    return this.scenes.length - 1;
  }
  start() {
    let oldTimeStamp;
    let fps;
    this.scenes[this.sceneIndex].onEnter(this);
    const gameLoop = (timeStamp) => {
      this.delta = (timeStamp - oldTimeStamp) / 1000;
      oldTimeStamp = timeStamp;
      fps = Math.round(1 / this.delta);
      if (this.clearBackground) {
        this.ctx.fillStyle = "black";
        this.ctx.fillRect(0, 0, this.width, this.height);
      }
      this.update();
      if (this.displayFPS && this.clearBackground) {
        const tempSize = this.fontSize;
        const tempFont = this.font;
        this.setFont(8, "Courier New");
        this.drawText(this.width - 60, 15, `FPS: ${fps}`, "red");
        this.setFont(tempSize, tempFont);
      }
      this.keyPress.clear();
      if (this.running) {
        window.requestAnimationFrame(gameLoop);
      }
    };
    window.requestAnimationFrame(gameLoop);
  }
  update() {
    const i = this.scenes[this.sceneIndex].update(this);
    if (i !== -1) {
      this.scenes[this.sceneIndex].onExit(this);
      this.sceneIndex = i;
      this.scenes[this.sceneIndex].onEnter(this);
    }
  }
  setFont(size = undefined, font = undefined) {
    if (size != null) {
      this.fontSize = size;
    }
    if (font != null) {
      this.font = font;
    }
    this.ctx.font = `${this.fontSize}px ${this.font}`;
  }
  drawRectOutline(x, y, width, height, strokeWidth, color) {
    this.ctx.lineWidth = strokeWidth;
    this.ctx.strokeStyle = color;
    this.ctx.strokeRect(x, y, width, height);
  }
  drawRect(x, y, width, height, color) {
    this.ctx.fillStyle = color;
    this.ctx.fillRect(x, y, width, height);
  }
  drawText(x, y, char, fontColor = "white", background = false, backgroundColor = "white") {
    if (background) {
      const txtMeasure = this.ctx.measureText(char);
      this.drawRect(x - 1, y - this.fontSize * 0.7, txtMeasure.width, this.fontSize - 2, backgroundColor);
    }
    this.ctx.fillStyle = fontColor;
    this.ctx.fillText(char, x, y);
  }
  shutoff() {
    this.running = false;
  }
}
// src/WorldEngine/src/Component.ts
class Component {
}

class ComponentContainer {
  map = new Map;
  add(component) {
    this.map.set(component.constructor, component);
  }
  get(componentClass) {
    return this.map.get(componentClass);
  }
  has(componentClass) {
    return this.map.has(componentClass);
  }
  hasAll(componentClasses) {
    for (let cls of componentClasses) {
      if (!this.map.has(cls)) {
        return false;
      }
    }
    return true;
  }
  delete(componentClass) {
    this.map.delete(componentClass);
  }
}
// src/WorldEngine/src/System.ts
class System {
  ecs;
}
// src/WorldEngine/src/Scene.ts
class Scene {
}
// src/WorldEngine/src/ECSScene.ts
class ECSScene extends Scene {
  entities = new Map;
  priorityToSystem = new Map;
  priorityToComponents = new Map;
  priorities = new Array;
  blackBoard = new Map;
  nextEntityID = 0;
  entitiesToDestroy = new Array;
  update(engine) {
    for (let priority of this.priorities) {
      const system = this.priorityToSystem.get(priority);
      const components = this.priorityToComponents.get(priority);
      system.update(engine, components);
    }
    while (this.entitiesToDestroy.length > 0) {
      this.destroyEntity(this.entitiesToDestroy.pop());
    }
    return this.customUpdate(engine);
  }
  addEntity() {
    let entity = this.nextEntityID;
    this.nextEntityID++;
    this.entities.set(entity, new ComponentContainer);
    return entity;
  }
  removeEntity(entity) {
    this.entitiesToDestroy.push(entity);
  }
  addComponent(entity, component) {
    this.entities.get(entity).add(component);
    this.checkE(entity);
  }
  getComponents(entity) {
    return this.entities.get(entity);
  }
  removeComponent(entity, componentClass) {
    this.entities.get(entity)?.delete(componentClass);
    this.checkE(entity);
  }
  setBB(key, val) {
    this.blackBoard.set(key, val);
  }
  getBB(key) {
    return this.blackBoard.get(key);
  }
  addSystem(priority, system) {
    if (this.priorities.includes(priority)) {
      alert("Fatal error. Check the console.");
      console.error(`${system} can not be used since priority ${priority} already in use.`);
      return;
    }
    system.ecs = this;
    this.priorityToSystem.set(priority, system);
    this.priorityToComponents.set(priority, new Set);
    this.priorities.push(priority);
    this.priorities.sort();
    for (let entity of this.entities.keys()) {
      this.checkES(entity, priority);
    }
  }
  clear() {
    this.entities.clear();
    this.priorityToComponents.clear();
    this.priorityToSystem.clear();
    this.blackBoard.clear();
    this.priorities.length = 0;
    this.nextEntityID = 0;
  }
  destroyEntity(entity) {
    this.entities.delete(entity);
    for (let priority of this.priorities) {
      this.priorityToComponents.get(priority)?.delete(entity);
    }
  }
  checkE(entity) {
    for (let priority of this.priorities) {
      this.checkES(entity, priority);
    }
  }
  checkES(entity, priority) {
    let have = this.entities.get(entity);
    let need = this.priorityToSystem.get(priority).componentsRequired;
    if (have.hasAll(need)) {
      this.priorityToComponents.get(priority).add(entity);
    } else {
      this.priorityToComponents.get(priority).delete(entity);
    }
  }
}
// src/WorldEngine/src/Components/index.ts
var exports_Components = {};
__export(exports_Components, {
  Position2d: () => Position2d
});

// src/WorldEngine/src/Components/Position2d.ts
class Position2d extends Component {
  x;
  y;
  oldX;
  oldY;
  changed = false;
  constructor(x, y) {
    super();
    this.x = x;
    this.y = y;
    this.x = x;
    this.y = y;
    this.oldX = x;
    this.oldY = y;
  }
  equals(other) {
    return this.x == other.x && this.y == other.y;
  }
  hash() {
    return (this.x + this.y) * (this.x + this.y + 1) / 2 + this.y;
  }
  oldHash() {
    return (this.oldX + this.oldY) * (this.oldX + this.oldY + 1) / 2 + this.oldY;
  }
  updated() {
    return this.changed;
  }
  set(x, y) {
    this.changed = true;
    this.x = x;
    this.y = y;
  }
  setPos(pos) {
    this.changed = true;
    this.x = pos.x;
    this.y = pos.y;
  }
  setX(x) {
    this.changed = true;
    this.x = x;
  }
  setY(y) {
    this.changed = true;
    this.y = y;
  }
  getX() {
    return this.x;
  }
  getY() {
    return this.y;
  }
  acceptChange() {
    this.changed = false;
    this.oldX = this.x;
    this.oldY = this.y;
  }
  rejectChange() {
    this.changed = false;
    this.x = this.oldX;
    this.y = this.oldY;
  }
  euclideanDistance(pos) {
    const x = Math.pow(this.x - pos.x, 2);
    const y = Math.pow(this.y - pos.y, 2);
    return Math.sqrt(x + y);
  }
  add(pos) {
    return new Position2d(this.x + pos.x, this.y + pos.y);
  }
}
// src/WorldEngine/src/Utility/index.ts
var exports_Utility = {};
__export(exports_Utility, {
  GridCollisions: () => GridCollisions,
  Cookie: () => exports_Cookie
});

// src/WorldEngine/src/Utility/GridCollisions.ts
class GridCollisions {
  grid = new Map;
  get(pos) {
    return this.grid.get(pos.hash());
  }
  set(pos, val) {
    const hash = pos.hash();
    if (this.grid.has(hash)) {
      return false;
    }
    this.grid.set(hash, val);
    return true;
  }
  remove(pos, useNew) {
    if (useNew) {
      this.grid.delete(pos.hash());
    } else {
      this.grid.delete(pos.oldHash());
    }
  }
  acceptChange(pos, val) {
    this.grid.delete(pos.oldHash());
    pos.acceptChange();
    this.grid.set(pos.hash(), val);
  }
}
// src/WorldEngine/src/Utility/Cookie.ts
var exports_Cookie = {};
__export(exports_Cookie, {
  set: () => set,
  get: () => get
});
function set(name, val) {
  const date = new Date;
  date.setTime(date.getTime() + 31 * 24 * 60 * 60 * 1000);
  document.cookie = name + "=" + val + "; expires=" + date.toUTCString() + "; path=/";
}
function get(name) {
  const value = "; " + document.cookie;
  const parts = value.split("; " + name + "=");
  if (parts != null && parts.length == 2) {
    return parts.pop().split(";").shift();
  }
  return;
}
// src/Components/Collider.ts
class Collider extends Component {
  constructor() {
    super();
  }
}

// src/Components/Movable.ts
class Movable extends Component {
  constructor() {
    super();
  }
}

// src/Components/Player.ts
class Player extends Component {
  stamina;
  furthestColumn;
  constructor(stamina, furthestColumn) {
    super();
    this.stamina = stamina;
    this.furthestColumn = furthestColumn;
  }
}

// src/Components/Portal.ts
class Portal extends Component {
  constructor() {
    super();
  }
}

// src/Components/Render.ts
class Render extends Component {
  character;
  constructor(character) {
    super();
    this.character = character;
  }
}

// src/Components/Switch.ts
class Switch extends Component {
  constructor() {
    super();
  }
}

// src/Components/Enemy.ts
class Enemy extends Component {
  type;
  startPosition;
  constructor(type, startPosition) {
    super();
    this.type = type;
    this.startPosition = startPosition;
  }
}

// src/Components/Food.ts
class Food extends Component {
  constructor() {
    super();
  }
}

// src/constants.ts
var NUM_ROWS = 11;
var MAX_STAMINA = 40;
var FOOD_STAMINA = 30;
var PLAYER_LOST = -1;
var PLAYER_WON = 1;
var CONTINUE = 0;
var OFFSET_COL = 8;
var OFFSET_ROW = 7;
var ENEMY_RANGE = 3;
var KEY_START = "start";
var KEY_DEATH = "death";
var KEY_END = "end";
var ENEMY_TURN_NEXT_COLOR = "#FF000022";
var ENEMY_PAUSE_COLOR = "#FF440011";
var LD_RANDOM = "random";
var LD_ENJOYMENT = "enjoyment";
var LD_DIFFICULTY = "difficulty";
var LD_BOTH = "both";
var LD_SWITCH = 3;
var START_TIME = performance.now();
var MAX_TIME = 15 * 1000 * 60;

// src/Components/Territory.ts
class Territory extends Component {
  territory;
  constructor(pos) {
    super();
    this.territory = [];
    for (let y = -ENEMY_RANGE;y <= ENEMY_RANGE; ++y) {
      for (let x = -ENEMY_RANGE;x <= ENEMY_RANGE; ++x) {
        const point = new exports_Components.Position2d(x + pos.getX(), y + pos.getY());
        if (pos.euclideanDistance(point) <= ENEMY_RANGE) {
          this.territory.push(point);
        }
      }
    }
  }
}

// src/Components/index.ts
var C = {
  Collider,
  Enemy,
  Movable,
  Player,
  Portal,
  Render,
  Switch,
  Food,
  Territory,
  VisibleText: Text
};

// src/Global.ts
class Global {
  static playerID = "-1";
  static playerWon = false;
  static order = 0;
  static staminaLeft = 0;
  static time = 0;
  static levels = [];
  static diedFrom = "Stamina";
  static playerGaveUp = false;
  static gamesPlayed = 0;
  static director = "-1";
  static version = "0.0.1";
}

// src/Systems/EnemyAI.ts
class EnemyAI extends System {
  componentsRequired = new Set([exports_Components.Position2d, C.Enemy, C.Movable]);
  constructor() {
    super();
  }
  update(engine, entities) {
    if (this.ecs.getBB("time step") % 3 != 0)
      return;
    const playerID = this.ecs.getBB("player id");
    const player = this.ecs.getComponents(playerID);
    const playerPos = player.get(exports_Components.Position2d);
    const gc = this.ecs.getBB("grid collisions");
    enemyloop:
      for (let id of entities) {
        const components = this.ecs.getComponents(id);
        const currentPos = components.get(exports_Components.Position2d);
        const startPos = components.get(Enemy).startPosition;
        let target;
        const distanceToPlayer = startPos.euclideanDistance(playerPos);
        const distanceToStart = currentPos.euclideanDistance(startPos);
        if (distanceToPlayer <= ENEMY_RANGE && distanceToStart <= ENEMY_RANGE) {
          target = playerPos;
        } else {
          target = startPos;
        }
        const moves = this.getMoves(currentPos, target);
        const size = moves.length;
        for (let i = 0;i < size; ++i) {
          const newPosition = currentPos.add(moves[i]);
          if (newPosition.equals(playerPos)) {
            Global.staminaLeft = player.get(Player).stamina;
            Global.diedFrom = components.get(Enemy).type;
            this.ecs.setBB("game over", PLAYER_LOST);
            break enemyloop;
          } else if (gc.get(newPosition) === undefined) {
            currentPos.setPos(newPosition);
            gc.acceptChange(currentPos, id);
            break;
          }
        }
      }
    const time = this.ecs.getBB("time step");
    this.ecs.setBB("time step", time + 1);
  }
  getMoves(currentPos, target) {
    let moves = new Array;
    const rr = currentPos.getY() - OFFSET_ROW;
    const cc = currentPos.getX() - OFFSET_COL;
    const dr = target.getY() - rr - OFFSET_ROW;
    const dc = target.getX() - cc - OFFSET_COL;
    if (dr == 0 && dc == 0) {
      return moves;
    }
    if (Math.abs(dr) > Math.abs(dc)) {
      if (dr !== 0) {
        moves.push(new exports_Components.Position2d(0, Math.sign(dr)));
      }
      if (dc !== 0) {
        moves.push(new exports_Components.Position2d(Math.sign(dc), 0));
      }
    } else if (Math.abs(dc) > Math.abs(dr)) {
      if (dc !== 0) {
        moves.push(new exports_Components.Position2d(Math.sign(dc), 0));
      }
      if (dr !== 0) {
        moves.push(new exports_Components.Position2d(0, Math.sign(dr)));
      }
    } else if ((cc + rr) % 2 == 0) {
      if (dr !== 0) {
        moves.push(new exports_Components.Position2d(0, Math.sign(dr)));
      }
      if (dc !== 0) {
        moves.push(new exports_Components.Position2d(Math.sign(dc), 0));
      }
    } else {
      if (dc !== 0) {
        moves.push(new exports_Components.Position2d(Math.sign(dc), 0));
      }
      if (dr !== 0) {
        moves.push(new exports_Components.Position2d(0, Math.sign(dr)));
      }
    }
    return moves;
  }
}

// src/Systems/PlayerCollision.ts
class PlayerCollision extends System {
  componentsRequired = new Set([]);
  update(engine, entities) {
    const id = this.ecs.getBB("player id");
    const components = this.ecs.getComponents(id);
    const pos = components.get(exports_Components.Position2d);
    if (!pos.updated()) {
      return;
    }
    const player = components.get(C.Player);
    if (player.stamina <= 0) {
      Global.diedFrom = "Stamina";
      Global.staminaLeft = 0;
      this.ecs.setBB("game over", PLAYER_LOST);
    }
    const gc = this.ecs.getBB("grid collisions");
    const locID = gc.get(pos);
    if (locID == undefined) {
      gc.acceptChange(pos, id);
      return;
    }
    const locComponents = this.ecs.getComponents(locID);
    if (locComponents.has(C.Switch)) {
      const switchCount = this.ecs.getBB("switch count") - 1;
      this.ecs.setBB("switch count", switchCount);
      this.ecs.removeEntity(locID);
      gc.acceptChange(pos, id);
      return;
    }
    if (locComponents.has(C.Enemy)) {
      Global.diedFrom = locComponents.get(C.Enemy).type;
      Global.staminaLeft = player.stamina;
      this.ecs.setBB("game over", PLAYER_LOST);
      return;
    }
    if (locComponents.has(C.Portal)) {
      if (this.ecs.getBB("switch count") == 0) {
        Global.diedFrom = "";
        Global.playerWon = true;
        Global.staminaLeft = player.stamina;
        this.ecs.setBB("game over", PLAYER_WON);
      } else {
        pos.rejectChange();
      }
      return;
    }
    if (locComponents.has(C.Food)) {
      player.stamina = Math.min(player.stamina + FOOD_STAMINA, MAX_STAMINA);
      this.ecs.removeEntity(locID);
      gc.acceptChange(pos, id);
      this.ecs.setBB("game over", CONTINUE);
      return;
    }
    pos.rejectChange();
  }
}

// src/Systems/PlayerMovement.ts
class PlayerMovement extends System {
  componentsRequired = new Set([Position2d, Render, Player]);
  updateTimeStep() {
    const timeStep = this.ecs.getBB("time step");
    this.ecs.setBB("time step", timeStep + 1);
  }
  update(engine, entities) {
    const playerID = entities.values().next().value;
    const components = this.ecs.getComponents(playerID);
    const player = components.get(Player);
    let pos = components.get(Position2d);
    const x = pos.getX();
    const y = pos.getY();
    for (let key of engine.keyPress) {
      let playerMoved = false;
      switch (key) {
        case 5 /* A */:
        case 0 /* LEFT */:
          this.updateTimeStep();
          playerMoved = true;
          player.stamina -= 1;
          pos.setX(x - 1);
          break;
        case 6 /* S */:
        case 2 /* DOWN */:
          this.updateTimeStep();
          playerMoved = true;
          pos.setY(y + 1);
          player.stamina -= 1;
          break;
        case 7 /* D */:
        case 1 /* RIGHT */:
          this.updateTimeStep();
          playerMoved = true;
          pos.setX(x + 1);
          player.stamina -= 1;
          break;
        case 4 /* W */:
        case 3 /* UP */:
          this.updateTimeStep();
          playerMoved = true;
          pos.setY(y - 1);
          player.stamina -= 1;
          break;
        case 10 /* SPACE */:
          this.updateTimeStep();
          player.stamina -= 1;
          playerMoved = true;
          if (player.stamina <= 0) {
            Global.diedFrom = "Stamina";
            this.ecs.setBB("game over", PLAYER_LOST);
          }
          break;
      }
      if (playerMoved) {
        player.furthestColumn = Math.max(player.furthestColumn, pos.getX() - OFFSET_COL);
        break;
      }
    }
  }
}

// src/Systems/PortalSystem.ts
class PortalSystem extends System {
  componentsRequired = new Set([C.Portal, C.Render]);
  update(engine, entities) {
    const [id] = entities;
    if (this.ecs.getBB("switch count") == 0) {
      this.ecs.getComponents(id).get(C.Render).character = "O";
    } else {
      this.ecs.getComponents(id).get(C.Render).character = "o";
    }
  }
}

// src/Systems/RenderGameInfo.ts
class RenderGameInfo extends System {
  componentsRequired = new Set([C.Player]);
  update(engine, entities) {
    const [id] = entities;
    const stamina = this.ecs.getComponents(id).get(C.Player).stamina;
    let color;
    if (stamina > 20) {
      color = "green";
    } else if (stamina > 10) {
      color = "#8B8000";
    } else {
      color = "red";
    }
    engine.drawRect(20, 20, stamina * 8, 20, color);
    const maxStamina = MAX_STAMINA * 8;
    engine.drawRectOutline(19, 18, maxStamina + 2, 22, 2, "gray");
    engine.drawText(MAX_STAMINA * 4, 35, `${stamina}`, "white");
    const time = this.ecs.getBB("time step");
    let x = time < 10 ? 890 : 875;
    engine.drawText(x, 30, `Turn: ${time}`);
  }
}

// src/Systems/RenderSystem.ts
class RenderSystem extends System {
  componentsRequired = new Set([exports_Components.Position2d, C.Render]);
  charToColor = {
    "@": "white",
    "-": "#d9d1d0",
    X: "#636363",
    "*": "#0ccef0",
    "\\": "#c300d1",
    "/": "#c300d1",
    o: "#414d42",
    O: "#19f00a",
    "#": "red",
    "^": "#f0cd0a",
    "&": "#259c2b"
  };
  update(engine, entities) {
    const xMod = this.ecs.getBB("x mod");
    const yMod = this.ecs.getBB("y mod");
    engine.setFont(20);
    for (let entity of entities.values()) {
      const components = this.ecs.getComponents(entity);
      const render = components.get(C.Render);
      const pos = components.get(exports_Components.Position2d);
      const char = render.character;
      const color = this.charToColor[char];
      engine.drawText(pos.getX() * xMod, pos.getY() * yMod, char, color);
    }
  }
}

// src/Systems/UpdatePlayerTurn.ts
class UpdatePlayerTurn extends System {
  componentsRequired = new Set([]);
  update(engine, entities) {
    this.ecs.setBB("player turn", true);
  }
}

// src/Systems/RenderEnemyTerritory.ts
class RenderEnemyTerritory extends System {
  componentsRequired = new Set([C.Territory]);
  update(engine, entities) {
    const bg = (this.ecs.getBB("time step") + 1) % 3 === 0 ? ENEMY_TURN_NEXT_COLOR : ENEMY_PAUSE_COLOR;
    const xMod = this.ecs.getBB("x mod");
    const yMod = this.ecs.getBB("y mod");
    const playerID = this.ecs.getBB("player id");
    const playerPos = this.ecs.getComponents(playerID).get(exports_Components.Position2d);
    for (let entity of entities.values()) {
      const components = this.ecs.getComponents(entity);
      if (components.get(exports_Components.Position2d).euclideanDistance(playerPos) > 4) {
        continue;
      }
      const territory = components.get(C.Territory).territory;
      const size = territory.length;
      for (let i = 0;i < size; ++i) {
        const pos = territory[i];
        engine.drawText(pos.getX() * xMod, pos.getY() * yMod, " ", "#000000", true, bg);
      }
    }
  }
}

// src/Components/VisibleText.ts
class VisibleText extends Component {
  text;
  constructor(text) {
    super();
    this.text = text;
  }
}

// src/Systems/TutorialSystem.ts
class TutorialSystem extends System {
  componentsRequired = new Set([]);
  steps = [];
  index = 0;
  playerID;
  textID;
  constructor(player, text) {
    super();
    const gc = new GridCollisions;
    this.playerID = player;
    this.textID = text;
    this.steps.push([
      "Press 'A' to move your character, the '@' symbol, left.",
      (engine, player2) => {
        if (engine.isKeyDown(5 /* A */) || engine.isKeyDown(0 /* LEFT */)) {
          const pos = this.ecs.getComponents(player2).get(Position2d);
          pos.setX(pos.getX() - 1);
          return true;
        }
        return false;
      }
    ]);
    this.steps.push([
      "Press 'D' to move your character right.",
      (engine, player2) => {
        if (engine.isKeyDown(7 /* D */) || engine.isKeyDown(1 /* RIGHT */)) {
          const pos = this.ecs.getComponents(player2).get(Position2d);
          pos.setX(pos.getX() + 1);
          return true;
        }
        return false;
      }
    ]);
    this.steps.push([
      "Press 'S' to move your character down.",
      (engine, player2) => {
        if (engine.isKeyDown(6 /* S */) || engine.isKeyDown(2 /* DOWN */)) {
          const pos = this.ecs.getComponents(player2).get(Position2d);
          pos.setY(pos.getY() + 1);
          return true;
        }
        return false;
      }
    ]);
    this.steps.push([
      "Press 'W' to move your character up.",
      (engine, player2) => {
        if (engine.isKeyDown(4 /* W */) || engine.isKeyDown(3 /* UP */)) {
          const pos = this.ecs.getComponents(player2).get(Position2d);
          pos.setY(pos.getY() - 1);
          return true;
        }
        return false;
      }
    ]);
    let s;
    let p;
    let e;
    const positionSwitch = new Position2d(20, 8);
    const positionPortal = new Position2d(30, 8);
    const positionEnemy = new Position2d(28, 8);
    this.steps.push([
      "Press ' ' (space) to spend one turn and not move.",
      (engine, player2) => {
        if (engine.isKeyDown(10 /* SPACE */)) {
          const MIN_X = 15;
          const MAX_X = 35;
          const MIN_Y = 3;
          const MAX_Y = 15;
          for (let x = MIN_X;x < MAX_X; ++x) {
            const top = this.ecs.addEntity();
            this.ecs.addComponent(top, new Position2d(x, MIN_Y));
            this.ecs.addComponent(top, new Collider);
            this.ecs.addComponent(top, new Render("X"));
            gc.set(new Position2d(x, MIN_Y), top);
            const bot = this.ecs.addEntity();
            this.ecs.addComponent(bot, new Position2d(x, MAX_Y));
            this.ecs.addComponent(bot, new Collider);
            this.ecs.addComponent(bot, new Render("X"));
            gc.set(new Position2d(x, MAX_Y), bot);
          }
          for (let y = MIN_Y;y <= MAX_Y; ++y) {
            const left = this.ecs.addEntity();
            this.ecs.addComponent(left, new Position2d(MIN_X, y));
            this.ecs.addComponent(left, new Collider);
            this.ecs.addComponent(left, new Render("X"));
            gc.set(new Position2d(MIN_X, y), left);
            const right = this.ecs.addEntity();
            this.ecs.addComponent(right, new Position2d(MAX_X, y));
            this.ecs.addComponent(right, new Collider);
            this.ecs.addComponent(right, new Render("X"));
            gc.set(new Position2d(MAX_X, y), right);
          }
          s = this.ecs.addEntity();
          p = this.ecs.addEntity();
          e = this.ecs.addEntity();
          this.ecs.addComponent(s, positionSwitch);
          this.ecs.addComponent(s, new Render("*"));
          this.ecs.addComponent(p, new Portal);
          this.ecs.addComponent(p, positionPortal);
          this.ecs.addComponent(p, new Render("o"));
          this.ecs.addComponent(p, new Portal);
          this.ecs.setBB("grid collisions", gc);
          this.ecs.addSystem(5, new PlayerMovement);
          this.ecs.addSystem(10, new PlayerCollision);
          this.ecs.addSystem(50, new EnemyAI);
          this.ecs.addSystem(80, new RenderGameInfo);
          this.ecs.addSystem(85, new RenderEnemyTerritory);
          return true;
        }
        return false;
      }
    ]);
    this.steps.push([
      "That * is a switch. Run into it to open the portal.",
      (engine, player2) => {
        const components = this.ecs.getComponents(this.playerID);
        const positionPlayer = components.get(Position2d);
        const playerComponent = components.get(Player);
        if (positionPlayer.equals(positionSwitch)) {
          this.ecs.removeEntity(s);
          this.ecs.getComponents(p).get(Render).character = "O";
          this.ecs.addComponent(e, positionEnemy);
          this.ecs.addComponent(e, new Render("#"));
          this.ecs.addComponent(e, new Enemy("Enemy", new Position2d(positionEnemy.getX(), positionEnemy.getY())));
          this.ecs.addComponent(e, new Territory(positionEnemy));
          this.ecs.addComponent(e, new Movable);
          return true;
        }
        if (playerComponent.stamina <= 0) {
          playerComponent.stamina = MAX_STAMINA;
          positionPlayer.setX(25);
          positionPlayer.setY(5);
          this.ecs.getComponents(this.textID).get(VisibleText).text = "Try to hit the '*' switch before you run out of stamina.";
        }
        return false;
      }
    ]);
    this.steps.push([
      "Go through the opened portal, if you can...",
      (engine, player2) => {
        const components = this.ecs.getComponents(this.playerID);
        const positionPlayer = components.get(Position2d);
        const p2 = components.get(Player);
        if (this.ecs.getBB("game over") == PLAYER_LOST || p2.stamina <= 0 || positionPlayer.equals(positionEnemy)) {
          positionPlayer.setX(positionSwitch.getX());
          positionPlayer.setY(positionSwitch.getY());
          positionEnemy.setX(28);
          positionEnemy.setY(8);
          p2.stamina = MAX_STAMINA;
          this.ecs.setBB("game over", CONTINUE);
          this.ecs.getComponents(this.textID).get(VisibleText).text = "Try to avoid the enemy and not run out of stamina!";
        }
        if (positionPlayer.equals(positionPortal)) {
          exports_Cookie.set("completed tutorial", "true");
          console.log(exports_Cookie.get("completed tutorial"));
          return true;
        }
        return false;
      }
    ]);
  }
  update(engine, entities) {
    if (this.steps[this.index][1](engine, this.playerID)) {
      ++this.index;
      if (this.index >= this.steps.length) {
        this.ecs.setBB("tutorial over", true);
      } else {
        this.ecs.getComponents(this.textID).get(VisibleText).text = this.steps[this.index][0];
      }
    }
  }
}

// src/Systems/TutorialRenderSystem.ts
class TutorialRenderSystem extends System {
  componentsRequired = new Set([
    exports_Components.Position2d,
    VisibleText
  ]);
  update(engine, entities) {
    const xMod = this.ecs.getBB("x mod");
    const yMod = this.ecs.getBB("y mod");
    engine.setFont(20);
    for (let entity of entities.values()) {
      const components = this.ecs.getComponents(entity);
      const text = components.get(VisibleText);
      const pos = components.get(exports_Components.Position2d);
      engine.drawText(pos.getX() * xMod, pos.getY() * yMod, text.text);
    }
  }
}

// src/Systems/index.ts
var S = {
  EnemyAI,
  PlayerCollision,
  PlayerMovement,
  PortalSystem,
  RenderSystem,
  UpdatePlayerTurn,
  RenderGameInfo,
  RenderEnemyTerritory,
  TutorialSystem,
  TutorialRenderSystem
};

// src/GDM-TS/src/Graph/edge.ts
class Edge {
  src;
  tgt;
  probability;
  constructor(src, tgt, probability) {
    this.src = src;
    this.tgt = tgt;
    this.probability = probability;
  }
}

// src/GDM-TS/src/Graph/node.ts
class Node {
  name;
  reward;
  utility;
  isTerminal;
  neighbors;
  constructor(name, reward, utility, is_terminal, neighbors) {
    this.name = name;
    this.reward = reward;
    this.utility = utility;
    this.isTerminal = is_terminal;
    this.neighbors = neighbors;
  }
}

// src/GDM-TS/src/Graph/graph.ts
class Graph {
  nodes;
  edges;
  constructor() {
    this.nodes = {};
    this.edges = {};
  }
  getNode(nodeName) {
    return this.nodes[nodeName];
  }
  hasNode(nodeName) {
    return nodeName in this.nodes;
  }
  addNode(node) {
    this.nodes[node.name] = node;
  }
  addDefaultNode(nodeName, reward = 1, utility = 0, terminal = false, neighbors = null) {
    if (neighbors == null) {
      neighbors = [];
    }
    this.nodes[nodeName] = new Node(nodeName, reward, utility, terminal, neighbors);
  }
  removeNode(nodeName) {
    const edgesToRemove = [];
    for (const e of Object.values(this.edges)) {
      if (e.src == nodeName || e.tgt == nodeName) {
        edgesToRemove.push(e);
      }
      const probabilities = e.probability;
      let index = -1;
      for (let i = 0;i < probabilities.length; i++) {
        const [name, _] = probabilities[i];
        if (name == nodeName) {
          index = i;
          break;
        }
      }
      if (index == -1) {
        continue;
      }
      const pValue = probabilities[index][1];
      probabilities.splice(index, 1);
      const len = probabilities.length;
      const pValueNew = pValue / len;
      e.probability = probabilities.map(([name, p]) => [name, p + pValueNew]);
    }
    for (const e of edgesToRemove) {
      this.removeEdge(e.src, e.tgt);
    }
    delete this.nodes[nodeName];
  }
  getEdge(srcName, tgtName) {
    return this.edges[`${srcName},${tgtName}`];
  }
  hasEdge(srcName, tgtName) {
    return `${srcName},${tgtName}` in this.edges;
  }
  addEdge(edge) {
    this.edges[`${edge.src},${edge.tgt}`] = edge;
    const neighbors = this.nodes[edge.src].neighbors;
    if (!neighbors.includes(edge.tgt)) {
      neighbors.push(edge.tgt);
    }
  }
  addDefaultEdge(srcName, tgtName, p = null) {
    if (p == null) {
      p = [[tgtName, 1]];
    }
    this.addEdge(new Edge(srcName, tgtName, p));
  }
  removeEdge(srcNode, tgtNode) {
    const src = this.nodes[srcNode];
    const index = src.neighbors.indexOf(tgtNode);
    src.neighbors.splice(index, 1);
    delete this.edges[`${srcNode},${tgtNode}`];
  }
  neighbors(nodeName) {
    return this.nodes[nodeName].neighbors;
  }
  setNodeUtilities(utilities) {
    for (const [nodeName, utility] of Object.entries(utilities)) {
      this.nodes[nodeName].utility = utility;
    }
  }
  utility(nodeName) {
    return this.nodes[nodeName].utility;
  }
  reward(nodeName) {
    return this.nodes[nodeName].reward;
  }
  isTerminal(nodeName) {
    return this.nodes[nodeName].isTerminal;
  }
  mapNodes(lambda) {
    for (const n of Object.values(this.nodes)) {
      lambda(n);
    }
  }
  mapEdges(lambda) {
    for (const e of Object.values(this.edges)) {
      lambda(e);
    }
  }
}
// src/GDM-TS/src/rand.ts
function choice(list) {
  return list[Math.floor(Math.random() * list.length)];
}

// src/GDM-TS/src/util.ts
function calculateUtility(G, src, tgt, gamma) {
  const P = G.getEdge(src, tgt).probability;
  const size = P.length;
  let sum = 0;
  for (let i = 0;i < size; ++i) {
    const [nTgt, p] = P[i];
    sum += p * (G.reward(nTgt) + gamma * G.utility(nTgt));
  }
  return sum;
}
function calculateMaxUtility(G, n, gamma) {
  const node = G.getNode(n);
  if (node.isTerminal) {
    return 0;
  }
  const neighbors = node.neighbors;
  const size = neighbors.length;
  let max = -Infinity;
  for (let i = 0;i < size; ++i) {
    max = Math.max(max, calculateUtility(G, n, neighbors[i], gamma));
  }
  return max;
}
function resetUtility(G) {
  for (const n in G.nodes) {
    G.nodes[n].utility = 0;
  }
}
function createRandomPolicy(G) {
  const pi = {};
  for (const n in G.nodes) {
    if (!G.getNode(n).isTerminal) {
      pi[n] = [...G.neighbors(n)];
    }
  }
  return pi;
}
function createPolicy(G, gamma) {
  const pi = {};
  for (const n in G.nodes) {
    if (G.getNode(n).isTerminal) {
      continue;
    }
    let bestU = -Infinity;
    let bestN = [];
    for (const np of G.neighbors(n)) {
      const u = calculateUtility(G, n, np, gamma);
      if (u === bestU) {
        bestN.push(np);
      } else if (u > bestU) {
        bestU = u;
        bestN.length = 0;
        bestN.push(np);
      }
    }
    pi[n] = bestN;
  }
  return pi;
}
// src/GDM-TS/src/ADP/policyIteration.ts
function modifiedInPlacePolicyEvaluation(G, pi, gamma, policyK) {
  for (let i = 0;i < policyK; ++i) {
    for (const n in G.nodes) {
      const node = G.getNode(n);
      if (!node.isTerminal) {
        node.utility = calculateUtility(G, n, choice(pi[n]), gamma);
      }
    }
  }
}
function modifiedPolicyEvaluation(G, pi, gamma, policyK) {
  for (let i = 0;i < policyK; ++i) {
    const uTemp = {};
    for (const n in G.nodes) {
      if (!G.getNode(n).isTerminal) {
        uTemp[n] = calculateUtility(G, n, choice(pi[n]), gamma);
      }
    }
    G.setNodeUtilities(uTemp);
  }
}
function inPlacePolicyEvaluation(G, _, gamma, policyK) {
  for (let i = 0;i < policyK; ++i) {
    for (const n in G.nodes) {
      G.getNode(n).utility = calculateMaxUtility(G, n, gamma);
    }
  }
}
function policyEvaluation(G, _, gamma, policyK) {
  for (let i = 0;i < policyK; ++i) {
    const uTemp = {};
    for (const n in G.nodes) {
      uTemp[n] = calculateMaxUtility(G, n, gamma);
    }
    G.setNodeUtilities(uTemp);
  }
}
function policyImprovement(G, pi, gamma) {
  let changed = false;
  for (const n in G.nodes) {
    if (G.getNode(n).isTerminal) {
      continue;
    }
    let bestS = null;
    let bestU = -Infinity;
    for (const np of G.neighbors(n)) {
      const up = calculateUtility(G, n, np, gamma);
      if (up === bestU) {
      } else if (up > bestU) {
        bestS = np;
        bestU = up;
      }
    }
    if (choice(pi[n]) !== bestS) {
      pi[n].length = 0;
      pi[n].push(bestS);
      changed = true;
    }
  }
  return changed;
}
function policyIteration(G, gamma, modified = false, inPlace = false, policyK = 10, shouldResetUtility = true) {
  if (shouldResetUtility) {
    resetUtility(G);
  }
  const pi = createRandomPolicy(G);
  let policyEval;
  if (modified && inPlace) {
    policyEval = modifiedInPlacePolicyEvaluation;
  } else if (modified && !inPlace) {
    policyEval = modifiedPolicyEvaluation;
  } else if (!modified && inPlace) {
    policyEval = inPlacePolicyEvaluation;
  } else {
    policyEval = policyEvaluation;
  }
  let loop = true;
  while (loop) {
    policyEval(G, pi, gamma, policyK);
    loop = policyImprovement(G, pi, gamma);
  }
  policyEval(G, pi, gamma, policyK);
  policyImprovement(G, pi, gamma);
  return createPolicy(G, gamma);
}
// src/GDM-TS/src/Baseline/random.ts
function randomPolicy(G) {
  return createRandomPolicy(G);
}
// src/customNode.ts
class CustomNode extends Node {
  visitedCount;
  sumPercentCompleted;
  depth;
  difficulty;
  enjoyability;
  constructor(name, difficulty, enjoyability, utility, isTerminal, neighbors, depth) {
    super(name, difficulty, utility, isTerminal, neighbors);
    this.difficulty = difficulty;
    this.enjoyability = enjoyability;
    this.depth = depth;
    this.visitedCount = 1;
    this.sumPercentCompleted = 1;
  }
  updateReward(useDifficulty) {
    if (useDifficulty) {
      this.reward = this.difficulty * this.visitedCount;
    } else {
      this.reward = this.enjoyability * this.visitedCount;
    }
  }
}

// src/customEdge.ts
class CustomEdge extends Edge {
  link;
  constructor(src, tgt, probability, link) {
    super(src, tgt, probability);
    this.link = link;
  }
}

// src/levels.ts
var MDP = new Graph;
MDP.addNode(new CustomNode(KEY_START, 0, 0, 0, false, [], -1));
MDP.addNode(new CustomNode(KEY_DEATH, -5, -5, 0, true, [], -1));
MDP.addNode(new CustomNode("0_0_0", -1, -1, 0, false, [], 0));
MDP.addNode(new CustomNode("0_1_0", -0.5238095238095237, -0.11904761904761896, 0, false, [], 1));
MDP.addNode(new CustomNode("0_11_0", -0.6984126984126984, -0.04761904761904756, 0, false, [], 27));
MDP.addNode(new CustomNode("0_12_0", -0.5306122448979592, -0.12244897959183665, 0, false, [], 28));
MDP.addNode(new CustomNode("0_13_0", -0.8095238095238095, -0.1428571428571429, 0, false, [], 29));
MDP.addNode(new CustomNode("0_14_0", -0.5428571428571428, -0.1428571428571429, 0, false, [], 29));
MDP.addNode(new CustomNode("0_2_0", -0.4693877551020408, -0.16326530612244905, 0, false, [], 2));
MDP.addNode(new CustomNode("0_3_0", -0.4897959183673469, -0.26530612244897955, 0, false, [], 3));
MDP.addNode(new CustomNode("0_4_0", -0.4285714285714286, -0.18367346938775508, 0, false, [], 4));
MDP.addNode(new CustomNode("0_5_0", -0.1428571428571429, -0.2142857142857143, 0, false, [], 5));
MDP.addNode(new CustomNode("0_6_0", -0.4693877551020408, -0.18367346938775508, 0, false, [], 6));
MDP.addNode(new CustomNode("10_0_0", -0.3214285714285714, -0.1071428571428571, 0, false, [], 10));
MDP.addNode(new CustomNode("10_1_0", -0.4571428571428572, -0.22857142857142854, 0, false, [], 11));
MDP.addNode(new CustomNode("10_2_0", -0.1428571428571429, 0, 0, false, [], 12));
MDP.addNode(new CustomNode("10_3_0", -0.3928571428571429, -0.3928571428571429, 0, false, [], 13));
MDP.addNode(new CustomNode("10_4_0", -0.6734693877551021, -0.3877551020408163, 0, false, [], 14));
MDP.addNode(new CustomNode("10_5_0", -0.3928571428571429, -0.0714285714285714, 0, false, [], 15));
MDP.addNode(new CustomNode("10_6_0", -0.5357142857142857, -0.1607142857142857, 0, false, [], 16));
MDP.addNode(new CustomNode("10_7_0", -0.4821428571428571, -0.25, 0, false, [], 17));
MDP.addNode(new CustomNode("11_0_0", -0.3142857142857143, -0.2857142857142857, 0, false, [], 11));
MDP.addNode(new CustomNode("11_1_0", -0.33333333333333326, -0.2857142857142857, 0, false, [], 12));
MDP.addNode(new CustomNode("11_2_0", -0.3928571428571429, -0.1964285714285714, 0, false, [], 13));
MDP.addNode(new CustomNode("11_3_0", -0.375, -0.3928571428571429, 0, false, [], 14));
MDP.addNode(new CustomNode("11_4_0", -0.2857142857142857, -0.2142857142857143, 0, false, [], 15));
MDP.addNode(new CustomNode("11_5_0", -0.4464285714285714, -0.1785714285714286, 0, false, [], 16));
MDP.addNode(new CustomNode("11_6_0", -0.4285714285714286, -0.0714285714285714, 0, false, [], 17));
MDP.addNode(new CustomNode("12_0_0", -0.3214285714285714, -0.2678571428571429, 0, false, [], 12));
MDP.addNode(new CustomNode("12_1_0", -0.4285714285714286, -0.04761904761904756, 0, false, [], 13));
MDP.addNode(new CustomNode("12_2_0", -0.08571428571428563, -0.37142857142857133, 0, false, [], 14));
MDP.addNode(new CustomNode("12_3_0", -0.26190476190476186, -0.4285714285714286, 0, false, [], 15));
MDP.addNode(new CustomNode("12_4_0", -0.4, -0.11428571428571421, 0, false, [], 16));
MDP.addNode(new CustomNode("12_5_0", -0.2857142857142857, -0.09523809523809523, 0, false, [], 17));
MDP.addNode(new CustomNode("12_6_0", -0.1428571428571429, -0.6190476190476191, 0, false, [], 18));
MDP.addNode(new CustomNode("13_0_0", -0.3142857142857143, -0.4, 0, false, [], 13));
MDP.addNode(new CustomNode("13_1_0", -0.23809523809523814, -0.4285714285714286, 0, false, [], 14));
MDP.addNode(new CustomNode("13_2_0", -0.4285714285714286, -0.20408163265306123, 0, false, [], 15));
MDP.addNode(new CustomNode("13_3_0", -0.4107142857142857, -0.2678571428571429, 0, false, [], 16));
MDP.addNode(new CustomNode("13_4_0", -0.5714285714285714, -0.34285714285714286, 0, false, [], 17));
MDP.addNode(new CustomNode("14_0_0", -0.2857142857142857, -0.2142857142857143, 0, false, [], 14));
MDP.addNode(new CustomNode("14_1_0", -0.48571428571428565, -0.17142857142857149, 0, false, [], 15));
MDP.addNode(new CustomNode("14_2_0", -0.1428571428571429, -0.4285714285714286, 0, false, [], 16));
MDP.addNode(new CustomNode("14_3_0", -0.26190476190476186, -0.16666666666666674, 0, false, [], 17));
MDP.addNode(new CustomNode("14_4_0", -0.20000000000000007, -0.2571428571428571, 0, false, [], 18));
MDP.addNode(new CustomNode("15_0_0", -0.5714285714285714, -0.2857142857142857, 0, false, [], 15));
MDP.addNode(new CustomNode("15_1_0", -0.2142857142857143, -0.2142857142857143, 0, false, [], 16));
MDP.addNode(new CustomNode("15_2_0", -0.3571428571428571, -0.1071428571428571, 0, false, [], 17));
MDP.addNode(new CustomNode("15_3_0", -0.37142857142857133, -0.08571428571428563, 0, false, [], 18));
MDP.addNode(new CustomNode("15_4_0", -0.33333333333333326, -0.1428571428571429, 0, false, [], 19));
MDP.addNode(new CustomNode("16_1_0", -0.375, -0.1607142857142857, 0, false, [], 17));
MDP.addNode(new CustomNode("16_2_0", -0.2142857142857143, -0.25, 0, false, [], 18));
MDP.addNode(new CustomNode("16_3_0", -0.2857142857142857, -0.3571428571428571, 0, false, [], 19));
MDP.addNode(new CustomNode("16_4_0", -0.2142857142857143, -0.2142857142857143, 0, false, [], 20));
MDP.addNode(new CustomNode("17_2_0", -0.22857142857142854, -0.2857142857142857, 0, false, [], 19));
MDP.addNode(new CustomNode("17_4_0", -0.5238095238095237, -0.2063492063492064, 0, false, [], 19));
MDP.addNode(new CustomNode("17_5_0", -0.1428571428571429, -0.5, 0, false, [], 18));
MDP.addNode(new CustomNode("18_2_0", -0.16326530612244905, -0.16326530612244905, 0, false, [], 20));
MDP.addNode(new CustomNode("18_3_0", -0.33333333333333326, -0.1428571428571429, 0, false, [], 21));
MDP.addNode(new CustomNode("1_0_0", -0.4, -0.2571428571428571, 0, false, [], 1));
MDP.addNode(new CustomNode("1_1_0", -0.5357142857142857, -0.1071428571428571, 0, false, [], 2));
MDP.addNode(new CustomNode("1_11_0", -0.0714285714285714, -0.4285714285714286, 0, false, [], 26));
MDP.addNode(new CustomNode("1_12_0", -0.20000000000000007, -0.3142857142857143, 0, false, [], 27));
MDP.addNode(new CustomNode("1_13_0", -0.8214285714285714, -0.2142857142857143, 0, false, [], 28));
MDP.addNode(new CustomNode("1_14_0", -0.34285714285714286, -0.2571428571428571, 0, false, [], 28));
MDP.addNode(new CustomNode("1_15_0", -0.2142857142857143, -0.3214285714285714, 0, false, [], 29));
MDP.addNode(new CustomNode("1_16_0", -0.6666666666666666, -0.19047619047619047, 0, false, [], 30));
MDP.addNode(new CustomNode("1_17_0", -0.4571428571428572, -0.2857142857142857, 0, false, [], 31));
MDP.addNode(new CustomNode("1_2_0", -0.5238095238095237, -0.38095238095238104, 0, false, [], 3));
MDP.addNode(new CustomNode("1_3_0", -0.5714285714285714, -0.09523809523809523, 0, false, [], 4));
MDP.addNode(new CustomNode("1_4_0", -0.2857142857142857, -0.19047619047619047, 0, false, [], 5));
MDP.addNode(new CustomNode("1_5_0", -0.47619047619047616, -0.40476190476190477, 0, false, [], 6));
MDP.addNode(new CustomNode("2_0_0", -0.22857142857142854, -0.22857142857142854, 0, false, [], 2));
MDP.addNode(new CustomNode("2_1_0", -0.2857142857142857, -0.33333333333333326, 0, false, [], 3));
MDP.addNode(new CustomNode("2_10_0", -0.4693877551020408, -0.2857142857142857, 0, false, [], 24));
MDP.addNode(new CustomNode("2_11_0", -0.2571428571428571, -0.2571428571428571, 0, false, [], 25));
MDP.addNode(new CustomNode("2_12_0", -0.2857142857142857, 0, 0, false, [], 26));
MDP.addNode(new CustomNode("2_13_0", -0.34285714285714286, -0.17142857142857149, 0, false, [], 27));
MDP.addNode(new CustomNode("2_14_0", -0.34693877551020413, -0.1428571428571429, 0, false, [], 27));
MDP.addNode(new CustomNode("2_15_0", -0.33333333333333326, -0.26190476190476186, 0, false, [], 28));
MDP.addNode(new CustomNode("2_16_0", -0.5, -0.3571428571428571, 0, false, [], 29));
MDP.addNode(new CustomNode("2_2_0", -0.5428571428571428, -0.2857142857142857, 0, false, [], 4));
MDP.addNode(new CustomNode("2_3_0", -0.5142857142857142, -0.2571428571428571, 0, false, [], 5));
MDP.addNode(new CustomNode("2_4_0", -0.7142857142857143, -0.38095238095238104, 0, false, [], 6));
MDP.addNode(new CustomNode("3_0_0", -0.40476190476190477, -0.33333333333333326, 0, false, [], 3));
MDP.addNode(new CustomNode("3_1_0", -0.3571428571428571, -0.2857142857142857, 0, false, [], 4));
MDP.addNode(new CustomNode("3_10_0", 0, -0.8571428571428572, 0, false, [], 23));
MDP.addNode(new CustomNode("3_11_0", -0.48571428571428565, -0.20000000000000007, 0, false, [], 24));
MDP.addNode(new CustomNode("3_12_0", -0.7142857142857143, -0.33333333333333326, 0, false, [], 25));
MDP.addNode(new CustomNode("3_13_0", -0.2857142857142857, -0.1785714285714286, 0, false, [], 26));
MDP.addNode(new CustomNode("3_14_0", -0.1428571428571429, 0, 0, false, [], 26));
MDP.addNode(new CustomNode("3_15_0", -0.30952380952380953, -0.23809523809523814, 0, false, [], 27));
MDP.addNode(new CustomNode("3_16_0", -0.16326530612244905, -0.34693877551020413, 0, false, [], 28));
MDP.addNode(new CustomNode("3_2_0", -0.6938775510204082, -0.12244897959183665, 0, false, [], 5));
MDP.addNode(new CustomNode("3_3_0", -0.6734693877551021, -0.16326530612244905, 0, false, [], 8));
MDP.addNode(new CustomNode("3_4_0", -0.4285714285714286, -0.05714285714285716, 0, false, [], 9));
MDP.addNode(new CustomNode("4_0_0", -0.17142857142857149, -0.22857142857142854, 0, false, [], 4));
MDP.addNode(new CustomNode("4_1_0", -0.3142857142857143, -0.29999999999999993, 0, false, [], 5));
MDP.addNode(new CustomNode("4_10_0", -0.3571428571428571, -0.1607142857142857, 0, false, [], 22));
MDP.addNode(new CustomNode("4_11_0", -0.6326530612244898, -0.34693877551020413, 0, false, [], 23));
MDP.addNode(new CustomNode("4_12_0", -0.1071428571428571, -0.3571428571428571, 0, false, [], 24));
MDP.addNode(new CustomNode("4_13_0", -0.2142857142857143, -0.16666666666666674, 0, false, [], 25));
MDP.addNode(new CustomNode("4_14_0", -0.3214285714285714, -0.3571428571428571, 0, false, [], 25));
MDP.addNode(new CustomNode("4_15_0", -0.20000000000000007, -0.4285714285714286, 0, false, [], 26));
MDP.addNode(new CustomNode("4_16_0", -0.2857142857142857, -0.2142857142857143, 0, false, [], 27));
MDP.addNode(new CustomNode("4_2_0", -0.2857142857142857, -0.1785714285714286, 0, false, [], 6));
MDP.addNode(new CustomNode("4_3_0", -0.3571428571428571, -0.1428571428571429, 0, false, [], 7));
MDP.addNode(new CustomNode("4_4_0", -0.47619047619047616, -0.19047619047619047, 0, false, [], 8));
MDP.addNode(new CustomNode("4_8_0", -0.4571428571428572, -0.1428571428571429, 0, false, [], 20));
MDP.addNode(new CustomNode("4_9_0", -0.4285714285714286, -0.11428571428571421, 0, false, [], 21));
MDP.addNode(new CustomNode("5_0_0", 0, -0.33333333333333326, 0, false, [], 5));
MDP.addNode(new CustomNode("5_1_0", -0.1428571428571429, -0.3877551020408163, 0, false, [], 6));
MDP.addNode(new CustomNode("5_10_0", -0.37142857142857133, -0.3142857142857143, 0, false, [], 21));
MDP.addNode(new CustomNode("5_11_0", -0.20000000000000007, -0.34285714285714286, 0, false, [], 22));
MDP.addNode(new CustomNode("5_12_0", -0.3571428571428571, -0.19047619047619047, 0, false, [], 23));
MDP.addNode(new CustomNode("5_13_0", -0.47619047619047616, -0.47619047619047616, 0, false, [], 24));
MDP.addNode(new CustomNode("5_14_0", -0.22857142857142854, -0.3142857142857143, 0, false, [], 24));
MDP.addNode(new CustomNode("5_15_0", -0.5, -0.2857142857142857, 0, false, [], 25));
MDP.addNode(new CustomNode("5_2_0", -0.75, -0.3214285714285714, 0, false, [], 7));
MDP.addNode(new CustomNode("5_3_0", -0.38095238095238104, -0.33333333333333326, 0, false, [], 8));
MDP.addNode(new CustomNode("5_4_0", -0.3877551020408163, -0.40816326530612235, 0, false, [], 9));
MDP.addNode(new CustomNode("5_5_0", -0.4897959183673469, -0.12244897959183665, 0, false, [], 14));
MDP.addNode(new CustomNode("5_7_0", -0.5079365079365079, -0.2222222222222222, 0, false, [], 18));
MDP.addNode(new CustomNode("5_8_0", -0.3214285714285714, -0.3571428571428571, 0, false, [], 19));
MDP.addNode(new CustomNode("5_9_0", -0.3214285714285714, -0.3571428571428571, 0, false, [], 20));
MDP.addNode(new CustomNode("6_0_0", -0.326530612244898, -0.30612244897959184, 0, false, [], 6));
MDP.addNode(new CustomNode("6_1_0", -0.2857142857142857, -0.2678571428571429, 0, false, [], 7));
MDP.addNode(new CustomNode("6_10_0", -0.2857142857142857, -0.20408163265306123, 0, false, [], 20));
MDP.addNode(new CustomNode("6_11_0", -0.2857142857142857, -0.1428571428571429, 0, false, [], 21));
MDP.addNode(new CustomNode("6_12_0", -0.4642857142857143, -0.4642857142857143, 0, false, [], 22));
MDP.addNode(new CustomNode("6_14_0", -0.2857142857142857, 0, 0, false, [], 23));
MDP.addNode(new CustomNode("6_15_0", -0.1785714285714286, -0.2142857142857143, 0, false, [], 24));
MDP.addNode(new CustomNode("6_2_0", -0.3928571428571429, -0.3928571428571429, 0, false, [], 8));
MDP.addNode(new CustomNode("6_3_0", -0.47619047619047616, -0.19047619047619047, 0, false, [], 9));
MDP.addNode(new CustomNode("6_4_0", -0.2857142857142857, -0.2857142857142857, 0, false, [], 12));
MDP.addNode(new CustomNode("6_5_0", -0.6428571428571428, -0.1428571428571429, 0, false, [], 13));
MDP.addNode(new CustomNode("6_7_0", -0.4, -0.1428571428571429, 0, false, [], 17));
MDP.addNode(new CustomNode("6_8_0", -0.5476190476190477, -0.40476190476190477, 0, false, [], 18));
MDP.addNode(new CustomNode("6_9_0", -0.4693877551020408, -0.12244897959183665, 0, false, [], 19));
MDP.addNode(new CustomNode("7_0_0", -0.2857142857142857, -0.20000000000000007, 0, false, [], 7));
MDP.addNode(new CustomNode("7_1_0", -0.2857142857142857, -0.4571428571428572, 0, false, [], 8));
MDP.addNode(new CustomNode("7_10_0", -0.04761904761904756, 0, 0, false, [], 19));
MDP.addNode(new CustomNode("7_2_0", -0.38095238095238104, -0.2857142857142857, 0, false, [], 9));
MDP.addNode(new CustomNode("7_3_0", -0.6122448979591837, -0.26530612244897955, 0, false, [], 10));
MDP.addNode(new CustomNode("7_4_0", -0.4571428571428572, -0.2857142857142857, 0, false, [], 11));
MDP.addNode(new CustomNode("7_5_0", -0.4285714285714286, -0.11428571428571421, 0, false, [], 12));
MDP.addNode(new CustomNode("7_7_0", -0.4285714285714286, -0.1785714285714286, 0, false, [], 16));
MDP.addNode(new CustomNode("7_8_0", -0.2857142857142857, -0.2142857142857143, 0, false, [], 17));
MDP.addNode(new CustomNode("7_9_0", -0.38095238095238104, -0.38095238095238104, 0, false, [], 18));
MDP.addNode(new CustomNode("8_0_0", -0.4642857142857143, -0.1071428571428571, 0, false, [], 8));
MDP.addNode(new CustomNode("8_1_0", -0.4821428571428571, -0.2321428571428571, 0, false, [], 9));
MDP.addNode(new CustomNode("8_2_0", -0.5918367346938775, -0.16326530612244905, 0, false, [], 10));
MDP.addNode(new CustomNode("8_3_0", -0.4571428571428572, -0.22857142857142854, 0, false, [], 11));
MDP.addNode(new CustomNode("8_4_0", -0.5918367346938775, -0.04081632653061218, 0, false, [], 12));
MDP.addNode(new CustomNode("8_5_0", -0.5476190476190477, -0.2142857142857143, 0, false, [], 13));
MDP.addNode(new CustomNode("8_6_0", -0.2571428571428571, -0.11428571428571421, 0, false, [], 14));
MDP.addNode(new CustomNode("8_7_0", -0.4693877551020408, -0.26530612244897955, 0, false, [], 15));
MDP.addNode(new CustomNode("8_8_0", -0.38095238095238104, -0.09523809523809523, 0, false, [], 16));
MDP.addNode(new CustomNode("8_9_0", -0.5357142857142857, -0.1785714285714286, 0, false, [], 17));
MDP.addNode(new CustomNode("9_0_0", -0.47619047619047616, -0.2142857142857143, 0, false, [], 9));
MDP.addNode(new CustomNode("9_1_0", -0.48571428571428565, -0.1428571428571429, 0, false, [], 10));
MDP.addNode(new CustomNode("9_2_0", -0.5142857142857142, -0.02857142857142858, 0, false, [], 11));
MDP.addNode(new CustomNode("9_3_0", -0.4642857142857143, -0.25, 0, false, [], 12));
MDP.addNode(new CustomNode("9_4_0", -0.4285714285714286, -0.1428571428571429, 0, false, [], 13));
MDP.addNode(new CustomNode("9_5_0", -0.45238095238095233, -0.1428571428571429, 0, false, [], 14));
MDP.addNode(new CustomNode("9_6_0", -0.33333333333333326, -0.23809523809523814, 0, false, [], 15));
MDP.addNode(new CustomNode("9_7_0", -0.38095238095238104, -0.33333333333333326, 0, false, [], 16));
MDP.addNode(new CustomNode("end", 0, 0, 0, true, [], 20));
MDP.addEdge(new CustomEdge(KEY_START, "0_0_0", [["0_0_0", 0.99], [KEY_DEATH, 0.01]], []));
MDP.addEdge(new CustomEdge("13_1_0", "13_2_0", [["13_2_0", 0.99], [KEY_DEATH, 0.01]], ["---------&-"]));
MDP.addEdge(new CustomEdge("13_1_0", "13_0_0", [["13_0_0", 0.99], [KEY_DEATH, 0.01]], ["---------&-"]));
MDP.addEdge(new CustomEdge("13_1_0", "14_1_0", [["14_1_0", 0.99], [KEY_DEATH, 0.01]], ["---------&-"]));
MDP.addEdge(new CustomEdge("13_1_0", "12_1_0", [["12_1_0", 0.99], [KEY_DEATH, 0.01]], ["---------&-"]));
MDP.addEdge(new CustomEdge("1_5_0", "0_5_0", [["0_5_0", 0.99], [KEY_DEATH, 0.01]], []));
MDP.addEdge(new CustomEdge("6_4_0", "6_5_0", [["6_5_0", 0.99], [KEY_DEATH, 0.01]], ["---------&-"]));
MDP.addEdge(new CustomEdge("6_4_0", "7_4_0", [["7_4_0", 0.99], [KEY_DEATH, 0.01]], ["---------&-"]));
MDP.addEdge(new CustomEdge("6_5_0", "6_4_0", [["6_4_0", 0.99], [KEY_DEATH, 0.01]], ["-----&-----", "---------&-"]));
MDP.addEdge(new CustomEdge("6_5_0", "7_5_0", [["7_5_0", 0.99], [KEY_DEATH, 0.01]], ["-----&-----", "---------&-"]));
MDP.addEdge(new CustomEdge("6_5_0", "5_5_0", [["5_5_0", 0.99], [KEY_DEATH, 0.01]], []));
MDP.addEdge(new CustomEdge("17_5_0", "17_4_0", [["17_4_0", 0.99], [KEY_DEATH, 0.01]], ["-----&-----"]));
MDP.addEdge(new CustomEdge("17_5_0", "12_5_0", [["12_5_0", 0.99], [KEY_DEATH, 0.01]], ["-----&-----"]));
MDP.addEdge(new CustomEdge("4_0_0", "4_1_0", [["4_1_0", 0.99], [KEY_DEATH, 0.01]], ["-&---------"]));
MDP.addEdge(new CustomEdge("4_0_0", "5_0_0", [["5_0_0", 0.99], [KEY_DEATH, 0.01]], ["-&---------"]));
MDP.addEdge(new CustomEdge("4_0_0", "3_0_0", [["3_0_0", 0.99], [KEY_DEATH, 0.01]], ["-----&-----"]));
MDP.addEdge(new CustomEdge("12_3_0", "12_2_0", [["12_2_0", 0.99], [KEY_DEATH, 0.01]], ["---------&-"]));
MDP.addEdge(new CustomEdge("12_3_0", "13_3_0", [["13_3_0", 0.99], [KEY_DEATH, 0.01]], ["---------&-"]));
MDP.addEdge(new CustomEdge("12_3_0", "11_3_0", [["11_3_0", 0.99], [KEY_DEATH, 0.01]], ["---------&-"]));
MDP.addEdge(new CustomEdge("2_4_0", "2_3_0", [["2_3_0", 0.99], [KEY_DEATH, 0.01]], ["-----&-----"]));
MDP.addEdge(new CustomEdge("2_4_0", "1_4_0", [["1_4_0", 0.99], [KEY_DEATH, 0.01]], ["-----&-----", "---------&-"]));
MDP.addEdge(new CustomEdge("8_3_0", "8_4_0", [["8_4_0", 0.99], [KEY_DEATH, 0.01]], ["---------&-"]));
MDP.addEdge(new CustomEdge("8_3_0", "8_2_0", [["8_2_0", 0.99], [KEY_DEATH, 0.01]], ["---------&-"]));
MDP.addEdge(new CustomEdge("8_3_0", "9_3_0", [["9_3_0", 0.99], [KEY_DEATH, 0.01]], ["---------&-", "---------&-"]));
MDP.addEdge(new CustomEdge("8_3_0", "7_3_0", [["7_3_0", 0.99], [KEY_DEATH, 0.01]], ["---------&-"]));
MDP.addEdge(new CustomEdge("15_1_0", "15_2_0", [["15_2_0", 0.99], [KEY_DEATH, 0.01]], ["-&---------"]));
MDP.addEdge(new CustomEdge("15_1_0", "15_0_0", [["15_0_0", 0.99], [KEY_DEATH, 0.01]], []));
MDP.addEdge(new CustomEdge("15_1_0", "16_1_0", [["16_1_0", 0.99], [KEY_DEATH, 0.01]], ["---------&-"]));
MDP.addEdge(new CustomEdge("15_1_0", "14_1_0", [["14_1_0", 0.99], [KEY_DEATH, 0.01]], ["---------&-"]));
MDP.addEdge(new CustomEdge("11_3_0", "11_2_0", [["11_2_0", 0.99], [KEY_DEATH, 0.01]], ["-&---------"]));
MDP.addEdge(new CustomEdge("11_3_0", "12_3_0", [["12_3_0", 0.99], [KEY_DEATH, 0.01]], ["---------&-"]));
MDP.addEdge(new CustomEdge("11_3_0", "10_3_0", [["10_3_0", 0.99], [KEY_DEATH, 0.01]], ["---------&-"]));
MDP.addEdge(new CustomEdge("2_1_0", "2_2_0", [["2_2_0", 0.99], [KEY_DEATH, 0.01]], ["-----&-----"]));
MDP.addEdge(new CustomEdge("2_1_0", "2_0_0", [["2_0_0", 0.99], [KEY_DEATH, 0.01]], ["-----&-----"]));
MDP.addEdge(new CustomEdge("2_1_0", "3_1_0", [["3_1_0", 0.99], [KEY_DEATH, 0.01]], ["-----&-----"]));
MDP.addEdge(new CustomEdge("2_1_0", "1_1_0", [["1_1_0", 0.99], [KEY_DEATH, 0.01]], ["-----&-----"]));
MDP.addEdge(new CustomEdge("13_3_0", "13_4_0", [["13_4_0", 0.99], [KEY_DEATH, 0.01]], ["-&---------"]));
MDP.addEdge(new CustomEdge("13_3_0", "13_2_0", [["13_2_0", 0.99], [KEY_DEATH, 0.01]], ["-&---------"]));
MDP.addEdge(new CustomEdge("13_3_0", "14_3_0", [["14_3_0", 0.99], [KEY_DEATH, 0.01]], ["---------&-", "-&---------"]));
MDP.addEdge(new CustomEdge("13_3_0", "12_3_0", [["12_3_0", 0.99], [KEY_DEATH, 0.01]], ["-&---------"]));
MDP.addEdge(new CustomEdge("4_3_0", "4_4_0", [["4_4_0", 0.99], [KEY_DEATH, 0.01]], ["---------&-", "-&---------"]));
MDP.addEdge(new CustomEdge("4_3_0", "4_2_0", [["4_2_0", 0.99], [KEY_DEATH, 0.01]], ["---------&-", "-&---------"]));
MDP.addEdge(new CustomEdge("4_3_0", "5_3_0", [["5_3_0", 0.99], [KEY_DEATH, 0.01]], ["---------&-", "-&---------"]));
MDP.addEdge(new CustomEdge("4_3_0", "3_3_0", [["3_3_0", 0.99], [KEY_DEATH, 0.01]], ["---------&-", "-&---------"]));
MDP.addEdge(new CustomEdge("14_2_0", "14_3_0", [["14_3_0", 0.99], [KEY_DEATH, 0.01]], ["-&---------", "---------&-"]));
MDP.addEdge(new CustomEdge("14_2_0", "14_1_0", [["14_1_0", 0.99], [KEY_DEATH, 0.01]], ["-&---------"]));
MDP.addEdge(new CustomEdge("14_2_0", "15_2_0", [["15_2_0", 0.99], [KEY_DEATH, 0.01]], ["-----&-----", "-&---------", "-----&-----"]));
MDP.addEdge(new CustomEdge("14_2_0", "13_2_0", [["13_2_0", 0.99], [KEY_DEATH, 0.01]], ["---------&-", "-&---------"]));
MDP.addEdge(new CustomEdge("1_4_0", "1_5_0", [["1_5_0", 0.99], [KEY_DEATH, 0.01]], []));
MDP.addEdge(new CustomEdge("1_4_0", "1_3_0", [["1_3_0", 0.99], [KEY_DEATH, 0.01]], ["-----&-----"]));
MDP.addEdge(new CustomEdge("1_4_0", "2_4_0", [["2_4_0", 0.99], [KEY_DEATH, 0.01]], ["-----&-----", "---------&-"]));
MDP.addEdge(new CustomEdge("1_4_0", "0_4_0", [["0_4_0", 0.99], [KEY_DEATH, 0.01]], ["-----&-----", "---------&-"]));
MDP.addEdge(new CustomEdge("5_1_0", "5_2_0", [["5_2_0", 0.99], [KEY_DEATH, 0.01]], ["---------&-", "-&---------"]));
MDP.addEdge(new CustomEdge("5_1_0", "5_0_0", [["5_0_0", 0.99], [KEY_DEATH, 0.01]], ["-&---------"]));
MDP.addEdge(new CustomEdge("5_1_0", "6_1_0", [["6_1_0", 0.99], [KEY_DEATH, 0.01]], ["-&---------"]));
MDP.addEdge(new CustomEdge("5_1_0", "4_1_0", [["4_1_0", 0.99], [KEY_DEATH, 0.01]], ["-&---------"]));
MDP.addEdge(new CustomEdge("3_12_0", "3_13_0", [["3_13_0", 0.99], [KEY_DEATH, 0.01]], ["-----&-----"]));
MDP.addEdge(new CustomEdge("3_12_0", "3_11_0", [["3_11_0", 0.99], [KEY_DEATH, 0.01]], ["---------&-"]));
MDP.addEdge(new CustomEdge("3_12_0", "4_12_0", [["4_12_0", 0.99], [KEY_DEATH, 0.01]], ["---------&-"]));
MDP.addEdge(new CustomEdge("3_12_0", "2_12_0", [["2_12_0", 0.99], [KEY_DEATH, 0.01]], ["---------&-"]));
MDP.addEdge(new CustomEdge("3_4_0", "4_4_0", [["4_4_0", 0.99], [KEY_DEATH, 0.01]], ["-----&-----", "---------&-"]));
MDP.addEdge(new CustomEdge("4_4_0", "4_3_0", [["4_3_0", 0.99], [KEY_DEATH, 0.01]], ["---------&-"]));
MDP.addEdge(new CustomEdge("4_4_0", "5_4_0", [["5_4_0", 0.99], [KEY_DEATH, 0.01]], ["---------&-"]));
MDP.addEdge(new CustomEdge("4_4_0", "3_4_0", [["3_4_0", 0.99], [KEY_DEATH, 0.01]], ["---------&-"]));
MDP.addEdge(new CustomEdge("8_4_0", "8_5_0", [["8_5_0", 0.99], [KEY_DEATH, 0.01]], ["-----&-----", "---------&-"]));
MDP.addEdge(new CustomEdge("8_4_0", "8_3_0", [["8_3_0", 0.99], [KEY_DEATH, 0.01]], ["-----&-----", "---------&-"]));
MDP.addEdge(new CustomEdge("8_4_0", "9_4_0", [["9_4_0", 0.99], [KEY_DEATH, 0.01]], ["-----&-----"]));
MDP.addEdge(new CustomEdge("8_4_0", "7_4_0", [["7_4_0", 0.99], [KEY_DEATH, 0.01]], ["-----&-----", "---------&-"]));
MDP.addEdge(new CustomEdge("6_3_0", "6_2_0", [["6_2_0", 0.99], [KEY_DEATH, 0.01]], ["-----&-----"]));
MDP.addEdge(new CustomEdge("6_3_0", "7_3_0", [["7_3_0", 0.99], [KEY_DEATH, 0.01]], ["-----&-----"]));
MDP.addEdge(new CustomEdge("5_3_0", "5_2_0", [["5_2_0", 0.99], [KEY_DEATH, 0.01]], ["-----&-----", "---------&-"]));
MDP.addEdge(new CustomEdge("5_3_0", "4_3_0", [["4_3_0", 0.99], [KEY_DEATH, 0.01]], ["-----&-----", "---------&-"]));
MDP.addEdge(new CustomEdge("13_0_0", "13_1_0", [["13_1_0", 0.99], [KEY_DEATH, 0.01]], ["---------&-"]));
MDP.addEdge(new CustomEdge("13_0_0", "14_0_0", [["14_0_0", 0.99], [KEY_DEATH, 0.01]], ["-----&-----"]));
MDP.addEdge(new CustomEdge("13_0_0", "12_0_0", [["12_0_0", 0.99], [KEY_DEATH, 0.01]], ["---------&-"]));
MDP.addEdge(new CustomEdge("2_12_0", "2_13_0", [["2_13_0", 0.99], [KEY_DEATH, 0.01]], ["---------&-"]));
MDP.addEdge(new CustomEdge("2_12_0", "2_11_0", [["2_11_0", 0.99], [KEY_DEATH, 0.01]], ["-----&-----"]));
MDP.addEdge(new CustomEdge("2_12_0", "3_12_0", [["3_12_0", 0.99], [KEY_DEATH, 0.01]], ["---------&-"]));
MDP.addEdge(new CustomEdge("2_12_0", "1_12_0", [["1_12_0", 0.99], [KEY_DEATH, 0.01]], ["-----&-----"]));
MDP.addEdge(new CustomEdge("17_4_0", "17_5_0", [["17_5_0", 0.99], [KEY_DEATH, 0.01]], ["-&---------"]));
MDP.addEdge(new CustomEdge("17_4_0", "16_4_0", [["16_4_0", 0.99], [KEY_DEATH, 0.01]], ["-&---------"]));
MDP.addEdge(new CustomEdge("8_2_0", "8_3_0", [["8_3_0", 0.99], [KEY_DEATH, 0.01]], ["---------&-", "---------&-"]));
MDP.addEdge(new CustomEdge("8_2_0", "8_1_0", [["8_1_0", 0.99], [KEY_DEATH, 0.01]], ["-----&-----"]));
MDP.addEdge(new CustomEdge("8_2_0", "9_2_0", [["9_2_0", 0.99], [KEY_DEATH, 0.01]], ["-----&-----"]));
MDP.addEdge(new CustomEdge("3_1_0", "3_2_0", [["3_2_0", 0.99], [KEY_DEATH, 0.01]], ["-----&-----"]));
MDP.addEdge(new CustomEdge("3_1_0", "3_0_0", [["3_0_0", 0.99], [KEY_DEATH, 0.01]], ["-----&-----"]));
MDP.addEdge(new CustomEdge("3_1_0", "4_1_0", [["4_1_0", 0.99], [KEY_DEATH, 0.01]], ["-&---------"]));
MDP.addEdge(new CustomEdge("3_1_0", "2_1_0", [["2_1_0", 0.99], [KEY_DEATH, 0.01]], ["-&---------"]));
MDP.addEdge(new CustomEdge("0_1_0", "0_2_0", [["0_2_0", 0.99], [KEY_DEATH, 0.01]], []));
MDP.addEdge(new CustomEdge("0_1_0", "0_0_0", [["0_0_0", 0.99], [KEY_DEATH, 0.01]], []));
MDP.addEdge(new CustomEdge("0_1_0", "1_1_0", [["1_1_0", 0.99], [KEY_DEATH, 0.01]], []));
MDP.addEdge(new CustomEdge("9_3_0", "9_4_0", [["9_4_0", 0.99], [KEY_DEATH, 0.01]], ["---------&-"]));
MDP.addEdge(new CustomEdge("9_3_0", "9_2_0", [["9_2_0", 0.99], [KEY_DEATH, 0.01]], ["---------&-"]));
MDP.addEdge(new CustomEdge("9_3_0", "10_3_0", [["10_3_0", 0.99], [KEY_DEATH, 0.01]], ["---------&-"]));
MDP.addEdge(new CustomEdge("9_3_0", "8_3_0", [["8_3_0", 0.99], [KEY_DEATH, 0.01]], ["---------&-", "---------&-"]));
MDP.addEdge(new CustomEdge("0_4_0", "0_5_0", [["0_5_0", 0.99], [KEY_DEATH, 0.01]], []));
MDP.addEdge(new CustomEdge("0_4_0", "0_3_0", [["0_3_0", 0.99], [KEY_DEATH, 0.01]], ["-----&-----"]));
MDP.addEdge(new CustomEdge("0_4_0", "1_4_0", [["1_4_0", 0.99], [KEY_DEATH, 0.01]], ["-----&-----", "---------&-"]));
MDP.addEdge(new CustomEdge("0_3_0", "0_4_0", [["0_4_0", 0.99], [KEY_DEATH, 0.01]], ["---------&-"]));
MDP.addEdge(new CustomEdge("0_3_0", "0_2_0", [["0_2_0", 0.99], [KEY_DEATH, 0.01]], []));
MDP.addEdge(new CustomEdge("0_3_0", "1_3_0", [["1_3_0", 0.99], [KEY_DEATH, 0.01]], []));
MDP.addEdge(new CustomEdge("1_2_0", "1_3_0", [["1_3_0", 0.99], [KEY_DEATH, 0.01]], []));
MDP.addEdge(new CustomEdge("1_2_0", "1_1_0", [["1_1_0", 0.99], [KEY_DEATH, 0.01]], []));
MDP.addEdge(new CustomEdge("1_2_0", "2_2_0", [["2_2_0", 0.99], [KEY_DEATH, 0.01]], []));
MDP.addEdge(new CustomEdge("1_2_0", "0_2_0", [["0_2_0", 0.99], [KEY_DEATH, 0.01]], []));
MDP.addEdge(new CustomEdge("2_3_0", "2_2_0", [["2_2_0", 0.99], [KEY_DEATH, 0.01]], []));
MDP.addEdge(new CustomEdge("2_3_0", "1_3_0", [["1_3_0", 0.99], [KEY_DEATH, 0.01]], []));
MDP.addEdge(new CustomEdge("7_7_0", "7_8_0", [["7_8_0", 0.99], [KEY_DEATH, 0.01]], ["-----&-----", "-&---------"]));
MDP.addEdge(new CustomEdge("7_7_0", "8_7_0", [["8_7_0", 0.99], [KEY_DEATH, 0.01]], ["-----&-----", "-----&-----"]));
MDP.addEdge(new CustomEdge("7_7_0", "6_7_0", [["6_7_0", 0.99], [KEY_DEATH, 0.01]], ["-----&-----", "-----&-----"]));
MDP.addEdge(new CustomEdge("13_2_0", "13_3_0", [["13_3_0", 0.99], [KEY_DEATH, 0.01]], ["---------&-"]));
MDP.addEdge(new CustomEdge("13_2_0", "13_1_0", [["13_1_0", 0.99], [KEY_DEATH, 0.01]], ["-----&-----"]));
MDP.addEdge(new CustomEdge("13_2_0", "14_2_0", [["14_2_0", 0.99], [KEY_DEATH, 0.01]], ["-&---------"]));
MDP.addEdge(new CustomEdge("13_2_0", "12_2_0", [["12_2_0", 0.99], [KEY_DEATH, 0.01]], ["-----&-----"]));
MDP.addEdge(new CustomEdge("0_2_0", "0_3_0", [["0_3_0", 0.99], [KEY_DEATH, 0.01]], []));
MDP.addEdge(new CustomEdge("0_2_0", "0_1_0", [["0_1_0", 0.99], [KEY_DEATH, 0.01]], []));
MDP.addEdge(new CustomEdge("0_2_0", "1_2_0", [["1_2_0", 0.99], [KEY_DEATH, 0.01]], []));
MDP.addEdge(new CustomEdge("4_1_0", "4_2_0", [["4_2_0", 0.99], [KEY_DEATH, 0.01]], ["-----&-----", "---------&-"]));
MDP.addEdge(new CustomEdge("4_1_0", "4_0_0", [["4_0_0", 0.99], [KEY_DEATH, 0.01]], ["-&---------"]));
MDP.addEdge(new CustomEdge("4_1_0", "5_1_0", [["5_1_0", 0.99], [KEY_DEATH, 0.01]], ["-&---------"]));
MDP.addEdge(new CustomEdge("4_1_0", "3_1_0", [["3_1_0", 0.99], [KEY_DEATH, 0.01]], ["-&---------"]));
MDP.addEdge(new CustomEdge("3_2_0", "3_1_0", [["3_1_0", 0.99], [KEY_DEATH, 0.01]], []));
MDP.addEdge(new CustomEdge("3_2_0", "4_2_0", [["4_2_0", 0.99], [KEY_DEATH, 0.01]], ["---------&-"]));
MDP.addEdge(new CustomEdge("3_2_0", "2_2_0", [["2_2_0", 0.99], [KEY_DEATH, 0.01]], ["---------&-"]));
MDP.addEdge(new CustomEdge("6_2_0", "6_3_0", [["6_3_0", 0.99], [KEY_DEATH, 0.01]], ["---------&-"]));
MDP.addEdge(new CustomEdge("6_2_0", "6_1_0", [["6_1_0", 0.99], [KEY_DEATH, 0.01]], ["-----&-----"]));
MDP.addEdge(new CustomEdge("6_2_0", "7_2_0", [["7_2_0", 0.99], [KEY_DEATH, 0.01]], ["---------&-"]));
MDP.addEdge(new CustomEdge("6_2_0", "5_2_0", [["5_2_0", 0.99], [KEY_DEATH, 0.01]], ["---------&-"]));
MDP.addEdge(new CustomEdge("9_0_0", "9_1_0", [["9_1_0", 0.99], [KEY_DEATH, 0.01]], ["-----&-----"]));
MDP.addEdge(new CustomEdge("9_0_0", "10_0_0", [["10_0_0", 0.99], [KEY_DEATH, 0.01]], ["-----&-----"]));
MDP.addEdge(new CustomEdge("9_0_0", "8_0_0", [["8_0_0", 0.99], [KEY_DEATH, 0.01]], ["-----&-----"]));
MDP.addEdge(new CustomEdge("8_0_0", "8_1_0", [["8_1_0", 0.99], [KEY_DEATH, 0.01]], ["-----&-----"]));
MDP.addEdge(new CustomEdge("8_0_0", "9_0_0", [["9_0_0", 0.99], [KEY_DEATH, 0.01]], ["-----&-----"]));
MDP.addEdge(new CustomEdge("8_0_0", "7_0_0", [["7_0_0", 0.99], [KEY_DEATH, 0.01]], ["-&---------"]));
MDP.addEdge(new CustomEdge("5_8_0", "5_9_0", [["5_9_0", 0.99], [KEY_DEATH, 0.01]], ["-----&-----"]));
MDP.addEdge(new CustomEdge("5_8_0", "5_7_0", [["5_7_0", 0.99], [KEY_DEATH, 0.01]], ["-----&-----"]));
MDP.addEdge(new CustomEdge("5_8_0", "6_8_0", [["6_8_0", 0.99], [KEY_DEATH, 0.01]], ["-----&-----"]));
MDP.addEdge(new CustomEdge("5_8_0", "4_8_0", [["4_8_0", 0.99], [KEY_DEATH, 0.01]], ["---------&-"]));
MDP.addEdge(new CustomEdge("2_11_0", "2_12_0", [["2_12_0", 0.99], [KEY_DEATH, 0.01]], ["---------&-"]));
MDP.addEdge(new CustomEdge("2_11_0", "2_10_0", [["2_10_0", 0.99], [KEY_DEATH, 0.01]], ["-----&-----"]));
MDP.addEdge(new CustomEdge("2_11_0", "3_11_0", [["3_11_0", 0.99], [KEY_DEATH, 0.01]], ["---------&-"]));
MDP.addEdge(new CustomEdge("2_11_0", "1_11_0", [["1_11_0", 0.99], [KEY_DEATH, 0.01]], []));
MDP.addEdge(new CustomEdge("0_5_0", "0_6_0", [["0_6_0", 0.99], [KEY_DEATH, 0.01]], []));
MDP.addEdge(new CustomEdge("0_5_0", "0_4_0", [["0_4_0", 0.99], [KEY_DEATH, 0.01]], ["---------&-"]));
MDP.addEdge(new CustomEdge("0_5_0", "1_5_0", [["1_5_0", 0.99], [KEY_DEATH, 0.01]], []));
MDP.addEdge(new CustomEdge("14_1_0", "14_2_0", [["14_2_0", 0.99], [KEY_DEATH, 0.01]], ["-&---------"]));
MDP.addEdge(new CustomEdge("14_1_0", "14_0_0", [["14_0_0", 0.99], [KEY_DEATH, 0.01]], ["---------&-"]));
MDP.addEdge(new CustomEdge("14_1_0", "15_1_0", [["15_1_0", 0.99], [KEY_DEATH, 0.01]], ["---------&-"]));
MDP.addEdge(new CustomEdge("14_1_0", "13_1_0", [["13_1_0", 0.99], [KEY_DEATH, 0.01]], ["---------&-"]));
MDP.addEdge(new CustomEdge("7_1_0", "7_2_0", [["7_2_0", 0.99], [KEY_DEATH, 0.01]], ["-----&-----", "---------&-"]));
MDP.addEdge(new CustomEdge("7_1_0", "7_0_0", [["7_0_0", 0.99], [KEY_DEATH, 0.01]], ["-&---------"]));
MDP.addEdge(new CustomEdge("7_1_0", "8_1_0", [["8_1_0", 0.99], [KEY_DEATH, 0.01]], ["-&---------"]));
MDP.addEdge(new CustomEdge("7_1_0", "6_1_0", [["6_1_0", 0.99], [KEY_DEATH, 0.01]], ["-&---------"]));
MDP.addEdge(new CustomEdge("1_16_0", "1_17_0", [["1_17_0", 0.99], [KEY_DEATH, 0.01]], ["-----&-----"]));
MDP.addEdge(new CustomEdge("1_16_0", "1_15_0", [["1_15_0", 0.99], [KEY_DEATH, 0.01]], ["-----&-----"]));
MDP.addEdge(new CustomEdge("1_16_0", "2_16_0", [["2_16_0", 0.99], [KEY_DEATH, 0.01]], []));
MDP.addEdge(new CustomEdge("14_0_0", "14_1_0", [["14_1_0", 0.99], [KEY_DEATH, 0.01]], ["---------&-"]));
MDP.addEdge(new CustomEdge("14_0_0", "15_0_0", [["15_0_0", 0.99], [KEY_DEATH, 0.01]], ["-----&-----"]));
MDP.addEdge(new CustomEdge("14_0_0", "13_0_0", [["13_0_0", 0.99], [KEY_DEATH, 0.01]], ["-----&-----"]));
MDP.addEdge(new CustomEdge("3_3_0", "3_4_0", [["3_4_0", 0.99], [KEY_DEATH, 0.01]], ["---------&-"]));
MDP.addEdge(new CustomEdge("3_3_0", "3_2_0", [["3_2_0", 0.99], [KEY_DEATH, 0.01]], ["-----&-----"]));
MDP.addEdge(new CustomEdge("3_3_0", "4_3_0", [["4_3_0", 0.99], [KEY_DEATH, 0.01]], ["---------&-"]));
MDP.addEdge(new CustomEdge("3_3_0", "2_3_0", [["2_3_0", 0.99], [KEY_DEATH, 0.01]], ["-----&-----"]));
MDP.addEdge(new CustomEdge("1_13_0", "1_14_0", [["1_14_0", 0.99], [KEY_DEATH, 0.01]], ["-----&-----"]));
MDP.addEdge(new CustomEdge("1_13_0", "1_12_0", [["1_12_0", 0.99], [KEY_DEATH, 0.01]], ["-----&-----"]));
MDP.addEdge(new CustomEdge("1_13_0", "2_13_0", [["2_13_0", 0.99], [KEY_DEATH, 0.01]], ["---------&-"]));
MDP.addEdge(new CustomEdge("1_13_0", "0_13_0", [["0_13_0", 0.99], [KEY_DEATH, 0.01]], ["-----&-----"]));
MDP.addEdge(new CustomEdge("12_0_0", "12_1_0", [["12_1_0", 0.99], [KEY_DEATH, 0.01]], ["-----&-----"]));
MDP.addEdge(new CustomEdge("12_0_0", "13_0_0", [["13_0_0", 0.99], [KEY_DEATH, 0.01]], ["-----&-----"]));
MDP.addEdge(new CustomEdge("12_0_0", "11_0_0", [["11_0_0", 0.99], [KEY_DEATH, 0.01]], ["-----&-----"]));
MDP.addEdge(new CustomEdge("5_10_0", "5_11_0", [["5_11_0", 0.99], [KEY_DEATH, 0.01]], ["---------&-"]));
MDP.addEdge(new CustomEdge("5_10_0", "5_9_0", [["5_9_0", 0.99], [KEY_DEATH, 0.01]], ["-----&-----"]));
MDP.addEdge(new CustomEdge("5_10_0", "6_10_0", [["6_10_0", 0.99], [KEY_DEATH, 0.01]], ["---------&-"]));
MDP.addEdge(new CustomEdge("5_10_0", "4_10_0", [["4_10_0", 0.99], [KEY_DEATH, 0.01]], ["---------&-"]));
MDP.addEdge(new CustomEdge("16_2_0", "16_3_0", [["16_3_0", 0.99], [KEY_DEATH, 0.01]], ["-----&-----"]));
MDP.addEdge(new CustomEdge("16_2_0", "16_1_0", [["16_1_0", 0.99], [KEY_DEATH, 0.01]], ["-----&-----"]));
MDP.addEdge(new CustomEdge("16_2_0", "17_2_0", [["17_2_0", 0.99], [KEY_DEATH, 0.01]], ["-----&-----"]));
MDP.addEdge(new CustomEdge("16_2_0", "15_2_0", [["15_2_0", 0.99], [KEY_DEATH, 0.01]], ["-----&-----", "-&---------"]));
MDP.addEdge(new CustomEdge("11_1_0", "11_2_0", [["11_2_0", 0.99], [KEY_DEATH, 0.01]], ["-&---------"]));
MDP.addEdge(new CustomEdge("11_1_0", "11_0_0", [["11_0_0", 0.99], [KEY_DEATH, 0.01]], ["-----&-----"]));
MDP.addEdge(new CustomEdge("11_1_0", "12_1_0", [["12_1_0", 0.99], [KEY_DEATH, 0.01]], ["-----&-----"]));
MDP.addEdge(new CustomEdge("11_1_0", "10_1_0", [["10_1_0", 0.99], [KEY_DEATH, 0.01]], ["-&---------"]));
MDP.addEdge(new CustomEdge("7_2_0", "7_3_0", [["7_3_0", 0.99], [KEY_DEATH, 0.01]], ["-----&-----"]));
MDP.addEdge(new CustomEdge("7_2_0", "7_1_0", [["7_1_0", 0.99], [KEY_DEATH, 0.01]], ["-----&-----"]));
MDP.addEdge(new CustomEdge("7_2_0", "8_2_0", [["8_2_0", 0.99], [KEY_DEATH, 0.01]], ["-----&-----"]));
MDP.addEdge(new CustomEdge("7_2_0", "6_2_0", [["6_2_0", 0.99], [KEY_DEATH, 0.01]], ["-----&-----"]));
MDP.addEdge(new CustomEdge("4_10_0", "4_11_0", [["4_11_0", 0.99], [KEY_DEATH, 0.01]], ["---------&-"]));
MDP.addEdge(new CustomEdge("4_10_0", "4_9_0", [["4_9_0", 0.99], [KEY_DEATH, 0.01]], ["---------&-"]));
MDP.addEdge(new CustomEdge("4_10_0", "5_10_0", [["5_10_0", 0.99], [KEY_DEATH, 0.01]], ["-----&-----"]));
MDP.addEdge(new CustomEdge("4_10_0", "3_10_0", [["3_10_0", 0.99], [KEY_DEATH, 0.01]], ["---------&-"]));
MDP.addEdge(new CustomEdge("1_1_0", "1_2_0", [["1_2_0", 0.99], [KEY_DEATH, 0.01]], ["-----&-----"]));
MDP.addEdge(new CustomEdge("1_1_0", "1_0_0", [["1_0_0", 0.99], [KEY_DEATH, 0.01]], ["-----&-----"]));
MDP.addEdge(new CustomEdge("1_1_0", "2_1_0", [["2_1_0", 0.99], [KEY_DEATH, 0.01]], ["-----&-----"]));
MDP.addEdge(new CustomEdge("1_1_0", "0_1_0", [["0_1_0", 0.99], [KEY_DEATH, 0.01]], ["-----&-----"]));
MDP.addEdge(new CustomEdge("7_0_0", "7_1_0", [["7_1_0", 0.99], [KEY_DEATH, 0.01]], ["-&---------"]));
MDP.addEdge(new CustomEdge("7_0_0", "8_0_0", [["8_0_0", 0.99], [KEY_DEATH, 0.01]], ["-&---------"]));
MDP.addEdge(new CustomEdge("7_0_0", "6_0_0", [["6_0_0", 0.99], [KEY_DEATH, 0.01]], ["-&---------"]));
MDP.addEdge(new CustomEdge("5_5_0", "5_4_0", [["5_4_0", 0.99], [KEY_DEATH, 0.01]], ["---------&-"]));
MDP.addEdge(new CustomEdge("5_5_0", "6_5_0", [["6_5_0", 0.99], [KEY_DEATH, 0.01]], ["---------&-"]));
MDP.addEdge(new CustomEdge("0_6_0", "0_5_0", [["0_5_0", 0.99], [KEY_DEATH, 0.01]], []));
MDP.addEdge(new CustomEdge("1_3_0", "1_2_0", [["1_2_0", 0.99], [KEY_DEATH, 0.01]], []));
MDP.addEdge(new CustomEdge("1_3_0", "2_3_0", [["2_3_0", 0.99], [KEY_DEATH, 0.01]], []));
MDP.addEdge(new CustomEdge("1_3_0", "0_3_0", [["0_3_0", 0.99], [KEY_DEATH, 0.01]], []));
MDP.addEdge(new CustomEdge("5_2_0", "5_1_0", [["5_1_0", 0.99], [KEY_DEATH, 0.01]], ["-&---------"]));
MDP.addEdge(new CustomEdge("5_2_0", "6_2_0", [["6_2_0", 0.99], [KEY_DEATH, 0.01]], ["-&---------"]));
MDP.addEdge(new CustomEdge("5_2_0", "4_2_0", [["4_2_0", 0.99], [KEY_DEATH, 0.01]], ["---------&-", "---------&-"]));
MDP.addEdge(new CustomEdge("10_0_0", "10_1_0", [["10_1_0", 0.99], [KEY_DEATH, 0.01]], ["-----&-----", "-&---------"]));
MDP.addEdge(new CustomEdge("10_0_0", "11_0_0", [["11_0_0", 0.99], [KEY_DEATH, 0.01]], ["---------&-"]));
MDP.addEdge(new CustomEdge("10_0_0", "9_0_0", [["9_0_0", 0.99], [KEY_DEATH, 0.01]], ["-----&-----", "-&---------"]));
MDP.addEdge(new CustomEdge("3_0_0", "3_1_0", [["3_1_0", 0.99], [KEY_DEATH, 0.01]], []));
MDP.addEdge(new CustomEdge("3_0_0", "4_0_0", [["4_0_0", 0.99], [KEY_DEATH, 0.01]], []));
MDP.addEdge(new CustomEdge("3_0_0", "2_0_0", [["2_0_0", 0.99], [KEY_DEATH, 0.01]], []));
MDP.addEdge(new CustomEdge("4_8_0", "4_9_0", [["4_9_0", 0.99], [KEY_DEATH, 0.01]], ["---------&-"]));
MDP.addEdge(new CustomEdge("4_8_0", "5_8_0", [["5_8_0", 0.99], [KEY_DEATH, 0.01]], ["-----&-----"]));
MDP.addEdge(new CustomEdge("7_3_0", "7_4_0", [["7_4_0", 0.99], [KEY_DEATH, 0.01]], ["---------&-", "---------&-"]));
MDP.addEdge(new CustomEdge("7_3_0", "7_2_0", [["7_2_0", 0.99], [KEY_DEATH, 0.01]], ["---------&-", "---------&-"]));
MDP.addEdge(new CustomEdge("7_3_0", "8_3_0", [["8_3_0", 0.99], [KEY_DEATH, 0.01]], ["---------&-", "---------&-"]));
MDP.addEdge(new CustomEdge("7_3_0", "6_3_0", [["6_3_0", 0.99], [KEY_DEATH, 0.01]], ["-----&-----", "-----&-----", "---------&-", "---------&-"]));
MDP.addEdge(new CustomEdge("15_0_0", "15_1_0", [["15_1_0", 0.99], [KEY_DEATH, 0.01]], []));
MDP.addEdge(new CustomEdge("15_0_0", "14_0_0", [["14_0_0", 0.99], [KEY_DEATH, 0.01]], []));
MDP.addEdge(new CustomEdge("0_12_0", "0_13_0", [["0_13_0", 0.99], [KEY_DEATH, 0.01]], ["-----&-----"]));
MDP.addEdge(new CustomEdge("0_12_0", "0_11_0", [["0_11_0", 0.99], [KEY_DEATH, 0.01]], ["-----&-----"]));
MDP.addEdge(new CustomEdge("0_12_0", "1_12_0", [["1_12_0", 0.99], [KEY_DEATH, 0.01]], ["-----&-----"]));
MDP.addEdge(new CustomEdge("12_1_0", "12_2_0", [["12_2_0", 0.99], [KEY_DEATH, 0.01]], ["-----&-----"]));
MDP.addEdge(new CustomEdge("12_1_0", "12_0_0", [["12_0_0", 0.99], [KEY_DEATH, 0.01]], ["-----&-----"]));
MDP.addEdge(new CustomEdge("12_1_0", "13_1_0", [["13_1_0", 0.99], [KEY_DEATH, 0.01]], ["-&---------"]));
MDP.addEdge(new CustomEdge("12_1_0", "11_1_0", [["11_1_0", 0.99], [KEY_DEATH, 0.01]], ["-----&-----"]));
MDP.addEdge(new CustomEdge("4_2_0", "4_3_0", [["4_3_0", 0.99], [KEY_DEATH, 0.01]], ["---------&-", "---------&-"]));
MDP.addEdge(new CustomEdge("4_2_0", "4_1_0", [["4_1_0", 0.99], [KEY_DEATH, 0.01]], ["-&---------"]));
MDP.addEdge(new CustomEdge("4_2_0", "5_2_0", [["5_2_0", 0.99], [KEY_DEATH, 0.01]], ["---------&-", "---------&-"]));
MDP.addEdge(new CustomEdge("4_2_0", "3_2_0", [["3_2_0", 0.99], [KEY_DEATH, 0.01]], ["-&---------"]));
MDP.addEdge(new CustomEdge("5_7_0", "5_8_0", [["5_8_0", 0.99], [KEY_DEATH, 0.01]], ["-&---------"]));
MDP.addEdge(new CustomEdge("5_7_0", "6_7_0", [["6_7_0", 0.99], [KEY_DEATH, 0.01]], ["-----&-----"]));
MDP.addEdge(new CustomEdge("5_0_0", "5_1_0", [["5_1_0", 0.99], [KEY_DEATH, 0.01]], ["-&---------"]));
MDP.addEdge(new CustomEdge("5_0_0", "6_0_0", [["6_0_0", 0.99], [KEY_DEATH, 0.01]], ["-&---------"]));
MDP.addEdge(new CustomEdge("5_0_0", "4_0_0", [["4_0_0", 0.99], [KEY_DEATH, 0.01]], ["-&---------"]));
MDP.addEdge(new CustomEdge("15_2_0", "15_3_0", [["15_3_0", 0.99], [KEY_DEATH, 0.01]], ["-&---------", "---------&-"]));
MDP.addEdge(new CustomEdge("15_2_0", "15_1_0", [["15_1_0", 0.99], [KEY_DEATH, 0.01]], ["-&---------"]));
MDP.addEdge(new CustomEdge("15_2_0", "16_2_0", [["16_2_0", 0.99], [KEY_DEATH, 0.01]], ["-&---------"]));
MDP.addEdge(new CustomEdge("15_2_0", "14_2_0", [["14_2_0", 0.99], [KEY_DEATH, 0.01]], ["-----&-----", "-&---------", "-----&-----"]));
MDP.addEdge(new CustomEdge("8_1_0", "8_2_0", [["8_2_0", 0.99], [KEY_DEATH, 0.01]], ["-&---------"]));
MDP.addEdge(new CustomEdge("8_1_0", "8_0_0", [["8_0_0", 0.99], [KEY_DEATH, 0.01]], ["-&---------"]));
MDP.addEdge(new CustomEdge("8_1_0", "9_1_0", [["9_1_0", 0.99], [KEY_DEATH, 0.01]], ["-&---------"]));
MDP.addEdge(new CustomEdge("8_1_0", "7_1_0", [["7_1_0", 0.99], [KEY_DEATH, 0.01]], ["-&---------"]));
MDP.addEdge(new CustomEdge("3_10_0", "3_11_0", [["3_11_0", 0.99], [KEY_DEATH, 0.01]], ["---------&-"]));
MDP.addEdge(new CustomEdge("3_10_0", "4_10_0", [["4_10_0", 0.99], [KEY_DEATH, 0.01]], ["---------&-"]));
MDP.addEdge(new CustomEdge("3_10_0", "2_10_0", [["2_10_0", 0.99], [KEY_DEATH, 0.01]], ["-----&-----"]));
MDP.addEdge(new CustomEdge("0_0_0", "0_1_0", [["0_1_0", 0.99], [KEY_DEATH, 0.01]], ["-----&-----"]));
MDP.addEdge(new CustomEdge("0_0_0", "1_0_0", [["1_0_0", 0.99], [KEY_DEATH, 0.01]], ["-----&-----"]));
MDP.addEdge(new CustomEdge("10_3_0", "10_4_0", [["10_4_0", 0.99], [KEY_DEATH, 0.01]], ["---------&-"]));
MDP.addEdge(new CustomEdge("10_3_0", "10_2_0", [["10_2_0", 0.99], [KEY_DEATH, 0.01]], ["---------&-"]));
MDP.addEdge(new CustomEdge("10_3_0", "11_3_0", [["11_3_0", 0.99], [KEY_DEATH, 0.01]], ["---------&-"]));
MDP.addEdge(new CustomEdge("10_3_0", "9_3_0", [["9_3_0", 0.99], [KEY_DEATH, 0.01]], ["---------&-"]));
MDP.addEdge(new CustomEdge("5_4_0", "4_4_0", [["4_4_0", 0.99], [KEY_DEATH, 0.01]], ["---------&-"]));
MDP.addEdge(new CustomEdge("2_2_0", "2_3_0", [["2_3_0", 0.99], [KEY_DEATH, 0.01]], []));
MDP.addEdge(new CustomEdge("2_2_0", "2_1_0", [["2_1_0", 0.99], [KEY_DEATH, 0.01]], []));
MDP.addEdge(new CustomEdge("2_2_0", "3_2_0", [["3_2_0", 0.99], [KEY_DEATH, 0.01]], []));
MDP.addEdge(new CustomEdge("2_2_0", "1_2_0", [["1_2_0", 0.99], [KEY_DEATH, 0.01]], []));
MDP.addEdge(new CustomEdge("6_0_0", "6_1_0", [["6_1_0", 0.99], [KEY_DEATH, 0.01]], ["-&---------"]));
MDP.addEdge(new CustomEdge("6_0_0", "7_0_0", [["7_0_0", 0.99], [KEY_DEATH, 0.01]], ["-&---------"]));
MDP.addEdge(new CustomEdge("6_0_0", "5_0_0", [["5_0_0", 0.99], [KEY_DEATH, 0.01]], ["-&---------"]));
MDP.addEdge(new CustomEdge("15_3_0", "15_4_0", [["15_4_0", 0.99], [KEY_DEATH, 0.01]], ["-&---------"]));
MDP.addEdge(new CustomEdge("15_3_0", "15_2_0", [["15_2_0", 0.99], [KEY_DEATH, 0.01]], ["-----&-----", "-&---------", "-&---------"]));
MDP.addEdge(new CustomEdge("15_3_0", "16_3_0", [["16_3_0", 0.99], [KEY_DEATH, 0.01]], ["-&---------"]));
MDP.addEdge(new CustomEdge("15_3_0", "14_3_0", [["14_3_0", 0.99], [KEY_DEATH, 0.01]], ["---------&-", "-&---------"]));
MDP.addEdge(new CustomEdge("4_11_0", "4_12_0", [["4_12_0", 0.99], [KEY_DEATH, 0.01]], ["---------&-"]));
MDP.addEdge(new CustomEdge("4_11_0", "4_10_0", [["4_10_0", 0.99], [KEY_DEATH, 0.01]], ["---------&-"]));
MDP.addEdge(new CustomEdge("4_11_0", "5_11_0", [["5_11_0", 0.99], [KEY_DEATH, 0.01]], ["---------&-"]));
MDP.addEdge(new CustomEdge("4_11_0", "3_11_0", [["3_11_0", 0.99], [KEY_DEATH, 0.01]], ["---------&-"]));
MDP.addEdge(new CustomEdge("9_4_0", "9_5_0", [["9_5_0", 0.99], [KEY_DEATH, 0.01]], ["---------&-", "---------&-"]));
MDP.addEdge(new CustomEdge("9_4_0", "9_3_0", [["9_3_0", 0.99], [KEY_DEATH, 0.01]], ["---------&-", "---------&-"]));
MDP.addEdge(new CustomEdge("9_4_0", "10_4_0", [["10_4_0", 0.99], [KEY_DEATH, 0.01]], ["-&---------"]));
MDP.addEdge(new CustomEdge("9_4_0", "8_4_0", [["8_4_0", 0.99], [KEY_DEATH, 0.01]], ["---------&-", "---------&-"]));
MDP.addEdge(new CustomEdge("11_0_0", "11_1_0", [["11_1_0", 0.99], [KEY_DEATH, 0.01]], ["-----&-----"]));
MDP.addEdge(new CustomEdge("11_0_0", "12_0_0", [["12_0_0", 0.99], [KEY_DEATH, 0.01]], ["-----&-----"]));
MDP.addEdge(new CustomEdge("11_0_0", "10_0_0", [["10_0_0", 0.99], [KEY_DEATH, 0.01]], ["-----&-----"]));
MDP.addEdge(new CustomEdge("5_9_0", "5_10_0", [["5_10_0", 0.99], [KEY_DEATH, 0.01]], []));
MDP.addEdge(new CustomEdge("5_9_0", "5_8_0", [["5_8_0", 0.99], [KEY_DEATH, 0.01]], ["-----&-----"]));
MDP.addEdge(new CustomEdge("5_9_0", "6_9_0", [["6_9_0", 0.99], [KEY_DEATH, 0.01]], ["-----&-----"]));
MDP.addEdge(new CustomEdge("5_9_0", "4_9_0", [["4_9_0", 0.99], [KEY_DEATH, 0.01]], ["---------&-"]));
MDP.addEdge(new CustomEdge("5_12_0", "5_13_0", [["5_13_0", 0.99], [KEY_DEATH, 0.01]], ["-----&-----"]));
MDP.addEdge(new CustomEdge("5_12_0", "5_11_0", [["5_11_0", 0.99], [KEY_DEATH, 0.01]], ["-----&-----"]));
MDP.addEdge(new CustomEdge("5_12_0", "6_12_0", [["6_12_0", 0.99], [KEY_DEATH, 0.01]], []));
MDP.addEdge(new CustomEdge("5_12_0", "4_12_0", [["4_12_0", 0.99], [KEY_DEATH, 0.01]], ["---------&-"]));
MDP.addEdge(new CustomEdge("8_5_0", "8_6_0", [["8_6_0", 0.99], [KEY_DEATH, 0.01]], ["-----&-----", "-----&-----"]));
MDP.addEdge(new CustomEdge("8_5_0", "8_4_0", [["8_4_0", 0.99], [KEY_DEATH, 0.01]], ["-----&-----", "---------&-"]));
MDP.addEdge(new CustomEdge("8_5_0", "9_5_0", [["9_5_0", 0.99], [KEY_DEATH, 0.01]], ["-----&-----", "---------&-"]));
MDP.addEdge(new CustomEdge("8_5_0", "7_5_0", [["7_5_0", 0.99], [KEY_DEATH, 0.01]], ["-----&-----", "---------&-"]));
MDP.addEdge(new CustomEdge("1_11_0", "1_12_0", [["1_12_0", 0.99], [KEY_DEATH, 0.01]], ["-----&-----"]));
MDP.addEdge(new CustomEdge("1_11_0", "2_11_0", [["2_11_0", 0.99], [KEY_DEATH, 0.01]], []));
MDP.addEdge(new CustomEdge("1_11_0", "0_11_0", [["0_11_0", 0.99], [KEY_DEATH, 0.01]], []));
MDP.addEdge(new CustomEdge("2_0_0", "2_1_0", [["2_1_0", 0.99], [KEY_DEATH, 0.01]], []));
MDP.addEdge(new CustomEdge("2_0_0", "3_0_0", [["3_0_0", 0.99], [KEY_DEATH, 0.01]], []));
MDP.addEdge(new CustomEdge("2_0_0", "1_0_0", [["1_0_0", 0.99], [KEY_DEATH, 0.01]], []));
MDP.addEdge(new CustomEdge("14_3_0", "14_4_0", [["14_4_0", 0.99], [KEY_DEATH, 0.01]], ["-&---------"]));
MDP.addEdge(new CustomEdge("14_3_0", "14_2_0", [["14_2_0", 0.99], [KEY_DEATH, 0.01]], ["-----&-----", "-&---------", "-&---------"]));
MDP.addEdge(new CustomEdge("14_3_0", "15_3_0", [["15_3_0", 0.99], [KEY_DEATH, 0.01]], ["-----&-----", "-&---------"]));
MDP.addEdge(new CustomEdge("14_3_0", "13_3_0", [["13_3_0", 0.99], [KEY_DEATH, 0.01]], ["---------&-", "-&---------"]));
MDP.addEdge(new CustomEdge("7_8_0", "7_9_0", [["7_9_0", 0.99], [KEY_DEATH, 0.01]], ["-----&-----"]));
MDP.addEdge(new CustomEdge("7_8_0", "7_7_0", [["7_7_0", 0.99], [KEY_DEATH, 0.01]], ["-----&-----"]));
MDP.addEdge(new CustomEdge("7_8_0", "8_8_0", [["8_8_0", 0.99], [KEY_DEATH, 0.01]], ["-----&-----"]));
MDP.addEdge(new CustomEdge("7_8_0", "6_8_0", [["6_8_0", 0.99], [KEY_DEATH, 0.01]], ["-----&-----"]));
MDP.addEdge(new CustomEdge("1_12_0", "1_13_0", [["1_13_0", 0.99], [KEY_DEATH, 0.01]], []));
MDP.addEdge(new CustomEdge("1_12_0", "1_11_0", [["1_11_0", 0.99], [KEY_DEATH, 0.01]], ["-----&-----"]));
MDP.addEdge(new CustomEdge("1_12_0", "2_12_0", [["2_12_0", 0.99], [KEY_DEATH, 0.01]], ["---------&-"]));
MDP.addEdge(new CustomEdge("1_12_0", "0_12_0", [["0_12_0", 0.99], [KEY_DEATH, 0.01]], []));
MDP.addEdge(new CustomEdge("10_1_0", "10_2_0", [["10_2_0", 0.99], [KEY_DEATH, 0.01]], ["-&---------"]));
MDP.addEdge(new CustomEdge("10_1_0", "10_0_0", [["10_0_0", 0.99], [KEY_DEATH, 0.01]], ["-&---------"]));
MDP.addEdge(new CustomEdge("10_1_0", "11_1_0", [["11_1_0", 0.99], [KEY_DEATH, 0.01]], ["-&---------"]));
MDP.addEdge(new CustomEdge("10_1_0", "9_1_0", [["9_1_0", 0.99], [KEY_DEATH, 0.01]], ["-&---------"]));
MDP.addEdge(new CustomEdge("0_11_0", "0_12_0", [["0_12_0", 0.99], [KEY_DEATH, 0.01]], []));
MDP.addEdge(new CustomEdge("0_11_0", "1_11_0", [["1_11_0", 0.99], [KEY_DEATH, 0.01]], []));
MDP.addEdge(new CustomEdge("16_3_0", "16_4_0", [["16_4_0", 0.99], [KEY_DEATH, 0.01]], ["-----&-----"]));
MDP.addEdge(new CustomEdge("16_3_0", "16_2_0", [["16_2_0", 0.99], [KEY_DEATH, 0.01]], ["-----&-----"]));
MDP.addEdge(new CustomEdge("16_3_0", "15_3_0", [["15_3_0", 0.99], [KEY_DEATH, 0.01]], ["-----&-----", "-----&-----"]));
MDP.addEdge(new CustomEdge("9_2_0", "9_3_0", [["9_3_0", 0.99], [KEY_DEATH, 0.01]], ["---------&-", "---------&-"]));
MDP.addEdge(new CustomEdge("9_2_0", "9_1_0", [["9_1_0", 0.99], [KEY_DEATH, 0.01]], ["-----&-----"]));
MDP.addEdge(new CustomEdge("9_2_0", "10_2_0", [["10_2_0", 0.99], [KEY_DEATH, 0.01]], ["-----&-----"]));
MDP.addEdge(new CustomEdge("9_2_0", "8_2_0", [["8_2_0", 0.99], [KEY_DEATH, 0.01]], ["-----&-----"]));
MDP.addEdge(new CustomEdge("3_13_0", "3_14_0", [["3_14_0", 0.99], [KEY_DEATH, 0.01]], ["-&---------"]));
MDP.addEdge(new CustomEdge("3_13_0", "3_12_0", [["3_12_0", 0.99], [KEY_DEATH, 0.01]], ["---------&-"]));
MDP.addEdge(new CustomEdge("3_13_0", "4_13_0", [["4_13_0", 0.99], [KEY_DEATH, 0.01]], []));
MDP.addEdge(new CustomEdge("3_13_0", "2_13_0", [["2_13_0", 0.99], [KEY_DEATH, 0.01]], ["---------&-"]));
MDP.addEdge(new CustomEdge("4_12_0", "4_13_0", [["4_13_0", 0.99], [KEY_DEATH, 0.01]], ["-----&-----"]));
MDP.addEdge(new CustomEdge("4_12_0", "4_11_0", [["4_11_0", 0.99], [KEY_DEATH, 0.01]], ["---------&-"]));
MDP.addEdge(new CustomEdge("4_12_0", "5_12_0", [["5_12_0", 0.99], [KEY_DEATH, 0.01]], ["-----&-----"]));
MDP.addEdge(new CustomEdge("4_12_0", "3_12_0", [["3_12_0", 0.99], [KEY_DEATH, 0.01]], ["---------&-"]));
MDP.addEdge(new CustomEdge("1_0_0", "1_1_0", [["1_1_0", 0.99], [KEY_DEATH, 0.01]], []));
MDP.addEdge(new CustomEdge("1_0_0", "2_0_0", [["2_0_0", 0.99], [KEY_DEATH, 0.01]], []));
MDP.addEdge(new CustomEdge("1_0_0", "0_0_0", [["0_0_0", 0.99], [KEY_DEATH, 0.01]], []));
MDP.addEdge(new CustomEdge("7_4_0", "7_5_0", [["7_5_0", 0.99], [KEY_DEATH, 0.01]], ["-----&-----", "---------&-"]));
MDP.addEdge(new CustomEdge("7_4_0", "7_3_0", [["7_3_0", 0.99], [KEY_DEATH, 0.01]], ["-----&-----"]));
MDP.addEdge(new CustomEdge("7_4_0", "8_4_0", [["8_4_0", 0.99], [KEY_DEATH, 0.01]], ["-----&-----", "---------&-"]));
MDP.addEdge(new CustomEdge("7_4_0", "6_4_0", [["6_4_0", 0.99], [KEY_DEATH, 0.01]], ["-----&-----", "---------&-"]));
MDP.addEdge(new CustomEdge("9_1_0", "9_2_0", [["9_2_0", 0.99], [KEY_DEATH, 0.01]], ["-&---------"]));
MDP.addEdge(new CustomEdge("9_1_0", "9_0_0", [["9_0_0", 0.99], [KEY_DEATH, 0.01]], ["-&---------"]));
MDP.addEdge(new CustomEdge("9_1_0", "10_1_0", [["10_1_0", 0.99], [KEY_DEATH, 0.01]], ["-&---------"]));
MDP.addEdge(new CustomEdge("9_1_0", "8_1_0", [["8_1_0", 0.99], [KEY_DEATH, 0.01]], ["-&---------"]));
MDP.addEdge(new CustomEdge("4_9_0", "4_10_0", [["4_10_0", 0.99], [KEY_DEATH, 0.01]], ["---------&-"]));
MDP.addEdge(new CustomEdge("4_9_0", "4_8_0", [["4_8_0", 0.99], [KEY_DEATH, 0.01]], ["---------&-"]));
MDP.addEdge(new CustomEdge("4_9_0", "5_9_0", [["5_9_0", 0.99], [KEY_DEATH, 0.01]], ["-----&-----"]));
MDP.addEdge(new CustomEdge("1_14_0", "1_15_0", [["1_15_0", 0.99], [KEY_DEATH, 0.01]], ["-----&-----"]));
MDP.addEdge(new CustomEdge("1_14_0", "1_13_0", [["1_13_0", 0.99], [KEY_DEATH, 0.01]], ["-----&-----"]));
MDP.addEdge(new CustomEdge("1_14_0", "2_14_0", [["2_14_0", 0.99], [KEY_DEATH, 0.01]], ["-----&-----"]));
MDP.addEdge(new CustomEdge("1_14_0", "0_14_0", [["0_14_0", 0.99], [KEY_DEATH, 0.01]], []));
MDP.addEdge(new CustomEdge("2_10_0", "2_11_0", [["2_11_0", 0.99], [KEY_DEATH, 0.01]], ["-----&-----"]));
MDP.addEdge(new CustomEdge("2_10_0", "3_10_0", [["3_10_0", 0.99], [KEY_DEATH, 0.01]], ["---------&-"]));
MDP.addEdge(new CustomEdge("8_7_0", "8_8_0", [["8_8_0", 0.99], [KEY_DEATH, 0.01]], ["---------&-", "-&---------"]));
MDP.addEdge(new CustomEdge("8_7_0", "8_6_0", [["8_6_0", 0.99], [KEY_DEATH, 0.01]], ["---------&-", "-&---------"]));
MDP.addEdge(new CustomEdge("8_7_0", "9_7_0", [["9_7_0", 0.99], [KEY_DEATH, 0.01]], ["-----&-----", "-----&-----"]));
MDP.addEdge(new CustomEdge("8_7_0", "7_7_0", [["7_7_0", 0.99], [KEY_DEATH, 0.01]], ["-----&-----", "-----&-----"]));
MDP.addEdge(new CustomEdge("11_2_0", "11_3_0", [["11_3_0", 0.99], [KEY_DEATH, 0.01]], ["-&---------"]));
MDP.addEdge(new CustomEdge("11_2_0", "11_1_0", [["11_1_0", 0.99], [KEY_DEATH, 0.01]], ["-&---------"]));
MDP.addEdge(new CustomEdge("11_2_0", "12_2_0", [["12_2_0", 0.99], [KEY_DEATH, 0.01]], ["-&---------"]));
MDP.addEdge(new CustomEdge("11_2_0", "10_2_0", [["10_2_0", 0.99], [KEY_DEATH, 0.01]], ["-&---------"]));
MDP.addEdge(new CustomEdge("6_7_0", "6_8_0", [["6_8_0", 0.99], [KEY_DEATH, 0.01]], []));
MDP.addEdge(new CustomEdge("6_7_0", "7_7_0", [["7_7_0", 0.99], [KEY_DEATH, 0.01]], ["-----&-----"]));
MDP.addEdge(new CustomEdge("6_7_0", "5_7_0", [["5_7_0", 0.99], [KEY_DEATH, 0.01]], ["---------&-"]));
MDP.addEdge(new CustomEdge("2_13_0", "2_14_0", [["2_14_0", 0.99], [KEY_DEATH, 0.01]], ["-----&-----"]));
MDP.addEdge(new CustomEdge("2_13_0", "2_12_0", [["2_12_0", 0.99], [KEY_DEATH, 0.01]], ["---------&-"]));
MDP.addEdge(new CustomEdge("2_13_0", "3_13_0", [["3_13_0", 0.99], [KEY_DEATH, 0.01]], ["-----&-----"]));
MDP.addEdge(new CustomEdge("2_13_0", "1_13_0", [["1_13_0", 0.99], [KEY_DEATH, 0.01]], ["-----&-----"]));
MDP.addEdge(new CustomEdge("6_1_0", "6_2_0", [["6_2_0", 0.99], [KEY_DEATH, 0.01]], ["-----&-----"]));
MDP.addEdge(new CustomEdge("6_1_0", "6_0_0", [["6_0_0", 0.99], [KEY_DEATH, 0.01]], ["-&---------"]));
MDP.addEdge(new CustomEdge("6_1_0", "7_1_0", [["7_1_0", 0.99], [KEY_DEATH, 0.01]], ["-&---------"]));
MDP.addEdge(new CustomEdge("6_1_0", "5_1_0", [["5_1_0", 0.99], [KEY_DEATH, 0.01]], ["-&---------"]));
MDP.addEdge(new CustomEdge("3_11_0", "3_12_0", [["3_12_0", 0.99], [KEY_DEATH, 0.01]], ["---------&-"]));
MDP.addEdge(new CustomEdge("3_11_0", "3_10_0", [["3_10_0", 0.99], [KEY_DEATH, 0.01]], ["---------&-"]));
MDP.addEdge(new CustomEdge("3_11_0", "4_11_0", [["4_11_0", 0.99], [KEY_DEATH, 0.01]], ["---------&-"]));
MDP.addEdge(new CustomEdge("3_11_0", "2_11_0", [["2_11_0", 0.99], [KEY_DEATH, 0.01]], ["-----&-----"]));
MDP.addEdge(new CustomEdge("10_2_0", "10_3_0", [["10_3_0", 0.99], [KEY_DEATH, 0.01]], ["-----&-----"]));
MDP.addEdge(new CustomEdge("10_2_0", "10_1_0", [["10_1_0", 0.99], [KEY_DEATH, 0.01]], ["-----&-----"]));
MDP.addEdge(new CustomEdge("10_2_0", "11_2_0", [["11_2_0", 0.99], [KEY_DEATH, 0.01]], ["-----&-----"]));
MDP.addEdge(new CustomEdge("10_2_0", "9_2_0", [["9_2_0", 0.99], [KEY_DEATH, 0.01]], ["-----&-----"]));
MDP.addEdge(new CustomEdge("17_2_0", "18_2_0", [["18_2_0", 0.99], [KEY_DEATH, 0.01]], ["-----&-----"]));
MDP.addEdge(new CustomEdge("17_2_0", "16_2_0", [["16_2_0", 0.99], [KEY_DEATH, 0.01]], []));
MDP.addEdge(new CustomEdge("16_4_0", "16_3_0", [["16_3_0", 0.99], [KEY_DEATH, 0.01]], ["-&---------"]));
MDP.addEdge(new CustomEdge("16_4_0", "17_4_0", [["17_4_0", 0.99], [KEY_DEATH, 0.01]], ["-----&-----"]));
MDP.addEdge(new CustomEdge("16_4_0", "15_4_0", [["15_4_0", 0.99], [KEY_DEATH, 0.01]], ["-&---------"]));
MDP.addEdge(new CustomEdge("8_8_0", "8_9_0", [["8_9_0", 0.99], [KEY_DEATH, 0.01]], ["-&---------", "-----&-----"]));
MDP.addEdge(new CustomEdge("8_8_0", "8_7_0", [["8_7_0", 0.99], [KEY_DEATH, 0.01]], ["-----&-----", "-----&-----"]));
MDP.addEdge(new CustomEdge("8_8_0", "7_8_0", [["7_8_0", 0.99], [KEY_DEATH, 0.01]], ["-----&-----", "-&---------"]));
MDP.addEdge(new CustomEdge("10_4_0", "10_5_0", [["10_5_0", 0.99], [KEY_DEATH, 0.01]], ["---------&-", "---------&-"]));
MDP.addEdge(new CustomEdge("10_4_0", "10_3_0", [["10_3_0", 0.99], [KEY_DEATH, 0.01]], []));
MDP.addEdge(new CustomEdge("10_4_0", "11_4_0", [["11_4_0", 0.99], [KEY_DEATH, 0.01]], []));
MDP.addEdge(new CustomEdge("10_4_0", "9_4_0", [["9_4_0", 0.99], [KEY_DEATH, 0.01]], ["-&---------"]));
MDP.addEdge(new CustomEdge("0_14_0", "0_13_0", [["0_13_0", 0.99], [KEY_DEATH, 0.01]], []));
MDP.addEdge(new CustomEdge("0_14_0", "1_14_0", [["1_14_0", 0.99], [KEY_DEATH, 0.01]], ["-----&-----"]));
MDP.addEdge(new CustomEdge("2_16_0", "2_15_0", [["2_15_0", 0.99], [KEY_DEATH, 0.01]], ["-----&-----"]));
MDP.addEdge(new CustomEdge("2_16_0", "3_16_0", [["3_16_0", 0.99], [KEY_DEATH, 0.01]], []));
MDP.addEdge(new CustomEdge("2_16_0", "1_16_0", [["1_16_0", 0.99], [KEY_DEATH, 0.01]], ["-----&-----"]));
MDP.addEdge(new CustomEdge("15_4_0", "15_3_0", [["15_3_0", 0.99], [KEY_DEATH, 0.01]], ["-----&-----", "-----&-----"]));
MDP.addEdge(new CustomEdge("15_4_0", "16_4_0", [["16_4_0", 0.99], [KEY_DEATH, 0.01]], ["-&---------"]));
MDP.addEdge(new CustomEdge("15_4_0", "14_4_0", [["14_4_0", 0.99], [KEY_DEATH, 0.01]], ["-----&-----"]));
MDP.addEdge(new CustomEdge("8_6_0", "8_7_0", [["8_7_0", 0.99], [KEY_DEATH, 0.01]], ["---------&-", "-&---------"]));
MDP.addEdge(new CustomEdge("8_6_0", "8_5_0", [["8_5_0", 0.99], [KEY_DEATH, 0.01]], ["-&---------", "---------&-"]));
MDP.addEdge(new CustomEdge("8_6_0", "9_6_0", [["9_6_0", 0.99], [KEY_DEATH, 0.01]], ["-----&-----", "-----&-----", "-----&-----"]));
MDP.addEdge(new CustomEdge("7_5_0", "7_4_0", [["7_4_0", 0.99], [KEY_DEATH, 0.01]], ["-----&-----", "---------&-"]));
MDP.addEdge(new CustomEdge("7_5_0", "8_5_0", [["8_5_0", 0.99], [KEY_DEATH, 0.01]], ["-----&-----", "---------&-"]));
MDP.addEdge(new CustomEdge("7_5_0", "6_5_0", [["6_5_0", 0.99], [KEY_DEATH, 0.01]], ["-----&-----", "---------&-"]));
MDP.addEdge(new CustomEdge("6_10_0", "6_11_0", [["6_11_0", 0.99], [KEY_DEATH, 0.01]], ["-----&-----"]));
MDP.addEdge(new CustomEdge("6_10_0", "6_9_0", [["6_9_0", 0.99], [KEY_DEATH, 0.01]], ["-----&-----"]));
MDP.addEdge(new CustomEdge("6_10_0", "7_10_0", [["7_10_0", 0.99], [KEY_DEATH, 0.01]], ["-----&-----"]));
MDP.addEdge(new CustomEdge("6_10_0", "5_10_0", [["5_10_0", 0.99], [KEY_DEATH, 0.01]], ["-----&-----"]));
MDP.addEdge(new CustomEdge("6_8_0", "6_9_0", [["6_9_0", 0.99], [KEY_DEATH, 0.01]], ["-----&-----"]));
MDP.addEdge(new CustomEdge("6_8_0", "6_7_0", [["6_7_0", 0.99], [KEY_DEATH, 0.01]], ["-----&-----"]));
MDP.addEdge(new CustomEdge("6_8_0", "7_8_0", [["7_8_0", 0.99], [KEY_DEATH, 0.01]], ["---------&-"]));
MDP.addEdge(new CustomEdge("6_8_0", "5_8_0", [["5_8_0", 0.99], [KEY_DEATH, 0.01]], ["-----&-----"]));
MDP.addEdge(new CustomEdge("12_2_0", "12_3_0", [["12_3_0", 0.99], [KEY_DEATH, 0.01]], ["-----&-----"]));
MDP.addEdge(new CustomEdge("12_2_0", "12_1_0", [["12_1_0", 0.99], [KEY_DEATH, 0.01]], ["-----&-----"]));
MDP.addEdge(new CustomEdge("12_2_0", "13_2_0", [["13_2_0", 0.99], [KEY_DEATH, 0.01]], ["-----&-----"]));
MDP.addEdge(new CustomEdge("12_2_0", "11_2_0", [["11_2_0", 0.99], [KEY_DEATH, 0.01]], ["-----&-----"]));
MDP.addEdge(new CustomEdge("4_13_0", "4_14_0", [["4_14_0", 0.99], [KEY_DEATH, 0.01]], ["-----&-----"]));
MDP.addEdge(new CustomEdge("4_13_0", "4_12_0", [["4_12_0", 0.99], [KEY_DEATH, 0.01]], ["---------&-"]));
MDP.addEdge(new CustomEdge("4_13_0", "5_13_0", [["5_13_0", 0.99], [KEY_DEATH, 0.01]], ["-----&-----"]));
MDP.addEdge(new CustomEdge("4_13_0", "3_13_0", [["3_13_0", 0.99], [KEY_DEATH, 0.01]], ["-----&-----"]));
MDP.addEdge(new CustomEdge("3_14_0", "3_15_0", [["3_15_0", 0.99], [KEY_DEATH, 0.01]], ["-----&-----"]));
MDP.addEdge(new CustomEdge("3_14_0", "3_13_0", [["3_13_0", 0.99], [KEY_DEATH, 0.01]], ["-----&-----"]));
MDP.addEdge(new CustomEdge("3_14_0", "4_14_0", [["4_14_0", 0.99], [KEY_DEATH, 0.01]], ["-----&-----"]));
MDP.addEdge(new CustomEdge("3_14_0", "2_14_0", [["2_14_0", 0.99], [KEY_DEATH, 0.01]], ["-----&-----"]));
MDP.addEdge(new CustomEdge("11_4_0", "11_5_0", [["11_5_0", 0.99], [KEY_DEATH, 0.01]], ["---------&-", "---------&-", "-----&-----"]));
MDP.addEdge(new CustomEdge("11_4_0", "11_3_0", [["11_3_0", 0.99], [KEY_DEATH, 0.01]], ["-----&-----"]));
MDP.addEdge(new CustomEdge("11_4_0", "12_4_0", [["12_4_0", 0.99], [KEY_DEATH, 0.01]], ["-----&-----"]));
MDP.addEdge(new CustomEdge("11_4_0", "10_4_0", [["10_4_0", 0.99], [KEY_DEATH, 0.01]], ["-&---------"]));
MDP.addEdge(new CustomEdge("10_6_0", "10_7_0", [["10_7_0", 0.99], [KEY_DEATH, 0.01]], ["-&---------"]));
MDP.addEdge(new CustomEdge("10_6_0", "10_5_0", [["10_5_0", 0.99], [KEY_DEATH, 0.01]], ["-----&-----", "---------&-"]));
MDP.addEdge(new CustomEdge("10_6_0", "11_6_0", [["11_6_0", 0.99], [KEY_DEATH, 0.01]], ["-----&-----"]));
MDP.addEdge(new CustomEdge("10_6_0", "9_6_0", [["9_6_0", 0.99], [KEY_DEATH, 0.01]], ["-----&-----", "-&---------"]));
MDP.addEdge(new CustomEdge("0_13_0", "0_14_0", [["0_14_0", 0.99], [KEY_DEATH, 0.01]], []));
MDP.addEdge(new CustomEdge("0_13_0", "0_12_0", [["0_12_0", 0.99], [KEY_DEATH, 0.01]], []));
MDP.addEdge(new CustomEdge("0_13_0", "1_13_0", [["1_13_0", 0.99], [KEY_DEATH, 0.01]], []));
MDP.addEdge(new CustomEdge("11_5_0", "11_6_0", [["11_6_0", 0.99], [KEY_DEATH, 0.01]], ["-----&-----"]));
MDP.addEdge(new CustomEdge("11_5_0", "11_4_0", [["11_4_0", 0.99], [KEY_DEATH, 0.01]], ["-----&-----"]));
MDP.addEdge(new CustomEdge("11_5_0", "12_5_0", [["12_5_0", 0.99], [KEY_DEATH, 0.01]], ["-----&-----"]));
MDP.addEdge(new CustomEdge("11_5_0", "10_5_0", [["10_5_0", 0.99], [KEY_DEATH, 0.01]], ["-----&-----", "---------&-"]));
MDP.addEdge(new CustomEdge("8_9_0", "8_8_0", [["8_8_0", 0.99], [KEY_DEATH, 0.01]], ["---------&-"]));
MDP.addEdge(new CustomEdge("8_9_0", "7_9_0", [["7_9_0", 0.99], [KEY_DEATH, 0.01]], ["-----&-----"]));
MDP.addEdge(new CustomEdge("9_7_0", "9_6_0", [["9_6_0", 0.99], [KEY_DEATH, 0.01]], ["-----&-----", "-----&-----", "---------&-", "-----&-----"]));
MDP.addEdge(new CustomEdge("2_14_0", "2_15_0", [["2_15_0", 0.99], [KEY_DEATH, 0.01]], ["-----&-----"]));
MDP.addEdge(new CustomEdge("2_14_0", "2_13_0", [["2_13_0", 0.99], [KEY_DEATH, 0.01]], ["---------&-"]));
MDP.addEdge(new CustomEdge("2_14_0", "3_14_0", [["3_14_0", 0.99], [KEY_DEATH, 0.01]], ["-----&-----", "-&---------"]));
MDP.addEdge(new CustomEdge("2_14_0", "1_14_0", [["1_14_0", 0.99], [KEY_DEATH, 0.01]], ["-----&-----"]));
MDP.addEdge(new CustomEdge("9_5_0", "9_6_0", [["9_6_0", 0.99], [KEY_DEATH, 0.01]], ["-----&-----", "-&---------"]));
MDP.addEdge(new CustomEdge("9_5_0", "9_4_0", [["9_4_0", 0.99], [KEY_DEATH, 0.01]], ["-----&-----"]));
MDP.addEdge(new CustomEdge("9_5_0", "10_5_0", [["10_5_0", 0.99], [KEY_DEATH, 0.01]], ["-----&-----", "---------&-"]));
MDP.addEdge(new CustomEdge("9_5_0", "8_5_0", [["8_5_0", 0.99], [KEY_DEATH, 0.01]], ["-----&-----", "---------&-"]));
MDP.addEdge(new CustomEdge("12_5_0", "12_6_0", [["12_6_0", 0.99], [KEY_DEATH, 0.01]], ["-----&-----"]));
MDP.addEdge(new CustomEdge("12_5_0", "12_4_0", [["12_4_0", 0.99], [KEY_DEATH, 0.01]], []));
MDP.addEdge(new CustomEdge("12_5_0", "17_5_0", [["17_5_0", 0.99], [KEY_DEATH, 0.01]], ["---------&-"]));
MDP.addEdge(new CustomEdge("12_5_0", "11_5_0", [["11_5_0", 0.99], [KEY_DEATH, 0.01]], ["---------&-"]));
MDP.addEdge(new CustomEdge("10_5_0", "10_6_0", [["10_6_0", 0.99], [KEY_DEATH, 0.01]], ["-----&-----"]));
MDP.addEdge(new CustomEdge("10_5_0", "10_4_0", [["10_4_0", 0.99], [KEY_DEATH, 0.01]], ["-----&-----"]));
MDP.addEdge(new CustomEdge("10_5_0", "11_5_0", [["11_5_0", 0.99], [KEY_DEATH, 0.01]], ["-----&-----", "---------&-"]));
MDP.addEdge(new CustomEdge("10_5_0", "9_5_0", [["9_5_0", 0.99], [KEY_DEATH, 0.01]], ["-----&-----", "---------&-"]));
MDP.addEdge(new CustomEdge("1_15_0", "1_16_0", [["1_16_0", 0.99], [KEY_DEATH, 0.01]], ["-----&-----"]));
MDP.addEdge(new CustomEdge("1_15_0", "1_14_0", [["1_14_0", 0.99], [KEY_DEATH, 0.01]], ["-----&-----"]));
MDP.addEdge(new CustomEdge("1_15_0", "2_15_0", [["2_15_0", 0.99], [KEY_DEATH, 0.01]], ["-----&-----"]));
MDP.addEdge(new CustomEdge("12_4_0", "12_5_0", [["12_5_0", 0.99], [KEY_DEATH, 0.01]], ["-----&-----"]));
MDP.addEdge(new CustomEdge("12_4_0", "12_3_0", [["12_3_0", 0.99], [KEY_DEATH, 0.01]], ["-----&-----"]));
MDP.addEdge(new CustomEdge("12_4_0", "13_4_0", [["13_4_0", 0.99], [KEY_DEATH, 0.01]], ["-----&-----", "-----&-----"]));
MDP.addEdge(new CustomEdge("12_4_0", "11_4_0", [["11_4_0", 0.99], [KEY_DEATH, 0.01]], ["-----&-----"]));
MDP.addEdge(new CustomEdge("3_16_0", "3_15_0", [["3_15_0", 0.99], [KEY_DEATH, 0.01]], ["-----&-----"]));
MDP.addEdge(new CustomEdge("3_16_0", "4_16_0", [["4_16_0", 0.99], [KEY_DEATH, 0.01]], ["-----&-----", "-----&-----"]));
MDP.addEdge(new CustomEdge("3_16_0", "2_16_0", [["2_16_0", 0.99], [KEY_DEATH, 0.01]], []));
MDP.addEdge(new CustomEdge("9_6_0", "9_7_0", [["9_7_0", 0.99], [KEY_DEATH, 0.01]], ["-----&-----", "---------&-", "-----&-----"]));
MDP.addEdge(new CustomEdge("9_6_0", "10_6_0", [["10_6_0", 0.99], [KEY_DEATH, 0.01]], ["-----&-----"]));
MDP.addEdge(new CustomEdge("9_6_0", "8_6_0", [["8_6_0", 0.99], [KEY_DEATH, 0.01]], ["-----&-----", "-----&-----"]));
MDP.addEdge(new CustomEdge("2_15_0", "2_16_0", [["2_16_0", 0.99], [KEY_DEATH, 0.01]], []));
MDP.addEdge(new CustomEdge("2_15_0", "2_14_0", [["2_14_0", 0.99], [KEY_DEATH, 0.01]], ["-----&-----"]));
MDP.addEdge(new CustomEdge("2_15_0", "3_15_0", [["3_15_0", 0.99], [KEY_DEATH, 0.01]], ["-----&-----"]));
MDP.addEdge(new CustomEdge("2_15_0", "1_15_0", [["1_15_0", 0.99], [KEY_DEATH, 0.01]], ["-----&-----"]));
MDP.addEdge(new CustomEdge("4_16_0", "4_15_0", [["4_15_0", 0.99], [KEY_DEATH, 0.01]], []));
MDP.addEdge(new CustomEdge("4_16_0", "3_16_0", [["3_16_0", 0.99], [KEY_DEATH, 0.01]], []));
MDP.addEdge(new CustomEdge("7_9_0", "7_10_0", [["7_10_0", 0.99], [KEY_DEATH, 0.01]], ["-----&-----"]));
MDP.addEdge(new CustomEdge("7_9_0", "7_8_0", [["7_8_0", 0.99], [KEY_DEATH, 0.01]], ["---------&-"]));
MDP.addEdge(new CustomEdge("7_9_0", "8_9_0", [["8_9_0", 0.99], [KEY_DEATH, 0.01]], []));
MDP.addEdge(new CustomEdge("7_9_0", "6_9_0", [["6_9_0", 0.99], [KEY_DEATH, 0.01]], ["---------&-"]));
MDP.addEdge(new CustomEdge("5_14_0", "5_15_0", [["5_15_0", 0.99], [KEY_DEATH, 0.01]], ["-----&-----", "-----&-----"]));
MDP.addEdge(new CustomEdge("5_14_0", "5_13_0", [["5_13_0", 0.99], [KEY_DEATH, 0.01]], ["-----&-----"]));
MDP.addEdge(new CustomEdge("5_14_0", "6_14_0", [["6_14_0", 0.99], [KEY_DEATH, 0.01]], ["-----&-----", "-----&-----"]));
MDP.addEdge(new CustomEdge("5_14_0", "4_14_0", [["4_14_0", 0.99], [KEY_DEATH, 0.01]], ["-----&-----"]));
MDP.addEdge(new CustomEdge("5_13_0", "5_14_0", [["5_14_0", 0.99], [KEY_DEATH, 0.01]], ["-----&-----"]));
MDP.addEdge(new CustomEdge("5_13_0", "5_12_0", [["5_12_0", 0.99], [KEY_DEATH, 0.01]], []));
MDP.addEdge(new CustomEdge("5_13_0", "4_13_0", [["4_13_0", 0.99], [KEY_DEATH, 0.01]], []));
MDP.addEdge(new CustomEdge("4_14_0", "4_15_0", [["4_15_0", 0.99], [KEY_DEATH, 0.01]], []));
MDP.addEdge(new CustomEdge("4_14_0", "4_13_0", [["4_13_0", 0.99], [KEY_DEATH, 0.01]], ["-----&-----"]));
MDP.addEdge(new CustomEdge("4_14_0", "5_14_0", [["5_14_0", 0.99], [KEY_DEATH, 0.01]], ["-----&-----"]));
MDP.addEdge(new CustomEdge("4_14_0", "3_14_0", [["3_14_0", 0.99], [KEY_DEATH, 0.01]], ["-----&-----", "-&---------"]));
MDP.addEdge(new CustomEdge("10_7_0", "10_6_0", [["10_6_0", 0.99], [KEY_DEATH, 0.01]], ["-----&-----"]));
MDP.addEdge(new CustomEdge("10_7_0", "9_7_0", [["9_7_0", 0.99], [KEY_DEATH, 0.01]], ["---------&-", "-&---------"]));
MDP.addEdge(new CustomEdge("4_15_0", "4_16_0", [["4_16_0", 0.99], [KEY_DEATH, 0.01]], ["-----&-----", "-----&-----"]));
MDP.addEdge(new CustomEdge("4_15_0", "4_14_0", [["4_14_0", 0.99], [KEY_DEATH, 0.01]], ["-----&-----"]));
MDP.addEdge(new CustomEdge("4_15_0", "5_15_0", [["5_15_0", 0.99], [KEY_DEATH, 0.01]], ["-----&-----", "-----&-----"]));
MDP.addEdge(new CustomEdge("4_15_0", "3_15_0", [["3_15_0", 0.99], [KEY_DEATH, 0.01]], ["-----&-----"]));
MDP.addEdge(new CustomEdge("5_11_0", "5_12_0", [["5_12_0", 0.99], [KEY_DEATH, 0.01]], []));
MDP.addEdge(new CustomEdge("5_11_0", "5_10_0", [["5_10_0", 0.99], [KEY_DEATH, 0.01]], []));
MDP.addEdge(new CustomEdge("5_11_0", "6_11_0", [["6_11_0", 0.99], [KEY_DEATH, 0.01]], ["---------&-"]));
MDP.addEdge(new CustomEdge("5_11_0", "4_11_0", [["4_11_0", 0.99], [KEY_DEATH, 0.01]], ["---------&-"]));
MDP.addEdge(new CustomEdge("16_1_0", "16_2_0", [["16_2_0", 0.99], [KEY_DEATH, 0.01]], ["-&---------"]));
MDP.addEdge(new CustomEdge("16_1_0", "15_1_0", [["15_1_0", 0.99], [KEY_DEATH, 0.01]], ["---------&-"]));
MDP.addEdge(new CustomEdge("11_6_0", "11_5_0", [["11_5_0", 0.99], [KEY_DEATH, 0.01]], ["---------&-"]));
MDP.addEdge(new CustomEdge("11_6_0", "12_6_0", [["12_6_0", 0.99], [KEY_DEATH, 0.01]], ["-----&-----"]));
MDP.addEdge(new CustomEdge("11_6_0", "10_6_0", [["10_6_0", 0.99], [KEY_DEATH, 0.01]], ["-----&-----"]));
MDP.addEdge(new CustomEdge("18_2_0", "18_3_0", [["18_3_0", 0.99], [KEY_DEATH, 0.01]], ["-&---------"]));
MDP.addEdge(new CustomEdge("18_2_0", "17_2_0", [["17_2_0", 0.99], [KEY_DEATH, 0.01]], ["-&---------", "-----&-----"]));
MDP.addEdge(new CustomEdge("12_6_0", "12_5_0", [["12_5_0", 0.99], [KEY_DEATH, 0.01]], ["-----&-----"]));
MDP.addEdge(new CustomEdge("12_6_0", "11_6_0", [["11_6_0", 0.99], [KEY_DEATH, 0.01]], ["-----&-----"]));
MDP.addEdge(new CustomEdge("6_9_0", "6_10_0", [["6_10_0", 0.99], [KEY_DEATH, 0.01]], ["-----&-----"]));
MDP.addEdge(new CustomEdge("6_9_0", "6_8_0", [["6_8_0", 0.99], [KEY_DEATH, 0.01]], ["-----&-----"]));
MDP.addEdge(new CustomEdge("6_9_0", "7_9_0", [["7_9_0", 0.99], [KEY_DEATH, 0.01]], []));
MDP.addEdge(new CustomEdge("6_9_0", "5_9_0", [["5_9_0", 0.99], [KEY_DEATH, 0.01]], ["-----&-----"]));
MDP.addEdge(new CustomEdge("3_15_0", "3_16_0", [["3_16_0", 0.99], [KEY_DEATH, 0.01]], []));
MDP.addEdge(new CustomEdge("3_15_0", "3_14_0", [["3_14_0", 0.99], [KEY_DEATH, 0.01]], ["-----&-----", "-&---------"]));
MDP.addEdge(new CustomEdge("3_15_0", "4_15_0", [["4_15_0", 0.99], [KEY_DEATH, 0.01]], []));
MDP.addEdge(new CustomEdge("3_15_0", "2_15_0", [["2_15_0", 0.99], [KEY_DEATH, 0.01]], ["-----&-----"]));
MDP.addEdge(new CustomEdge("7_10_0", "7_9_0", [["7_9_0", 0.99], [KEY_DEATH, 0.01]], []));
MDP.addEdge(new CustomEdge("7_10_0", "6_10_0", [["6_10_0", 0.99], [KEY_DEATH, 0.01]], ["-----&-----", "---------&-"]));
MDP.addEdge(new CustomEdge("6_15_0", "6_14_0", [["6_14_0", 0.99], [KEY_DEATH, 0.01]], ["-----&-----", "-----&-----"]));
MDP.addEdge(new CustomEdge("6_15_0", "5_15_0", [["5_15_0", 0.99], [KEY_DEATH, 0.01]], ["-----&-----", "-----&-----"]));
MDP.addEdge(new CustomEdge("5_15_0", "5_14_0", [["5_14_0", 0.99], [KEY_DEATH, 0.01]], ["-----&-----"]));
MDP.addEdge(new CustomEdge("5_15_0", "6_15_0", [["6_15_0", 0.99], [KEY_DEATH, 0.01]], ["-----&-----", "-----&-----"]));
MDP.addEdge(new CustomEdge("5_15_0", "4_15_0", [["4_15_0", 0.99], [KEY_DEATH, 0.01]], []));
MDP.addEdge(new CustomEdge("18_3_0", "18_2_0", [["18_2_0", 0.99], [KEY_DEATH, 0.01]], ["-----&-----"]));
MDP.addEdge(new CustomEdge("13_4_0", "13_3_0", [["13_3_0", 0.99], [KEY_DEATH, 0.01]], ["-----&-----", "-----&-----"]));
MDP.addEdge(new CustomEdge("13_4_0", "14_4_0", [["14_4_0", 0.99], [KEY_DEATH, 0.01]], ["-----&-----"]));
MDP.addEdge(new CustomEdge("13_4_0", "12_4_0", [["12_4_0", 0.99], [KEY_DEATH, 0.01]], ["-----&-----"]));
MDP.addEdge(new CustomEdge("6_14_0", "6_15_0", [["6_15_0", 0.99], [KEY_DEATH, 0.01]], ["-----&-----"]));
MDP.addEdge(new CustomEdge("6_14_0", "6_12_0", [["6_12_0", 0.99], [KEY_DEATH, 0.01]], ["-----&-----"]));
MDP.addEdge(new CustomEdge("6_14_0", "5_14_0", [["5_14_0", 0.99], [KEY_DEATH, 0.01]], ["-----&-----"]));
MDP.addEdge(new CustomEdge("6_11_0", "6_12_0", [["6_12_0", 0.99], [KEY_DEATH, 0.01]], []));
MDP.addEdge(new CustomEdge("6_11_0", "6_10_0", [["6_10_0", 0.99], [KEY_DEATH, 0.01]], ["---------&-"]));
MDP.addEdge(new CustomEdge("6_11_0", "5_11_0", [["5_11_0", 0.99], [KEY_DEATH, 0.01]], ["---------&-"]));
MDP.addEdge(new CustomEdge("14_4_0", "14_3_0", [["14_3_0", 0.99], [KEY_DEATH, 0.01]], ["---------&-", "-&---------"]));
MDP.addEdge(new CustomEdge("14_4_0", "15_4_0", [["15_4_0", 0.99], [KEY_DEATH, 0.01]], ["-&---------"]));
MDP.addEdge(new CustomEdge("14_4_0", "13_4_0", [["13_4_0", 0.99], [KEY_DEATH, 0.01]], ["-&---------"]));
MDP.addEdge(new CustomEdge("6_12_0", "6_14_0", [["6_14_0", 0.99], [KEY_DEATH, 0.01]], ["-----&-----"]));
MDP.addEdge(new CustomEdge("6_12_0", "6_11_0", [["6_11_0", 0.99], [KEY_DEATH, 0.01]], ["-----&-----"]));
MDP.addEdge(new CustomEdge("6_12_0", "5_12_0", [["5_12_0", 0.99], [KEY_DEATH, 0.01]], []));
MDP.addEdge(new CustomEdge("1_17_0", "1_16_0", [["1_16_0", 0.99], [KEY_DEATH, 0.01]], ["-----&-----"]));
MDP.addEdge(new CustomEdge("7_10_0", "end", [["end", 0.99], [KEY_DEATH, 0.01]], []));
var idToLevel = {
  "2_8_0": [
    "XX----------XXX",
    "XX----------XXX",
    "XX---XX-----XXX",
    "XX-#-XXXX---XXX",
    "XX-----XX------",
    "XXXX---XX------",
    "XXXX---XX-----#",
    "XXXX--#XX---XXX",
    "XXXX---XX---XXX",
    "-------XX---XXX",
    "&------XX---XXX"
  ],
  "13_1_0": [
    "----^^^^^^^^^^^",
    "---------------",
    "---------------",
    "----------X----",
    "----------X-&-&",
    "----------XXXXX",
    "-#--------X-*#*",
    "----------X----",
    "---------------",
    "---------------",
    "----^^^^^^^^^^^"
  ],
  "1_5_0": [
    "XX-------------",
    "XX-------------",
    "XX---XX--------",
    "XX-#-XXXX------",
    "XX-----XX------",
    "XXXX---XX---&--",
    "XXXX---XX------",
    "XXXX--#XX------",
    "XXXX---XX------",
    "-------XX------",
    "&------XX------"
  ],
  "6_4_0": [
    "--------X------",
    "--------X------",
    "X-------X---^--",
    "XXX-----X---^--",
    "-XX---------^--",
    "-XX---------^--",
    "-XX-----#-#-#-#",
    "#XX--#---------",
    "-XX------------",
    "-XX-----XXXXXXX",
    "-XX-----XXXXXXX"
  ],
  "0_8_0": [
    "XX--------XXX--",
    "XX--------XXX--",
    "XX---XX---XXX--",
    "XX-#-XX---XXX--",
    "XX--------XXX--",
    "XXXX----XXXXXXX",
    "XXXX----XXXXXXX",
    "XXXX----XXXXXXX",
    "XXXX----XXXXXXX",
    "---------------",
    "&----------&---"
  ],
  "6_5_0": [
    "------X--^^^^^^",
    "------X----X--X",
    "X-----X----X--X",
    "XXX---X----X--X",
    "-XX--------X--X",
    "-XX--------X--X",
    "-XX--------X--X",
    "#XX---X----X--X",
    "-XX---X----X--X",
    "-XX---X--------",
    "-XX---X--^^^^^^"
  ],
  "17_5_0": [
    "^^^^^^^^^^^^^^^",
    "----X----------",
    "-X--X-------X--",
    "XX--X--XXX--XX-",
    "XX--X--X*X--XXX",
    "#*--X--X&---*#X",
    "XX--X--X*X--XXX",
    "XX--X--XXX--XX-",
    "-X--X-------X--",
    "---------------",
    "^^^^^^^^^^^^^^^"
  ],
  "4_0_0": [
    "---------------",
    "---------------",
    "---------------",
    "---X--------#--",
    "---X-----------",
    "XXXX-----------",
    "#*-X-----------",
    "---X--#--------",
    "---------#-----",
    "---------------",
    "---------------"
  ],
  "12_3_0": [
    "-----^^^^^^^^^^",
    "---------------",
    "X--------------",
    "XXX-------X----",
    "-XX-------X-&-&",
    "-XX-------XXXXX",
    "-XX-------X-*#*",
    "#XX-------X----",
    "-XX------------",
    "-XX------------",
    "-XX--^^^^^^^^^^"
  ],
  "2_4_0": [
    "-------------XX",
    "-------------XX",
    "X------------XX",
    "XXX----------XX",
    "-XX----------XX",
    "-XX----------XX",
    "-XX----------XX",
    "#XX--#-------XX",
    "-XX-----#----XX",
    "-XX------------",
    "-XX------------"
  ],
  "2_6_0": [
    "XX-------------",
    "XX-------------",
    "XX---XX--------",
    "XX-#-XXXX-----X",
    "XX-----XX-----X",
    "XXXX---XX-----X",
    "XXXX---XX-----X",
    "XXXX--#XX-----X",
    "XXXX---XX--#---",
    "-------XX------",
    "&------XX------"
  ],
  "8_3_0": [
    "----------^^^^^",
    "---------------",
    "X-----------X--",
    "XXX---------XX-",
    "-XX---------XXX",
    "-XX---------*#X",
    "-XX---------XXX",
    "#XX--#------XX-",
    "-XX---------X--",
    "-XX------------",
    "-XX-------^^^^^"
  ],
  "15_1_0": [
    "-^^^^^^^^^^^^^^",
    "---------------",
    "---------------",
    "----------X----",
    "----------X-&-&",
    "----------XXXXX",
    "----------X-*#*",
    "----------X----",
    "---------------",
    "---------------",
    "-^^^^^^^^^^^^^^"
  ],
  "11_3_0": [
    "------^^^^^^^^^",
    "---------------",
    "X--------------",
    "XXX-------X----",
    "-XX-------X-&-&",
    "-XX-------XXXXX",
    "-XX-------X-*#*",
    "#XX-------X----",
    "-XX------------",
    "-XX------------",
    "-XX---^^^^^^^^^"
  ],
  "2_1_0": [
    "-----------XX--",
    "---------------",
    "---------------",
    "---X-----------",
    "---X-----------",
    "XXXX-----------",
    "#*-X-----------",
    "---X--#--------",
    "---------------",
    "---------------",
    "-----------XX--"
  ],
  "13_3_0": [
    "----^^^^^^^^^^^",
    "------*#X--X--X",
    "------XXX--X--X",
    "------XX---X--X",
    "------X----X--X",
    "------X----X-#X",
    "-#----X----X--X",
    "------X----X--X",
    "------X----X--X",
    "---------------",
    "----^^^^^^^^^^^"
  ],
  "4_6_0": [
    "XX----------^^^",
    "XX-------------",
    "XX---XX--------",
    "XX-#-XXXX-----X",
    "XX-----XX-----X",
    "XXXX---XX-----X",
    "XXXX---XX-----X",
    "XXXX--#XX-----X",
    "XXXX---XX------",
    "-------XX------",
    "&------XX---^^^"
  ],
  "4_3_0": [
    "--------------X",
    "--------------X",
    "X-------------X",
    "XXX-----------X",
    "-XX-----------X",
    "-XX--------#--X",
    "-XX-----------X",
    "#XX--#--------X",
    "-XX-----#-----X",
    "-XX------------",
    "-XX--------*---"
  ],
  "14_2_0": [
    "---^^^^^^^^^^^^",
    "---------------",
    "--------------X",
    "-----X-----X--X",
    "-----X-&-&-X--X",
    "-----XXXXXXX--*",
    "-----X-*#*-X--X",
    "-----X-----X--X",
    "--------------X",
    "---------------",
    "---^^^^^^^^^^^^"
  ],
  "1_4_0": [
    "-------------XX",
    "-------------XX",
    "X------------XX",
    "XXX----------XX",
    "-XX----------XX",
    "-XX----------XX",
    "-XX----------XX",
    "#XX--#-------XX",
    "-XX----------XX",
    "-XX------------",
    "-XX------------"
  ],
  "5_1_0": [
    "---------------",
    "---------------",
    "---------------",
    "---X----------X",
    "---X---------^X",
    "XXXX--------^^X",
    "#*-X---------^X",
    "---X--#-------X",
    "---------#-----",
    "---------------",
    "---------------"
  ],
  "3_12_0": [
    "-----XXXXXXXXXX",
    "-----XXXXXXXXXX",
    "X----XXXXXXXXXX",
    "XXX--XXXXXXXXXX",
    "-XX----------#X",
    "-XX-----------X",
    "-XX----#--#----",
    "#XX--XXXXXXXXXX",
    "-XX--XXXXXXXXXX",
    "-XX--XXXXXXXXXX",
    "-XX--XXXXXXXXXX"
  ],
  "3_4_0": [
    "------------XX-",
    "------------XX-",
    "X-----------XX-",
    "XXX---------XX#",
    "-XX---------XX-",
    "-XX---------XX-",
    "-XX---------XX-",
    "#XX--#------XXX",
    "-XX-----#-----X",
    "-XX------------",
    "-XX------------"
  ],
  "4_4_0": [
    "------------X--",
    "---------------",
    "X-----------X--",
    "XXX---------XX-",
    "-XX---------XXX",
    "-XX---------*#X",
    "-XX---------XXX",
    "#XX--#------XX-",
    "-XX-----#---X--",
    "-XX------------",
    "-XX---------X--"
  ],
  "8_4_0": [
    "---------^^^^^^",
    "-----------X--X",
    "X----------X--X",
    "XXX--------X--X",
    "-XX--------X--X",
    "-XX--------X-#X",
    "-XX--------X--X",
    "#XX--#-----X--X",
    "-XX--------X--X",
    "-XX------------",
    "-XX------^^^^^^"
  ],
  "6_3_0": [
    "-----------^^^^",
    "-------------X-",
    "X------------X-",
    "XXX----------X-",
    "-XX----------X-",
    "-XX----------X-",
    "-XX----------X-",
    "#XX--#-------X-",
    "-XX-----#----X-",
    "-XX------------",
    "-XX--------^^^^"
  ],
  "1_10_0": [
    "XX---------XXXX",
    "XX---------XXXX",
    "XX---XX----XXXX",
    "XX-#-XXXX--XXXX",
    "XX-----XX--XXX-",
    "XXXX---XX--XX--",
    "XXXX---XX------",
    "XXXX--#XX--XXXX",
    "XXXX---XX--XXXX",
    "-------XX--XXXX",
    "&------XX--XXXX"
  ],
  "5_3_0": [
    "------------^^^",
    "--------------X",
    "X-------------X",
    "XXX-----------X",
    "-XX-----------X",
    "-XX-----------X",
    "-XX-----------X",
    "#XX--#--------X",
    "-XX-----#-----X",
    "-XX------------",
    "-XX---------^^^"
  ],
  "3_5_0": [
    "XX-------------",
    "XX-------------",
    "XX---XX-------&",
    "XX-#-XXXX------",
    "XX-----XX------",
    "XXXX---XX--#---",
    "XXXX---XX------",
    "XXXX--#XX------",
    "XXXX---XX------",
    "-------XX------",
    "&------XX--*---"
  ],
  "13_0_0": [
    "--^^^^^^^^^^^^^",
    "---------------",
    "---------------",
    "-----------X---",
    "-----------X-&-",
    "-----------XXXX",
    "-----------X-*#",
    "-----------X---",
    "---------------",
    "---------------",
    "--^^^^^^^^^^^^^"
  ],
  "2_12_0": [
    "------XXXXXXXXX",
    "------XXXXXXXXX",
    "X-----XXXXXXXXX",
    "XXX---XXXXXXXXX",
    "-XX-----#XXXXX-",
    "-XX------XXXXX-",
    "-XX-------*----",
    "#XX---XXXXXXXXX",
    "-XX---XXXXXXXXX",
    "-XX---XXXXXXXXX",
    "-XX---XXXXXXXXX"
  ],
  "17_4_0": [
    "^^^^^^^^^^^^^^^",
    "--X--X--X--X--X",
    "--X--X--X--X--X",
    "--X--X--X--X--X",
    "--X--X--X--X--X",
    "-#X-#X-#X-#X-#X",
    "--X--X--X--X--X",
    "--X--X--X--X--X",
    "--X--X--X--X--X",
    "---------------",
    "^^^^^^^^^^^^^^^"
  ],
  "8_2_0": [
    "---------^^^^^^",
    "--------------*",
    "X--------------",
    "XXX----------^^",
    "-XX--------^^^^",
    "-XX-----------&",
    "-XX--------^^^^",
    "#XX--#-------^^",
    "-XX------------",
    "-XX-----------*",
    "-XX------^^^^^^"
  ],
  "3_1_0": [
    "------------XX-",
    "---------------",
    "---------------",
    "---X-----------",
    "---X-----------",
    "XXXX-----------",
    "#*-X-----------",
    "---X--#--------",
    "---------#-----",
    "---------------",
    "------------XX-"
  ],
  "0_1_0": [
    "---------------",
    "------------X--",
    "------------X--",
    "------------X--",
    "------------X--",
    "-----------&X-&",
    "------------X--",
    "-*----------X--",
    "------------X--",
    "------------X--",
    "------------X--"
  ],
  "9_3_0": [
    "--------^^^^^^^",
    "---------------",
    "X-----------X--",
    "XXX---------XX-",
    "-XX---------XXX",
    "-XX---------*#X",
    "-XX---------XXX",
    "#XX--#------XX-",
    "-XX---------X--",
    "-XX------------",
    "-XX-----^^^^^^^"
  ],
  "0_4_0": [
    "-------------XX",
    "-------------XX",
    "X------------XX",
    "XXX----------XX",
    "-XX----------XX",
    "-XX----------XX",
    "-XX----------XX",
    "#XX----------XX",
    "-XX----------XX",
    "-XX------------",
    "-XX------------"
  ],
  "0_3_0": [
    "---------------",
    "------------X--",
    "X-----------X--",
    "XXX---------X--",
    "-XX---------X--",
    "-XX--------&X-&",
    "-XX---------X--",
    "#XX---------X--",
    "-XX---------X--",
    "-XX---------X--",
    "-XX---------X--"
  ],
  "1_2_0": [
    "---------------",
    "---------------",
    "X--------------",
    "XXX------------",
    "-XX------------",
    "-XX-----------&",
    "-XX------------",
    "#XX--#---------",
    "-XX------------",
    "-XX------------",
    "-XX------------"
  ],
  "2_3_0": [
    "---------------",
    "------------X--",
    "X-----------X--",
    "XXX---------X--",
    "-XX---------X--",
    "-XX--------&X-&",
    "-XX---------X--",
    "#XX--#------X--",
    "-XX-----#---X--",
    "-XX---------X--",
    "-XX---------X--"
  ],
  "7_7_0": [
    "-*XXXXXXXXXXXXX",
    "--XXXXXXX-----*",
    "--XXXXXX-------",
    "--XXXXX------^^",
    "-----------^^^^",
    "-#------------&",
    "----#------^^^^",
    "--XXXXX------^^",
    "--XXXXXX-------",
    "--XXXXXXX-----*",
    "--XXXXXXXXXXXXX"
  ],
  "13_2_0": [
    "----^^^^^^^^^^^",
    "---------------",
    "-------------X-",
    "--------XXX--XX",
    "--------X*X--XX",
    "--------X&---*#",
    "--------X*X--XX",
    "-*------XXX--XX",
    "-------------X-",
    "---------------",
    "----^^^^^^^^^^^"
  ],
  "0_2_0": [
    "---------------",
    "---------------",
    "X--------------",
    "XXX------------",
    "-XX------------",
    "-XX-----------&",
    "-XX------------",
    "#XX------------",
    "-XX------------",
    "-XX------------",
    "-XX------------"
  ],
  "4_5_0": [
    "XX-------------",
    "XX-------------",
    "XX---XX--------",
    "XX-#-XXXX-----#",
    "XX-----XX------",
    "XXXX---XX--#---",
    "XXXX---XX------",
    "XXXX--#XX------",
    "XXXX---XX------",
    "-------XX------",
    "&------XX--*---"
  ],
  "4_1_0": [
    "------------XXX",
    "---------------",
    "---------------",
    "---X-----------",
    "---X----------^",
    "XXXX-----------",
    "#*-X----------^",
    "---X--#--------",
    "---------#-----",
    "---------------",
    "------------XXX"
  ],
  "0_9_0": [
    "XX---------XXXX",
    "XX---------XXXX",
    "XX---XX----XXXX",
    "XX-#-XXXX--XXXX",
    "XX-----XX--XXXX",
    "XXXX---XX--XXXX",
    "XXXX---XX--XXXX",
    "XXXX---XX--XXXX",
    "XXXX---XX------",
    "-------XX------",
    "&------XX--XXXX"
  ],
  "3_2_0": [
    "---------------",
    "---------------",
    "X--------------",
    "XXX------------",
    "-XX------------",
    "-XX-----------&",
    "-XX------------",
    "#XX--#---------",
    "-XX-----#--#---",
    "-XX------------",
    "-XX------------"
  ],
  "6_2_0": [
    "-------------&-",
    "------------^^^",
    "X-----------^^^",
    "XXX---------^^^",
    "-XX---------^^^",
    "-XX---------^^^",
    "-XX---------^^^",
    "#XX--#------^^^",
    "-XX-----#---^^^",
    "-XX---------^^^",
    "-XX----------*-"
  ],
  "9_0_0": [
    "------^^^^^^^^^",
    "---------------",
    "---------------",
    "---X-----------",
    "---X-----------",
    "XXXX-----------",
    "#*-X-----------",
    "---X-----------",
    "---------------",
    "---------------",
    "------^^^^^^^^^"
  ],
  "8_0_0": [
    "---------^^^^^^",
    "---------------",
    "---------------",
    "---X-----------",
    "---X-----------",
    "XXXX-----------",
    "#*-X-----------",
    "---X--#--------",
    "---------------",
    "---------------",
    "---------^^^^^^"
  ],
  "5_8_0": [
    "-----XXXXXX---&",
    "-----XXXXXX--^^",
    "X----XXXXXX--^^",
    "XXX--XXXXXX--^^",
    "-XX----*-----^^",
    "-XX----------^^",
    "-XX-----#----^^",
    "#XX--XXXXXX--^^",
    "-XX--XXXXXX--^^",
    "-XX--XXXXXX--^^",
    "-XX--XXXXXX---*"
  ],
  "1_9_0": [
    "XX---------XXXX",
    "XX---------XXXX",
    "XX---XX----XXXX",
    "XX-#-XXXX--XXXX",
    "XX-----XX--XXXX",
    "XXXX---XX--XXXX",
    "XXXX---XX--XXXX",
    "XXXX--#XX--XXXX",
    "XXXX---XX------",
    "-------XX------",
    "&------XX--XXXX"
  ],
  "2_11_0": [
    "XX--XXX--XXX---",
    "XX--XXX--XXX---",
    "XX--XXX--XXX---",
    "XX--XXX--XXX-#-",
    "XX--XXX--XXX---",
    "XXXXXXXXXXXXXX-",
    "XXXXXXXXXXXXXX-",
    "XXXXXXXXXXXXXX-",
    "XXXXXXXXXX*XXX-",
    "---------------",
    "&----&----#----"
  ],
  "0_5_0": [
    "XX-------------",
    "XX-------------",
    "XX---XX--------",
    "XX-#-XXXX------",
    "XX-----XX------",
    "XXXX---XX-----&",
    "XXXX---XX------",
    "XXXX---XX------",
    "XXXX---XX------",
    "-------XX------",
    "&------XX------"
  ],
  "14_1_0": [
    "--^^^^^^^^^^^^^",
    "---------------",
    "---------------",
    "----------X----",
    "----------X-&-&",
    "----------XXXXX",
    "----------X-*#*",
    "----------X----",
    "---------------",
    "---------------",
    "--^^^^^^^^^^^^^"
  ],
  "7_1_0": [
    "----------^^^^^",
    "---------------",
    "---------------",
    "---X----------X",
    "---X----------X",
    "XXXX----------X",
    "#*-X----------X",
    "---X--#-------X",
    "---------------",
    "---------------",
    "----------^^^^^"
  ],
  "1_16_0": [
    "-XXXXXXXXXXXXXX",
    "-XXXXXXXXXXXXXX",
    "-XXXXXXXXXXXXXX",
    "-XXXXXXXXXXXXXX",
    "----#XXXXXXXXXX",
    "-----XXXXXXXXXX",
    "------*--------",
    "-XXXXXXXXXXXXXX",
    "-XXXXXXXXXXXXXX",
    "-XXXXXXXXXXXXXX",
    "-XXXXXXXXXXXXXX"
  ],
  "14_0_0": [
    "-^^^^^^^^^^^^^^",
    "---------------",
    "---------------",
    "-----------X---",
    "-----------X-&-",
    "-----------XXXX",
    "-----------X-*#",
    "-----------X---",
    "---------------",
    "---------------",
    "-^^^^^^^^^^^^^^"
  ],
  "3_3_0": [
    "---------------",
    "-----------^---",
    "X--------------",
    "XXX--------^--X",
    "-XX-----------X",
    "-XX--------^--X",
    "-XX-----------X",
    "#XX--#-----^--X",
    "-XX-----#-----X",
    "-XX--------^--X",
    "-XX-----------X"
  ],
  "3_7_0": [
    "XX----------X--",
    "XX-------------",
    "XX---XX-----X--",
    "XX-#-XXXX---XX-",
    "XX-----XX---XXX",
    "XXXX---XX---*#X",
    "XXXX---XX---XXX",
    "XXXX--#XX---XX-",
    "XXXX---XX---X--",
    "-------XX------",
    "&------XX---X--"
  ],
  "1_13_0": [
    "---XXXXXXXXXXXX",
    "---XXXXXXXXXXXX",
    "---XXXXXXXXXXXX",
    "---XXXXXXXXXXXX",
    "-----#XXXXXXX--",
    "------XXXXXX---",
    "-------*-------",
    "---XXXXXXXXXXXX",
    "---XXXXXXXXXXXX",
    "---XXXXXXXXXXXX",
    "---XXXXXXXXXXXX"
  ],
  "12_0_0": [
    "----^^^^^^^^^^^",
    "---------------",
    "---------------",
    "-----------X---",
    "-----------X-&-",
    "-----------XXXX",
    "-----------X-*#",
    "-*---------X---",
    "---------------",
    "---------------",
    "----^^^^^^^^^^^"
  ],
  "5_10_0": [
    "----XXXXXXXXXXX",
    "----XXXXXXXXXXX",
    "----XXXXXXXXXXX",
    "----XXXXXXXXXXX",
    "------*------*-",
    "---------------",
    "-#-----#--#---#",
    "----XXXXXXXXXXX",
    "----XXXXXXXXXXX",
    "----XXXXXXXXXXX",
    "----XXXXXXXXXXX"
  ],
  "16_2_0": [
    "^^^^^^^^^^^^^^^",
    "---------------",
    "---------------",
    "--------X-----X",
    "--------X-&-&-X",
    "--------XXXXXXX",
    "--------X-*#*-X",
    "X-------X-----X",
    "XX-------------",
    "#X-------------",
    "^^^^^^^^^^^^^^^"
  ],
  "11_1_0": [
    "------^^^^^^^^^",
    "---------X--X--",
    "---------X--X--",
    "---------X--X--",
    "---#-----X--X--",
    "---------X-#X-#",
    "---------X--X--",
    "-*-------X--X--",
    "---------X--X--",
    "---------------",
    "------^^^^^^^^^"
  ],
  "0_10_0": [
    "XX---------XXXX",
    "XX---------XXXX",
    "XX---XX----XXXX",
    "XX-#-XXXX--XXXX",
    "XX-----XX--XXX-",
    "XXXX---XX--XX--",
    "XXXX---XX------",
    "XXXX---XX--XXXX",
    "XXXX---XX--XXXX",
    "-------XX--XXXX",
    "&------XX--XXXX"
  ],
  "7_2_0": [
    "---------^^^^^^",
    "---------------",
    "X--------------",
    "XXX------------",
    "-XX------------",
    "-XX------------",
    "-XX------------",
    "#XX--#---------",
    "-XX------------",
    "-XX------------",
    "-XX------^^^^^^"
  ],
  "4_10_0": [
    "------XXXXXXXXX",
    "------XXXXXXXXX",
    "X-----XXXXXXXXX",
    "XXX---XXXXXXXXX",
    "-XX-----*---*--",
    "-XX------------",
    "-XX------#---#-",
    "#XX---XXXXXXXXX",
    "-XX---XXXXXXXXX",
    "-XX---XXXXXXXXX",
    "-XX---XXXXXXXXX"
  ],
  "1_1_0": [
    "-----------XX--",
    "---------------",
    "---------------",
    "---X-----------",
    "---X-----------",
    "XXXX-----------",
    "#*-X-----------",
    "---X-----------",
    "---------------",
    "---------------",
    "-----------XX--"
  ],
  "7_0_0": [
    "-------------&-",
    "------------^^^",
    "------------^^^",
    "---X--------^^^",
    "---X--------^^^",
    "XXXX--------^^^",
    "#*-X--------^^^",
    "---X--#-----^^^",
    "---------#--^^^",
    "------------^^^",
    "-------------*-"
  ],
  "5_5_0": [
    "XX-----------&-",
    "XX----------^^^",
    "XX---XX-----^^^",
    "XX-#-XXXX---^^^",
    "XX-----XX---^^^",
    "XXXX---XX---^^^",
    "XXXX---XX---^^^",
    "XXXX--#XX---^^^",
    "XXXX---XX---^^^",
    "-------XX---^^^",
    "&------XX----*-"
  ],
  "0_6_0": [
    "XX-------------",
    "XX----------X--",
    "XX---XX-----X--",
    "XX-#-XXXX---X--",
    "XX-----XX---X--",
    "XXXX---XX--&X-&",
    "XXXX---XX---X--",
    "XXXX---XX---X--",
    "XXXX---XX---X--",
    "-------XX---X--",
    "&------XX---X--"
  ],
  "4_7_0": [
    "XX---------X---",
    "XX---------X---",
    "XX---XX----X--^",
    "XX-#-XXXX--X--^",
    "XX-----XX-----^",
    "XXXX---XX-----^",
    "XXXX---XX--#-#-",
    "XXXX--#XX------",
    "XXXX---XX------",
    "-------XX--XXXX",
    "&------XX--XXXX"
  ],
  "1_3_0": [
    "---------------",
    "------------X--",
    "X-----------X--",
    "XXX---------X--",
    "-XX---------X--",
    "-XX--------&X-&",
    "-XX---------X--",
    "#XX--#------X--",
    "-XX---------X--",
    "-XX---------X--",
    "-XX---------X--"
  ],
  "6_6_0": [
    "XX---------^^^^",
    "XX-------------",
    "XX---XX-------X",
    "XX-#-XXXX-----X",
    "XX-----XX-----X",
    "XXXX---XX-----*",
    "XXXX---XX-----X",
    "XXXX--#XX-----X",
    "XXXX---XX-----X",
    "-------XX------",
    "&------XX--^^^^"
  ],
  "1_6_0": [
    "XX-------------",
    "XX----------X--",
    "XX---XX-----X--",
    "XX-#-XXXX---X--",
    "XX-----XX---X--",
    "XXXX---XX--&X-&",
    "XXXX---XX---X--",
    "XXXX--#XX---X--",
    "XXXX---XX---X--",
    "-------XX---X--",
    "&------XX---X--"
  ],
  "5_2_0": [
    "---------------",
    "---------------",
    "X--------------",
    "XXX-----------#",
    "-XX------------",
    "-XX--------#---",
    "-XX------------",
    "#XX--#---------",
    "-XX-----#------",
    "-XX------------",
    "-XX--------*---"
  ],
  "10_0_0": [
    "------^^^^^^^^^",
    "--------------*",
    "---------------",
    "---X---------^^",
    "---X-------^^^^",
    "XXXX----------&",
    "#*-X-------^^^^",
    "---X---------^^",
    "---------------",
    "--------------*",
    "------^^^^^^^^^"
  ],
  "3_0_0": [
    "---------------",
    "---------------",
    "---------------",
    "---X-----------",
    "---X-----------",
    "XXXX--------&--",
    "#*-X-----------",
    "---X--#--------",
    "---------#-----",
    "---------------",
    "---------------"
  ],
  "4_8_0": [
    "--------XXXXXXX",
    "--------XXXXXXX",
    "X-------XXXXXXX",
    "XXX-----XXXXXXX",
    "-XX----------*-",
    "-XX------------",
    "-XX-------#---#",
    "#XX--#--XXXXXXX",
    "-XX-----XXXXXXX",
    "-XX-----XXXXXXX",
    "-XX-----XXXXXXX"
  ],
  "7_3_0": [
    "-----------^^^^",
    "---------------",
    "X--------------",
    "XXX----------XX",
    "-XX----------X*",
    "-XX----------X&",
    "-XX----------X*",
    "#XX--#-------XX",
    "-XX-----#------",
    "-XX------------",
    "-XX--------^^^^"
  ],
  "15_0_0": [
    "^^^^^^^^^^^^^^^",
    "--------------*",
    "---------------",
    "-------------^^",
    "-----------^^^^",
    "--------------&",
    "-----------^^^^",
    "X------------^^",
    "XX-------------",
    "#X------------*",
    "^^^^^^^^^^^^^^^"
  ],
  "0_12_0": [
    "--XXXXX--XXXXXX",
    "--XXXXX--XXXXXX",
    "--XXXXX--XXXXXX",
    "--XXXXX--XXXXXX",
    "---------XXXXXX",
    "---------XXXXX-",
    "---------------",
    "--XXXXX--XXXXXX",
    "--XXXXX--XXXXXX",
    "--XXXXX--XXXXXX",
    "--XXXXX--XXXXXX"
  ],
  "12_1_0": [
    "----^^^^^^^^^^^",
    "---------X--X--",
    "---------X--X--",
    "---------X--X--",
    "---------X--X--",
    "---------X-#X-#",
    "---------X--X--",
    "-*-------X--X--",
    "---------X--X--",
    "---------------",
    "----^^^^^^^^^^^"
  ],
  "2_5_0": [
    "XX-------------",
    "XX-------------",
    "XX---XX--------",
    "XX-#-XXXX------",
    "XX-----XX------",
    "XXXX---XX-----&",
    "XXXX---XX------",
    "XXXX--#XX------",
    "XXXX---XX--#---",
    "-------XX------",
    "&------XX------"
  ],
  "4_2_0": [
    "---------------",
    "---------------",
    "X--------------",
    "XXX------------",
    "-XX------------",
    "-XX--------#---",
    "-XX------------",
    "#XX--#---------",
    "-XX-----#------",
    "-XX------------",
    "-XX--------*---"
  ],
  "2_9_0": [
    "XX---------XXXX",
    "XX---------XXXX",
    "XX---XX----XXXX",
    "XX-#-XXXX--XXXX",
    "XX-----XX------",
    "XXXX---XX------",
    "XXXX---XX----#-",
    "XXXX--#XX--XXXX",
    "XXXX---XX--XXXX",
    "-------XX--XXXX",
    "&------XX--XXXX"
  ],
  "5_7_0": [
    "-----XXXXX---&-",
    "-----XXXXX--^^^",
    "X----XXXXX--^^^",
    "XXX--XXXXX--^^^",
    "-XX---------^^^",
    "-XX---------^^^",
    "-XX----#----^^^",
    "#XX--XXXXX--^^^",
    "-XX--XXXXX--^^^",
    "-XX--XXXXX--^^^",
    "-XX--XXXXX---*-"
  ],
  "5_0_0": [
    "---------------",
    "---------------",
    "---------------",
    "---X--------#--",
    "---X-----------",
    "XXXX-----#-----",
    "#*-X-----------",
    "---X--#--------",
    "---------------",
    "---------------",
    "---------*-----"
  ],
  "15_2_0": [
    "--^^^^^^^^^^^^^",
    "---------------",
    "--------------X",
    "-----X-----X--X",
    "-----X-&-&-X--X",
    "-----XXXXXXX--*",
    "-----X-*#*-X--X",
    "-----X-----X--X",
    "--------------X",
    "---------------",
    "--^^^^^^^^^^^^^"
  ],
  "8_1_0": [
    "----------^^^^^",
    "------------X--",
    "------------X--",
    "---X--------X--",
    "---X--------X--",
    "XXXX--------X-#",
    "#*-X--------X--",
    "---X--#-----X--",
    "------------X--",
    "---------------",
    "----------^^^^^"
  ],
  "0_7_0": [
    "XX-------------",
    "XX-------------",
    "XX---XX----XX--",
    "XX-#-XX----XXXX",
    "XX-----------XX",
    "XXXX----XX---XX",
    "XXXX----XX---XX",
    "XXXX----XX---XX",
    "XXXX----XX---XX",
    "-------------XX",
    "&------------XX"
  ],
  "1_7_0": [
    "XX-----------XX",
    "XX-----------XX",
    "XX---XX------XX",
    "XX-#-XXXX----XX",
    "XX-----XX----XX",
    "XXXX---XX----XX",
    "XXXX---XX----XX",
    "XXXX--#XX----XX",
    "XXXX---XX----XX",
    "-------XX------",
    "&------XX------"
  ],
  "3_10_0": [
    "-------XXXXXXXX",
    "-------XXXXXXXX",
    "X------XXXXXXXX",
    "XXX----XXXXXXXX",
    "-XX---------#XX",
    "-XX----------XX",
    "-XX------#----*",
    "#XX----XXXXXXXX",
    "-XX----XXXXXXXX",
    "-XX----XXXXXXXX",
    "-XX----XXXXXXXX"
  ],
  "0_0_0": [
    "---------XX----",
    "---------------",
    "---------------",
    "---------------",
    "---------------",
    "---------------",
    "-#-------------",
    "---------------",
    "---------------",
    "---------------",
    "---------XX----"
  ],
  "10_3_0": [
    "--------^^^^^^^",
    "---------------",
    "X--------------",
    "XXX-------X----",
    "-XX-------X-&-&",
    "-XX-------XXXXX",
    "-XX-------X-*#*",
    "#XX--#----X----",
    "-XX------------",
    "-XX------------",
    "-XX-----^^^^^^^"
  ],
  "5_4_0": [
    "---------X-----",
    "---------X-----",
    "X--------X---^-",
    "XXX------X---^-",
    "-XX----------^-",
    "-XX----------^-",
    "-XX------#-#-#-",
    "#XX--#---------",
    "-XX------------",
    "-XX------XXXXXX",
    "-XX------XXXXXX"
  ],
  "2_2_0": [
    "---------------",
    "---------------",
    "X--------------",
    "XXX------------",
    "-XX------------",
    "-XX-----------&",
    "-XX------------",
    "#XX--#---------",
    "-XX-----#------",
    "-XX------------",
    "-XX------------"
  ],
  "3_9_0": [
    "XX---------XXXX",
    "XX---------XXXX",
    "XX---XX----XXXX",
    "XX-#-XXXX--XXXX",
    "XX-----XX----*-",
    "XXXX---XX------",
    "XXXX---XX-----#",
    "XXXX--#XX--XXXX",
    "XXXX---XX--XXXX",
    "-------XX--XXXX",
    "&------XX--XXXX"
  ],
  "6_0_0": [
    "--------------&",
    "-------------^^",
    "-------------^^",
    "---X---------^^",
    "---X---------^^",
    "XXXX---------^^",
    "#*-X---------^^",
    "---X--#------^^",
    "---------#---^^",
    "-------------^^",
    "--------------*"
  ],
  "5_6_0": [
    "XX----------^^^",
    "XX-------------",
    "XX---XX-------X",
    "XX-#-XXXX-----X",
    "XX-----XX-----X",
    "XXXX---XX-----*",
    "XXXX---XX-----X",
    "XXXX--#XX-----X",
    "XXXX---XX-----X",
    "-------XX------",
    "&------XX---^^^"
  ],
  "3_6_0": [
    "XX------------X",
    "XX------------X",
    "XX---XX-------X",
    "XX-#-XXXX-----X",
    "XX-----XX-----X",
    "XXXX---XX--#--X",
    "XXXX---XX-----X",
    "XXXX--#XX-----X",
    "XXXX---XX-----X",
    "-------XX------",
    "&------XX--*---"
  ],
  "2_7_0": [
    "XX----------XX-",
    "XX----------XX-",
    "XX---XX-----XX-",
    "XX-#-XXXX---XX#",
    "XX-----XX---XX-",
    "XXXX---XX---XX-",
    "XXXX---XX---XX-",
    "XXXX--#XX---XXX",
    "XXXX---XX-----X",
    "-------XX------",
    "&------XX------"
  ],
  "15_3_0": [
    "--^^^^^^^^^^^^^",
    "----*#X--X--X--",
    "----XXX--X--X--",
    "----XX---X--X--",
    "----X----X--X--",
    "----X----X-#X-#",
    "----X----X--X--",
    "----X----X--X--",
    "----X----X--X--",
    "---------------",
    "--^^^^^^^^^^^^^"
  ],
  "4_11_0": [
    "------XXXXXXXXX",
    "------XXXXXXXXX",
    "X-----XXXXXXXXX",
    "XXX---XXXXXXXXX",
    "-XX-----*---#XX",
    "-XX----------XX",
    "-XX------#----*",
    "#XX---XXXXXXXXX",
    "-XX---XXXXXXXXX",
    "-XX---XXXXXXXXX",
    "-XX---XXXXXXXXX"
  ],
  "9_4_0": [
    "-------^^^^^^^^",
    "---------------",
    "X-------------X",
    "XXX------XXX--X",
    "-XX------X*X--X",
    "-XX------X&---*",
    "-XX------X*X--X",
    "#XX------XXX--X",
    "-XX-----------X",
    "-XX------------",
    "-XX----^^^^^^^^"
  ],
  "11_0_0": [
    "------^^^^^^^^^",
    "---------------",
    "---------------",
    "-----------X---",
    "---#-------X-&-",
    "-----------XXXX",
    "-----------X-*#",
    "-*---------X---",
    "---------------",
    "---------------",
    "------^^^^^^^^^"
  ],
  "5_9_0": [
    "-*XXXXXXXXXXXXX",
    "--XXXXXXXXX--^^",
    "--XXXXXXXXX--^^",
    "--XXXXXXXXX--^^",
    "-------------^^",
    "-#------------&",
    "----#---#----^^",
    "--XXXXXXXXX--^^",
    "--XXXXXXXXX--^^",
    "--XXXXXXXXX--^^",
    "--XXXXXXXXXXXXX"
  ],
  "5_12_0": [
    "-*XXXXXXXXXXXXX",
    "--XXXXXXXXXXXXX",
    "--XXXXXXXXXXXXX",
    "--XXXXXXXXXXXXX",
    "-------------*-",
    "-#-----&-------",
    "----#-----#---#",
    "--XXXXXXXXXXXXX",
    "--XXXXXXXXXXXXX",
    "--XXXXXXXXXXXXX",
    "--XXXXXXXXXXXXX"
  ],
  "8_5_0": [
    "------^^^^^^^^^",
    "--------X--X--X",
    "X-------X--X--X",
    "XXX-----X--X--X",
    "-XX-----X--X--X",
    "-XX-----X--X--X",
    "-XX-----X--X--X",
    "#XX-----X--X--X",
    "-XX-----X--X--X",
    "-XX------------",
    "-XX---^^^^^^^^^"
  ],
  "1_11_0": [
    "XX--XXX--XXX---",
    "XX--XXX--XXX---",
    "XX--XXX--XXX---",
    "XX--XXX--XXX---",
    "XX--XXX--XXX---",
    "XXXXXXXXXXXXXX-",
    "XXXXXXXXXXXXXX-",
    "XXXXXXXXXXXXXX-",
    "XXXXXXXXXX*XXX-",
    "---------------",
    "&----&----#----"
  ],
  "2_0_0": [
    "---------------",
    "---------------",
    "---------------",
    "---X-----------",
    "---X-----------",
    "XXXX----------&",
    "#*-X-----------",
    "---X--#--------",
    "---------------",
    "---------------",
    "---------------"
  ],
  "14_3_0": [
    "--^^^^^^^^^^^^^",
    "------*#X--X--X",
    "------XXX--X--X",
    "------XX---X--X",
    "------X----X--X",
    "------X----X-#X",
    "------X----X--X",
    "------X----X--X",
    "------X----X--X",
    "---------------",
    "--^^^^^^^^^^^^^"
  ],
  "7_8_0": [
    "-*XXXXXXXXX---&",
    "--XXXXXXXXX--^^",
    "--XXXXXXXXX--^^",
    "--XXXXXXXXX--^^",
    "-------*-----^^",
    "-#-----------^^",
    "----#---#----^^",
    "--XXXXXXXXX--^^",
    "--XXXXXXXXX--^^",
    "--XXXXXXXXX--^^",
    "--XXXXXXXXX---*"
  ],
  "3_8_0": [
    "XX---------XXXX",
    "XX---------XX--",
    "XX---XX----XX--",
    "XX-#-XXXX--XX--",
    "XX-----XX------",
    "XXXX---XX------",
    "XXXX---XX------",
    "XXXX--#XX--XX--",
    "XXXX---XX--XX--",
    "-------XX--XX*#",
    "&------XX--XXXX"
  ],
  "1_8_0": [
    "XX----------XXX",
    "XX----------XXX",
    "XX---XX-----XXX",
    "XX-#-XXXX---XXX",
    "XX-----XX---XXX",
    "XXXX---XX---XXX",
    "XXXX---XX---XXX",
    "XXXX--#XX---XXX",
    "XXXX---XX------",
    "-------XX------",
    "&------XX---XXX"
  ],
  "7_6_0": [
    "XX---------^^^^",
    "XX-------------",
    "XX---XX------X-",
    "XX-#-XXXX----XX",
    "XX-----XX----XX",
    "XXXX---XX----*#",
    "XXXX---XX----XX",
    "XXXX--#XX----XX",
    "XXXX---XX----X-",
    "-------XX------",
    "&------XX--^^^^"
  ],
  "1_12_0": [
    "-----XXXXXXXXXX",
    "-----XXXXXXXXXX",
    "X----XXXXXXXXXX",
    "XXX--XXXXXXXXXX",
    "-XX----&--&--#X",
    "-XX-----------X",
    "-XX------------",
    "#XX--XXXXXXXXXX",
    "-XX--XXXXXXXXXX",
    "-XX--XXXXXXXXXX",
    "-XX--XXXXXXXXXX"
  ],
  "10_1_0": [
    "------^^^^^^^^^",
    "------------X--",
    "------------X--",
    "---X--------X--",
    "---X--------X--",
    "XXXX--------X-#",
    "#*-X--------X--",
    "---X--------X--",
    "------------X--",
    "---------------",
    "------^^^^^^^^^"
  ],
  "0_11_0": [
    "XX--XXX--XXX---",
    "XX--XXX--XXX---",
    "XX--XXX--XXX---",
    "XX--XXX--XXX---",
    "XX--XXX--XXX---",
    "XXXXXXXXXXXXXX-",
    "XXXXXXXXXXXXXX-",
    "XXXXXXXXXXXXXX-",
    "XXXXXXXXXXXXXX-",
    "---------------",
    "&----&----&----"
  ],
  "16_3_0": [
    "^^^^^^^^^^^^^^^",
    "---------------",
    "-------------X-",
    "--------XXX--XX",
    "--------X*X--XX",
    "--------X&---*#",
    "--------X*X--XX",
    "X-------XXX--XX",
    "XX-----------X-",
    "#X-------------",
    "^^^^^^^^^^^^^^^"
  ],
  "9_2_0": [
    "------^^^^^^^^^",
    "--------------*",
    "X--------------",
    "XXX----------^^",
    "-XX--------^^^^",
    "-XX-----------&",
    "-XX--------^^^^",
    "#XX----------^^",
    "-XX------------",
    "-XX-----------*",
    "-XX---^^^^^^^^^"
  ],
  "3_13_0": [
    "-*XXXXXXXXXXXXX",
    "--XXXXXXXXXXXXX",
    "--XXXXXXXXXXXXX",
    "--XXXXXXXXXXXXX",
    "-----#XXXX-----",
    "-#----XXXX--&--",
    "-------*-------",
    "--XXXXXXXXXXXXX",
    "--XXXXXXXXXXXXX",
    "--XXXXXXXXXXXXX",
    "--XXXXXXXXXXXXX"
  ],
  "4_12_0": [
    "-----XXXXXXXXXX",
    "-----XXXXXXXXXX",
    "X----XXXXXXXXXX",
    "XXX--XXXXXXXXXX",
    "-XX----*---#XXX",
    "-XX---------XXX",
    "-XX-----#----*-",
    "#XX--XXXXXXXXXX",
    "-XX--XXXXXXXXXX",
    "-XX--XXXXXXXXXX",
    "-XX--XXXXXXXXXX"
  ],
  "1_0_0": [
    "---------------",
    "---------------",
    "---------------",
    "---X-----------",
    "---X-----------",
    "XXXX----------&",
    "#*-X-----------",
    "---X-----------",
    "---------------",
    "---------------",
    "---------------"
  ],
  "7_4_0": [
    "---------^^^^^^",
    "-----------X--X",
    "X----------X--X",
    "XXX--------X--X",
    "-XX--------X--X",
    "-XX--------X--X",
    "-XX--------X--X",
    "#XX--#-----X--X",
    "-XX--------X--X",
    "-XX------------",
    "-XX------^^^^^^"
  ],
  "9_1_0": [
    "------^^^^^^^^^",
    "---------------",
    "---------------",
    "---X----------X",
    "---X----------X",
    "XXXX----------X",
    "#*-X----------X",
    "---X----------X",
    "---------------",
    "---------------",
    "------^^^^^^^^^"
  ],
  "4_9_0": [
    "-------XXXXXXXX",
    "-------XXXXXXXX",
    "X------XXXXXXXX",
    "XXX----XXXXXXXX",
    "-XX------*---*-",
    "-XX------------",
    "-XX-------#---#",
    "#XX----XXXXXXXX",
    "-XX----XXXXXXXX",
    "-XX----XXXXXXXX",
    "-XX----XXXXXXXX"
  ],
  "1_14_0": [
    "--XXXXXXXXXXXXX",
    "--XXXXXXXXXXXXX",
    "--XXXXXXXXXXXXX",
    "--XXXXXXXXXXXXX",
    "----#XXXXXXXX--",
    "-----XXXXXXX---",
    "------*--------",
    "--XXXXXXXXXXXXX",
    "--XXXXXXXXXXXXX",
    "--XXXXXXXXXXXXX",
    "--XXXXXXXXXXXXX"
  ],
  "2_10_0": [
    "-------XXXXXXXX",
    "-------XXXXXXXX",
    "X------XXXXXXXX",
    "XXX----XXXXXXXX",
    "-XX---------#XX",
    "-XX------&---XX",
    "-XX-----------*",
    "#XX----XXXXXXXX",
    "-XX----XXXXXXXX",
    "-XX----XXXXXXXX",
    "-XX----XXXXXXXX"
  ],
  "8_7_0": [
    "-*XXXXXXXXXXXXX",
    "--XXXXXX-----*-",
    "--XXXXXX-------",
    "--XXXXXX----^^^",
    "----------^^^^^",
    "-#-----------&-",
    "----#-----^^^^^",
    "--XXXXXX----^^^",
    "--XXXXXX-------",
    "--XXXXXX-----*-",
    "--XXXXXXXXXXXXX"
  ],
  "11_2_0": [
    "------^^^^^^^^^",
    "---------X--X--",
    "---------X--X--",
    "---X-----X--X--",
    "---X-----X--X--",
    "XXXX-----X-#X-#",
    "#*-X-----X--X--",
    "---X-----X--X--",
    "---------X--X--",
    "---------------",
    "------^^^^^^^^^"
  ],
  "6_7_0": [
    "-*XXXXXXXXXXXXX",
    "--XX---&---XXXX",
    "--XX--^^^--XXXX",
    "--XX--^^^--XXXX",
    "------^^^----*-",
    "-#----^^^------",
    "------^^^-----#",
    "--XX--^^^--XXXX",
    "--XX--^^^--XXXX",
    "--XX---&---XXXX",
    "--XXXXXXXXXXXXX"
  ],
  "2_13_0": [
    "-----XXXXXXXXXX",
    "-----XXXXXXXXXX",
    "X----XXXXXXXXXX",
    "XXX--XXXXXXXXXX",
    "-XX----#XXXXX--",
    "-XX-----XXXXX--",
    "-XX------*-----",
    "#XX--XXXXXXXXXX",
    "-XX--XXXXXXXXXX",
    "-XX--XXXXXXXXXX",
    "-XX--XXXXXXXXXX"
  ],
  "6_1_0": [
    "------------^^^",
    "--------------X",
    "--------------X",
    "---X-----------",
    "---X-----------",
    "XXXX-----------",
    "#*-X-----------",
    "---X--#--------",
    "---------#-----",
    "---------------",
    "------------^^^"
  ],
  "3_11_0": [
    "------XXXXXXXXX",
    "------XXXXXXXXX",
    "X-----XXXXXXXXX",
    "XXX---XXXXXXXXX",
    "-XX--------#XXX",
    "-XX---------XXX",
    "-XX-----#----*-",
    "#XX---XXXXXXXXX",
    "-XX---XXXXXXXXX",
    "-XX---XXXXXXXXX",
    "-XX---XXXXXXXXX"
  ],
  "10_2_0": [
    "-----^^^^^^^^^^",
    "--------------*",
    "X--------------",
    "XXX----------^^",
    "-XX--------^^^^",
    "-XX-----------&",
    "-XX--------^^^^",
    "#XX----------^^",
    "-XX------------",
    "-XX-----------*",
    "-XX--^^^^^^^^^^"
  ],
  "17_2_0": [
    "^^^^^^^^^^^^^^^",
    "---------------",
    "---------------",
    "-----XXX--X----",
    "-----X*X--X-&-&",
    "-----X&---XXXXX",
    "-----X*X--X-*#*",
    "X----XXX--X----",
    "XX-------------",
    "#X-------------",
    "^^^^^^^^^^^^^^^"
  ],
  "16_4_0": [
    "^^^^^^^^^^^^^^^",
    "-----X--X--X--X",
    "-----X--X--X--X",
    "-----X--X--X--X",
    "-----X--X--X--X",
    "-----X-#X-#X-#X",
    "-----X--X--X--X",
    "X----X--X--X--X",
    "XX---X--X--X--X",
    "#X-------------",
    "^^^^^^^^^^^^^^^"
  ],
  "8_8_0": [
    "-*XXXXXXXXXXXXX",
    "--XXXXXXX-----*",
    "--XXXXXXX------",
    "--XXXXXXX----^^",
    "----*------^^^^",
    "-#------------&",
    "-----#-----^^^^",
    "--XXXXXXX----^^",
    "--XXXXXXX------",
    "--XXXXXXX-----*",
    "--XXXXXXXXXXXXX"
  ],
  "10_4_0": [
    "------^^^^^^^^^",
    "---------------",
    "X-------------X",
    "XXX------XXX--X",
    "-XX------X*X--X",
    "-XX------X&---*",
    "-XX------X*X--X",
    "#XX------XXX--X",
    "-XX-----------X",
    "-XX------------",
    "-XX---^^^^^^^^^"
  ],
  "0_14_0": [
    "XXXXXXXXXXXXXXX",
    "XXXXXXXXXXXXXXX",
    "XXXXXXXXXXXXXXX",
    "XXXXXXXXXXXXXXX",
    "-------&-------",
    "---------------",
    "----------*----",
    "&-XXXXXXXXXXXXX",
    "XXXXXXXXXXXXXXX",
    "XXXXXXXXXXXXXXX",
    "XXXXXXXXXXXXXXX"
  ],
  "2_16_0": [
    "XXXXXXXXXXXXXXX",
    "XXXXXXXXXXXXXXX",
    "XXXXXXXXXXXXXXX",
    "XXXXXXXXXXXXXXX",
    "-------#XXXXXXX",
    "--------XXXXXXX",
    "----#----*-----",
    "&-XXXXXXXXXXXXX",
    "XXXXXXXXXXXXXXX",
    "XXXXXXXXXXXXXXX",
    "XXXXXXXXXXXXXXX"
  ],
  "15_4_0": [
    "^^^^^^^^^^^^^^^",
    "-----X--X--X--X",
    "-----X--X--X--X",
    "-----X--X--X--X",
    "-----X--X--X--X",
    "-----X-#X-#X--X",
    "-----X--X--X--X",
    "X----X--X--X--X",
    "XX---X--X--X--X",
    "#X-------------",
    "^^^^^^^^^^^^^^^"
  ],
  "8_6_0": [
    "-*XXXXXXXXXXXXX",
    "--XXXXX-----*--",
    "--XXXXX--------",
    "--XXXXX----^^^-",
    "---------^^^^^^",
    "-#----------&--",
    "----#----^^^^^^",
    "--XXXXX----^^^-",
    "--XXXXX--------",
    "--XXXXX-----*--",
    "--XXXXXXXXXXXXX"
  ],
  "7_5_0": [
    "------X--^^^^^^",
    "------X----X--X",
    "X-----X----X--X",
    "XXX---X----X--X",
    "-XX--------X--X",
    "-XX--------X-#X",
    "-XX--------X--X",
    "#XX---X----X--X",
    "-XX---X----X--X",
    "-XX---X--------",
    "-XX---X--^^^^^^"
  ],
  "6_10_0": [
    "-*XXXXXXXXXXXXX",
    "--XXXXXXXXX----",
    "--XXXXXXXXX--X-",
    "--XXXXXXXXX--X-",
    "-------*-----X-",
    "-#-----------X-",
    "----#---#----X-",
    "--XXXXXXXXX--XX",
    "--XXXXXXXXX--XX",
    "--XXXXXXXXX-&*#",
    "--XXXXXXXXXXXXX"
  ],
  "6_8_0": [
    "-*XXXXXXXX--^^^",
    "--XXXXXXXX-----",
    "--XXXXXXXX----X",
    "--XXXXXXXX----X",
    "--------------X",
    "-#-----&------*",
    "----#---------X",
    "--XXXXXXXX----X",
    "--XXXXXXXX----X",
    "--XXXXXXXX-----",
    "--XXXXXXXX--^^^"
  ],
  "12_2_0": [
    "------^^^^^^^^^",
    "---------------",
    "-------------X-",
    "--------XXX--XX",
    "---#----X*X--XX",
    "--------X&---*#",
    "--------X*X--XX",
    "-*------XXX--XX",
    "-------------X-",
    "---------------",
    "------^^^^^^^^^"
  ],
  "4_13_0": [
    "-*XXXXXXXXXXXXX",
    "--XXXXXXXXXXXXX",
    "--XXXXXXXXXXXXX",
    "--XXXXXXXXXXXXX",
    "----------#XXXX",
    "-#-----&---XXXX",
    "----#-------*--",
    "--XXXXXXXXXXXXX",
    "--XXXXXXXXXXXXX",
    "--XXXXXXXXXXXXX",
    "--XXXXXXXXXXXXX"
  ],
  "17_3_0": [
    "^^^^^^^^^^^^^^^",
    "---------------",
    "--------------X",
    "-----X-----X--X",
    "-----X-&-&-X--X",
    "-----XXXXXXX--*",
    "-----X-*#*-X--X",
    "X----X-----X--X",
    "XX------------X",
    "#X-------------",
    "^^^^^^^^^^^^^^^"
  ],
  "3_14_0": [
    "-*XXXXXXXXXXXXX",
    "--XXXXXXXXXXXXX",
    "--XXXXXXXXXXXXX",
    "--XXXXXXXXXXXXX",
    "-----#XXXXXXX--",
    "-#----XXXXXX---",
    "-------*-------",
    "--XXXXXXXXXXXXX",
    "--XXXXXXXXXXXXX",
    "--XXXXXXXXXXXXX",
    "--XXXXXXXXXXXXX"
  ],
  "11_4_0": [
    "------^^^^^^^^^",
    "---------------",
    "X--------------",
    "XXX-----X-----X",
    "-XX-----X-&-&-X",
    "-XX-----XXXXXXX",
    "-XX-----X-*#*-X",
    "#XX-----X-----X",
    "-XX------------",
    "-XX------------",
    "-XX---^^^^^^^^^"
  ],
  "10_6_0": [
    "XXX--^^^^^^^^^^",
    "XXX-----X--X--X",
    "XXX-----X--X--X",
    "XXX-----X--X--X",
    "XXX-----X--X--X",
    "XXX-----X-#X-#X",
    "XXX-----X--X--X",
    "X-------X--X--X",
    "--------X--X--X",
    "-XX------------",
    "XXX--^^^^^^^^^^"
  ],
  "0_13_0": [
    "-XXXXXXXXXXXXXX",
    "-XXXXXXXXXXXXXX",
    "-XXXXXXXXXXXXXX",
    "-XXXXXXXXXX-&-X",
    "---------------",
    "---------------",
    "-------#-------",
    "-XXXXXXXXXXXXXX",
    "-XXXXXXXXXXXXXX",
    "-XXXXXXXXXXXXXX",
    "-XXXXXXXXXXXXXX"
  ],
  "11_5_0": [
    "-----^^^^^^^^^^",
    "--------X--X--X",
    "X-------X--X--X",
    "XXX-----X--X--X",
    "-XX-----X--X--X",
    "-XX-----X-#X-#X",
    "-XX-----X--X--X",
    "#XX-----X--X--X",
    "-XX-----X--X--X",
    "-XX------------",
    "-XX--^^^^^^^^^^"
  ],
  "8_9_0": [
    "XXXXXXXX--^^^^^",
    "XXXXXXXX-------",
    "XXXXXXXX----X--",
    "XXXXXXXX----XX-",
    "----*-------XXX",
    "------------*#X",
    "-----#------XXX",
    "&-XXXXXX----XX-",
    "XXXXXXXX----X--",
    "XXXXXXXX-------",
    "XXXXXXXX--^^^^^"
  ],
  "9_7_0": [
    "XXXXXXXXXXXXXXX",
    "----*-----XXXXX",
    "----------XXXXX",
    "---^^^----XXXXX",
    "^^^^^^^^----*--",
    "----&----------",
    "^^^^^^^^-----#-",
    "---^^^----XXXXX",
    "----------XXXXX",
    "----*-----XXXXX",
    "XXXXXXXXXXXXXXX"
  ],
  "2_14_0": [
    "--XXXXXXXXXXXXX",
    "--XXXXXXXXXXXXX",
    "--XXXXXXXXXXXXX",
    "--XXXXXXXXXXXXX",
    "-------#XXXXXXX",
    "--------XXXXXX-",
    "----#----*-----",
    "--XXXXXXXXXXXXX",
    "--XXXXXXXXXXXXX",
    "--XXXXXXXXXXXXX",
    "--XXXXXXXXXXXXX"
  ],
  "9_5_0": [
    "------^^^^^^^^^",
    "--------X--X--X",
    "X-------X--X--X",
    "XXX-----X--X--X",
    "-XX-----X--X--X",
    "-XX-----X-#X--X",
    "-XX-----X--X--X",
    "#XX-----X--X--X",
    "-XX-----X--X--X",
    "-XX------------",
    "-XX---^^^^^^^^^"
  ],
  "12_5_0": [
    "-----^^^^^^^^^^",
    "---------------",
    "X-----------X--",
    "XXX----XXX--XX-",
    "-XX----X*X--XXX",
    "-XX----X&---*#X",
    "-XX----X*X--XXX",
    "#XX----XXX--XX-",
    "-XX---------X--",
    "-XX------------",
    "-XX--^^^^^^^^^^"
  ],
  "10_5_0": [
    "------^^^^^^^^^",
    "--------X--X--X",
    "X-------X--X--X",
    "XXX-----X--X--X",
    "-XX-----X--X--X",
    "-XX-----X-#X-#X",
    "-XX-----X--X--X",
    "#XX-----X--X--X",
    "-XX-----X--X--X",
    "-XX------------",
    "-XX---^^^^^^^^^"
  ],
  "1_15_0": [
    "--XXXXXXXXXXXXX",
    "--XXXXXXXXXXXXX",
    "--XXXXXXXXXXXXX",
    "--XXXXXXXXXXXXX",
    "----#XXXXXXXXXX",
    "-----XXXXXXXXXX",
    "------*--------",
    "--XXXXXXXXXXXXX",
    "--XXXXXXXXXXXXX",
    "--XXXXXXXXXXXXX",
    "--XXXXXXXXXXXXX"
  ],
  "12_4_0": [
    "-----^^^^^^^^^^",
    "---------------",
    "X--------------",
    "XXX-----X-----X",
    "-XX-----X-&-&-X",
    "-XX-----XXXXXXX",
    "-XX-----X-*#*-X",
    "#XX-----X-----X",
    "-XX------------",
    "-XX------------",
    "-XX--^^^^^^^^^^"
  ],
  "3_16_0": [
    "XXXXXXXXXXXXXXX",
    "XXXXXXXXXXXXXXX",
    "XXXXXXXXXXXXXXX",
    "XXXXXXXXXXXXXXX",
    "----#XXXX--#XXX",
    "-----XXXX---XXX",
    "------*------*-",
    "&-XXXXXXXXXXXXX",
    "XXXXXXXXXXXXXXX",
    "XXXXXXXXXXXXXXX",
    "XXXXXXXXXXXXXXX"
  ],
  "9_6_0": [
    "XXXXXXXXXXXXXXX",
    "-----*-----XXXX",
    "-----------XXXX",
    "----^^^----XXXX",
    "^^^^^^^^^------",
    "-----&---------",
    "^^^^^^^^^----#-",
    "----^^^----XXXX",
    "-----------XXXX",
    "-----*-----XXXX",
    "XXXXXXXXXXXXXXX"
  ],
  "2_15_0": [
    "-XXXXXXXXXXXXXX",
    "-XXXXXXXXXXXXXX",
    "-XXXXXXXXXXXXXX",
    "-XXXXXXXXXXXXXX",
    "-------#XXXXXXX",
    "--------XXXXXX-",
    "----#----*-----",
    "-XXXXXXXXXXXXXX",
    "-XXXXXXXXXXXXXX",
    "-XXXXXXXXXXXXXX",
    "-XXXXXXXXXXXXXX"
  ],
  "4_16_0": [
    "XXXXXXXXXXXXXXX",
    "XXXXXXXXXXXXXXX",
    "XXXXXXXXXXXXXXX",
    "XXXXXXXXXXXXXXX",
    "---*---#XXXXXXX",
    "--------XXXXXX-",
    "#---#----*-----",
    "XXXXXXXXXXXXXXX",
    "XXXXXXXXXXXXXXX",
    "XXXXXXXXXXXXXXX",
    "XXXXXXXXXXXXXXX"
  ],
  "7_9_0": [
    "XXXXXXXX--^^^^^",
    "XXXXXXXX-------",
    "XXXXXXXX----X--",
    "XXXXXXXX----XX-",
    "------------XXX",
    "------------*#X",
    "----#-------XXX",
    "&-XXXXXX----XX-",
    "XXXXXXXX----X--",
    "XXXXXXXX-------",
    "XXXXXXXX--^^^^^"
  ],
  "5_14_0": [
    "-XXXXXXXXXXXXXX",
    "-XXXXXXXXXXXXXX",
    "-XXXXXXXXXXXXXX",
    "-XXXXXXXXXXXXXX",
    "---*---*---#XXX",
    "------------XXX",
    "----#---#----*-",
    "-XXXXXXXXXXXXXX",
    "-XXXXXXXXXXXXXX",
    "-XXXXXXXXXXXXXX",
    "-XXXXXXXXXXXXXX"
  ],
  "5_13_0": [
    "-*XXXXXXXXXXXXX",
    "--XXXXXXXXXXXXX",
    "--XXXXXXXXXXXXX",
    "--XXXXXXXXXXXXX",
    "----*------#XXX",
    "-#------&---XXX",
    "-----#-------*-",
    "--XXXXXXXXXXXXX",
    "--XXXXXXXXXXXXX",
    "--XXXXXXXXXXXXX",
    "--XXXXXXXXXXXXX"
  ],
  "4_14_0": [
    "-XXXXXXXXXXXXXX",
    "-XXXXXXXXXXXXXX",
    "-XXXXXXXXXXXXXX",
    "-XXXXXXXXXXXXXX",
    "---*---#XXXX--#",
    "--------XXXX---",
    "----#----*-----",
    "-XXXXXXXXXXXXXX",
    "-XXXXXXXXXXXXXX",
    "-XXXXXXXXXXXXXX",
    "-XXXXXXXXXXXXXX"
  ],
  "10_7_0": [
    "^^^^^^^^^--XXXX",
    "-----------XXXX",
    "-X---------XXXX",
    "XX--XXX----XXXX",
    "XX--X*X----XXX-",
    "#*--X&-----XX--",
    "XX--X*X--------",
    "XX--XXX----XXXX",
    "-X---------XXXX",
    "-----------XXXX",
    "^^^^^^^^^--XXXX"
  ],
  "4_15_0": [
    "XXXXXXXXXXXXXXX",
    "XXXXXXXXXXXXXXX",
    "XXXXXXXXXXXXXXX",
    "XXXXXXXXXXXXXXX",
    "-------*---#XXX",
    "------------XXX",
    "----#---#----*-",
    "&-XXXXXXXXXXXXX",
    "XXXXXXXXXXXXXXX",
    "XXXXXXXXXXXXXXX",
    "XXXXXXXXXXXXXXX"
  ],
  "5_11_0": [
    "-*XXXXXXXXXXXXX",
    "--XXXXXXXXX*&XX",
    "--XXXXXXXXX--XX",
    "--XXXXXXXXX--XX",
    "-------*-------",
    "-#-------------",
    "----#---#------",
    "--XXXXXXXXX--XX",
    "--XXXXXXXXX--XX",
    "--XXXXXXXXX--XX",
    "--XXXXXXXXXXXXX"
  ],
  "16_1_0": [
    "^^^^^^^^^^^^^^^",
    "---------------",
    "---------------",
    "----------X----",
    "----------X-&-&",
    "----------XXXXX",
    "----------X-*#*",
    "X---------X----",
    "XX-------------",
    "#X-------------",
    "^^^^^^^^^^^^^^^"
  ],
  "11_6_0": [
    "XXX--^^^^^^^^^^",
    "XXX------------",
    "XXX---------X--",
    "XXX----XXX--XX-",
    "XXX----X*X--XXX",
    "XXX----X&---*#X",
    "XXX----X*X--XXX",
    "XXX----XXX--XX-",
    "XXX---------X--",
    "---------------",
    "XXX--^^^^^^^^^^"
  ],
  "18_2_0": [
    "^^^^^^^^^^^^^^^",
    "---------------",
    "---------------",
    "-X-----X--X----",
    "-X-&-&-X--X-&-&",
    "-XXXXXXX--XXXXX",
    "-X-*#*-X--X-*#*",
    "-X-----X--X----",
    "---------------",
    "---------------",
    "^^^^^^^^^^^^^^^"
  ],
  "12_6_0": [
    "^^^^^^^^^--XXXX",
    "-----------XXXX",
    "-X---------XXXX",
    "XX--XXX----XXXX",
    "XX--X*X------*-",
    "#*--X&---------",
    "XX--X*X-------#",
    "XX--XXX----XXXX",
    "-X---------XXXX",
    "-----------XXXX",
    "^^^^^^^^^--XXXX"
  ],
  "6_9_0": [
    "-*XXXXXXXXXXXXX",
    "--XXXXXXXXX--^^",
    "--XXXXXXXXX--^^",
    "--XXXXXXXXX--^^",
    "-------*-----^^",
    "-#------------&",
    "----#---#----^^",
    "--XXXXXXXXX--^^",
    "--XXXXXXXXX--^^",
    "--XXXXXXXXX--^^",
    "--XXXXXXXXXXXXX"
  ],
  "3_15_0": [
    "-XXXXXXXXXXXXXX",
    "-XXXXXXXXXXXXXX",
    "-XXXXXXXXXXXXXX",
    "-XXXXXXXXXXXXXX",
    "---*---#XXXXXXX",
    "--------XXXXXX-",
    "----#----*-----",
    "-XXXXXXXXXXXXXX",
    "-XXXXXXXXXXXXXX",
    "-XXXXXXXXXXXXXX",
    "-XXXXXXXXXXXXXX"
  ],
  "7_10_0": [
    "XXXXXXXXXXXXXXX",
    "------XXXXXXXXX",
    "------XXXXXXXXX",
    "------XXXXXXXXX",
    "^^^^----*------",
    "------------#--",
    "^^^^-----#----*",
    "------XXXXXXXXX",
    "------XXXXXXXXX",
    "------XXXXXXXXX",
    "XXXXXXXXXXXXXXX"
  ],
  "6_15_0": [
    "XXXXXXXXXXXXXXX",
    "XXXXXXXXXXXXXXX",
    "XXXXXXXXXXXXXXX",
    "XXXXXXXXXXXXXXX",
    "---*---*---#XXX",
    "------------XXX",
    "#---#---#----*-",
    "XXXXXXXXXXXXXXX",
    "XXXXXXXXXXXXXXX",
    "XXXXXXXXXXXXXXX",
    "XXXXXXXXXXXXXXX"
  ],
  "5_15_0": [
    "XXXXXXXXXXXXXXX",
    "XXXXXXXXXXXXXXX",
    "XXXXXXXXXXXXXXX",
    "XXXXXXXXXXXXXXX",
    "---*------#XXXX",
    "-----------XXXX",
    "#---#--#----*--",
    "XXXXXXXXXXXXXXX",
    "XXXXXXXXXXXXXXX",
    "XXXXXXXXXXXXXXX",
    "XXXXXXXXXXXXXXX"
  ],
  "18_3_0": [
    "^^^^^^^^^^^^^^^",
    "---------------",
    "-X-------------",
    "XX---XXX--X----",
    "XX---X*X--X-&-&",
    "#*---X&---XXXXX",
    "XX---X*X--X-*#*",
    "XX---XXX--X----",
    "-X-------------",
    "---------------",
    "^^^^^^^^^^^^^^^"
  ],
  "13_4_0": [
    "---^^^^^^^^^^^^",
    "-----X--X--X--X",
    "-----X--X--X--X",
    "X----X--X--X--X",
    "X----X--X--X--X",
    "X----X-#X-#X-#X",
    "X----X--X--X--X",
    "X----X--X--X--X",
    "-----X--X--X--X",
    "---------------",
    "---^^^^^^^^^^^^"
  ],
  "6_14_0": [
    "XXXXXXXXXXXXXXX",
    "XXXXXXXXXXXXXXX",
    "XXXXXXXXXXXXXXX",
    "XXXXXXXXXXXXXXX",
    "---*---------*-",
    "---------------",
    "#---#--#--#---#",
    "XXXXXXXXXXXXXXX",
    "XXXXXXXXXXXXXXX",
    "XXXXXXXXXXXXXXX",
    "XXXXXXXXXXXXXXX"
  ],
  "6_11_0": [
    "-*XXXXXXXXXXXXX",
    "--XXXXXXXXXX*&X",
    "--XXXXXXXXXX--X",
    "--XXXXXXXXXX--X",
    "----*---*------",
    "-#-------------",
    "-----#---#-----",
    "--XXXXXXXXXX--X",
    "--XXXXXXXXXX--X",
    "--XXXXXXXXXX--X",
    "--XXXXXXXXXXXXX"
  ],
  "14_4_0": [
    "^^^^^^^^^^^^^^^",
    "-X---------X--X",
    "-X---------X--X",
    "-X--X--X---X--X",
    "-X--X--X---X--X",
    "-X--XXXX---X--X",
    "-X--X--X---X--X",
    "-X--X--X---X--X",
    "-X---------X--X",
    "-#-------------",
    "^^^^^^^^^^^^^^^"
  ],
  "6_12_0": [
    "XXXXXXXXXXXXXXX",
    "XXXXXXXXXXX----",
    "XXXXXXXXXXX--X-",
    "XXXXXXXXXXX--X-",
    "---*---*-----X-",
    "-------------X-",
    "#---#---#----X-",
    "XXXXXXXXXXX--XX",
    "XXXXXXXXXXX--XX",
    "XXXXXXXXXXX-&*#",
    "XXXXXXXXXXXXXXX"
  ],
  "1_17_0": [
    "XXXXXXXXXXXXXXX",
    "XXXXXXXXXXXXXXX",
    "XXXXXXXXXXXXXXX",
    "XXXXXXXXXXXXXXX",
    "X---#XXXXXXXXXX",
    "-----XXXXXXXXXX",
    "------*--------",
    "XXXXXXXXXXXXXXX",
    "XXXXXXXXXXXXXXX",
    "XXXXXXXXXXXXXXX",
    "XXXXXXXXXXXXXXX"
  ]
};

// src/levelDirector.ts
class LevelDirector {
  playerIsOnLastLevel = false;
  keys = [];
  columnsPerLevel = [];
  lossesInARow = 0;
  playerWonLastRound = false;
  levelsPlayed = 0;
  optimizeDifficulty;
  type;
  constructor() {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has("default")) {
      this.type = LD_BOTH;
    } else {
      this.type = choice([LD_RANDOM, LD_DIFFICULTY, LD_ENJOYMENT, LD_BOTH]);
    }
    console.log(`Director: ${this.type}`);
    Global.director = this.type;
    if (this.type == LD_DIFFICULTY) {
      this.optimizeDifficulty = true;
    } else {
      this.optimizeDifficulty = false;
    }
    for (let key in MDP.nodes) {
      MDP.nodes[key].updateReward(this.optimizeDifficulty);
    }
  }
  update(playerWon, playerColumn) {
    ++this.levelsPlayed;
    console.log(this.levelsPlayed, this.type);
    if (this.levelsPlayed % LD_SWITCH == 0 && this.type == LD_BOTH) {
      console.log("switch!");
      this.optimizeDifficulty = !this.optimizeDifficulty;
      for (let key in MDP.nodes) {
        MDP.nodes[key].updateReward(this.optimizeDifficulty);
      }
    }
    const keysLength = this.keys.length;
    const percentCompleted = [];
    if (playerWon) {
      this.lossesInARow = 0;
      for (let i = 0;i < keysLength; ++i) {
        percentCompleted.push(1);
      }
    } else {
      let col = playerColumn;
      for (let i = 0;i < keysLength; ++i) {
        if (col > this.columnsPerLevel[i]) {
          percentCompleted[i] = 1;
          col -= this.columnsPerLevel[i];
        } else {
          percentCompleted[i] = col / this.columnsPerLevel[i];
          break;
        }
      }
    }
    const pcLength = percentCompleted.length;
    for (let i = 0;i < pcLength; ++i) {
      const pc = percentCompleted[i];
      const id = this.keys[i];
      const node = MDP.getNode(id);
      if (pc === 1) {
        if (!MDP.hasEdge(KEY_START, id)) {
          console.log(`'adding edge: ${KEY_START} -> ${id}`);
          MDP.addEdge(new CustomEdge(KEY_START, id, [
            [id, 1],
            [KEY_DEATH, 0]
          ], []));
        }
      }
      ++node.visitedCount;
      node.sumPercentCompleted += pc;
      node.updateReward(this.optimizeDifficulty);
      const probLife = node.sumPercentCompleted / node.visitedCount;
      const probDeath = 1 - probLife;
      MDP.mapEdges((e) => {
        if (e.tgt === id) {
          e.probability[0][1] = probLife;
          e.probability[1][1] = probDeath;
        }
      });
    }
    if (!playerWon) {
      ++this.lossesInARow;
      for (let i = 0;i < this.lossesInARow; ++i) {
        const neighbors = MDP.getNode(KEY_START).neighbors;
        const neighborsCount = neighbors.length;
        if (neighborsCount === 1) {
          break;
        }
        let hardestNeighbor = "";
        let minDepth = 1e4;
        let maxDifficulty = 0;
        for (let jj = 0;jj < neighborsCount; ++jj) {
          const nodeName = neighbors[jj];
          if (nodeName === "0_0_0") {
            continue;
          }
          const n = MDP.getNode(nodeName);
          const d = n.depth;
          if (d < minDepth || d === minDepth && maxDifficulty < n.difficulty) {
            hardestNeighbor = nodeName;
            minDepth = d;
            maxDifficulty = n.difficulty;
          }
        }
        console.log("removing edge:", hardestNeighbor, minDepth, maxDifficulty);
        MDP.removeEdge(KEY_START, hardestNeighbor);
      }
    }
    this.playerWonLastRound = playerWon;
  }
  get(levelSegments) {
    let pi;
    if (this.type == LD_RANDOM) {
      pi = randomPolicy(MDP);
      console.log(pi);
    } else {
      pi = policyIteration(MDP, 0.95, true, true, 20);
    }
    this.columnsPerLevel = [];
    if (this.playerWonLastRound) {
      this.keys = [choice(pi[KEY_START])];
    } else {
      this.keys = [KEY_START];
    }
    for (let i = 0;i < levelSegments; ++i) {
      const k = choice(pi[this.keys[i]]);
      this.keys.push(k);
      if (k === KEY_END) {
        break;
      }
    }
    this.keys.splice(0, 1);
    console.log(this.keys);
    this.playerIsOnLastLevel = this.keys.includes(KEY_END);
    let r;
    const lvl = new Array(NUM_ROWS).fill("");
    const length = this.keys.length;
    for (let i = 0;i < length; ++i) {
      const stateLVL = idToLevel[this.keys[i]].slice();
      if (i > 0) {
        const edge = MDP.getEdge(this.keys[i - 1], this.keys[i]);
        const link = edge.link;
        const linkLength = link.length;
        if (linkLength > 0) {
          for (let jj = 0;jj < linkLength; ++jj) {
            const column = link[jj];
            for (r = 0;r < NUM_ROWS; ++r) {
              stateLVL[r] = column[r] + stateLVL[r];
            }
          }
        }
      }
      this.columnsPerLevel.push(stateLVL[0].length);
      for (r = 0;r < NUM_ROWS; ++r) {
        lvl[r] += stateLVL[r];
      }
    }
    console.log(lvl.join(`
`));
    return lvl;
  }
}

// node_modules/@firebase/util/dist/index.esm2017.js
var stringToByteArray$1 = function(str) {
  const out = [];
  let p = 0;
  for (let i = 0;i < str.length; i++) {
    let c = str.charCodeAt(i);
    if (c < 128) {
      out[p++] = c;
    } else if (c < 2048) {
      out[p++] = c >> 6 | 192;
      out[p++] = c & 63 | 128;
    } else if ((c & 64512) === 55296 && i + 1 < str.length && (str.charCodeAt(i + 1) & 64512) === 56320) {
      c = 65536 + ((c & 1023) << 10) + (str.charCodeAt(++i) & 1023);
      out[p++] = c >> 18 | 240;
      out[p++] = c >> 12 & 63 | 128;
      out[p++] = c >> 6 & 63 | 128;
      out[p++] = c & 63 | 128;
    } else {
      out[p++] = c >> 12 | 224;
      out[p++] = c >> 6 & 63 | 128;
      out[p++] = c & 63 | 128;
    }
  }
  return out;
};
var byteArrayToString = function(bytes) {
  const out = [];
  let pos = 0, c = 0;
  while (pos < bytes.length) {
    const c1 = bytes[pos++];
    if (c1 < 128) {
      out[c++] = String.fromCharCode(c1);
    } else if (c1 > 191 && c1 < 224) {
      const c2 = bytes[pos++];
      out[c++] = String.fromCharCode((c1 & 31) << 6 | c2 & 63);
    } else if (c1 > 239 && c1 < 365) {
      const c2 = bytes[pos++];
      const c3 = bytes[pos++];
      const c4 = bytes[pos++];
      const u = ((c1 & 7) << 18 | (c2 & 63) << 12 | (c3 & 63) << 6 | c4 & 63) - 65536;
      out[c++] = String.fromCharCode(55296 + (u >> 10));
      out[c++] = String.fromCharCode(56320 + (u & 1023));
    } else {
      const c2 = bytes[pos++];
      const c3 = bytes[pos++];
      out[c++] = String.fromCharCode((c1 & 15) << 12 | (c2 & 63) << 6 | c3 & 63);
    }
  }
  return out.join("");
};
var base64 = {
  byteToCharMap_: null,
  charToByteMap_: null,
  byteToCharMapWebSafe_: null,
  charToByteMapWebSafe_: null,
  ENCODED_VALS_BASE: "ABCDEFGHIJKLMNOPQRSTUVWXYZ" + "abcdefghijklmnopqrstuvwxyz" + "0123456789",
  get ENCODED_VALS() {
    return this.ENCODED_VALS_BASE + "+/=";
  },
  get ENCODED_VALS_WEBSAFE() {
    return this.ENCODED_VALS_BASE + "-_.";
  },
  HAS_NATIVE_SUPPORT: typeof atob === "function",
  encodeByteArray(input, webSafe) {
    if (!Array.isArray(input)) {
      throw Error("encodeByteArray takes an array as a parameter");
    }
    this.init_();
    const byteToCharMap = webSafe ? this.byteToCharMapWebSafe_ : this.byteToCharMap_;
    const output = [];
    for (let i = 0;i < input.length; i += 3) {
      const byte1 = input[i];
      const haveByte2 = i + 1 < input.length;
      const byte2 = haveByte2 ? input[i + 1] : 0;
      const haveByte3 = i + 2 < input.length;
      const byte3 = haveByte3 ? input[i + 2] : 0;
      const outByte1 = byte1 >> 2;
      const outByte2 = (byte1 & 3) << 4 | byte2 >> 4;
      let outByte3 = (byte2 & 15) << 2 | byte3 >> 6;
      let outByte4 = byte3 & 63;
      if (!haveByte3) {
        outByte4 = 64;
        if (!haveByte2) {
          outByte3 = 64;
        }
      }
      output.push(byteToCharMap[outByte1], byteToCharMap[outByte2], byteToCharMap[outByte3], byteToCharMap[outByte4]);
    }
    return output.join("");
  },
  encodeString(input, webSafe) {
    if (this.HAS_NATIVE_SUPPORT && !webSafe) {
      return btoa(input);
    }
    return this.encodeByteArray(stringToByteArray$1(input), webSafe);
  },
  decodeString(input, webSafe) {
    if (this.HAS_NATIVE_SUPPORT && !webSafe) {
      return atob(input);
    }
    return byteArrayToString(this.decodeStringToByteArray(input, webSafe));
  },
  decodeStringToByteArray(input, webSafe) {
    this.init_();
    const charToByteMap = webSafe ? this.charToByteMapWebSafe_ : this.charToByteMap_;
    const output = [];
    for (let i = 0;i < input.length; ) {
      const byte1 = charToByteMap[input.charAt(i++)];
      const haveByte2 = i < input.length;
      const byte2 = haveByte2 ? charToByteMap[input.charAt(i)] : 0;
      ++i;
      const haveByte3 = i < input.length;
      const byte3 = haveByte3 ? charToByteMap[input.charAt(i)] : 64;
      ++i;
      const haveByte4 = i < input.length;
      const byte4 = haveByte4 ? charToByteMap[input.charAt(i)] : 64;
      ++i;
      if (byte1 == null || byte2 == null || byte3 == null || byte4 == null) {
        throw new DecodeBase64StringError;
      }
      const outByte1 = byte1 << 2 | byte2 >> 4;
      output.push(outByte1);
      if (byte3 !== 64) {
        const outByte2 = byte2 << 4 & 240 | byte3 >> 2;
        output.push(outByte2);
        if (byte4 !== 64) {
          const outByte3 = byte3 << 6 & 192 | byte4;
          output.push(outByte3);
        }
      }
    }
    return output;
  },
  init_() {
    if (!this.byteToCharMap_) {
      this.byteToCharMap_ = {};
      this.charToByteMap_ = {};
      this.byteToCharMapWebSafe_ = {};
      this.charToByteMapWebSafe_ = {};
      for (let i = 0;i < this.ENCODED_VALS.length; i++) {
        this.byteToCharMap_[i] = this.ENCODED_VALS.charAt(i);
        this.charToByteMap_[this.byteToCharMap_[i]] = i;
        this.byteToCharMapWebSafe_[i] = this.ENCODED_VALS_WEBSAFE.charAt(i);
        this.charToByteMapWebSafe_[this.byteToCharMapWebSafe_[i]] = i;
        if (i >= this.ENCODED_VALS_BASE.length) {
          this.charToByteMap_[this.ENCODED_VALS_WEBSAFE.charAt(i)] = i;
          this.charToByteMapWebSafe_[this.ENCODED_VALS.charAt(i)] = i;
        }
      }
    }
  }
};

class DecodeBase64StringError extends Error {
  constructor() {
    super(...arguments);
    this.name = "DecodeBase64StringError";
  }
}
var base64Encode = function(str) {
  const utf8Bytes = stringToByteArray$1(str);
  return base64.encodeByteArray(utf8Bytes, true);
};
var base64urlEncodeWithoutPadding = function(str) {
  return base64Encode(str).replace(/\./g, "");
};
var base64Decode = function(str) {
  try {
    return base64.decodeString(str, true);
  } catch (e) {
    console.error("base64Decode failed: ", e);
  }
  return null;
};
function getGlobal() {
  if (typeof self !== "undefined") {
    return self;
  }
  if (typeof window !== "undefined") {
    return window;
  }
  if (typeof global !== "undefined") {
    return global;
  }
  throw new Error("Unable to locate global object.");
}
var getDefaultsFromGlobal = () => getGlobal().__FIREBASE_DEFAULTS__;
var getDefaultsFromEnvVariable = () => {
  if (typeof process === "undefined" || typeof process.env === "undefined") {
    return;
  }
  const defaultsJsonString = process.env.__FIREBASE_DEFAULTS__;
  if (defaultsJsonString) {
    return JSON.parse(defaultsJsonString);
  }
};
var getDefaultsFromCookie = () => {
  if (typeof document === "undefined") {
    return;
  }
  let match;
  try {
    match = document.cookie.match(/__FIREBASE_DEFAULTS__=([^;]+)/);
  } catch (e) {
    return;
  }
  const decoded = match && base64Decode(match[1]);
  return decoded && JSON.parse(decoded);
};
var getDefaults = () => {
  try {
    return getDefaultsFromGlobal() || getDefaultsFromEnvVariable() || getDefaultsFromCookie();
  } catch (e) {
    console.info(`Unable to get __FIREBASE_DEFAULTS__ due to: ${e}`);
    return;
  }
};
var getDefaultEmulatorHost = (productName) => {
  var _a, _b;
  return (_b = (_a = getDefaults()) === null || _a === undefined ? undefined : _a.emulatorHosts) === null || _b === undefined ? undefined : _b[productName];
};
var getDefaultEmulatorHostnameAndPort = (productName) => {
  const host = getDefaultEmulatorHost(productName);
  if (!host) {
    return;
  }
  const separatorIndex = host.lastIndexOf(":");
  if (separatorIndex <= 0 || separatorIndex + 1 === host.length) {
    throw new Error(`Invalid host ${host} with no separate hostname and port!`);
  }
  const port = parseInt(host.substring(separatorIndex + 1), 10);
  if (host[0] === "[") {
    return [host.substring(1, separatorIndex - 1), port];
  } else {
    return [host.substring(0, separatorIndex), port];
  }
};
var getDefaultAppConfig = () => {
  var _a;
  return (_a = getDefaults()) === null || _a === undefined ? undefined : _a.config;
};
class Deferred {
  constructor() {
    this.reject = () => {
    };
    this.resolve = () => {
    };
    this.promise = new Promise((resolve, reject) => {
      this.resolve = resolve;
      this.reject = reject;
    });
  }
  wrapCallback(callback) {
    return (error, value) => {
      if (error) {
        this.reject(error);
      } else {
        this.resolve(value);
      }
      if (typeof callback === "function") {
        this.promise.catch(() => {
        });
        if (callback.length === 1) {
          callback(error);
        } else {
          callback(error, value);
        }
      }
    };
  }
}
function createMockUserToken(token, projectId) {
  if (token.uid) {
    throw new Error('The "uid" field is no longer supported by mockUserToken. Please use "sub" instead for Firebase Auth User ID.');
  }
  const header = {
    alg: "none",
    type: "JWT"
  };
  const project = projectId || "demo-project";
  const iat = token.iat || 0;
  const sub = token.sub || token.user_id;
  if (!sub) {
    throw new Error("mockUserToken must contain 'sub' or 'user_id' field!");
  }
  const payload = Object.assign({
    iss: `https://securetoken.google.com/${project}`,
    aud: project,
    iat,
    exp: iat + 3600,
    auth_time: iat,
    sub,
    user_id: sub,
    firebase: {
      sign_in_provider: "custom",
      identities: {}
    }
  }, token);
  const signature = "";
  return [
    base64urlEncodeWithoutPadding(JSON.stringify(header)),
    base64urlEncodeWithoutPadding(JSON.stringify(payload)),
    signature
  ].join(".");
}
function getUA() {
  if (typeof navigator !== "undefined" && typeof navigator["userAgent"] === "string") {
    return navigator["userAgent"];
  } else {
    return "";
  }
}
function isNode() {
  var _a;
  const forceEnvironment = (_a = getDefaults()) === null || _a === undefined ? undefined : _a.forceEnvironment;
  if (forceEnvironment === "node") {
    return true;
  } else if (forceEnvironment === "browser") {
    return false;
  }
  try {
    return Object.prototype.toString.call(global.process) === "[object process]";
  } catch (e) {
    return false;
  }
}
function isSafari() {
  return !isNode() && !!navigator.userAgent && navigator.userAgent.includes("Safari") && !navigator.userAgent.includes("Chrome");
}
function isIndexedDBAvailable() {
  try {
    return typeof indexedDB === "object";
  } catch (e) {
    return false;
  }
}
function validateIndexedDBOpenable() {
  return new Promise((resolve, reject) => {
    try {
      let preExist = true;
      const DB_CHECK_NAME = "validate-browser-context-for-indexeddb-analytics-module";
      const request = self.indexedDB.open(DB_CHECK_NAME);
      request.onsuccess = () => {
        request.result.close();
        if (!preExist) {
          self.indexedDB.deleteDatabase(DB_CHECK_NAME);
        }
        resolve(true);
      };
      request.onupgradeneeded = () => {
        preExist = false;
      };
      request.onerror = () => {
        var _a;
        reject(((_a = request.error) === null || _a === undefined ? undefined : _a.message) || "");
      };
    } catch (error) {
      reject(error);
    }
  });
}
var ERROR_NAME = "FirebaseError";

class FirebaseError extends Error {
  constructor(code, message, customData) {
    super(message);
    this.code = code;
    this.customData = customData;
    this.name = ERROR_NAME;
    Object.setPrototypeOf(this, FirebaseError.prototype);
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ErrorFactory.prototype.create);
    }
  }
}

class ErrorFactory {
  constructor(service, serviceName, errors) {
    this.service = service;
    this.serviceName = serviceName;
    this.errors = errors;
  }
  create(code, ...data) {
    const customData = data[0] || {};
    const fullCode = `${this.service}/${code}`;
    const template = this.errors[code];
    const message = template ? replaceTemplate(template, customData) : "Error";
    const fullMessage = `${this.serviceName}: ${message} (${fullCode}).`;
    const error = new FirebaseError(fullCode, fullMessage, customData);
    return error;
  }
}
function replaceTemplate(template, data) {
  return template.replace(PATTERN, (_, key) => {
    const value = data[key];
    return value != null ? String(value) : `<${key}?>`;
  });
}
var PATTERN = /\{\$([^}]+)}/g;
function deepEqual(a, b) {
  if (a === b) {
    return true;
  }
  const aKeys = Object.keys(a);
  const bKeys = Object.keys(b);
  for (const k of aKeys) {
    if (!bKeys.includes(k)) {
      return false;
    }
    const aProp = a[k];
    const bProp = b[k];
    if (isObject(aProp) && isObject(bProp)) {
      if (!deepEqual(aProp, bProp)) {
        return false;
      }
    } else if (aProp !== bProp) {
      return false;
    }
  }
  for (const k of bKeys) {
    if (!aKeys.includes(k)) {
      return false;
    }
  }
  return true;
}
function isObject(thing) {
  return thing !== null && typeof thing === "object";
}
var MAX_VALUE_MILLIS = 4 * 60 * 60 * 1000;
function getModularInstance(service) {
  if (service && service._delegate) {
    return service._delegate;
  } else {
    return service;
  }
}

// node_modules/@firebase/component/dist/esm/index.esm2017.js
class Component3 {
  constructor(name, instanceFactory, type) {
    this.name = name;
    this.instanceFactory = instanceFactory;
    this.type = type;
    this.multipleInstances = false;
    this.serviceProps = {};
    this.instantiationMode = "LAZY";
    this.onInstanceCreated = null;
  }
  setInstantiationMode(mode) {
    this.instantiationMode = mode;
    return this;
  }
  setMultipleInstances(multipleInstances) {
    this.multipleInstances = multipleInstances;
    return this;
  }
  setServiceProps(props) {
    this.serviceProps = props;
    return this;
  }
  setInstanceCreatedCallback(callback) {
    this.onInstanceCreated = callback;
    return this;
  }
}
var DEFAULT_ENTRY_NAME = "[DEFAULT]";

class Provider {
  constructor(name, container) {
    this.name = name;
    this.container = container;
    this.component = null;
    this.instances = new Map;
    this.instancesDeferred = new Map;
    this.instancesOptions = new Map;
    this.onInitCallbacks = new Map;
  }
  get(identifier) {
    const normalizedIdentifier = this.normalizeInstanceIdentifier(identifier);
    if (!this.instancesDeferred.has(normalizedIdentifier)) {
      const deferred = new Deferred;
      this.instancesDeferred.set(normalizedIdentifier, deferred);
      if (this.isInitialized(normalizedIdentifier) || this.shouldAutoInitialize()) {
        try {
          const instance = this.getOrInitializeService({
            instanceIdentifier: normalizedIdentifier
          });
          if (instance) {
            deferred.resolve(instance);
          }
        } catch (e) {
        }
      }
    }
    return this.instancesDeferred.get(normalizedIdentifier).promise;
  }
  getImmediate(options) {
    var _a;
    const normalizedIdentifier = this.normalizeInstanceIdentifier(options === null || options === undefined ? undefined : options.identifier);
    const optional = (_a = options === null || options === undefined ? undefined : options.optional) !== null && _a !== undefined ? _a : false;
    if (this.isInitialized(normalizedIdentifier) || this.shouldAutoInitialize()) {
      try {
        return this.getOrInitializeService({
          instanceIdentifier: normalizedIdentifier
        });
      } catch (e) {
        if (optional) {
          return null;
        } else {
          throw e;
        }
      }
    } else {
      if (optional) {
        return null;
      } else {
        throw Error(`Service ${this.name} is not available`);
      }
    }
  }
  getComponent() {
    return this.component;
  }
  setComponent(component) {
    if (component.name !== this.name) {
      throw Error(`Mismatching Component ${component.name} for Provider ${this.name}.`);
    }
    if (this.component) {
      throw Error(`Component for ${this.name} has already been provided`);
    }
    this.component = component;
    if (!this.shouldAutoInitialize()) {
      return;
    }
    if (isComponentEager(component)) {
      try {
        this.getOrInitializeService({ instanceIdentifier: DEFAULT_ENTRY_NAME });
      } catch (e) {
      }
    }
    for (const [instanceIdentifier, instanceDeferred] of this.instancesDeferred.entries()) {
      const normalizedIdentifier = this.normalizeInstanceIdentifier(instanceIdentifier);
      try {
        const instance = this.getOrInitializeService({
          instanceIdentifier: normalizedIdentifier
        });
        instanceDeferred.resolve(instance);
      } catch (e) {
      }
    }
  }
  clearInstance(identifier = DEFAULT_ENTRY_NAME) {
    this.instancesDeferred.delete(identifier);
    this.instancesOptions.delete(identifier);
    this.instances.delete(identifier);
  }
  async delete() {
    const services = Array.from(this.instances.values());
    await Promise.all([
      ...services.filter((service) => ("INTERNAL" in service)).map((service) => service.INTERNAL.delete()),
      ...services.filter((service) => ("_delete" in service)).map((service) => service._delete())
    ]);
  }
  isComponentSet() {
    return this.component != null;
  }
  isInitialized(identifier = DEFAULT_ENTRY_NAME) {
    return this.instances.has(identifier);
  }
  getOptions(identifier = DEFAULT_ENTRY_NAME) {
    return this.instancesOptions.get(identifier) || {};
  }
  initialize(opts = {}) {
    const { options = {} } = opts;
    const normalizedIdentifier = this.normalizeInstanceIdentifier(opts.instanceIdentifier);
    if (this.isInitialized(normalizedIdentifier)) {
      throw Error(`${this.name}(${normalizedIdentifier}) has already been initialized`);
    }
    if (!this.isComponentSet()) {
      throw Error(`Component ${this.name} has not been registered yet`);
    }
    const instance = this.getOrInitializeService({
      instanceIdentifier: normalizedIdentifier,
      options
    });
    for (const [instanceIdentifier, instanceDeferred] of this.instancesDeferred.entries()) {
      const normalizedDeferredIdentifier = this.normalizeInstanceIdentifier(instanceIdentifier);
      if (normalizedIdentifier === normalizedDeferredIdentifier) {
        instanceDeferred.resolve(instance);
      }
    }
    return instance;
  }
  onInit(callback, identifier) {
    var _a;
    const normalizedIdentifier = this.normalizeInstanceIdentifier(identifier);
    const existingCallbacks = (_a = this.onInitCallbacks.get(normalizedIdentifier)) !== null && _a !== undefined ? _a : new Set;
    existingCallbacks.add(callback);
    this.onInitCallbacks.set(normalizedIdentifier, existingCallbacks);
    const existingInstance = this.instances.get(normalizedIdentifier);
    if (existingInstance) {
      callback(existingInstance, normalizedIdentifier);
    }
    return () => {
      existingCallbacks.delete(callback);
    };
  }
  invokeOnInitCallbacks(instance, identifier) {
    const callbacks = this.onInitCallbacks.get(identifier);
    if (!callbacks) {
      return;
    }
    for (const callback of callbacks) {
      try {
        callback(instance, identifier);
      } catch (_a) {
      }
    }
  }
  getOrInitializeService({ instanceIdentifier, options = {} }) {
    let instance = this.instances.get(instanceIdentifier);
    if (!instance && this.component) {
      instance = this.component.instanceFactory(this.container, {
        instanceIdentifier: normalizeIdentifierForFactory(instanceIdentifier),
        options
      });
      this.instances.set(instanceIdentifier, instance);
      this.instancesOptions.set(instanceIdentifier, options);
      this.invokeOnInitCallbacks(instance, instanceIdentifier);
      if (this.component.onInstanceCreated) {
        try {
          this.component.onInstanceCreated(this.container, instanceIdentifier, instance);
        } catch (_a) {
        }
      }
    }
    return instance || null;
  }
  normalizeInstanceIdentifier(identifier = DEFAULT_ENTRY_NAME) {
    if (this.component) {
      return this.component.multipleInstances ? identifier : DEFAULT_ENTRY_NAME;
    } else {
      return identifier;
    }
  }
  shouldAutoInitialize() {
    return !!this.component && this.component.instantiationMode !== "EXPLICIT";
  }
}
function normalizeIdentifierForFactory(identifier) {
  return identifier === DEFAULT_ENTRY_NAME ? undefined : identifier;
}
function isComponentEager(component) {
  return component.instantiationMode === "EAGER";
}

class ComponentContainer2 {
  constructor(name) {
    this.name = name;
    this.providers = new Map;
  }
  addComponent(component) {
    const provider = this.getProvider(component.name);
    if (provider.isComponentSet()) {
      throw new Error(`Component ${component.name} has already been registered with ${this.name}`);
    }
    provider.setComponent(component);
  }
  addOrOverwriteComponent(component) {
    const provider = this.getProvider(component.name);
    if (provider.isComponentSet()) {
      this.providers.delete(component.name);
    }
    this.addComponent(component);
  }
  getProvider(name) {
    if (this.providers.has(name)) {
      return this.providers.get(name);
    }
    const provider = new Provider(name, this);
    this.providers.set(name, provider);
    return provider;
  }
  getProviders() {
    return Array.from(this.providers.values());
  }
}

// node_modules/@firebase/logger/dist/esm/index.esm2017.js
var instances = [];
var LogLevel;
(function(LogLevel2) {
  LogLevel2[LogLevel2["DEBUG"] = 0] = "DEBUG";
  LogLevel2[LogLevel2["VERBOSE"] = 1] = "VERBOSE";
  LogLevel2[LogLevel2["INFO"] = 2] = "INFO";
  LogLevel2[LogLevel2["WARN"] = 3] = "WARN";
  LogLevel2[LogLevel2["ERROR"] = 4] = "ERROR";
  LogLevel2[LogLevel2["SILENT"] = 5] = "SILENT";
})(LogLevel || (LogLevel = {}));
var levelStringToEnum = {
  debug: LogLevel.DEBUG,
  verbose: LogLevel.VERBOSE,
  info: LogLevel.INFO,
  warn: LogLevel.WARN,
  error: LogLevel.ERROR,
  silent: LogLevel.SILENT
};
var defaultLogLevel = LogLevel.INFO;
var ConsoleMethod = {
  [LogLevel.DEBUG]: "log",
  [LogLevel.VERBOSE]: "log",
  [LogLevel.INFO]: "info",
  [LogLevel.WARN]: "warn",
  [LogLevel.ERROR]: "error"
};
var defaultLogHandler = (instance, logType, ...args) => {
  if (logType < instance.logLevel) {
    return;
  }
  const now = new Date().toISOString();
  const method = ConsoleMethod[logType];
  if (method) {
    console[method](`[${now}]  ${instance.name}:`, ...args);
  } else {
    throw new Error(`Attempted to log a message with an invalid logType (value: ${logType})`);
  }
};

class Logger {
  constructor(name) {
    this.name = name;
    this._logLevel = defaultLogLevel;
    this._logHandler = defaultLogHandler;
    this._userLogHandler = null;
    instances.push(this);
  }
  get logLevel() {
    return this._logLevel;
  }
  set logLevel(val) {
    if (!(val in LogLevel)) {
      throw new TypeError(`Invalid value "${val}" assigned to \`logLevel\``);
    }
    this._logLevel = val;
  }
  setLogLevel(val) {
    this._logLevel = typeof val === "string" ? levelStringToEnum[val] : val;
  }
  get logHandler() {
    return this._logHandler;
  }
  set logHandler(val) {
    if (typeof val !== "function") {
      throw new TypeError("Value assigned to `logHandler` must be a function");
    }
    this._logHandler = val;
  }
  get userLogHandler() {
    return this._userLogHandler;
  }
  set userLogHandler(val) {
    this._userLogHandler = val;
  }
  debug(...args) {
    this._userLogHandler && this._userLogHandler(this, LogLevel.DEBUG, ...args);
    this._logHandler(this, LogLevel.DEBUG, ...args);
  }
  log(...args) {
    this._userLogHandler && this._userLogHandler(this, LogLevel.VERBOSE, ...args);
    this._logHandler(this, LogLevel.VERBOSE, ...args);
  }
  info(...args) {
    this._userLogHandler && this._userLogHandler(this, LogLevel.INFO, ...args);
    this._logHandler(this, LogLevel.INFO, ...args);
  }
  warn(...args) {
    this._userLogHandler && this._userLogHandler(this, LogLevel.WARN, ...args);
    this._logHandler(this, LogLevel.WARN, ...args);
  }
  error(...args) {
    this._userLogHandler && this._userLogHandler(this, LogLevel.ERROR, ...args);
    this._logHandler(this, LogLevel.ERROR, ...args);
  }
}
// node_modules/idb/build/wrap-idb-value.js
var instanceOfAny = (object, constructors) => constructors.some((c) => object instanceof c);
var idbProxyableTypes;
var cursorAdvanceMethods;
function getIdbProxyableTypes() {
  return idbProxyableTypes || (idbProxyableTypes = [
    IDBDatabase,
    IDBObjectStore,
    IDBIndex,
    IDBCursor,
    IDBTransaction
  ]);
}
function getCursorAdvanceMethods() {
  return cursorAdvanceMethods || (cursorAdvanceMethods = [
    IDBCursor.prototype.advance,
    IDBCursor.prototype.continue,
    IDBCursor.prototype.continuePrimaryKey
  ]);
}
var cursorRequestMap = new WeakMap;
var transactionDoneMap = new WeakMap;
var transactionStoreNamesMap = new WeakMap;
var transformCache = new WeakMap;
var reverseTransformCache = new WeakMap;
function promisifyRequest(request) {
  const promise = new Promise((resolve, reject) => {
    const unlisten = () => {
      request.removeEventListener("success", success);
      request.removeEventListener("error", error);
    };
    const success = () => {
      resolve(wrap(request.result));
      unlisten();
    };
    const error = () => {
      reject(request.error);
      unlisten();
    };
    request.addEventListener("success", success);
    request.addEventListener("error", error);
  });
  promise.then((value) => {
    if (value instanceof IDBCursor) {
      cursorRequestMap.set(value, request);
    }
  }).catch(() => {
  });
  reverseTransformCache.set(promise, request);
  return promise;
}
function cacheDonePromiseForTransaction(tx) {
  if (transactionDoneMap.has(tx))
    return;
  const done = new Promise((resolve, reject) => {
    const unlisten = () => {
      tx.removeEventListener("complete", complete);
      tx.removeEventListener("error", error);
      tx.removeEventListener("abort", error);
    };
    const complete = () => {
      resolve();
      unlisten();
    };
    const error = () => {
      reject(tx.error || new DOMException("AbortError", "AbortError"));
      unlisten();
    };
    tx.addEventListener("complete", complete);
    tx.addEventListener("error", error);
    tx.addEventListener("abort", error);
  });
  transactionDoneMap.set(tx, done);
}
var idbProxyTraps = {
  get(target, prop, receiver) {
    if (target instanceof IDBTransaction) {
      if (prop === "done")
        return transactionDoneMap.get(target);
      if (prop === "objectStoreNames") {
        return target.objectStoreNames || transactionStoreNamesMap.get(target);
      }
      if (prop === "store") {
        return receiver.objectStoreNames[1] ? undefined : receiver.objectStore(receiver.objectStoreNames[0]);
      }
    }
    return wrap(target[prop]);
  },
  set(target, prop, value) {
    target[prop] = value;
    return true;
  },
  has(target, prop) {
    if (target instanceof IDBTransaction && (prop === "done" || prop === "store")) {
      return true;
    }
    return prop in target;
  }
};
function replaceTraps(callback) {
  idbProxyTraps = callback(idbProxyTraps);
}
function wrapFunction(func) {
  if (func === IDBDatabase.prototype.transaction && !("objectStoreNames" in IDBTransaction.prototype)) {
    return function(storeNames, ...args) {
      const tx = func.call(unwrap(this), storeNames, ...args);
      transactionStoreNamesMap.set(tx, storeNames.sort ? storeNames.sort() : [storeNames]);
      return wrap(tx);
    };
  }
  if (getCursorAdvanceMethods().includes(func)) {
    return function(...args) {
      func.apply(unwrap(this), args);
      return wrap(cursorRequestMap.get(this));
    };
  }
  return function(...args) {
    return wrap(func.apply(unwrap(this), args));
  };
}
function transformCachableValue(value) {
  if (typeof value === "function")
    return wrapFunction(value);
  if (value instanceof IDBTransaction)
    cacheDonePromiseForTransaction(value);
  if (instanceOfAny(value, getIdbProxyableTypes()))
    return new Proxy(value, idbProxyTraps);
  return value;
}
function wrap(value) {
  if (value instanceof IDBRequest)
    return promisifyRequest(value);
  if (transformCache.has(value))
    return transformCache.get(value);
  const newValue = transformCachableValue(value);
  if (newValue !== value) {
    transformCache.set(value, newValue);
    reverseTransformCache.set(newValue, value);
  }
  return newValue;
}
var unwrap = (value) => reverseTransformCache.get(value);

// node_modules/idb/build/index.js
function openDB(name, version, { blocked, upgrade, blocking, terminated } = {}) {
  const request = indexedDB.open(name, version);
  const openPromise = wrap(request);
  if (upgrade) {
    request.addEventListener("upgradeneeded", (event) => {
      upgrade(wrap(request.result), event.oldVersion, event.newVersion, wrap(request.transaction), event);
    });
  }
  if (blocked) {
    request.addEventListener("blocked", (event) => blocked(event.oldVersion, event.newVersion, event));
  }
  openPromise.then((db) => {
    if (terminated)
      db.addEventListener("close", () => terminated());
    if (blocking) {
      db.addEventListener("versionchange", (event) => blocking(event.oldVersion, event.newVersion, event));
    }
  }).catch(() => {
  });
  return openPromise;
}
var readMethods = ["get", "getKey", "getAll", "getAllKeys", "count"];
var writeMethods = ["put", "add", "delete", "clear"];
var cachedMethods = new Map;
function getMethod(target, prop) {
  if (!(target instanceof IDBDatabase && !(prop in target) && typeof prop === "string")) {
    return;
  }
  if (cachedMethods.get(prop))
    return cachedMethods.get(prop);
  const targetFuncName = prop.replace(/FromIndex$/, "");
  const useIndex = prop !== targetFuncName;
  const isWrite = writeMethods.includes(targetFuncName);
  if (!(targetFuncName in (useIndex ? IDBIndex : IDBObjectStore).prototype) || !(isWrite || readMethods.includes(targetFuncName))) {
    return;
  }
  const method = async function(storeName, ...args) {
    const tx = this.transaction(storeName, isWrite ? "readwrite" : "readonly");
    let target2 = tx.store;
    if (useIndex)
      target2 = target2.index(args.shift());
    return (await Promise.all([
      target2[targetFuncName](...args),
      isWrite && tx.done
    ]))[0];
  };
  cachedMethods.set(prop, method);
  return method;
}
replaceTraps((oldTraps) => ({
  ...oldTraps,
  get: (target, prop, receiver) => getMethod(target, prop) || oldTraps.get(target, prop, receiver),
  has: (target, prop) => !!getMethod(target, prop) || oldTraps.has(target, prop)
}));

// node_modules/@firebase/app/dist/esm/index.esm2017.js
class PlatformLoggerServiceImpl {
  constructor(container) {
    this.container = container;
  }
  getPlatformInfoString() {
    const providers = this.container.getProviders();
    return providers.map((provider) => {
      if (isVersionServiceProvider(provider)) {
        const service = provider.getImmediate();
        return `${service.library}/${service.version}`;
      } else {
        return null;
      }
    }).filter((logString) => logString).join(" ");
  }
}
function isVersionServiceProvider(provider) {
  const component = provider.getComponent();
  return (component === null || component === undefined ? undefined : component.type) === "VERSION";
}
var name$p = "@firebase/app";
var version$1 = "0.10.9";
var logger = new Logger("@firebase/app");
var name$o = "@firebase/app-compat";
var name$n = "@firebase/analytics-compat";
var name$m = "@firebase/analytics";
var name$l = "@firebase/app-check-compat";
var name$k = "@firebase/app-check";
var name$j = "@firebase/auth";
var name$i = "@firebase/auth-compat";
var name$h = "@firebase/database";
var name$g = "@firebase/database-compat";
var name$f = "@firebase/functions";
var name$e = "@firebase/functions-compat";
var name$d = "@firebase/installations";
var name$c = "@firebase/installations-compat";
var name$b = "@firebase/messaging";
var name$a = "@firebase/messaging-compat";
var name$9 = "@firebase/performance";
var name$8 = "@firebase/performance-compat";
var name$7 = "@firebase/remote-config";
var name$6 = "@firebase/remote-config-compat";
var name$5 = "@firebase/storage";
var name$4 = "@firebase/storage-compat";
var name$3 = "@firebase/firestore";
var name$2 = "@firebase/vertexai-preview";
var name$1 = "@firebase/firestore-compat";
var name = "firebase";
var version = "10.13.0";
var DEFAULT_ENTRY_NAME2 = "[DEFAULT]";
var PLATFORM_LOG_STRING = {
  [name$p]: "fire-core",
  [name$o]: "fire-core-compat",
  [name$m]: "fire-analytics",
  [name$n]: "fire-analytics-compat",
  [name$k]: "fire-app-check",
  [name$l]: "fire-app-check-compat",
  [name$j]: "fire-auth",
  [name$i]: "fire-auth-compat",
  [name$h]: "fire-rtdb",
  [name$g]: "fire-rtdb-compat",
  [name$f]: "fire-fn",
  [name$e]: "fire-fn-compat",
  [name$d]: "fire-iid",
  [name$c]: "fire-iid-compat",
  [name$b]: "fire-fcm",
  [name$a]: "fire-fcm-compat",
  [name$9]: "fire-perf",
  [name$8]: "fire-perf-compat",
  [name$7]: "fire-rc",
  [name$6]: "fire-rc-compat",
  [name$5]: "fire-gcs",
  [name$4]: "fire-gcs-compat",
  [name$3]: "fire-fst",
  [name$1]: "fire-fst-compat",
  [name$2]: "fire-vertex",
  "fire-js": "fire-js",
  [name]: "fire-js-all"
};
var _apps = new Map;
var _serverApps = new Map;
var _components = new Map;
function _addComponent(app, component) {
  try {
    app.container.addComponent(component);
  } catch (e) {
    logger.debug(`Component ${component.name} failed to register with FirebaseApp ${app.name}`, e);
  }
}
function _registerComponent(component) {
  const componentName = component.name;
  if (_components.has(componentName)) {
    logger.debug(`There were multiple attempts to register component ${componentName}.`);
    return false;
  }
  _components.set(componentName, component);
  for (const app of _apps.values()) {
    _addComponent(app, component);
  }
  for (const serverApp of _serverApps.values()) {
    _addComponent(serverApp, component);
  }
  return true;
}
function _getProvider(app, name2) {
  const heartbeatController = app.container.getProvider("heartbeat").getImmediate({ optional: true });
  if (heartbeatController) {
    heartbeatController.triggerHeartbeat();
  }
  return app.container.getProvider(name2);
}
var ERRORS = {
  ["no-app"]: "No Firebase App '{$appName}' has been created - " + "call initializeApp() first",
  ["bad-app-name"]: "Illegal App name: '{$appName}'",
  ["duplicate-app"]: "Firebase App named '{$appName}' already exists with different options or config",
  ["app-deleted"]: "Firebase App named '{$appName}' already deleted",
  ["server-app-deleted"]: "Firebase Server App has been deleted",
  ["no-options"]: "Need to provide options, when not being deployed to hosting via source.",
  ["invalid-app-argument"]: "firebase.{$appName}() takes either no argument or a " + "Firebase App instance.",
  ["invalid-log-argument"]: "First argument to `onLog` must be null or a function.",
  ["idb-open"]: "Error thrown when opening IndexedDB. Original error: {$originalErrorMessage}.",
  ["idb-get"]: "Error thrown when reading from IndexedDB. Original error: {$originalErrorMessage}.",
  ["idb-set"]: "Error thrown when writing to IndexedDB. Original error: {$originalErrorMessage}.",
  ["idb-delete"]: "Error thrown when deleting from IndexedDB. Original error: {$originalErrorMessage}.",
  ["finalization-registry-not-supported"]: "FirebaseServerApp deleteOnDeref field defined but the JS runtime does not support FinalizationRegistry.",
  ["invalid-server-app-environment"]: "FirebaseServerApp is not for use in browser environments."
};
var ERROR_FACTORY = new ErrorFactory("app", "Firebase", ERRORS);

class FirebaseAppImpl {
  constructor(options, config, container) {
    this._isDeleted = false;
    this._options = Object.assign({}, options);
    this._config = Object.assign({}, config);
    this._name = config.name;
    this._automaticDataCollectionEnabled = config.automaticDataCollectionEnabled;
    this._container = container;
    this.container.addComponent(new Component3("app", () => this, "PUBLIC"));
  }
  get automaticDataCollectionEnabled() {
    this.checkDestroyed();
    return this._automaticDataCollectionEnabled;
  }
  set automaticDataCollectionEnabled(val) {
    this.checkDestroyed();
    this._automaticDataCollectionEnabled = val;
  }
  get name() {
    this.checkDestroyed();
    return this._name;
  }
  get options() {
    this.checkDestroyed();
    return this._options;
  }
  get config() {
    this.checkDestroyed();
    return this._config;
  }
  get container() {
    return this._container;
  }
  get isDeleted() {
    return this._isDeleted;
  }
  set isDeleted(val) {
    this._isDeleted = val;
  }
  checkDestroyed() {
    if (this.isDeleted) {
      throw ERROR_FACTORY.create("app-deleted", { appName: this._name });
    }
  }
}
var SDK_VERSION = version;
function initializeApp(_options, rawConfig = {}) {
  let options = _options;
  if (typeof rawConfig !== "object") {
    const name3 = rawConfig;
    rawConfig = { name: name3 };
  }
  const config = Object.assign({ name: DEFAULT_ENTRY_NAME2, automaticDataCollectionEnabled: false }, rawConfig);
  const name2 = config.name;
  if (typeof name2 !== "string" || !name2) {
    throw ERROR_FACTORY.create("bad-app-name", {
      appName: String(name2)
    });
  }
  options || (options = getDefaultAppConfig());
  if (!options) {
    throw ERROR_FACTORY.create("no-options");
  }
  const existingApp = _apps.get(name2);
  if (existingApp) {
    if (deepEqual(options, existingApp.options) && deepEqual(config, existingApp.config)) {
      return existingApp;
    } else {
      throw ERROR_FACTORY.create("duplicate-app", { appName: name2 });
    }
  }
  const container = new ComponentContainer2(name2);
  for (const component of _components.values()) {
    container.addComponent(component);
  }
  const newApp = new FirebaseAppImpl(options, config, container);
  _apps.set(name2, newApp);
  return newApp;
}
function getApp(name2 = DEFAULT_ENTRY_NAME2) {
  const app = _apps.get(name2);
  if (!app && name2 === DEFAULT_ENTRY_NAME2 && getDefaultAppConfig()) {
    return initializeApp();
  }
  if (!app) {
    throw ERROR_FACTORY.create("no-app", { appName: name2 });
  }
  return app;
}
function registerVersion(libraryKeyOrName, version2, variant) {
  var _a;
  let library = (_a = PLATFORM_LOG_STRING[libraryKeyOrName]) !== null && _a !== undefined ? _a : libraryKeyOrName;
  if (variant) {
    library += `-${variant}`;
  }
  const libraryMismatch = library.match(/\s|\//);
  const versionMismatch = version2.match(/\s|\//);
  if (libraryMismatch || versionMismatch) {
    const warning = [
      `Unable to register library "${library}" with version "${version2}":`
    ];
    if (libraryMismatch) {
      warning.push(`library name "${library}" contains illegal characters (whitespace or "/")`);
    }
    if (libraryMismatch && versionMismatch) {
      warning.push("and");
    }
    if (versionMismatch) {
      warning.push(`version name "${version2}" contains illegal characters (whitespace or "/")`);
    }
    logger.warn(warning.join(" "));
    return;
  }
  _registerComponent(new Component3(`${library}-version`, () => ({ library, version: version2 }), "VERSION"));
}
var DB_NAME = "firebase-heartbeat-database";
var DB_VERSION = 1;
var STORE_NAME = "firebase-heartbeat-store";
var dbPromise = null;
function getDbPromise() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade: (db, oldVersion) => {
        switch (oldVersion) {
          case 0:
            try {
              db.createObjectStore(STORE_NAME);
            } catch (e) {
              console.warn(e);
            }
        }
      }
    }).catch((e) => {
      throw ERROR_FACTORY.create("idb-open", {
        originalErrorMessage: e.message
      });
    });
  }
  return dbPromise;
}
async function readHeartbeatsFromIndexedDB(app) {
  try {
    const db = await getDbPromise();
    const tx = db.transaction(STORE_NAME);
    const result = await tx.objectStore(STORE_NAME).get(computeKey(app));
    await tx.done;
    return result;
  } catch (e) {
    if (e instanceof FirebaseError) {
      logger.warn(e.message);
    } else {
      const idbGetError = ERROR_FACTORY.create("idb-get", {
        originalErrorMessage: e === null || e === undefined ? undefined : e.message
      });
      logger.warn(idbGetError.message);
    }
  }
}
async function writeHeartbeatsToIndexedDB(app, heartbeatObject) {
  try {
    const db = await getDbPromise();
    const tx = db.transaction(STORE_NAME, "readwrite");
    const objectStore = tx.objectStore(STORE_NAME);
    await objectStore.put(heartbeatObject, computeKey(app));
    await tx.done;
  } catch (e) {
    if (e instanceof FirebaseError) {
      logger.warn(e.message);
    } else {
      const idbGetError = ERROR_FACTORY.create("idb-set", {
        originalErrorMessage: e === null || e === undefined ? undefined : e.message
      });
      logger.warn(idbGetError.message);
    }
  }
}
function computeKey(app) {
  return `${app.name}!${app.options.appId}`;
}
var MAX_HEADER_BYTES = 1024;
var STORED_HEARTBEAT_RETENTION_MAX_MILLIS = 30 * 24 * 60 * 60 * 1000;

class HeartbeatServiceImpl {
  constructor(container) {
    this.container = container;
    this._heartbeatsCache = null;
    const app = this.container.getProvider("app").getImmediate();
    this._storage = new HeartbeatStorageImpl(app);
    this._heartbeatsCachePromise = this._storage.read().then((result) => {
      this._heartbeatsCache = result;
      return result;
    });
  }
  async triggerHeartbeat() {
    var _a, _b, _c;
    try {
      const platformLogger = this.container.getProvider("platform-logger").getImmediate();
      const agent = platformLogger.getPlatformInfoString();
      const date = getUTCDateString();
      console.log("heartbeats", (_a = this._heartbeatsCache) === null || _a === undefined ? undefined : _a.heartbeats);
      if (((_b = this._heartbeatsCache) === null || _b === undefined ? undefined : _b.heartbeats) == null) {
        this._heartbeatsCache = await this._heartbeatsCachePromise;
        if (((_c = this._heartbeatsCache) === null || _c === undefined ? undefined : _c.heartbeats) == null) {
          return;
        }
      }
      if (this._heartbeatsCache.lastSentHeartbeatDate === date || this._heartbeatsCache.heartbeats.some((singleDateHeartbeat) => singleDateHeartbeat.date === date)) {
        return;
      } else {
        this._heartbeatsCache.heartbeats.push({ date, agent });
      }
      this._heartbeatsCache.heartbeats = this._heartbeatsCache.heartbeats.filter((singleDateHeartbeat) => {
        const hbTimestamp = new Date(singleDateHeartbeat.date).valueOf();
        const now = Date.now();
        return now - hbTimestamp <= STORED_HEARTBEAT_RETENTION_MAX_MILLIS;
      });
      return this._storage.overwrite(this._heartbeatsCache);
    } catch (e) {
      logger.warn(e);
    }
  }
  async getHeartbeatsHeader() {
    var _a;
    try {
      if (this._heartbeatsCache === null) {
        await this._heartbeatsCachePromise;
      }
      if (((_a = this._heartbeatsCache) === null || _a === undefined ? undefined : _a.heartbeats) == null || this._heartbeatsCache.heartbeats.length === 0) {
        return "";
      }
      const date = getUTCDateString();
      const { heartbeatsToSend, unsentEntries } = extractHeartbeatsForHeader(this._heartbeatsCache.heartbeats);
      const headerString = base64urlEncodeWithoutPadding(JSON.stringify({ version: 2, heartbeats: heartbeatsToSend }));
      this._heartbeatsCache.lastSentHeartbeatDate = date;
      if (unsentEntries.length > 0) {
        this._heartbeatsCache.heartbeats = unsentEntries;
        await this._storage.overwrite(this._heartbeatsCache);
      } else {
        this._heartbeatsCache.heartbeats = [];
        this._storage.overwrite(this._heartbeatsCache);
      }
      return headerString;
    } catch (e) {
      logger.warn(e);
      return "";
    }
  }
}
function getUTCDateString() {
  const today = new Date;
  return today.toISOString().substring(0, 10);
}
function extractHeartbeatsForHeader(heartbeatsCache, maxSize = MAX_HEADER_BYTES) {
  const heartbeatsToSend = [];
  let unsentEntries = heartbeatsCache.slice();
  for (const singleDateHeartbeat of heartbeatsCache) {
    const heartbeatEntry = heartbeatsToSend.find((hb) => hb.agent === singleDateHeartbeat.agent);
    if (!heartbeatEntry) {
      heartbeatsToSend.push({
        agent: singleDateHeartbeat.agent,
        dates: [singleDateHeartbeat.date]
      });
      if (countBytes(heartbeatsToSend) > maxSize) {
        heartbeatsToSend.pop();
        break;
      }
    } else {
      heartbeatEntry.dates.push(singleDateHeartbeat.date);
      if (countBytes(heartbeatsToSend) > maxSize) {
        heartbeatEntry.dates.pop();
        break;
      }
    }
    unsentEntries = unsentEntries.slice(1);
  }
  return {
    heartbeatsToSend,
    unsentEntries
  };
}

class HeartbeatStorageImpl {
  constructor(app) {
    this.app = app;
    this._canUseIndexedDBPromise = this.runIndexedDBEnvironmentCheck();
  }
  async runIndexedDBEnvironmentCheck() {
    if (!isIndexedDBAvailable()) {
      return false;
    } else {
      return validateIndexedDBOpenable().then(() => true).catch(() => false);
    }
  }
  async read() {
    const canUseIndexedDB = await this._canUseIndexedDBPromise;
    if (!canUseIndexedDB) {
      return { heartbeats: [] };
    } else {
      const idbHeartbeatObject = await readHeartbeatsFromIndexedDB(this.app);
      if (idbHeartbeatObject === null || idbHeartbeatObject === undefined ? undefined : idbHeartbeatObject.heartbeats) {
        return idbHeartbeatObject;
      } else {
        return { heartbeats: [] };
      }
    }
  }
  async overwrite(heartbeatsObject) {
    var _a;
    const canUseIndexedDB = await this._canUseIndexedDBPromise;
    if (!canUseIndexedDB) {
      return;
    } else {
      const existingHeartbeatsObject = await this.read();
      return writeHeartbeatsToIndexedDB(this.app, {
        lastSentHeartbeatDate: (_a = heartbeatsObject.lastSentHeartbeatDate) !== null && _a !== undefined ? _a : existingHeartbeatsObject.lastSentHeartbeatDate,
        heartbeats: heartbeatsObject.heartbeats
      });
    }
  }
  async add(heartbeatsObject) {
    var _a;
    const canUseIndexedDB = await this._canUseIndexedDBPromise;
    if (!canUseIndexedDB) {
      return;
    } else {
      const existingHeartbeatsObject = await this.read();
      return writeHeartbeatsToIndexedDB(this.app, {
        lastSentHeartbeatDate: (_a = heartbeatsObject.lastSentHeartbeatDate) !== null && _a !== undefined ? _a : existingHeartbeatsObject.lastSentHeartbeatDate,
        heartbeats: [
          ...existingHeartbeatsObject.heartbeats,
          ...heartbeatsObject.heartbeats
        ]
      });
    }
  }
}
function countBytes(heartbeatsCache) {
  return base64urlEncodeWithoutPadding(JSON.stringify({ version: 2, heartbeats: heartbeatsCache })).length;
}
function registerCoreComponents(variant) {
  _registerComponent(new Component3("platform-logger", (container) => new PlatformLoggerServiceImpl(container), "PRIVATE"));
  _registerComponent(new Component3("heartbeat", (container) => new HeartbeatServiceImpl(container), "PRIVATE"));
  registerVersion(name$p, version$1, variant);
  registerVersion(name$p, version$1, "esm2017");
  registerVersion("fire-js", "");
}
registerCoreComponents("");

// node_modules/firebase/app/dist/esm/index.esm.js
var name2 = "firebase";
var version2 = "10.13.0";
registerVersion(name2, version2, "app");

// node_modules/@firebase/webchannel-wrapper/dist/bloom-blob/esm/bloom_blob_es2018.js
var commonjsGlobal = typeof globalThis !== "undefined" ? globalThis : typeof window !== "undefined" ? window : typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : {};
var bloom_blob_es2018 = {};
var Integer;
var Md5;
(function() {
  var h;
  function k(f, a) {
    function c() {
    }
    c.prototype = a.prototype;
    f.D = a.prototype;
    f.prototype = new c;
    f.prototype.constructor = f;
    f.C = function(d, e, g) {
      for (var b = Array(arguments.length - 2), r = 2;r < arguments.length; r++)
        b[r - 2] = arguments[r];
      return a.prototype[e].apply(d, b);
    };
  }
  function l() {
    this.blockSize = -1;
  }
  function m() {
    this.blockSize = -1;
    this.blockSize = 64;
    this.g = Array(4);
    this.B = Array(this.blockSize);
    this.o = this.h = 0;
    this.s();
  }
  k(m, l);
  m.prototype.s = function() {
    this.g[0] = 1732584193;
    this.g[1] = 4023233417;
    this.g[2] = 2562383102;
    this.g[3] = 271733878;
    this.o = this.h = 0;
  };
  function n(f, a, c) {
    c || (c = 0);
    var d = Array(16);
    if (typeof a === "string")
      for (var e = 0;16 > e; ++e)
        d[e] = a.charCodeAt(c++) | a.charCodeAt(c++) << 8 | a.charCodeAt(c++) << 16 | a.charCodeAt(c++) << 24;
    else
      for (e = 0;16 > e; ++e)
        d[e] = a[c++] | a[c++] << 8 | a[c++] << 16 | a[c++] << 24;
    a = f.g[0];
    c = f.g[1];
    e = f.g[2];
    var g = f.g[3];
    var b = a + (g ^ c & (e ^ g)) + d[0] + 3614090360 & 4294967295;
    a = c + (b << 7 & 4294967295 | b >>> 25);
    b = g + (e ^ a & (c ^ e)) + d[1] + 3905402710 & 4294967295;
    g = a + (b << 12 & 4294967295 | b >>> 20);
    b = e + (c ^ g & (a ^ c)) + d[2] + 606105819 & 4294967295;
    e = g + (b << 17 & 4294967295 | b >>> 15);
    b = c + (a ^ e & (g ^ a)) + d[3] + 3250441966 & 4294967295;
    c = e + (b << 22 & 4294967295 | b >>> 10);
    b = a + (g ^ c & (e ^ g)) + d[4] + 4118548399 & 4294967295;
    a = c + (b << 7 & 4294967295 | b >>> 25);
    b = g + (e ^ a & (c ^ e)) + d[5] + 1200080426 & 4294967295;
    g = a + (b << 12 & 4294967295 | b >>> 20);
    b = e + (c ^ g & (a ^ c)) + d[6] + 2821735955 & 4294967295;
    e = g + (b << 17 & 4294967295 | b >>> 15);
    b = c + (a ^ e & (g ^ a)) + d[7] + 4249261313 & 4294967295;
    c = e + (b << 22 & 4294967295 | b >>> 10);
    b = a + (g ^ c & (e ^ g)) + d[8] + 1770035416 & 4294967295;
    a = c + (b << 7 & 4294967295 | b >>> 25);
    b = g + (e ^ a & (c ^ e)) + d[9] + 2336552879 & 4294967295;
    g = a + (b << 12 & 4294967295 | b >>> 20);
    b = e + (c ^ g & (a ^ c)) + d[10] + 4294925233 & 4294967295;
    e = g + (b << 17 & 4294967295 | b >>> 15);
    b = c + (a ^ e & (g ^ a)) + d[11] + 2304563134 & 4294967295;
    c = e + (b << 22 & 4294967295 | b >>> 10);
    b = a + (g ^ c & (e ^ g)) + d[12] + 1804603682 & 4294967295;
    a = c + (b << 7 & 4294967295 | b >>> 25);
    b = g + (e ^ a & (c ^ e)) + d[13] + 4254626195 & 4294967295;
    g = a + (b << 12 & 4294967295 | b >>> 20);
    b = e + (c ^ g & (a ^ c)) + d[14] + 2792965006 & 4294967295;
    e = g + (b << 17 & 4294967295 | b >>> 15);
    b = c + (a ^ e & (g ^ a)) + d[15] + 1236535329 & 4294967295;
    c = e + (b << 22 & 4294967295 | b >>> 10);
    b = a + (e ^ g & (c ^ e)) + d[1] + 4129170786 & 4294967295;
    a = c + (b << 5 & 4294967295 | b >>> 27);
    b = g + (c ^ e & (a ^ c)) + d[6] + 3225465664 & 4294967295;
    g = a + (b << 9 & 4294967295 | b >>> 23);
    b = e + (a ^ c & (g ^ a)) + d[11] + 643717713 & 4294967295;
    e = g + (b << 14 & 4294967295 | b >>> 18);
    b = c + (g ^ a & (e ^ g)) + d[0] + 3921069994 & 4294967295;
    c = e + (b << 20 & 4294967295 | b >>> 12);
    b = a + (e ^ g & (c ^ e)) + d[5] + 3593408605 & 4294967295;
    a = c + (b << 5 & 4294967295 | b >>> 27);
    b = g + (c ^ e & (a ^ c)) + d[10] + 38016083 & 4294967295;
    g = a + (b << 9 & 4294967295 | b >>> 23);
    b = e + (a ^ c & (g ^ a)) + d[15] + 3634488961 & 4294967295;
    e = g + (b << 14 & 4294967295 | b >>> 18);
    b = c + (g ^ a & (e ^ g)) + d[4] + 3889429448 & 4294967295;
    c = e + (b << 20 & 4294967295 | b >>> 12);
    b = a + (e ^ g & (c ^ e)) + d[9] + 568446438 & 4294967295;
    a = c + (b << 5 & 4294967295 | b >>> 27);
    b = g + (c ^ e & (a ^ c)) + d[14] + 3275163606 & 4294967295;
    g = a + (b << 9 & 4294967295 | b >>> 23);
    b = e + (a ^ c & (g ^ a)) + d[3] + 4107603335 & 4294967295;
    e = g + (b << 14 & 4294967295 | b >>> 18);
    b = c + (g ^ a & (e ^ g)) + d[8] + 1163531501 & 4294967295;
    c = e + (b << 20 & 4294967295 | b >>> 12);
    b = a + (e ^ g & (c ^ e)) + d[13] + 2850285829 & 4294967295;
    a = c + (b << 5 & 4294967295 | b >>> 27);
    b = g + (c ^ e & (a ^ c)) + d[2] + 4243563512 & 4294967295;
    g = a + (b << 9 & 4294967295 | b >>> 23);
    b = e + (a ^ c & (g ^ a)) + d[7] + 1735328473 & 4294967295;
    e = g + (b << 14 & 4294967295 | b >>> 18);
    b = c + (g ^ a & (e ^ g)) + d[12] + 2368359562 & 4294967295;
    c = e + (b << 20 & 4294967295 | b >>> 12);
    b = a + (c ^ e ^ g) + d[5] + 4294588738 & 4294967295;
    a = c + (b << 4 & 4294967295 | b >>> 28);
    b = g + (a ^ c ^ e) + d[8] + 2272392833 & 4294967295;
    g = a + (b << 11 & 4294967295 | b >>> 21);
    b = e + (g ^ a ^ c) + d[11] + 1839030562 & 4294967295;
    e = g + (b << 16 & 4294967295 | b >>> 16);
    b = c + (e ^ g ^ a) + d[14] + 4259657740 & 4294967295;
    c = e + (b << 23 & 4294967295 | b >>> 9);
    b = a + (c ^ e ^ g) + d[1] + 2763975236 & 4294967295;
    a = c + (b << 4 & 4294967295 | b >>> 28);
    b = g + (a ^ c ^ e) + d[4] + 1272893353 & 4294967295;
    g = a + (b << 11 & 4294967295 | b >>> 21);
    b = e + (g ^ a ^ c) + d[7] + 4139469664 & 4294967295;
    e = g + (b << 16 & 4294967295 | b >>> 16);
    b = c + (e ^ g ^ a) + d[10] + 3200236656 & 4294967295;
    c = e + (b << 23 & 4294967295 | b >>> 9);
    b = a + (c ^ e ^ g) + d[13] + 681279174 & 4294967295;
    a = c + (b << 4 & 4294967295 | b >>> 28);
    b = g + (a ^ c ^ e) + d[0] + 3936430074 & 4294967295;
    g = a + (b << 11 & 4294967295 | b >>> 21);
    b = e + (g ^ a ^ c) + d[3] + 3572445317 & 4294967295;
    e = g + (b << 16 & 4294967295 | b >>> 16);
    b = c + (e ^ g ^ a) + d[6] + 76029189 & 4294967295;
    c = e + (b << 23 & 4294967295 | b >>> 9);
    b = a + (c ^ e ^ g) + d[9] + 3654602809 & 4294967295;
    a = c + (b << 4 & 4294967295 | b >>> 28);
    b = g + (a ^ c ^ e) + d[12] + 3873151461 & 4294967295;
    g = a + (b << 11 & 4294967295 | b >>> 21);
    b = e + (g ^ a ^ c) + d[15] + 530742520 & 4294967295;
    e = g + (b << 16 & 4294967295 | b >>> 16);
    b = c + (e ^ g ^ a) + d[2] + 3299628645 & 4294967295;
    c = e + (b << 23 & 4294967295 | b >>> 9);
    b = a + (e ^ (c | ~g)) + d[0] + 4096336452 & 4294967295;
    a = c + (b << 6 & 4294967295 | b >>> 26);
    b = g + (c ^ (a | ~e)) + d[7] + 1126891415 & 4294967295;
    g = a + (b << 10 & 4294967295 | b >>> 22);
    b = e + (a ^ (g | ~c)) + d[14] + 2878612391 & 4294967295;
    e = g + (b << 15 & 4294967295 | b >>> 17);
    b = c + (g ^ (e | ~a)) + d[5] + 4237533241 & 4294967295;
    c = e + (b << 21 & 4294967295 | b >>> 11);
    b = a + (e ^ (c | ~g)) + d[12] + 1700485571 & 4294967295;
    a = c + (b << 6 & 4294967295 | b >>> 26);
    b = g + (c ^ (a | ~e)) + d[3] + 2399980690 & 4294967295;
    g = a + (b << 10 & 4294967295 | b >>> 22);
    b = e + (a ^ (g | ~c)) + d[10] + 4293915773 & 4294967295;
    e = g + (b << 15 & 4294967295 | b >>> 17);
    b = c + (g ^ (e | ~a)) + d[1] + 2240044497 & 4294967295;
    c = e + (b << 21 & 4294967295 | b >>> 11);
    b = a + (e ^ (c | ~g)) + d[8] + 1873313359 & 4294967295;
    a = c + (b << 6 & 4294967295 | b >>> 26);
    b = g + (c ^ (a | ~e)) + d[15] + 4264355552 & 4294967295;
    g = a + (b << 10 & 4294967295 | b >>> 22);
    b = e + (a ^ (g | ~c)) + d[6] + 2734768916 & 4294967295;
    e = g + (b << 15 & 4294967295 | b >>> 17);
    b = c + (g ^ (e | ~a)) + d[13] + 1309151649 & 4294967295;
    c = e + (b << 21 & 4294967295 | b >>> 11);
    b = a + (e ^ (c | ~g)) + d[4] + 4149444226 & 4294967295;
    a = c + (b << 6 & 4294967295 | b >>> 26);
    b = g + (c ^ (a | ~e)) + d[11] + 3174756917 & 4294967295;
    g = a + (b << 10 & 4294967295 | b >>> 22);
    b = e + (a ^ (g | ~c)) + d[2] + 718787259 & 4294967295;
    e = g + (b << 15 & 4294967295 | b >>> 17);
    b = c + (g ^ (e | ~a)) + d[9] + 3951481745 & 4294967295;
    f.g[0] = f.g[0] + a & 4294967295;
    f.g[1] = f.g[1] + (e + (b << 21 & 4294967295 | b >>> 11)) & 4294967295;
    f.g[2] = f.g[2] + e & 4294967295;
    f.g[3] = f.g[3] + g & 4294967295;
  }
  m.prototype.u = function(f, a) {
    a === undefined && (a = f.length);
    for (var c = a - this.blockSize, d = this.B, e = this.h, g = 0;g < a; ) {
      if (e == 0)
        for (;g <= c; )
          n(this, f, g), g += this.blockSize;
      if (typeof f === "string")
        for (;g < a; ) {
          if (d[e++] = f.charCodeAt(g++), e == this.blockSize) {
            n(this, d);
            e = 0;
            break;
          }
        }
      else
        for (;g < a; )
          if (d[e++] = f[g++], e == this.blockSize) {
            n(this, d);
            e = 0;
            break;
          }
    }
    this.h = e;
    this.o += a;
  };
  m.prototype.v = function() {
    var f = Array((56 > this.h ? this.blockSize : 2 * this.blockSize) - this.h);
    f[0] = 128;
    for (var a = 1;a < f.length - 8; ++a)
      f[a] = 0;
    var c = 8 * this.o;
    for (a = f.length - 8;a < f.length; ++a)
      f[a] = c & 255, c /= 256;
    this.u(f);
    f = Array(16);
    for (a = c = 0;4 > a; ++a)
      for (var d = 0;32 > d; d += 8)
        f[c++] = this.g[a] >>> d & 255;
    return f;
  };
  function p(f, a) {
    var c = q;
    return Object.prototype.hasOwnProperty.call(c, f) ? c[f] : c[f] = a(f);
  }
  function t(f, a) {
    this.h = a;
    for (var c = [], d = true, e = f.length - 1;0 <= e; e--) {
      var g = f[e] | 0;
      d && g == a || (c[e] = g, d = false);
    }
    this.g = c;
  }
  var q = {};
  function u(f) {
    return -128 <= f && 128 > f ? p(f, function(a) {
      return new t([a | 0], 0 > a ? -1 : 0);
    }) : new t([f | 0], 0 > f ? -1 : 0);
  }
  function v(f) {
    if (isNaN(f) || !isFinite(f))
      return w;
    if (0 > f)
      return x(v(-f));
    for (var a = [], c = 1, d = 0;f >= c; d++)
      a[d] = f / c | 0, c *= 4294967296;
    return new t(a, 0);
  }
  function y(f, a) {
    if (f.length == 0)
      throw Error("number format error: empty string");
    a = a || 10;
    if (2 > a || 36 < a)
      throw Error("radix out of range: " + a);
    if (f.charAt(0) == "-")
      return x(y(f.substring(1), a));
    if (0 <= f.indexOf("-"))
      throw Error('number format error: interior "-" character');
    for (var c = v(Math.pow(a, 8)), d = w, e = 0;e < f.length; e += 8) {
      var g = Math.min(8, f.length - e), b = parseInt(f.substring(e, e + g), a);
      8 > g ? (g = v(Math.pow(a, g)), d = d.j(g).add(v(b))) : (d = d.j(c), d = d.add(v(b)));
    }
    return d;
  }
  var w = u(0), z = u(1), A = u(16777216);
  h = t.prototype;
  h.m = function() {
    if (B(this))
      return -x(this).m();
    for (var f = 0, a = 1, c = 0;c < this.g.length; c++) {
      var d = this.i(c);
      f += (0 <= d ? d : 4294967296 + d) * a;
      a *= 4294967296;
    }
    return f;
  };
  h.toString = function(f) {
    f = f || 10;
    if (2 > f || 36 < f)
      throw Error("radix out of range: " + f);
    if (C2(this))
      return "0";
    if (B(this))
      return "-" + x(this).toString(f);
    for (var a = v(Math.pow(f, 6)), c = this, d = "";; ) {
      var e = D(c, a).g;
      c = F(c, e.j(a));
      var g = ((0 < c.g.length ? c.g[0] : c.h) >>> 0).toString(f);
      c = e;
      if (C2(c))
        return g + d;
      for (;6 > g.length; )
        g = "0" + g;
      d = g + d;
    }
  };
  h.i = function(f) {
    return 0 > f ? 0 : f < this.g.length ? this.g[f] : this.h;
  };
  function C2(f) {
    if (f.h != 0)
      return false;
    for (var a = 0;a < f.g.length; a++)
      if (f.g[a] != 0)
        return false;
    return true;
  }
  function B(f) {
    return f.h == -1;
  }
  h.l = function(f) {
    f = F(this, f);
    return B(f) ? -1 : C2(f) ? 0 : 1;
  };
  function x(f) {
    for (var a = f.g.length, c = [], d = 0;d < a; d++)
      c[d] = ~f.g[d];
    return new t(c, ~f.h).add(z);
  }
  h.abs = function() {
    return B(this) ? x(this) : this;
  };
  h.add = function(f) {
    for (var a = Math.max(this.g.length, f.g.length), c = [], d = 0, e = 0;e <= a; e++) {
      var g = d + (this.i(e) & 65535) + (f.i(e) & 65535), b = (g >>> 16) + (this.i(e) >>> 16) + (f.i(e) >>> 16);
      d = b >>> 16;
      g &= 65535;
      b &= 65535;
      c[e] = b << 16 | g;
    }
    return new t(c, c[c.length - 1] & -2147483648 ? -1 : 0);
  };
  function F(f, a) {
    return f.add(x(a));
  }
  h.j = function(f) {
    if (C2(this) || C2(f))
      return w;
    if (B(this))
      return B(f) ? x(this).j(x(f)) : x(x(this).j(f));
    if (B(f))
      return x(this.j(x(f)));
    if (0 > this.l(A) && 0 > f.l(A))
      return v(this.m() * f.m());
    for (var a = this.g.length + f.g.length, c = [], d = 0;d < 2 * a; d++)
      c[d] = 0;
    for (d = 0;d < this.g.length; d++)
      for (var e = 0;e < f.g.length; e++) {
        var g = this.i(d) >>> 16, b = this.i(d) & 65535, r = f.i(e) >>> 16, E = f.i(e) & 65535;
        c[2 * d + 2 * e] += b * E;
        G(c, 2 * d + 2 * e);
        c[2 * d + 2 * e + 1] += g * E;
        G(c, 2 * d + 2 * e + 1);
        c[2 * d + 2 * e + 1] += b * r;
        G(c, 2 * d + 2 * e + 1);
        c[2 * d + 2 * e + 2] += g * r;
        G(c, 2 * d + 2 * e + 2);
      }
    for (d = 0;d < a; d++)
      c[d] = c[2 * d + 1] << 16 | c[2 * d];
    for (d = a;d < 2 * a; d++)
      c[d] = 0;
    return new t(c, 0);
  };
  function G(f, a) {
    for (;(f[a] & 65535) != f[a]; )
      f[a + 1] += f[a] >>> 16, f[a] &= 65535, a++;
  }
  function H(f, a) {
    this.g = f;
    this.h = a;
  }
  function D(f, a) {
    if (C2(a))
      throw Error("division by zero");
    if (C2(f))
      return new H(w, w);
    if (B(f))
      return a = D(x(f), a), new H(x(a.g), x(a.h));
    if (B(a))
      return a = D(f, x(a)), new H(x(a.g), a.h);
    if (30 < f.g.length) {
      if (B(f) || B(a))
        throw Error("slowDivide_ only works with positive integers.");
      for (var c = z, d = a;0 >= d.l(f); )
        c = I(c), d = I(d);
      var e = J(c, 1), g = J(d, 1);
      d = J(d, 2);
      for (c = J(c, 2);!C2(d); ) {
        var b = g.add(d);
        0 >= b.l(f) && (e = e.add(c), g = b);
        d = J(d, 1);
        c = J(c, 1);
      }
      a = F(f, e.j(a));
      return new H(e, a);
    }
    for (e = w;0 <= f.l(a); ) {
      c = Math.max(1, Math.floor(f.m() / a.m()));
      d = Math.ceil(Math.log(c) / Math.LN2);
      d = 48 >= d ? 1 : Math.pow(2, d - 48);
      g = v(c);
      for (b = g.j(a);B(b) || 0 < b.l(f); )
        c -= d, g = v(c), b = g.j(a);
      C2(g) && (g = z);
      e = e.add(g);
      f = F(f, b);
    }
    return new H(e, f);
  }
  h.A = function(f) {
    return D(this, f).h;
  };
  h.and = function(f) {
    for (var a = Math.max(this.g.length, f.g.length), c = [], d = 0;d < a; d++)
      c[d] = this.i(d) & f.i(d);
    return new t(c, this.h & f.h);
  };
  h.or = function(f) {
    for (var a = Math.max(this.g.length, f.g.length), c = [], d = 0;d < a; d++)
      c[d] = this.i(d) | f.i(d);
    return new t(c, this.h | f.h);
  };
  h.xor = function(f) {
    for (var a = Math.max(this.g.length, f.g.length), c = [], d = 0;d < a; d++)
      c[d] = this.i(d) ^ f.i(d);
    return new t(c, this.h ^ f.h);
  };
  function I(f) {
    for (var a = f.g.length + 1, c = [], d = 0;d < a; d++)
      c[d] = f.i(d) << 1 | f.i(d - 1) >>> 31;
    return new t(c, f.h);
  }
  function J(f, a) {
    var c = a >> 5;
    a %= 32;
    for (var d = f.g.length - c, e = [], g = 0;g < d; g++)
      e[g] = 0 < a ? f.i(g + c) >>> a | f.i(g + c + 1) << 32 - a : f.i(g + c);
    return new t(e, f.h);
  }
  m.prototype.digest = m.prototype.v;
  m.prototype.reset = m.prototype.s;
  m.prototype.update = m.prototype.u;
  Md5 = bloom_blob_es2018.Md5 = m;
  t.prototype.add = t.prototype.add;
  t.prototype.multiply = t.prototype.j;
  t.prototype.modulo = t.prototype.A;
  t.prototype.compare = t.prototype.l;
  t.prototype.toNumber = t.prototype.m;
  t.prototype.toString = t.prototype.toString;
  t.prototype.getBits = t.prototype.i;
  t.fromNumber = v;
  t.fromString = y;
  Integer = bloom_blob_es2018.Integer = t;
}).apply(typeof commonjsGlobal !== "undefined" ? commonjsGlobal : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {});

// node_modules/@firebase/webchannel-wrapper/dist/webchannel-blob/esm/webchannel_blob_es2018.js
var commonjsGlobal2 = typeof globalThis !== "undefined" ? globalThis : typeof window !== "undefined" ? window : typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : {};
var webchannel_blob_es2018 = {};
var XhrIo;
var FetchXmlHttpFactory;
var WebChannel;
var EventType;
var ErrorCode;
var Stat;
var Event;
var getStatEventTarget;
var createWebChannelTransport;
(function() {
  var h, aa = typeof Object.defineProperties == "function" ? Object.defineProperty : function(a, b, c) {
    if (a == Array.prototype || a == Object.prototype)
      return a;
    a[b] = c.value;
    return a;
  };
  function ba(a) {
    a = [typeof globalThis == "object" && globalThis, a, typeof window == "object" && window, typeof self == "object" && self, typeof commonjsGlobal2 == "object" && commonjsGlobal2];
    for (var b = 0;b < a.length; ++b) {
      var c = a[b];
      if (c && c.Math == Math)
        return c;
    }
    throw Error("Cannot find global object");
  }
  var ca = ba(this);
  function da(a, b) {
    if (b)
      a: {
        var c = ca;
        a = a.split(".");
        for (var d = 0;d < a.length - 1; d++) {
          var e = a[d];
          if (!(e in c))
            break a;
          c = c[e];
        }
        a = a[a.length - 1];
        d = c[a];
        b = b(d);
        b != d && b != null && aa(c, a, { configurable: true, writable: true, value: b });
      }
  }
  function ea(a, b) {
    a instanceof String && (a += "");
    var c = 0, d = false, e = { next: function() {
      if (!d && c < a.length) {
        var f = c++;
        return { value: b(f, a[f]), done: false };
      }
      d = true;
      return { done: true, value: undefined };
    } };
    e[Symbol.iterator] = function() {
      return e;
    };
    return e;
  }
  da("Array.prototype.values", function(a) {
    return a ? a : function() {
      return ea(this, function(b, c) {
        return c;
      });
    };
  });
  var fa = fa || {}, k = this || self;
  function ha(a) {
    var b = typeof a;
    b = b != "object" ? b : a ? Array.isArray(a) ? "array" : b : "null";
    return b == "array" || b == "object" && typeof a.length == "number";
  }
  function n(a) {
    var b = typeof a;
    return b == "object" && a != null || b == "function";
  }
  function ia(a, b, c) {
    return a.call.apply(a.bind, arguments);
  }
  function ja(a, b, c) {
    if (!a)
      throw Error();
    if (2 < arguments.length) {
      var d = Array.prototype.slice.call(arguments, 2);
      return function() {
        var e = Array.prototype.slice.call(arguments);
        Array.prototype.unshift.apply(e, d);
        return a.apply(b, e);
      };
    }
    return function() {
      return a.apply(b, arguments);
    };
  }
  function p(a, b, c) {
    p = Function.prototype.bind && Function.prototype.bind.toString().indexOf("native code") != -1 ? ia : ja;
    return p.apply(null, arguments);
  }
  function ka(a, b) {
    var c = Array.prototype.slice.call(arguments, 1);
    return function() {
      var d = c.slice();
      d.push.apply(d, arguments);
      return a.apply(this, d);
    };
  }
  function r(a, b) {
    function c() {
    }
    c.prototype = b.prototype;
    a.aa = b.prototype;
    a.prototype = new c;
    a.prototype.constructor = a;
    a.Qb = function(d, e, f) {
      for (var g = Array(arguments.length - 2), m = 2;m < arguments.length; m++)
        g[m - 2] = arguments[m];
      return b.prototype[e].apply(d, g);
    };
  }
  function la(a) {
    const b = a.length;
    if (0 < b) {
      const c = Array(b);
      for (let d = 0;d < b; d++)
        c[d] = a[d];
      return c;
    }
    return [];
  }
  function ma(a, b) {
    for (let c = 1;c < arguments.length; c++) {
      const d = arguments[c];
      if (ha(d)) {
        const e = a.length || 0, f = d.length || 0;
        a.length = e + f;
        for (let g = 0;g < f; g++)
          a[e + g] = d[g];
      } else
        a.push(d);
    }
  }

  class na {
    constructor(a, b) {
      this.i = a;
      this.j = b;
      this.h = 0;
      this.g = null;
    }
    get() {
      let a;
      0 < this.h ? (this.h--, a = this.g, this.g = a.next, a.next = null) : a = this.i();
      return a;
    }
  }
  function t(a) {
    return /^[\s\xa0]*$/.test(a);
  }
  function u() {
    var a = k.navigator;
    return a && (a = a.userAgent) ? a : "";
  }
  function oa(a) {
    oa[" "](a);
    return a;
  }
  oa[" "] = function() {
  };
  var pa = u().indexOf("Gecko") != -1 && !(u().toLowerCase().indexOf("webkit") != -1 && u().indexOf("Edge") == -1) && !(u().indexOf("Trident") != -1 || u().indexOf("MSIE") != -1) && u().indexOf("Edge") == -1;
  function qa(a, b, c) {
    for (const d in a)
      b.call(c, a[d], d, a);
  }
  function ra(a, b) {
    for (const c in a)
      b.call(undefined, a[c], c, a);
  }
  function sa(a) {
    const b = {};
    for (const c in a)
      b[c] = a[c];
    return b;
  }
  const ta = "constructor hasOwnProperty isPrototypeOf propertyIsEnumerable toLocaleString toString valueOf".split(" ");
  function ua(a, b) {
    let c, d;
    for (let e = 1;e < arguments.length; e++) {
      d = arguments[e];
      for (c in d)
        a[c] = d[c];
      for (let f = 0;f < ta.length; f++)
        c = ta[f], Object.prototype.hasOwnProperty.call(d, c) && (a[c] = d[c]);
    }
  }
  function va(a) {
    var b = 1;
    a = a.split(":");
    const c = [];
    for (;0 < b && a.length; )
      c.push(a.shift()), b--;
    a.length && c.push(a.join(":"));
    return c;
  }
  function wa(a) {
    k.setTimeout(() => {
      throw a;
    }, 0);
  }
  function xa() {
    var a = za;
    let b = null;
    a.g && (b = a.g, a.g = a.g.next, a.g || (a.h = null), b.next = null);
    return b;
  }

  class Aa {
    constructor() {
      this.h = this.g = null;
    }
    add(a, b) {
      const c = Ba.get();
      c.set(a, b);
      this.h ? this.h.next = c : this.g = c;
      this.h = c;
    }
  }
  var Ba = new na(() => new Ca, (a) => a.reset());

  class Ca {
    constructor() {
      this.next = this.g = this.h = null;
    }
    set(a, b) {
      this.h = a;
      this.g = b;
      this.next = null;
    }
    reset() {
      this.next = this.g = this.h = null;
    }
  }
  let x, y = false, za = new Aa, Ea = () => {
    const a = k.Promise.resolve(undefined);
    x = () => {
      a.then(Da);
    };
  };
  var Da = () => {
    for (var a;a = xa(); ) {
      try {
        a.h.call(a.g);
      } catch (c) {
        wa(c);
      }
      var b = Ba;
      b.j(a);
      100 > b.h && (b.h++, a.next = b.g, b.g = a);
    }
    y = false;
  };
  function z() {
    this.s = this.s;
    this.C = this.C;
  }
  z.prototype.s = false;
  z.prototype.ma = function() {
    this.s || (this.s = true, this.N());
  };
  z.prototype.N = function() {
    if (this.C)
      for (;this.C.length; )
        this.C.shift()();
  };
  function A(a, b) {
    this.type = a;
    this.g = this.target = b;
    this.defaultPrevented = false;
  }
  A.prototype.h = function() {
    this.defaultPrevented = true;
  };
  var Fa = function() {
    if (!k.addEventListener || !Object.defineProperty)
      return false;
    var a = false, b = Object.defineProperty({}, "passive", { get: function() {
      a = true;
    } });
    try {
      const c = () => {
      };
      k.addEventListener("test", c, b);
      k.removeEventListener("test", c, b);
    } catch (c) {
    }
    return a;
  }();
  function C2(a, b) {
    A.call(this, a ? a.type : "");
    this.relatedTarget = this.g = this.target = null;
    this.button = this.screenY = this.screenX = this.clientY = this.clientX = 0;
    this.key = "";
    this.metaKey = this.shiftKey = this.altKey = this.ctrlKey = false;
    this.state = null;
    this.pointerId = 0;
    this.pointerType = "";
    this.i = null;
    if (a) {
      var c = this.type = a.type, d = a.changedTouches && a.changedTouches.length ? a.changedTouches[0] : null;
      this.target = a.target || a.srcElement;
      this.g = b;
      if (b = a.relatedTarget) {
        if (pa) {
          a: {
            try {
              oa(b.nodeName);
              var e = true;
              break a;
            } catch (f) {
            }
            e = false;
          }
          e || (b = null);
        }
      } else
        c == "mouseover" ? b = a.fromElement : c == "mouseout" && (b = a.toElement);
      this.relatedTarget = b;
      d ? (this.clientX = d.clientX !== undefined ? d.clientX : d.pageX, this.clientY = d.clientY !== undefined ? d.clientY : d.pageY, this.screenX = d.screenX || 0, this.screenY = d.screenY || 0) : (this.clientX = a.clientX !== undefined ? a.clientX : a.pageX, this.clientY = a.clientY !== undefined ? a.clientY : a.pageY, this.screenX = a.screenX || 0, this.screenY = a.screenY || 0);
      this.button = a.button;
      this.key = a.key || "";
      this.ctrlKey = a.ctrlKey;
      this.altKey = a.altKey;
      this.shiftKey = a.shiftKey;
      this.metaKey = a.metaKey;
      this.pointerId = a.pointerId || 0;
      this.pointerType = typeof a.pointerType === "string" ? a.pointerType : Ga[a.pointerType] || "";
      this.state = a.state;
      this.i = a;
      a.defaultPrevented && C2.aa.h.call(this);
    }
  }
  r(C2, A);
  var Ga = { 2: "touch", 3: "pen", 4: "mouse" };
  C2.prototype.h = function() {
    C2.aa.h.call(this);
    var a = this.i;
    a.preventDefault ? a.preventDefault() : a.returnValue = false;
  };
  var D = "closure_listenable_" + (1e6 * Math.random() | 0);
  var Ha = 0;
  function Ia(a, b, c, d, e) {
    this.listener = a;
    this.proxy = null;
    this.src = b;
    this.type = c;
    this.capture = !!d;
    this.ha = e;
    this.key = ++Ha;
    this.da = this.fa = false;
  }
  function Ja(a) {
    a.da = true;
    a.listener = null;
    a.proxy = null;
    a.src = null;
    a.ha = null;
  }
  function Ka(a) {
    this.src = a;
    this.g = {};
    this.h = 0;
  }
  Ka.prototype.add = function(a, b, c, d, e) {
    var f = a.toString();
    a = this.g[f];
    a || (a = this.g[f] = [], this.h++);
    var g = La(a, b, d, e);
    -1 < g ? (b = a[g], c || (b.fa = false)) : (b = new Ia(b, this.src, f, !!d, e), b.fa = c, a.push(b));
    return b;
  };
  function Ma(a, b) {
    var c = b.type;
    if (c in a.g) {
      var d = a.g[c], e = Array.prototype.indexOf.call(d, b, undefined), f;
      (f = 0 <= e) && Array.prototype.splice.call(d, e, 1);
      f && (Ja(b), a.g[c].length == 0 && (delete a.g[c], a.h--));
    }
  }
  function La(a, b, c, d) {
    for (var e = 0;e < a.length; ++e) {
      var f = a[e];
      if (!f.da && f.listener == b && f.capture == !!c && f.ha == d)
        return e;
    }
    return -1;
  }
  var Na = "closure_lm_" + (1e6 * Math.random() | 0), Oa = {};
  function Qa(a, b, c, d, e) {
    if (d && d.once)
      return Ra(a, b, c, d, e);
    if (Array.isArray(b)) {
      for (var f = 0;f < b.length; f++)
        Qa(a, b[f], c, d, e);
      return null;
    }
    c = Sa(c);
    return a && a[D] ? a.K(b, c, n(d) ? !!d.capture : !!d, e) : Ta(a, b, c, false, d, e);
  }
  function Ta(a, b, c, d, e, f) {
    if (!b)
      throw Error("Invalid event type");
    var g = n(e) ? !!e.capture : !!e, m = Ua(a);
    m || (a[Na] = m = new Ka(a));
    c = m.add(b, c, d, g, f);
    if (c.proxy)
      return c;
    d = Va();
    c.proxy = d;
    d.src = a;
    d.listener = c;
    if (a.addEventListener)
      Fa || (e = g), e === undefined && (e = false), a.addEventListener(b.toString(), d, e);
    else if (a.attachEvent)
      a.attachEvent(Wa(b.toString()), d);
    else if (a.addListener && a.removeListener)
      a.addListener(d);
    else
      throw Error("addEventListener and attachEvent are unavailable.");
    return c;
  }
  function Va() {
    function a(c) {
      return b.call(a.src, a.listener, c);
    }
    const b = Xa;
    return a;
  }
  function Ra(a, b, c, d, e) {
    if (Array.isArray(b)) {
      for (var f = 0;f < b.length; f++)
        Ra(a, b[f], c, d, e);
      return null;
    }
    c = Sa(c);
    return a && a[D] ? a.L(b, c, n(d) ? !!d.capture : !!d, e) : Ta(a, b, c, true, d, e);
  }
  function Ya(a, b, c, d, e) {
    if (Array.isArray(b))
      for (var f = 0;f < b.length; f++)
        Ya(a, b[f], c, d, e);
    else
      (d = n(d) ? !!d.capture : !!d, c = Sa(c), a && a[D]) ? (a = a.i, b = String(b).toString(), (b in a.g) && (f = a.g[b], c = La(f, c, d, e), -1 < c && (Ja(f[c]), Array.prototype.splice.call(f, c, 1), f.length == 0 && (delete a.g[b], a.h--)))) : a && (a = Ua(a)) && (b = a.g[b.toString()], a = -1, b && (a = La(b, c, d, e)), (c = -1 < a ? b[a] : null) && Za(c));
  }
  function Za(a) {
    if (typeof a !== "number" && a && !a.da) {
      var b = a.src;
      if (b && b[D])
        Ma(b.i, a);
      else {
        var { type: c, proxy: d } = a;
        b.removeEventListener ? b.removeEventListener(c, d, a.capture) : b.detachEvent ? b.detachEvent(Wa(c), d) : b.addListener && b.removeListener && b.removeListener(d);
        (c = Ua(b)) ? (Ma(c, a), c.h == 0 && (c.src = null, b[Na] = null)) : Ja(a);
      }
    }
  }
  function Wa(a) {
    return a in Oa ? Oa[a] : Oa[a] = "on" + a;
  }
  function Xa(a, b) {
    if (a.da)
      a = true;
    else {
      b = new C2(b, this);
      var c = a.listener, d = a.ha || a.src;
      a.fa && Za(a);
      a = c.call(d, b);
    }
    return a;
  }
  function Ua(a) {
    a = a[Na];
    return a instanceof Ka ? a : null;
  }
  var $a = "__closure_events_fn_" + (1e9 * Math.random() >>> 0);
  function Sa(a) {
    if (typeof a === "function")
      return a;
    a[$a] || (a[$a] = function(b) {
      return a.handleEvent(b);
    });
    return a[$a];
  }
  function E() {
    z.call(this);
    this.i = new Ka(this);
    this.M = this;
    this.F = null;
  }
  r(E, z);
  E.prototype[D] = true;
  E.prototype.removeEventListener = function(a, b, c, d) {
    Ya(this, a, b, c, d);
  };
  function F(a, b) {
    var c, d = a.F;
    if (d)
      for (c = [];d; d = d.F)
        c.push(d);
    a = a.M;
    d = b.type || b;
    if (typeof b === "string")
      b = new A(b, a);
    else if (b instanceof A)
      b.target = b.target || a;
    else {
      var e = b;
      b = new A(d, a);
      ua(b, e);
    }
    e = true;
    if (c)
      for (var f = c.length - 1;0 <= f; f--) {
        var g = b.g = c[f];
        e = ab(g, d, true, b) && e;
      }
    g = b.g = a;
    e = ab(g, d, true, b) && e;
    e = ab(g, d, false, b) && e;
    if (c)
      for (f = 0;f < c.length; f++)
        g = b.g = c[f], e = ab(g, d, false, b) && e;
  }
  E.prototype.N = function() {
    E.aa.N.call(this);
    if (this.i) {
      var a = this.i, c;
      for (c in a.g) {
        for (var d = a.g[c], e = 0;e < d.length; e++)
          Ja(d[e]);
        delete a.g[c];
        a.h--;
      }
    }
    this.F = null;
  };
  E.prototype.K = function(a, b, c, d) {
    return this.i.add(String(a), b, false, c, d);
  };
  E.prototype.L = function(a, b, c, d) {
    return this.i.add(String(a), b, true, c, d);
  };
  function ab(a, b, c, d) {
    b = a.i.g[String(b)];
    if (!b)
      return true;
    b = b.concat();
    for (var e = true, f = 0;f < b.length; ++f) {
      var g = b[f];
      if (g && !g.da && g.capture == c) {
        var m = g.listener, q = g.ha || g.src;
        g.fa && Ma(a.i, g);
        e = m.call(q, d) !== false && e;
      }
    }
    return e && !d.defaultPrevented;
  }
  function bb(a, b, c) {
    if (typeof a === "function")
      c && (a = p(a, c));
    else if (a && typeof a.handleEvent == "function")
      a = p(a.handleEvent, a);
    else
      throw Error("Invalid listener argument");
    return 2147483647 < Number(b) ? -1 : k.setTimeout(a, b || 0);
  }
  function cb(a) {
    a.g = bb(() => {
      a.g = null;
      a.i && (a.i = false, cb(a));
    }, a.l);
    const b = a.h;
    a.h = null;
    a.m.apply(null, b);
  }

  class eb extends z {
    constructor(a, b) {
      super();
      this.m = a;
      this.l = b;
      this.h = null;
      this.i = false;
      this.g = null;
    }
    j(a) {
      this.h = arguments;
      this.g ? this.i = true : cb(this);
    }
    N() {
      super.N();
      this.g && (k.clearTimeout(this.g), this.g = null, this.i = false, this.h = null);
    }
  }
  function G(a) {
    z.call(this);
    this.h = a;
    this.g = {};
  }
  r(G, z);
  var fb = [];
  function gb(a) {
    qa(a.g, function(b, c) {
      this.g.hasOwnProperty(c) && Za(b);
    }, a);
    a.g = {};
  }
  G.prototype.N = function() {
    G.aa.N.call(this);
    gb(this);
  };
  G.prototype.handleEvent = function() {
    throw Error("EventHandler.handleEvent not implemented");
  };
  var hb = k.JSON.stringify;
  var ib = k.JSON.parse;
  var jb = class {
    stringify(a) {
      return k.JSON.stringify(a, undefined);
    }
    parse(a) {
      return k.JSON.parse(a, undefined);
    }
  };
  function kb() {
  }
  kb.prototype.h = null;
  function lb(a) {
    return a.h || (a.h = a.i());
  }
  function mb() {
  }
  var H = { OPEN: "a", kb: "b", Ja: "c", wb: "d" };
  function nb() {
    A.call(this, "d");
  }
  r(nb, A);
  function ob() {
    A.call(this, "c");
  }
  r(ob, A);
  var I = {}, pb = null;
  function qb() {
    return pb = pb || new E;
  }
  I.La = "serverreachability";
  function rb(a) {
    A.call(this, I.La, a);
  }
  r(rb, A);
  function J(a) {
    const b = qb();
    F(b, new rb(b));
  }
  I.STAT_EVENT = "statevent";
  function sb(a, b) {
    A.call(this, I.STAT_EVENT, a);
    this.stat = b;
  }
  r(sb, A);
  function K(a) {
    const b = qb();
    F(b, new sb(b, a));
  }
  I.Ma = "timingevent";
  function tb(a, b) {
    A.call(this, I.Ma, a);
    this.size = b;
  }
  r(tb, A);
  function ub(a, b) {
    if (typeof a !== "function")
      throw Error("Fn must not be null and must be a function");
    return k.setTimeout(function() {
      a();
    }, b);
  }
  function vb() {
    this.g = true;
  }
  vb.prototype.xa = function() {
    this.g = false;
  };
  function wb(a, b, c, d, e, f) {
    a.info(function() {
      if (a.g)
        if (f) {
          var g = "";
          for (var m = f.split("&"), q = 0;q < m.length; q++) {
            var l = m[q].split("=");
            if (1 < l.length) {
              var v = l[0];
              l = l[1];
              var w = v.split("_");
              g = 2 <= w.length && w[1] == "type" ? g + (v + "=" + l + "&") : g + (v + "=redacted&");
            }
          }
        } else
          g = null;
      else
        g = f;
      return "XMLHTTP REQ (" + d + ") [attempt " + e + "]: " + b + `
` + c + `
` + g;
    });
  }
  function xb(a, b, c, d, e, f, g) {
    a.info(function() {
      return "XMLHTTP RESP (" + d + ") [ attempt " + e + "]: " + b + `
` + c + `
` + f + " " + g;
    });
  }
  function L(a, b, c, d) {
    a.info(function() {
      return "XMLHTTP TEXT (" + b + "): " + yb(a, c) + (d ? " " + d : "");
    });
  }
  function zb(a, b) {
    a.info(function() {
      return "TIMEOUT: " + b;
    });
  }
  vb.prototype.info = function() {
  };
  function yb(a, b) {
    if (!a.g)
      return b;
    if (!b)
      return null;
    try {
      var c = JSON.parse(b);
      if (c) {
        for (a = 0;a < c.length; a++)
          if (Array.isArray(c[a])) {
            var d = c[a];
            if (!(2 > d.length)) {
              var e = d[1];
              if (Array.isArray(e) && !(1 > e.length)) {
                var f = e[0];
                if (f != "noop" && f != "stop" && f != "close")
                  for (var g = 1;g < e.length; g++)
                    e[g] = "";
              }
            }
          }
      }
      return hb(c);
    } catch (m) {
      return b;
    }
  }
  var Ab = { NO_ERROR: 0, gb: 1, tb: 2, sb: 3, nb: 4, rb: 5, ub: 6, Ia: 7, TIMEOUT: 8, xb: 9 };
  var Bb = { lb: "complete", Hb: "success", Ja: "error", Ia: "abort", zb: "ready", Ab: "readystatechange", TIMEOUT: "timeout", vb: "incrementaldata", yb: "progress", ob: "downloadprogress", Pb: "uploadprogress" };
  var Cb;
  function Db() {
  }
  r(Db, kb);
  Db.prototype.g = function() {
    return new XMLHttpRequest;
  };
  Db.prototype.i = function() {
    return {};
  };
  Cb = new Db;
  function M(a, b, c, d) {
    this.j = a;
    this.i = b;
    this.l = c;
    this.R = d || 1;
    this.U = new G(this);
    this.I = 45000;
    this.H = null;
    this.o = false;
    this.m = this.A = this.v = this.L = this.F = this.S = this.B = null;
    this.D = [];
    this.g = null;
    this.C = 0;
    this.s = this.u = null;
    this.X = -1;
    this.J = false;
    this.O = 0;
    this.M = null;
    this.W = this.K = this.T = this.P = false;
    this.h = new Eb;
  }
  function Eb() {
    this.i = null;
    this.g = "";
    this.h = false;
  }
  var Fb = {}, Gb = {};
  function Hb(a, b, c) {
    a.L = 1;
    a.v = Ib(N(b));
    a.m = c;
    a.P = true;
    Jb(a, null);
  }
  function Jb(a, b) {
    a.F = Date.now();
    Kb(a);
    a.A = N(a.v);
    var { A: c, R: d } = a;
    Array.isArray(d) || (d = [String(d)]);
    Lb(c.i, "t", d);
    a.C = 0;
    c = a.j.J;
    a.h = new Eb;
    a.g = Mb(a.j, c ? b : null, !a.m);
    0 < a.O && (a.M = new eb(p(a.Y, a, a.g), a.O));
    b = a.U;
    c = a.g;
    d = a.ca;
    var e = "readystatechange";
    Array.isArray(e) || (e && (fb[0] = e.toString()), e = fb);
    for (var f = 0;f < e.length; f++) {
      var g = Qa(c, e[f], d || b.handleEvent, false, b.h || b);
      if (!g)
        break;
      b.g[g.key] = g;
    }
    b = a.H ? sa(a.H) : {};
    a.m ? (a.u || (a.u = "POST"), b["Content-Type"] = "application/x-www-form-urlencoded", a.g.ea(a.A, a.u, a.m, b)) : (a.u = "GET", a.g.ea(a.A, a.u, null, b));
    J();
    wb(a.i, a.u, a.A, a.l, a.R, a.m);
  }
  M.prototype.ca = function(a) {
    a = a.target;
    const b = this.M;
    b && P(a) == 3 ? b.j() : this.Y(a);
  };
  M.prototype.Y = function(a) {
    try {
      if (a == this.g)
        a: {
          const w = P(this.g);
          var b = this.g.Ba();
          const O = this.g.Z();
          if (!(3 > w) && (w != 3 || this.g && (this.h.h || this.g.oa() || Nb(this.g)))) {
            this.J || w != 4 || b == 7 || (b == 8 || 0 >= O ? J(3) : J(2));
            Ob(this);
            var c = this.g.Z();
            this.X = c;
            b:
              if (Pb(this)) {
                var d = Nb(this.g);
                a = "";
                var e = d.length, f = P(this.g) == 4;
                if (!this.h.i) {
                  if (typeof TextDecoder === "undefined") {
                    Q(this);
                    Qb(this);
                    var g = "";
                    break b;
                  }
                  this.h.i = new k.TextDecoder;
                }
                for (b = 0;b < e; b++)
                  this.h.h = true, a += this.h.i.decode(d[b], { stream: !(f && b == e - 1) });
                d.length = 0;
                this.h.g += a;
                this.C = 0;
                g = this.h.g;
              } else
                g = this.g.oa();
            this.o = c == 200;
            xb(this.i, this.u, this.A, this.l, this.R, w, c);
            if (this.o) {
              if (this.T && !this.K) {
                b: {
                  if (this.g) {
                    var m, q = this.g;
                    if ((m = q.g ? q.g.getResponseHeader("X-HTTP-Initial-Response") : null) && !t(m)) {
                      var l = m;
                      break b;
                    }
                  }
                  l = null;
                }
                if (c = l)
                  L(this.i, this.l, c, "Initial handshake response via X-HTTP-Initial-Response"), this.K = true, Rb(this, c);
                else {
                  this.o = false;
                  this.s = 3;
                  K(12);
                  Q(this);
                  Qb(this);
                  break a;
                }
              }
              if (this.P) {
                c = true;
                let B;
                for (;!this.J && this.C < g.length; )
                  if (B = Sb(this, g), B == Gb) {
                    w == 4 && (this.s = 4, K(14), c = false);
                    L(this.i, this.l, null, "[Incomplete Response]");
                    break;
                  } else if (B == Fb) {
                    this.s = 4;
                    K(15);
                    L(this.i, this.l, g, "[Invalid Chunk]");
                    c = false;
                    break;
                  } else
                    L(this.i, this.l, B, null), Rb(this, B);
                Pb(this) && this.C != 0 && (this.h.g = this.h.g.slice(this.C), this.C = 0);
                w != 4 || g.length != 0 || this.h.h || (this.s = 1, K(16), c = false);
                this.o = this.o && c;
                if (!c)
                  L(this.i, this.l, g, "[Invalid Chunked Response]"), Q(this), Qb(this);
                else if (0 < g.length && !this.W) {
                  this.W = true;
                  var v = this.j;
                  v.g == this && v.ba && !v.M && (v.j.info("Great, no buffering proxy detected. Bytes received: " + g.length), Tb(v), v.M = true, K(11));
                }
              } else
                L(this.i, this.l, g, null), Rb(this, g);
              w == 4 && Q(this);
              this.o && !this.J && (w == 4 ? Ub(this.j, this) : (this.o = false, Kb(this)));
            } else
              Vb(this.g), c == 400 && 0 < g.indexOf("Unknown SID") ? (this.s = 3, K(12)) : (this.s = 0, K(13)), Q(this), Qb(this);
          }
        }
    } catch (w) {
    } finally {
    }
  };
  function Pb(a) {
    return a.g ? a.u == "GET" && a.L != 2 && a.j.Ca : false;
  }
  function Sb(a, b) {
    var c = a.C, d = b.indexOf(`
`, c);
    if (d == -1)
      return Gb;
    c = Number(b.substring(c, d));
    if (isNaN(c))
      return Fb;
    d += 1;
    if (d + c > b.length)
      return Gb;
    b = b.slice(d, d + c);
    a.C = d + c;
    return b;
  }
  M.prototype.cancel = function() {
    this.J = true;
    Q(this);
  };
  function Kb(a) {
    a.S = Date.now() + a.I;
    Wb(a, a.I);
  }
  function Wb(a, b) {
    if (a.B != null)
      throw Error("WatchDog timer not null");
    a.B = ub(p(a.ba, a), b);
  }
  function Ob(a) {
    a.B && (k.clearTimeout(a.B), a.B = null);
  }
  M.prototype.ba = function() {
    this.B = null;
    const a = Date.now();
    0 <= a - this.S ? (zb(this.i, this.A), this.L != 2 && (J(), K(17)), Q(this), this.s = 2, Qb(this)) : Wb(this, this.S - a);
  };
  function Qb(a) {
    a.j.G == 0 || a.J || Ub(a.j, a);
  }
  function Q(a) {
    Ob(a);
    var b = a.M;
    b && typeof b.ma == "function" && b.ma();
    a.M = null;
    gb(a.U);
    a.g && (b = a.g, a.g = null, b.abort(), b.ma());
  }
  function Rb(a, b) {
    try {
      var c = a.j;
      if (c.G != 0 && (c.g == a || Xb(c.h, a))) {
        if (!a.K && Xb(c.h, a) && c.G == 3) {
          try {
            var d = c.Da.g.parse(b);
          } catch (l) {
            d = null;
          }
          if (Array.isArray(d) && d.length == 3) {
            var e = d;
            if (e[0] == 0)
              a: {
                if (!c.u) {
                  if (c.g)
                    if (c.g.F + 3000 < a.F)
                      Yb(c), Zb(c);
                    else
                      break a;
                  $b(c);
                  K(18);
                }
              }
            else
              c.za = e[1], 0 < c.za - c.T && 37500 > e[2] && c.F && c.v == 0 && !c.C && (c.C = ub(p(c.Za, c), 6000));
            if (1 >= ac(c.h) && c.ca) {
              try {
                c.ca();
              } catch (l) {
              }
              c.ca = undefined;
            }
          } else
            R(c, 11);
        } else if ((a.K || c.g == a) && Yb(c), !t(b))
          for (e = c.Da.g.parse(b), b = 0;b < e.length; b++) {
            let l = e[b];
            c.T = l[0];
            l = l[1];
            if (c.G == 2)
              if (l[0] == "c") {
                c.K = l[1];
                c.ia = l[2];
                const v = l[3];
                v != null && (c.la = v, c.j.info("VER=" + c.la));
                const w = l[4];
                w != null && (c.Aa = w, c.j.info("SVER=" + c.Aa));
                const O = l[5];
                O != null && typeof O === "number" && 0 < O && (d = 1.5 * O, c.L = d, c.j.info("backChannelRequestTimeoutMs_=" + d));
                d = c;
                const B = a.g;
                if (B) {
                  const ya = B.g ? B.g.getResponseHeader("X-Client-Wire-Protocol") : null;
                  if (ya) {
                    var f = d.h;
                    f.g || ya.indexOf("spdy") == -1 && ya.indexOf("quic") == -1 && ya.indexOf("h2") == -1 || (f.j = f.l, f.g = new Set, f.h && (bc(f, f.h), f.h = null));
                  }
                  if (d.D) {
                    const db = B.g ? B.g.getResponseHeader("X-HTTP-Session-Id") : null;
                    db && (d.ya = db, S2(d.I, d.D, db));
                  }
                }
                c.G = 3;
                c.l && c.l.ua();
                c.ba && (c.R = Date.now() - a.F, c.j.info("Handshake RTT: " + c.R + "ms"));
                d = c;
                var g = a;
                d.qa = cc(d, d.J ? d.ia : null, d.W);
                if (g.K) {
                  dc(d.h, g);
                  var m = g, q = d.L;
                  q && (m.I = q);
                  m.B && (Ob(m), Kb(m));
                  d.g = g;
                } else
                  ec(d);
                0 < c.i.length && fc(c);
              } else
                l[0] != "stop" && l[0] != "close" || R(c, 7);
            else
              c.G == 3 && (l[0] == "stop" || l[0] == "close" ? l[0] == "stop" ? R(c, 7) : gc(c) : l[0] != "noop" && c.l && c.l.ta(l), c.v = 0);
          }
      }
      J(4);
    } catch (l) {
    }
  }
  var hc = class {
    constructor(a, b) {
      this.g = a;
      this.map = b;
    }
  };
  function ic(a) {
    this.l = a || 10;
    k.PerformanceNavigationTiming ? (a = k.performance.getEntriesByType("navigation"), a = 0 < a.length && (a[0].nextHopProtocol == "hq" || a[0].nextHopProtocol == "h2")) : a = !!(k.chrome && k.chrome.loadTimes && k.chrome.loadTimes() && k.chrome.loadTimes().wasFetchedViaSpdy);
    this.j = a ? this.l : 1;
    this.g = null;
    1 < this.j && (this.g = new Set);
    this.h = null;
    this.i = [];
  }
  function jc(a) {
    return a.h ? true : a.g ? a.g.size >= a.j : false;
  }
  function ac(a) {
    return a.h ? 1 : a.g ? a.g.size : 0;
  }
  function Xb(a, b) {
    return a.h ? a.h == b : a.g ? a.g.has(b) : false;
  }
  function bc(a, b) {
    a.g ? a.g.add(b) : a.h = b;
  }
  function dc(a, b) {
    a.h && a.h == b ? a.h = null : a.g && a.g.has(b) && a.g.delete(b);
  }
  ic.prototype.cancel = function() {
    this.i = kc(this);
    if (this.h)
      this.h.cancel(), this.h = null;
    else if (this.g && this.g.size !== 0) {
      for (const a of this.g.values())
        a.cancel();
      this.g.clear();
    }
  };
  function kc(a) {
    if (a.h != null)
      return a.i.concat(a.h.D);
    if (a.g != null && a.g.size !== 0) {
      let b = a.i;
      for (const c of a.g.values())
        b = b.concat(c.D);
      return b;
    }
    return la(a.i);
  }
  function lc(a) {
    if (a.V && typeof a.V == "function")
      return a.V();
    if (typeof Map !== "undefined" && a instanceof Map || typeof Set !== "undefined" && a instanceof Set)
      return Array.from(a.values());
    if (typeof a === "string")
      return a.split("");
    if (ha(a)) {
      for (var b = [], c = a.length, d = 0;d < c; d++)
        b.push(a[d]);
      return b;
    }
    b = [];
    c = 0;
    for (d in a)
      b[c++] = a[d];
    return b;
  }
  function mc(a) {
    if (a.na && typeof a.na == "function")
      return a.na();
    if (!a.V || typeof a.V != "function") {
      if (typeof Map !== "undefined" && a instanceof Map)
        return Array.from(a.keys());
      if (!(typeof Set !== "undefined" && a instanceof Set)) {
        if (ha(a) || typeof a === "string") {
          var b = [];
          a = a.length;
          for (var c = 0;c < a; c++)
            b.push(c);
          return b;
        }
        b = [];
        c = 0;
        for (const d in a)
          b[c++] = d;
        return b;
      }
    }
  }
  function nc(a, b) {
    if (a.forEach && typeof a.forEach == "function")
      a.forEach(b, undefined);
    else if (ha(a) || typeof a === "string")
      Array.prototype.forEach.call(a, b, undefined);
    else
      for (var c = mc(a), d = lc(a), e = d.length, f = 0;f < e; f++)
        b.call(undefined, d[f], c && c[f], a);
  }
  var oc = RegExp("^(?:([^:/?#.]+):)?(?://(?:([^\\\\/?#]*)@)?([^\\\\/?#]*?)(?::([0-9]+))?(?=[\\\\/?#]|$))?([^?#]+)?(?:\\?([^#]*))?(?:#([\\s\\S]*))?$");
  function pc(a, b) {
    if (a) {
      a = a.split("&");
      for (var c = 0;c < a.length; c++) {
        var d = a[c].indexOf("="), e = null;
        if (0 <= d) {
          var f = a[c].substring(0, d);
          e = a[c].substring(d + 1);
        } else
          f = a[c];
        b(f, e ? decodeURIComponent(e.replace(/\+/g, " ")) : "");
      }
    }
  }
  function T(a) {
    this.g = this.o = this.j = "";
    this.s = null;
    this.m = this.l = "";
    this.h = false;
    if (a instanceof T) {
      this.h = a.h;
      qc(this, a.j);
      this.o = a.o;
      this.g = a.g;
      rc(this, a.s);
      this.l = a.l;
      var b = a.i;
      var c = new sc;
      c.i = b.i;
      b.g && (c.g = new Map(b.g), c.h = b.h);
      tc(this, c);
      this.m = a.m;
    } else
      a && (b = String(a).match(oc)) ? (this.h = false, qc(this, b[1] || "", true), this.o = uc(b[2] || ""), this.g = uc(b[3] || "", true), rc(this, b[4]), this.l = uc(b[5] || "", true), tc(this, b[6] || "", true), this.m = uc(b[7] || "")) : (this.h = false, this.i = new sc(null, this.h));
  }
  T.prototype.toString = function() {
    var a = [], b = this.j;
    b && a.push(vc(b, wc, true), ":");
    var c = this.g;
    if (c || b == "file")
      a.push("//"), (b = this.o) && a.push(vc(b, wc, true), "@"), a.push(encodeURIComponent(String(c)).replace(/%25([0-9a-fA-F]{2})/g, "%$1")), c = this.s, c != null && a.push(":", String(c));
    if (c = this.l)
      this.g && c.charAt(0) != "/" && a.push("/"), a.push(vc(c, c.charAt(0) == "/" ? xc : yc, true));
    (c = this.i.toString()) && a.push("?", c);
    (c = this.m) && a.push("#", vc(c, zc));
    return a.join("");
  };
  function N(a) {
    return new T(a);
  }
  function qc(a, b, c) {
    a.j = c ? uc(b, true) : b;
    a.j && (a.j = a.j.replace(/:$/, ""));
  }
  function rc(a, b) {
    if (b) {
      b = Number(b);
      if (isNaN(b) || 0 > b)
        throw Error("Bad port number " + b);
      a.s = b;
    } else
      a.s = null;
  }
  function tc(a, b, c) {
    b instanceof sc ? (a.i = b, Ac(a.i, a.h)) : (c || (b = vc(b, Bc)), a.i = new sc(b, a.h));
  }
  function S2(a, b, c) {
    a.i.set(b, c);
  }
  function Ib(a) {
    S2(a, "zx", Math.floor(2147483648 * Math.random()).toString(36) + Math.abs(Math.floor(2147483648 * Math.random()) ^ Date.now()).toString(36));
    return a;
  }
  function uc(a, b) {
    return a ? b ? decodeURI(a.replace(/%25/g, "%2525")) : decodeURIComponent(a) : "";
  }
  function vc(a, b, c) {
    return typeof a === "string" ? (a = encodeURI(a).replace(b, Cc), c && (a = a.replace(/%25([0-9a-fA-F]{2})/g, "%$1")), a) : null;
  }
  function Cc(a) {
    a = a.charCodeAt(0);
    return "%" + (a >> 4 & 15).toString(16) + (a & 15).toString(16);
  }
  var wc = /[#\/\?@]/g, yc = /[#\?:]/g, xc = /[#\?]/g, Bc = /[#\?@]/g, zc = /#/g;
  function sc(a, b) {
    this.h = this.g = null;
    this.i = a || null;
    this.j = !!b;
  }
  function U(a) {
    a.g || (a.g = new Map, a.h = 0, a.i && pc(a.i, function(b, c) {
      a.add(decodeURIComponent(b.replace(/\+/g, " ")), c);
    }));
  }
  h = sc.prototype;
  h.add = function(a, b) {
    U(this);
    this.i = null;
    a = V(this, a);
    var c = this.g.get(a);
    c || this.g.set(a, c = []);
    c.push(b);
    this.h += 1;
    return this;
  };
  function Dc(a, b) {
    U(a);
    b = V(a, b);
    a.g.has(b) && (a.i = null, a.h -= a.g.get(b).length, a.g.delete(b));
  }
  function Ec(a, b) {
    U(a);
    b = V(a, b);
    return a.g.has(b);
  }
  h.forEach = function(a, b) {
    U(this);
    this.g.forEach(function(c, d) {
      c.forEach(function(e) {
        a.call(b, e, d, this);
      }, this);
    }, this);
  };
  h.na = function() {
    U(this);
    const a = Array.from(this.g.values()), b = Array.from(this.g.keys()), c = [];
    for (let d = 0;d < b.length; d++) {
      const e = a[d];
      for (let f = 0;f < e.length; f++)
        c.push(b[d]);
    }
    return c;
  };
  h.V = function(a) {
    U(this);
    let b = [];
    if (typeof a === "string")
      Ec(this, a) && (b = b.concat(this.g.get(V(this, a))));
    else {
      a = Array.from(this.g.values());
      for (let c = 0;c < a.length; c++)
        b = b.concat(a[c]);
    }
    return b;
  };
  h.set = function(a, b) {
    U(this);
    this.i = null;
    a = V(this, a);
    Ec(this, a) && (this.h -= this.g.get(a).length);
    this.g.set(a, [b]);
    this.h += 1;
    return this;
  };
  h.get = function(a, b) {
    if (!a)
      return b;
    a = this.V(a);
    return 0 < a.length ? String(a[0]) : b;
  };
  function Lb(a, b, c) {
    Dc(a, b);
    0 < c.length && (a.i = null, a.g.set(V(a, b), la(c)), a.h += c.length);
  }
  h.toString = function() {
    if (this.i)
      return this.i;
    if (!this.g)
      return "";
    const a = [], b = Array.from(this.g.keys());
    for (var c = 0;c < b.length; c++) {
      var d = b[c];
      const f = encodeURIComponent(String(d)), g = this.V(d);
      for (d = 0;d < g.length; d++) {
        var e = f;
        g[d] !== "" && (e += "=" + encodeURIComponent(String(g[d])));
        a.push(e);
      }
    }
    return this.i = a.join("&");
  };
  function V(a, b) {
    b = String(b);
    a.j && (b = b.toLowerCase());
    return b;
  }
  function Ac(a, b) {
    b && !a.j && (U(a), a.i = null, a.g.forEach(function(c, d) {
      var e = d.toLowerCase();
      d != e && (Dc(this, d), Lb(this, e, c));
    }, a));
    a.j = b;
  }
  function Fc(a, b) {
    const c = new vb;
    if (k.Image) {
      const d = new Image;
      d.onload = ka(W, c, "TestLoadImage: loaded", true, b, d);
      d.onerror = ka(W, c, "TestLoadImage: error", false, b, d);
      d.onabort = ka(W, c, "TestLoadImage: abort", false, b, d);
      d.ontimeout = ka(W, c, "TestLoadImage: timeout", false, b, d);
      k.setTimeout(function() {
        if (d.ontimeout)
          d.ontimeout();
      }, 1e4);
      d.src = a;
    } else
      b(false);
  }
  function Gc(a, b) {
    const c = new vb, d = new AbortController, e = setTimeout(() => {
      d.abort();
      W(c, "TestPingServer: timeout", false, b);
    }, 1e4);
    fetch(a, { signal: d.signal }).then((f) => {
      clearTimeout(e);
      f.ok ? W(c, "TestPingServer: ok", true, b) : W(c, "TestPingServer: server error", false, b);
    }).catch(() => {
      clearTimeout(e);
      W(c, "TestPingServer: error", false, b);
    });
  }
  function W(a, b, c, d, e) {
    try {
      e && (e.onload = null, e.onerror = null, e.onabort = null, e.ontimeout = null), d(c);
    } catch (f) {
    }
  }
  function Hc() {
    this.g = new jb;
  }
  function Ic(a, b, c) {
    const d = c || "";
    try {
      nc(a, function(e, f) {
        let g = e;
        n(e) && (g = hb(e));
        b.push(d + f + "=" + encodeURIComponent(g));
      });
    } catch (e) {
      throw b.push(d + "type=" + encodeURIComponent("_badmap")), e;
    }
  }
  function Jc(a) {
    this.l = a.Ub || null;
    this.j = a.eb || false;
  }
  r(Jc, kb);
  Jc.prototype.g = function() {
    return new Kc(this.l, this.j);
  };
  Jc.prototype.i = function(a) {
    return function() {
      return a;
    };
  }({});
  function Kc(a, b) {
    E.call(this);
    this.D = a;
    this.o = b;
    this.m = undefined;
    this.status = this.readyState = 0;
    this.responseType = this.responseText = this.response = this.statusText = "";
    this.onreadystatechange = null;
    this.u = new Headers;
    this.h = null;
    this.B = "GET";
    this.A = "";
    this.g = false;
    this.v = this.j = this.l = null;
  }
  r(Kc, E);
  h = Kc.prototype;
  h.open = function(a, b) {
    if (this.readyState != 0)
      throw this.abort(), Error("Error reopening a connection");
    this.B = a;
    this.A = b;
    this.readyState = 1;
    Lc(this);
  };
  h.send = function(a) {
    if (this.readyState != 1)
      throw this.abort(), Error("need to call open() first. ");
    this.g = true;
    const b = { headers: this.u, method: this.B, credentials: this.m, cache: undefined };
    a && (b.body = a);
    (this.D || k).fetch(new Request(this.A, b)).then(this.Sa.bind(this), this.ga.bind(this));
  };
  h.abort = function() {
    this.response = this.responseText = "";
    this.u = new Headers;
    this.status = 0;
    this.j && this.j.cancel("Request was aborted.").catch(() => {
    });
    1 <= this.readyState && this.g && this.readyState != 4 && (this.g = false, Mc(this));
    this.readyState = 0;
  };
  h.Sa = function(a) {
    if (this.g && (this.l = a, this.h || (this.status = this.l.status, this.statusText = this.l.statusText, this.h = a.headers, this.readyState = 2, Lc(this)), this.g && (this.readyState = 3, Lc(this), this.g)))
      if (this.responseType === "arraybuffer")
        a.arrayBuffer().then(this.Qa.bind(this), this.ga.bind(this));
      else if (typeof k.ReadableStream !== "undefined" && "body" in a) {
        this.j = a.body.getReader();
        if (this.o) {
          if (this.responseType)
            throw Error('responseType must be empty for "streamBinaryChunks" mode responses.');
          this.response = [];
        } else
          this.response = this.responseText = "", this.v = new TextDecoder;
        Nc(this);
      } else
        a.text().then(this.Ra.bind(this), this.ga.bind(this));
  };
  function Nc(a) {
    a.j.read().then(a.Pa.bind(a)).catch(a.ga.bind(a));
  }
  h.Pa = function(a) {
    if (this.g) {
      if (this.o && a.value)
        this.response.push(a.value);
      else if (!this.o) {
        var b = a.value ? a.value : new Uint8Array(0);
        if (b = this.v.decode(b, { stream: !a.done }))
          this.response = this.responseText += b;
      }
      a.done ? Mc(this) : Lc(this);
      this.readyState == 3 && Nc(this);
    }
  };
  h.Ra = function(a) {
    this.g && (this.response = this.responseText = a, Mc(this));
  };
  h.Qa = function(a) {
    this.g && (this.response = a, Mc(this));
  };
  h.ga = function() {
    this.g && Mc(this);
  };
  function Mc(a) {
    a.readyState = 4;
    a.l = null;
    a.j = null;
    a.v = null;
    Lc(a);
  }
  h.setRequestHeader = function(a, b) {
    this.u.append(a, b);
  };
  h.getResponseHeader = function(a) {
    return this.h ? this.h.get(a.toLowerCase()) || "" : "";
  };
  h.getAllResponseHeaders = function() {
    if (!this.h)
      return "";
    const a = [], b = this.h.entries();
    for (var c = b.next();!c.done; )
      c = c.value, a.push(c[0] + ": " + c[1]), c = b.next();
    return a.join(`\r
`);
  };
  function Lc(a) {
    a.onreadystatechange && a.onreadystatechange.call(a);
  }
  Object.defineProperty(Kc.prototype, "withCredentials", { get: function() {
    return this.m === "include";
  }, set: function(a) {
    this.m = a ? "include" : "same-origin";
  } });
  function Oc(a) {
    let b = "";
    qa(a, function(c, d) {
      b += d;
      b += ":";
      b += c;
      b += `\r
`;
    });
    return b;
  }
  function Pc(a, b, c) {
    a: {
      for (d in c) {
        var d = false;
        break a;
      }
      d = true;
    }
    d || (c = Oc(c), typeof a === "string" ? c != null && encodeURIComponent(String(c)) : S2(a, b, c));
  }
  function X(a) {
    E.call(this);
    this.headers = new Map;
    this.o = a || null;
    this.h = false;
    this.v = this.g = null;
    this.D = "";
    this.m = 0;
    this.l = "";
    this.j = this.B = this.u = this.A = false;
    this.I = null;
    this.H = "";
    this.J = false;
  }
  r(X, E);
  var Qc = /^https?$/i, Rc = ["POST", "PUT"];
  h = X.prototype;
  h.Ha = function(a) {
    this.J = a;
  };
  h.ea = function(a, b, c, d) {
    if (this.g)
      throw Error("[goog.net.XhrIo] Object is active with another request=" + this.D + "; newUri=" + a);
    b = b ? b.toUpperCase() : "GET";
    this.D = a;
    this.l = "";
    this.m = 0;
    this.A = false;
    this.h = true;
    this.g = this.o ? this.o.g() : Cb.g();
    this.v = this.o ? lb(this.o) : lb(Cb);
    this.g.onreadystatechange = p(this.Ea, this);
    try {
      this.B = true, this.g.open(b, String(a), true), this.B = false;
    } catch (f) {
      Sc(this, f);
      return;
    }
    a = c || "";
    c = new Map(this.headers);
    if (d)
      if (Object.getPrototypeOf(d) === Object.prototype)
        for (var e in d)
          c.set(e, d[e]);
      else if (typeof d.keys === "function" && typeof d.get === "function")
        for (const f of d.keys())
          c.set(f, d.get(f));
      else
        throw Error("Unknown input type for opt_headers: " + String(d));
    d = Array.from(c.keys()).find((f) => f.toLowerCase() == "content-type");
    e = k.FormData && a instanceof k.FormData;
    !(0 <= Array.prototype.indexOf.call(Rc, b, undefined)) || d || e || c.set("Content-Type", "application/x-www-form-urlencoded;charset=utf-8");
    for (const [f, g] of c)
      this.g.setRequestHeader(f, g);
    this.H && (this.g.responseType = this.H);
    "withCredentials" in this.g && this.g.withCredentials !== this.J && (this.g.withCredentials = this.J);
    try {
      Tc(this), this.u = true, this.g.send(a), this.u = false;
    } catch (f) {
      Sc(this, f);
    }
  };
  function Sc(a, b) {
    a.h = false;
    a.g && (a.j = true, a.g.abort(), a.j = false);
    a.l = b;
    a.m = 5;
    Uc(a);
    Vc(a);
  }
  function Uc(a) {
    a.A || (a.A = true, F(a, "complete"), F(a, "error"));
  }
  h.abort = function(a) {
    this.g && this.h && (this.h = false, this.j = true, this.g.abort(), this.j = false, this.m = a || 7, F(this, "complete"), F(this, "abort"), Vc(this));
  };
  h.N = function() {
    this.g && (this.h && (this.h = false, this.j = true, this.g.abort(), this.j = false), Vc(this, true));
    X.aa.N.call(this);
  };
  h.Ea = function() {
    this.s || (this.B || this.u || this.j ? Wc(this) : this.bb());
  };
  h.bb = function() {
    Wc(this);
  };
  function Wc(a) {
    if (a.h && typeof fa != "undefined" && (!a.v[1] || P(a) != 4 || a.Z() != 2)) {
      if (a.u && P(a) == 4)
        bb(a.Ea, 0, a);
      else if (F(a, "readystatechange"), P(a) == 4) {
        a.h = false;
        try {
          const g = a.Z();
          a:
            switch (g) {
              case 200:
              case 201:
              case 202:
              case 204:
              case 206:
              case 304:
              case 1223:
                var b = true;
                break a;
              default:
                b = false;
            }
          var c;
          if (!(c = b)) {
            var d;
            if (d = g === 0) {
              var e = String(a.D).match(oc)[1] || null;
              !e && k.self && k.self.location && (e = k.self.location.protocol.slice(0, -1));
              d = !Qc.test(e ? e.toLowerCase() : "");
            }
            c = d;
          }
          if (c)
            F(a, "complete"), F(a, "success");
          else {
            a.m = 6;
            try {
              var f = 2 < P(a) ? a.g.statusText : "";
            } catch (m) {
              f = "";
            }
            a.l = f + " [" + a.Z() + "]";
            Uc(a);
          }
        } finally {
          Vc(a);
        }
      }
    }
  }
  function Vc(a, b) {
    if (a.g) {
      Tc(a);
      const c = a.g, d = a.v[0] ? () => {
      } : null;
      a.g = null;
      a.v = null;
      b || F(a, "ready");
      try {
        c.onreadystatechange = d;
      } catch (e) {
      }
    }
  }
  function Tc(a) {
    a.I && (k.clearTimeout(a.I), a.I = null);
  }
  h.isActive = function() {
    return !!this.g;
  };
  function P(a) {
    return a.g ? a.g.readyState : 0;
  }
  h.Z = function() {
    try {
      return 2 < P(this) ? this.g.status : -1;
    } catch (a) {
      return -1;
    }
  };
  h.oa = function() {
    try {
      return this.g ? this.g.responseText : "";
    } catch (a) {
      return "";
    }
  };
  h.Oa = function(a) {
    if (this.g) {
      var b = this.g.responseText;
      a && b.indexOf(a) == 0 && (b = b.substring(a.length));
      return ib(b);
    }
  };
  function Nb(a) {
    try {
      if (!a.g)
        return null;
      if ("response" in a.g)
        return a.g.response;
      switch (a.H) {
        case "":
        case "text":
          return a.g.responseText;
        case "arraybuffer":
          if ("mozResponseArrayBuffer" in a.g)
            return a.g.mozResponseArrayBuffer;
      }
      return null;
    } catch (b) {
      return null;
    }
  }
  function Vb(a) {
    const b = {};
    a = (a.g && 2 <= P(a) ? a.g.getAllResponseHeaders() || "" : "").split(`\r
`);
    for (let d = 0;d < a.length; d++) {
      if (t(a[d]))
        continue;
      var c = va(a[d]);
      const e = c[0];
      c = c[1];
      if (typeof c !== "string")
        continue;
      c = c.trim();
      const f = b[e] || [];
      b[e] = f;
      f.push(c);
    }
    ra(b, function(d) {
      return d.join(", ");
    });
  }
  h.Ba = function() {
    return this.m;
  };
  h.Ka = function() {
    return typeof this.l === "string" ? this.l : String(this.l);
  };
  function Xc(a, b, c) {
    return c && c.internalChannelParams ? c.internalChannelParams[a] || b : b;
  }
  function Yc(a) {
    this.Aa = 0;
    this.i = [];
    this.j = new vb;
    this.ia = this.qa = this.I = this.W = this.g = this.ya = this.D = this.H = this.m = this.S = this.o = null;
    this.Ya = this.U = 0;
    this.Va = Xc("failFast", false, a);
    this.F = this.C = this.u = this.s = this.l = null;
    this.X = true;
    this.za = this.T = -1;
    this.Y = this.v = this.B = 0;
    this.Ta = Xc("baseRetryDelayMs", 5000, a);
    this.cb = Xc("retryDelaySeedMs", 1e4, a);
    this.Wa = Xc("forwardChannelMaxRetries", 2, a);
    this.wa = Xc("forwardChannelRequestTimeoutMs", 20000, a);
    this.pa = a && a.xmlHttpFactory || undefined;
    this.Xa = a && a.Tb || undefined;
    this.Ca = a && a.useFetchStreams || false;
    this.L = undefined;
    this.J = a && a.supportsCrossDomainXhr || false;
    this.K = "";
    this.h = new ic(a && a.concurrentRequestLimit);
    this.Da = new Hc;
    this.P = a && a.fastHandshake || false;
    this.O = a && a.encodeInitMessageHeaders || false;
    this.P && this.O && (this.O = false);
    this.Ua = a && a.Rb || false;
    a && a.xa && this.j.xa();
    a && a.forceLongPolling && (this.X = false);
    this.ba = !this.P && this.X && a && a.detectBufferingProxy || false;
    this.ja = undefined;
    a && a.longPollingTimeout && 0 < a.longPollingTimeout && (this.ja = a.longPollingTimeout);
    this.ca = undefined;
    this.R = 0;
    this.M = false;
    this.ka = this.A = null;
  }
  h = Yc.prototype;
  h.la = 8;
  h.G = 1;
  h.connect = function(a, b, c, d) {
    K(0);
    this.W = a;
    this.H = b || {};
    c && d !== undefined && (this.H.OSID = c, this.H.OAID = d);
    this.F = this.X;
    this.I = cc(this, null, this.W);
    fc(this);
  };
  function gc(a) {
    Zc(a);
    if (a.G == 3) {
      var b = a.U++, c = N(a.I);
      S2(c, "SID", a.K);
      S2(c, "RID", b);
      S2(c, "TYPE", "terminate");
      $c(a, c);
      b = new M(a, a.j, b);
      b.L = 2;
      b.v = Ib(N(c));
      c = false;
      if (k.navigator && k.navigator.sendBeacon)
        try {
          c = k.navigator.sendBeacon(b.v.toString(), "");
        } catch (d) {
        }
      !c && k.Image && (new Image().src = b.v, c = true);
      c || (b.g = Mb(b.j, null), b.g.ea(b.v));
      b.F = Date.now();
      Kb(b);
    }
    ad(a);
  }
  function Zb(a) {
    a.g && (Tb(a), a.g.cancel(), a.g = null);
  }
  function Zc(a) {
    Zb(a);
    a.u && (k.clearTimeout(a.u), a.u = null);
    Yb(a);
    a.h.cancel();
    a.s && (typeof a.s === "number" && k.clearTimeout(a.s), a.s = null);
  }
  function fc(a) {
    if (!jc(a.h) && !a.s) {
      a.s = true;
      var b = a.Ga;
      x || Ea();
      y || (x(), y = true);
      za.add(b, a);
      a.B = 0;
    }
  }
  function bd(a, b) {
    if (ac(a.h) >= a.h.j - (a.s ? 1 : 0))
      return false;
    if (a.s)
      return a.i = b.D.concat(a.i), true;
    if (a.G == 1 || a.G == 2 || a.B >= (a.Va ? 0 : a.Wa))
      return false;
    a.s = ub(p(a.Ga, a, b), cd(a, a.B));
    a.B++;
    return true;
  }
  h.Ga = function(a) {
    if (this.s)
      if (this.s = null, this.G == 1) {
        if (!a) {
          this.U = Math.floor(1e5 * Math.random());
          a = this.U++;
          const e = new M(this, this.j, a);
          let f = this.o;
          this.S && (f ? (f = sa(f), ua(f, this.S)) : f = this.S);
          this.m !== null || this.O || (e.H = f, f = null);
          if (this.P)
            a: {
              var b = 0;
              for (var c = 0;c < this.i.length; c++) {
                b: {
                  var d = this.i[c];
                  if ("__data__" in d.map && (d = d.map.__data__, typeof d === "string")) {
                    d = d.length;
                    break b;
                  }
                  d = undefined;
                }
                if (d === undefined)
                  break;
                b += d;
                if (4096 < b) {
                  b = c;
                  break a;
                }
                if (b === 4096 || c === this.i.length - 1) {
                  b = c + 1;
                  break a;
                }
              }
              b = 1000;
            }
          else
            b = 1000;
          b = dd(this, e, b);
          c = N(this.I);
          S2(c, "RID", a);
          S2(c, "CVER", 22);
          this.D && S2(c, "X-HTTP-Session-Id", this.D);
          $c(this, c);
          f && (this.O ? b = "headers=" + encodeURIComponent(String(Oc(f))) + "&" + b : this.m && Pc(c, this.m, f));
          bc(this.h, e);
          this.Ua && S2(c, "TYPE", "init");
          this.P ? (S2(c, "$req", b), S2(c, "SID", "null"), e.T = true, Hb(e, c, null)) : Hb(e, c, b);
          this.G = 2;
        }
      } else
        this.G == 3 && (a ? ed(this, a) : this.i.length == 0 || jc(this.h) || ed(this));
  };
  function ed(a, b) {
    var c;
    b ? c = b.l : c = a.U++;
    const d = N(a.I);
    S2(d, "SID", a.K);
    S2(d, "RID", c);
    S2(d, "AID", a.T);
    $c(a, d);
    a.m && a.o && Pc(d, a.m, a.o);
    c = new M(a, a.j, c, a.B + 1);
    a.m === null && (c.H = a.o);
    b && (a.i = b.D.concat(a.i));
    b = dd(a, c, 1000);
    c.I = Math.round(0.5 * a.wa) + Math.round(0.5 * a.wa * Math.random());
    bc(a.h, c);
    Hb(c, d, b);
  }
  function $c(a, b) {
    a.H && qa(a.H, function(c, d) {
      S2(b, d, c);
    });
    a.l && nc({}, function(c, d) {
      S2(b, d, c);
    });
  }
  function dd(a, b, c) {
    c = Math.min(a.i.length, c);
    var d = a.l ? p(a.l.Na, a.l, a) : null;
    a: {
      var e = a.i;
      let f = -1;
      for (;; ) {
        const g = ["count=" + c];
        f == -1 ? 0 < c ? (f = e[0].g, g.push("ofs=" + f)) : f = 0 : g.push("ofs=" + f);
        let m = true;
        for (let q = 0;q < c; q++) {
          let l = e[q].g;
          const v = e[q].map;
          l -= f;
          if (0 > l)
            f = Math.max(0, e[q].g - 100), m = false;
          else
            try {
              Ic(v, g, "req" + l + "_");
            } catch (w) {
              d && d(v);
            }
        }
        if (m) {
          d = g.join("&");
          break a;
        }
      }
    }
    a = a.i.splice(0, c);
    b.D = a;
    return d;
  }
  function ec(a) {
    if (!a.g && !a.u) {
      a.Y = 1;
      var b = a.Fa;
      x || Ea();
      y || (x(), y = true);
      za.add(b, a);
      a.v = 0;
    }
  }
  function $b(a) {
    if (a.g || a.u || 3 <= a.v)
      return false;
    a.Y++;
    a.u = ub(p(a.Fa, a), cd(a, a.v));
    a.v++;
    return true;
  }
  h.Fa = function() {
    this.u = null;
    fd(this);
    if (this.ba && !(this.M || this.g == null || 0 >= this.R)) {
      var a = 2 * this.R;
      this.j.info("BP detection timer enabled: " + a);
      this.A = ub(p(this.ab, this), a);
    }
  };
  h.ab = function() {
    this.A && (this.A = null, this.j.info("BP detection timeout reached."), this.j.info("Buffering proxy detected and switch to long-polling!"), this.F = false, this.M = true, K(10), Zb(this), fd(this));
  };
  function Tb(a) {
    a.A != null && (k.clearTimeout(a.A), a.A = null);
  }
  function fd(a) {
    a.g = new M(a, a.j, "rpc", a.Y);
    a.m === null && (a.g.H = a.o);
    a.g.O = 0;
    var b = N(a.qa);
    S2(b, "RID", "rpc");
    S2(b, "SID", a.K);
    S2(b, "AID", a.T);
    S2(b, "CI", a.F ? "0" : "1");
    !a.F && a.ja && S2(b, "TO", a.ja);
    S2(b, "TYPE", "xmlhttp");
    $c(a, b);
    a.m && a.o && Pc(b, a.m, a.o);
    a.L && (a.g.I = a.L);
    var c = a.g;
    a = a.ia;
    c.L = 1;
    c.v = Ib(N(b));
    c.m = null;
    c.P = true;
    Jb(c, a);
  }
  h.Za = function() {
    this.C != null && (this.C = null, Zb(this), $b(this), K(19));
  };
  function Yb(a) {
    a.C != null && (k.clearTimeout(a.C), a.C = null);
  }
  function Ub(a, b) {
    var c = null;
    if (a.g == b) {
      Yb(a);
      Tb(a);
      a.g = null;
      var d = 2;
    } else if (Xb(a.h, b))
      c = b.D, dc(a.h, b), d = 1;
    else
      return;
    if (a.G != 0) {
      if (b.o)
        if (d == 1) {
          c = b.m ? b.m.length : 0;
          b = Date.now() - b.F;
          var e = a.B;
          d = qb();
          F(d, new tb(d, c));
          fc(a);
        } else
          ec(a);
      else if (e = b.s, e == 3 || e == 0 && 0 < b.X || !(d == 1 && bd(a, b) || d == 2 && $b(a)))
        switch (c && 0 < c.length && (b = a.h, b.i = b.i.concat(c)), e) {
          case 1:
            R(a, 5);
            break;
          case 4:
            R(a, 10);
            break;
          case 3:
            R(a, 6);
            break;
          default:
            R(a, 2);
        }
    }
  }
  function cd(a, b) {
    let c = a.Ta + Math.floor(Math.random() * a.cb);
    a.isActive() || (c *= 2);
    return c * b;
  }
  function R(a, b) {
    a.j.info("Error code " + b);
    if (b == 2) {
      var c = p(a.fb, a), d = a.Xa;
      const e = !d;
      d = new T(d || "//www.google.com/images/cleardot.gif");
      k.location && k.location.protocol == "http" || qc(d, "https");
      Ib(d);
      e ? Fc(d.toString(), c) : Gc(d.toString(), c);
    } else
      K(2);
    a.G = 0;
    a.l && a.l.sa(b);
    ad(a);
    Zc(a);
  }
  h.fb = function(a) {
    a ? (this.j.info("Successfully pinged google.com"), K(2)) : (this.j.info("Failed to ping google.com"), K(1));
  };
  function ad(a) {
    a.G = 0;
    a.ka = [];
    if (a.l) {
      const b = kc(a.h);
      if (b.length != 0 || a.i.length != 0)
        ma(a.ka, b), ma(a.ka, a.i), a.h.i.length = 0, la(a.i), a.i.length = 0;
      a.l.ra();
    }
  }
  function cc(a, b, c) {
    var d = c instanceof T ? N(c) : new T(c);
    if (d.g != "")
      b && (d.g = b + "." + d.g), rc(d, d.s);
    else {
      var e = k.location;
      d = e.protocol;
      b = b ? b + "." + e.hostname : e.hostname;
      e = +e.port;
      var f = new T(null);
      d && qc(f, d);
      b && (f.g = b);
      e && rc(f, e);
      c && (f.l = c);
      d = f;
    }
    c = a.D;
    b = a.ya;
    c && b && S2(d, c, b);
    S2(d, "VER", a.la);
    $c(a, d);
    return d;
  }
  function Mb(a, b, c) {
    if (b && !a.J)
      throw Error("Can't create secondary domain capable XhrIo object.");
    b = a.Ca && !a.pa ? new X(new Jc({ eb: c })) : new X(a.pa);
    b.Ha(a.J);
    return b;
  }
  h.isActive = function() {
    return !!this.l && this.l.isActive(this);
  };
  function gd() {
  }
  h = gd.prototype;
  h.ua = function() {
  };
  h.ta = function() {
  };
  h.sa = function() {
  };
  h.ra = function() {
  };
  h.isActive = function() {
    return true;
  };
  h.Na = function() {
  };
  function hd() {
  }
  hd.prototype.g = function(a, b) {
    return new Y(a, b);
  };
  function Y(a, b) {
    E.call(this);
    this.g = new Yc(b);
    this.l = a;
    this.h = b && b.messageUrlParams || null;
    a = b && b.messageHeaders || null;
    b && b.clientProtocolHeaderRequired && (a ? a["X-Client-Protocol"] = "webchannel" : a = { "X-Client-Protocol": "webchannel" });
    this.g.o = a;
    a = b && b.initMessageHeaders || null;
    b && b.messageContentType && (a ? a["X-WebChannel-Content-Type"] = b.messageContentType : a = { "X-WebChannel-Content-Type": b.messageContentType });
    b && b.va && (a ? a["X-WebChannel-Client-Profile"] = b.va : a = { "X-WebChannel-Client-Profile": b.va });
    this.g.S = a;
    (a = b && b.Sb) && !t(a) && (this.g.m = a);
    this.v = b && b.supportsCrossDomainXhr || false;
    this.u = b && b.sendRawJson || false;
    (b = b && b.httpSessionIdParam) && !t(b) && (this.g.D = b, a = this.h, a !== null && (b in a) && (a = this.h, (b in a) && delete a[b]));
    this.j = new Z(this);
  }
  r(Y, E);
  Y.prototype.m = function() {
    this.g.l = this.j;
    this.v && (this.g.J = true);
    this.g.connect(this.l, this.h || undefined);
  };
  Y.prototype.close = function() {
    gc(this.g);
  };
  Y.prototype.o = function(a) {
    var b = this.g;
    if (typeof a === "string") {
      var c = {};
      c.__data__ = a;
      a = c;
    } else
      this.u && (c = {}, c.__data__ = hb(a), a = c);
    b.i.push(new hc(b.Ya++, a));
    b.G == 3 && fc(b);
  };
  Y.prototype.N = function() {
    this.g.l = null;
    delete this.j;
    gc(this.g);
    delete this.g;
    Y.aa.N.call(this);
  };
  function id(a) {
    nb.call(this);
    a.__headers__ && (this.headers = a.__headers__, this.statusCode = a.__status__, delete a.__headers__, delete a.__status__);
    var b = a.__sm__;
    if (b) {
      a: {
        for (const c in b) {
          a = c;
          break a;
        }
        a = undefined;
      }
      if (this.i = a)
        a = this.i, b = b !== null && a in b ? b[a] : undefined;
      this.data = b;
    } else
      this.data = a;
  }
  r(id, nb);
  function jd() {
    ob.call(this);
    this.status = 1;
  }
  r(jd, ob);
  function Z(a) {
    this.g = a;
  }
  r(Z, gd);
  Z.prototype.ua = function() {
    F(this.g, "a");
  };
  Z.prototype.ta = function(a) {
    F(this.g, new id(a));
  };
  Z.prototype.sa = function(a) {
    F(this.g, new jd);
  };
  Z.prototype.ra = function() {
    F(this.g, "b");
  };
  hd.prototype.createWebChannel = hd.prototype.g;
  Y.prototype.send = Y.prototype.o;
  Y.prototype.open = Y.prototype.m;
  Y.prototype.close = Y.prototype.close;
  createWebChannelTransport = webchannel_blob_es2018.createWebChannelTransport = function() {
    return new hd;
  };
  getStatEventTarget = webchannel_blob_es2018.getStatEventTarget = function() {
    return qb();
  };
  Event = webchannel_blob_es2018.Event = I;
  Stat = webchannel_blob_es2018.Stat = { mb: 0, pb: 1, qb: 2, Jb: 3, Ob: 4, Lb: 5, Mb: 6, Kb: 7, Ib: 8, Nb: 9, PROXY: 10, NOPROXY: 11, Gb: 12, Cb: 13, Db: 14, Bb: 15, Eb: 16, Fb: 17, ib: 18, hb: 19, jb: 20 };
  Ab.NO_ERROR = 0;
  Ab.TIMEOUT = 8;
  Ab.HTTP_ERROR = 6;
  ErrorCode = webchannel_blob_es2018.ErrorCode = Ab;
  Bb.COMPLETE = "complete";
  EventType = webchannel_blob_es2018.EventType = Bb;
  mb.EventType = H;
  H.OPEN = "a";
  H.CLOSE = "b";
  H.ERROR = "c";
  H.MESSAGE = "d";
  E.prototype.listen = E.prototype.K;
  WebChannel = webchannel_blob_es2018.WebChannel = mb;
  FetchXmlHttpFactory = webchannel_blob_es2018.FetchXmlHttpFactory = Jc;
  X.prototype.listenOnce = X.prototype.L;
  X.prototype.getLastError = X.prototype.Ka;
  X.prototype.getLastErrorCode = X.prototype.Ba;
  X.prototype.getStatus = X.prototype.Z;
  X.prototype.getResponseJson = X.prototype.Oa;
  X.prototype.getResponseText = X.prototype.oa;
  X.prototype.send = X.prototype.ea;
  X.prototype.setWithCredentials = X.prototype.Ha;
  XhrIo = webchannel_blob_es2018.XhrIo = X;
}).apply(typeof commonjsGlobal2 !== "undefined" ? commonjsGlobal2 : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {});

// node_modules/@firebase/firestore/dist/index.esm2017.js
var S2 = "@firebase/firestore";

class User {
  constructor(e) {
    this.uid = e;
  }
  isAuthenticated() {
    return this.uid != null;
  }
  toKey() {
    return this.isAuthenticated() ? "uid:" + this.uid : "anonymous-user";
  }
  isEqual(e) {
    return e.uid === this.uid;
  }
}
User.UNAUTHENTICATED = new User(null), User.GOOGLE_CREDENTIALS = new User("google-credentials-uid"), User.FIRST_PARTY = new User("first-party-uid"), User.MOCK_USER = new User("mock-user");
var b = "10.13.0";
var D = new Logger("@firebase/firestore");
function __PRIVATE_getLogLevel() {
  return D.logLevel;
}
function __PRIVATE_logDebug(e, ...t) {
  if (D.logLevel <= LogLevel.DEBUG) {
    const n = t.map(__PRIVATE_argToString);
    D.debug(`Firestore (${b}): ${e}`, ...n);
  }
}
function __PRIVATE_logError(e, ...t) {
  if (D.logLevel <= LogLevel.ERROR) {
    const n = t.map(__PRIVATE_argToString);
    D.error(`Firestore (${b}): ${e}`, ...n);
  }
}
function __PRIVATE_logWarn(e, ...t) {
  if (D.logLevel <= LogLevel.WARN) {
    const n = t.map(__PRIVATE_argToString);
    D.warn(`Firestore (${b}): ${e}`, ...n);
  }
}
function __PRIVATE_argToString(e) {
  if (typeof e == "string")
    return e;
  try {
    return function __PRIVATE_formatJSON(e2) {
      return JSON.stringify(e2);
    }(e);
  } catch (t) {
    return e;
  }
}
function fail(e = "Unexpected state") {
  const t = `FIRESTORE (${b}) INTERNAL ASSERTION FAILED: ` + e;
  throw __PRIVATE_logError(t), new Error(t);
}
function __PRIVATE_hardAssert(e, t) {
  e || fail();
}
function __PRIVATE_debugCast(e, t) {
  return e;
}
var v = {
  OK: "ok",
  CANCELLED: "cancelled",
  UNKNOWN: "unknown",
  INVALID_ARGUMENT: "invalid-argument",
  DEADLINE_EXCEEDED: "deadline-exceeded",
  NOT_FOUND: "not-found",
  ALREADY_EXISTS: "already-exists",
  PERMISSION_DENIED: "permission-denied",
  UNAUTHENTICATED: "unauthenticated",
  RESOURCE_EXHAUSTED: "resource-exhausted",
  FAILED_PRECONDITION: "failed-precondition",
  ABORTED: "aborted",
  OUT_OF_RANGE: "out-of-range",
  UNIMPLEMENTED: "unimplemented",
  INTERNAL: "internal",
  UNAVAILABLE: "unavailable",
  DATA_LOSS: "data-loss"
};

class FirestoreError extends FirebaseError {
  constructor(e, t) {
    super(e, t), this.code = e, this.message = t, this.toString = () => `${this.name}: [code=${this.code}]: ${this.message}`;
  }
}

class __PRIVATE_Deferred {
  constructor() {
    this.promise = new Promise((e, t) => {
      this.resolve = e, this.reject = t;
    });
  }
}

class __PRIVATE_OAuthToken {
  constructor(e, t) {
    this.user = t, this.type = "OAuth", this.headers = new Map, this.headers.set("Authorization", `Bearer ${e}`);
  }
}

class __PRIVATE_EmptyAuthCredentialsProvider {
  getToken() {
    return Promise.resolve(null);
  }
  invalidateToken() {
  }
  start(e, t) {
    e.enqueueRetryable(() => t(User.UNAUTHENTICATED));
  }
  shutdown() {
  }
}

class __PRIVATE_EmulatorAuthCredentialsProvider {
  constructor(e) {
    this.token = e, this.changeListener = null;
  }
  getToken() {
    return Promise.resolve(this.token);
  }
  invalidateToken() {
  }
  start(e, t) {
    this.changeListener = t, e.enqueueRetryable(() => t(this.token.user));
  }
  shutdown() {
    this.changeListener = null;
  }
}

class __PRIVATE_FirebaseAuthCredentialsProvider {
  constructor(e) {
    this.t = e, this.currentUser = User.UNAUTHENTICATED, this.i = 0, this.forceRefresh = false, this.auth = null;
  }
  start(e, t) {
    let n = this.i;
    const __PRIVATE_guardedChangeListener = (e2) => this.i !== n ? (n = this.i, t(e2)) : Promise.resolve();
    let r = new __PRIVATE_Deferred;
    this.o = () => {
      this.i++, this.currentUser = this.u(), r.resolve(), r = new __PRIVATE_Deferred, e.enqueueRetryable(() => __PRIVATE_guardedChangeListener(this.currentUser));
    };
    const __PRIVATE_awaitNextToken = () => {
      const t2 = r;
      e.enqueueRetryable(async () => {
        await t2.promise, await __PRIVATE_guardedChangeListener(this.currentUser);
      });
    }, __PRIVATE_registerAuth = (e2) => {
      __PRIVATE_logDebug("FirebaseAuthCredentialsProvider", "Auth detected"), this.auth = e2, this.auth.addAuthTokenListener(this.o), __PRIVATE_awaitNextToken();
    };
    this.t.onInit((e2) => __PRIVATE_registerAuth(e2)), setTimeout(() => {
      if (!this.auth) {
        const e2 = this.t.getImmediate({
          optional: true
        });
        e2 ? __PRIVATE_registerAuth(e2) : (__PRIVATE_logDebug("FirebaseAuthCredentialsProvider", "Auth not yet detected"), r.resolve(), r = new __PRIVATE_Deferred);
      }
    }, 0), __PRIVATE_awaitNextToken();
  }
  getToken() {
    const e = this.i, t = this.forceRefresh;
    return this.forceRefresh = false, this.auth ? this.auth.getToken(t).then((t2) => this.i !== e ? (__PRIVATE_logDebug("FirebaseAuthCredentialsProvider", "getToken aborted due to token change."), this.getToken()) : t2 ? (__PRIVATE_hardAssert(typeof t2.accessToken == "string"), new __PRIVATE_OAuthToken(t2.accessToken, this.currentUser)) : null) : Promise.resolve(null);
  }
  invalidateToken() {
    this.forceRefresh = true;
  }
  shutdown() {
    this.auth && this.auth.removeAuthTokenListener(this.o);
  }
  u() {
    const e = this.auth && this.auth.getUid();
    return __PRIVATE_hardAssert(e === null || typeof e == "string"), new User(e);
  }
}

class __PRIVATE_FirstPartyToken {
  constructor(e, t, n) {
    this.l = e, this.h = t, this.P = n, this.type = "FirstParty", this.user = User.FIRST_PARTY, this.I = new Map;
  }
  T() {
    return this.P ? this.P() : null;
  }
  get headers() {
    this.I.set("X-Goog-AuthUser", this.l);
    const e = this.T();
    return e && this.I.set("Authorization", e), this.h && this.I.set("X-Goog-Iam-Authorization-Token", this.h), this.I;
  }
}

class __PRIVATE_FirstPartyAuthCredentialsProvider {
  constructor(e, t, n) {
    this.l = e, this.h = t, this.P = n;
  }
  getToken() {
    return Promise.resolve(new __PRIVATE_FirstPartyToken(this.l, this.h, this.P));
  }
  start(e, t) {
    e.enqueueRetryable(() => t(User.FIRST_PARTY));
  }
  shutdown() {
  }
  invalidateToken() {
  }
}

class AppCheckToken {
  constructor(e) {
    this.value = e, this.type = "AppCheck", this.headers = new Map, e && e.length > 0 && this.headers.set("x-firebase-appcheck", this.value);
  }
}

class __PRIVATE_FirebaseAppCheckTokenProvider {
  constructor(e) {
    this.A = e, this.forceRefresh = false, this.appCheck = null, this.R = null;
  }
  start(e, t) {
    const onTokenChanged = (e2) => {
      e2.error != null && __PRIVATE_logDebug("FirebaseAppCheckTokenProvider", `Error getting App Check token; using placeholder token instead. Error: ${e2.error.message}`);
      const n = e2.token !== this.R;
      return this.R = e2.token, __PRIVATE_logDebug("FirebaseAppCheckTokenProvider", `Received ${n ? "new" : "existing"} token.`), n ? t(e2.token) : Promise.resolve();
    };
    this.o = (t2) => {
      e.enqueueRetryable(() => onTokenChanged(t2));
    };
    const __PRIVATE_registerAppCheck = (e2) => {
      __PRIVATE_logDebug("FirebaseAppCheckTokenProvider", "AppCheck detected"), this.appCheck = e2, this.appCheck.addTokenListener(this.o);
    };
    this.A.onInit((e2) => __PRIVATE_registerAppCheck(e2)), setTimeout(() => {
      if (!this.appCheck) {
        const e2 = this.A.getImmediate({
          optional: true
        });
        e2 ? __PRIVATE_registerAppCheck(e2) : __PRIVATE_logDebug("FirebaseAppCheckTokenProvider", "AppCheck not yet detected");
      }
    }, 0);
  }
  getToken() {
    const e = this.forceRefresh;
    return this.forceRefresh = false, this.appCheck ? this.appCheck.getToken(e).then((e2) => e2 ? (__PRIVATE_hardAssert(typeof e2.token == "string"), this.R = e2.token, new AppCheckToken(e2.token)) : null) : Promise.resolve(null);
  }
  invalidateToken() {
    this.forceRefresh = true;
  }
  shutdown() {
    this.appCheck && this.appCheck.removeTokenListener(this.o);
  }
}
function __PRIVATE_randomBytes(e) {
  const t = typeof self != "undefined" && (self.crypto || self.msCrypto), n = new Uint8Array(e);
  if (t && typeof t.getRandomValues == "function")
    t.getRandomValues(n);
  else
    for (let t2 = 0;t2 < e; t2++)
      n[t2] = Math.floor(256 * Math.random());
  return n;
}

class __PRIVATE_AutoId {
  static newId() {
    const e = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789", t = Math.floor(256 / e.length) * e.length;
    let n = "";
    for (;n.length < 20; ) {
      const r = __PRIVATE_randomBytes(40);
      for (let i = 0;i < r.length; ++i)
        n.length < 20 && r[i] < t && (n += e.charAt(r[i] % e.length));
    }
    return n;
  }
}
function __PRIVATE_primitiveComparator(e, t) {
  return e < t ? -1 : e > t ? 1 : 0;
}
function __PRIVATE_arrayEquals(e, t, n) {
  return e.length === t.length && e.every((e2, r) => n(e2, t[r]));
}
class Timestamp {
  constructor(e, t) {
    if (this.seconds = e, this.nanoseconds = t, t < 0)
      throw new FirestoreError(v.INVALID_ARGUMENT, "Timestamp nanoseconds out of range: " + t);
    if (t >= 1e9)
      throw new FirestoreError(v.INVALID_ARGUMENT, "Timestamp nanoseconds out of range: " + t);
    if (e < -62135596800)
      throw new FirestoreError(v.INVALID_ARGUMENT, "Timestamp seconds out of range: " + e);
    if (e >= 253402300800)
      throw new FirestoreError(v.INVALID_ARGUMENT, "Timestamp seconds out of range: " + e);
  }
  static now() {
    return Timestamp.fromMillis(Date.now());
  }
  static fromDate(e) {
    return Timestamp.fromMillis(e.getTime());
  }
  static fromMillis(e) {
    const t = Math.floor(e / 1000), n = Math.floor(1e6 * (e - 1000 * t));
    return new Timestamp(t, n);
  }
  toDate() {
    return new Date(this.toMillis());
  }
  toMillis() {
    return 1000 * this.seconds + this.nanoseconds / 1e6;
  }
  _compareTo(e) {
    return this.seconds === e.seconds ? __PRIVATE_primitiveComparator(this.nanoseconds, e.nanoseconds) : __PRIVATE_primitiveComparator(this.seconds, e.seconds);
  }
  isEqual(e) {
    return e.seconds === this.seconds && e.nanoseconds === this.nanoseconds;
  }
  toString() {
    return "Timestamp(seconds=" + this.seconds + ", nanoseconds=" + this.nanoseconds + ")";
  }
  toJSON() {
    return {
      seconds: this.seconds,
      nanoseconds: this.nanoseconds
    };
  }
  valueOf() {
    const e = this.seconds - -62135596800;
    return String(e).padStart(12, "0") + "." + String(this.nanoseconds).padStart(9, "0");
  }
}

class SnapshotVersion {
  constructor(e) {
    this.timestamp = e;
  }
  static fromTimestamp(e) {
    return new SnapshotVersion(e);
  }
  static min() {
    return new SnapshotVersion(new Timestamp(0, 0));
  }
  static max() {
    return new SnapshotVersion(new Timestamp(253402300799, 999999999));
  }
  compareTo(e) {
    return this.timestamp._compareTo(e.timestamp);
  }
  isEqual(e) {
    return this.timestamp.isEqual(e.timestamp);
  }
  toMicroseconds() {
    return 1e6 * this.timestamp.seconds + this.timestamp.nanoseconds / 1000;
  }
  toString() {
    return "SnapshotVersion(" + this.timestamp.toString() + ")";
  }
  toTimestamp() {
    return this.timestamp;
  }
}

class BasePath {
  constructor(e, t, n) {
    t === undefined ? t = 0 : t > e.length && fail(), n === undefined ? n = e.length - t : n > e.length - t && fail(), this.segments = e, this.offset = t, this.len = n;
  }
  get length() {
    return this.len;
  }
  isEqual(e) {
    return BasePath.comparator(this, e) === 0;
  }
  child(e) {
    const t = this.segments.slice(this.offset, this.limit());
    return e instanceof BasePath ? e.forEach((e2) => {
      t.push(e2);
    }) : t.push(e), this.construct(t);
  }
  limit() {
    return this.offset + this.length;
  }
  popFirst(e) {
    return e = e === undefined ? 1 : e, this.construct(this.segments, this.offset + e, this.length - e);
  }
  popLast() {
    return this.construct(this.segments, this.offset, this.length - 1);
  }
  firstSegment() {
    return this.segments[this.offset];
  }
  lastSegment() {
    return this.get(this.length - 1);
  }
  get(e) {
    return this.segments[this.offset + e];
  }
  isEmpty() {
    return this.length === 0;
  }
  isPrefixOf(e) {
    if (e.length < this.length)
      return false;
    for (let t = 0;t < this.length; t++)
      if (this.get(t) !== e.get(t))
        return false;
    return true;
  }
  isImmediateParentOf(e) {
    if (this.length + 1 !== e.length)
      return false;
    for (let t = 0;t < this.length; t++)
      if (this.get(t) !== e.get(t))
        return false;
    return true;
  }
  forEach(e) {
    for (let t = this.offset, n = this.limit();t < n; t++)
      e(this.segments[t]);
  }
  toArray() {
    return this.segments.slice(this.offset, this.limit());
  }
  static comparator(e, t) {
    const n = Math.min(e.length, t.length);
    for (let r = 0;r < n; r++) {
      const n2 = e.get(r), i = t.get(r);
      if (n2 < i)
        return -1;
      if (n2 > i)
        return 1;
    }
    return e.length < t.length ? -1 : e.length > t.length ? 1 : 0;
  }
}

class ResourcePath extends BasePath {
  construct(e, t, n) {
    return new ResourcePath(e, t, n);
  }
  canonicalString() {
    return this.toArray().join("/");
  }
  toString() {
    return this.canonicalString();
  }
  toUriEncodedString() {
    return this.toArray().map(encodeURIComponent).join("/");
  }
  static fromString(...e) {
    const t = [];
    for (const n of e) {
      if (n.indexOf("//") >= 0)
        throw new FirestoreError(v.INVALID_ARGUMENT, `Invalid segment (${n}). Paths must not contain // in them.`);
      t.push(...n.split("/").filter((e2) => e2.length > 0));
    }
    return new ResourcePath(t);
  }
  static emptyPath() {
    return new ResourcePath([]);
  }
}
var C2 = /^[_a-zA-Z][_a-zA-Z0-9]*$/;

class FieldPath$1 extends BasePath {
  construct(e, t, n) {
    return new FieldPath$1(e, t, n);
  }
  static isValidIdentifier(e) {
    return C2.test(e);
  }
  canonicalString() {
    return this.toArray().map((e) => (e = e.replace(/\\/g, "\\\\").replace(/`/g, "\\`"), FieldPath$1.isValidIdentifier(e) || (e = "`" + e + "`"), e)).join(".");
  }
  toString() {
    return this.canonicalString();
  }
  isKeyField() {
    return this.length === 1 && this.get(0) === "__name__";
  }
  static keyField() {
    return new FieldPath$1(["__name__"]);
  }
  static fromServerFormat(e) {
    const t = [];
    let n = "", r = 0;
    const __PRIVATE_addCurrentSegment = () => {
      if (n.length === 0)
        throw new FirestoreError(v.INVALID_ARGUMENT, `Invalid field path (${e}). Paths must not be empty, begin with '.', end with '.', or contain '..'`);
      t.push(n), n = "";
    };
    let i = false;
    for (;r < e.length; ) {
      const t2 = e[r];
      if (t2 === "\\") {
        if (r + 1 === e.length)
          throw new FirestoreError(v.INVALID_ARGUMENT, "Path has trailing escape character: " + e);
        const t3 = e[r + 1];
        if (t3 !== "\\" && t3 !== "." && t3 !== "`")
          throw new FirestoreError(v.INVALID_ARGUMENT, "Path has invalid escape sequence: " + e);
        n += t3, r += 2;
      } else
        t2 === "`" ? (i = !i, r++) : t2 !== "." || i ? (n += t2, r++) : (__PRIVATE_addCurrentSegment(), r++);
    }
    if (__PRIVATE_addCurrentSegment(), i)
      throw new FirestoreError(v.INVALID_ARGUMENT, "Unterminated ` in path: " + e);
    return new FieldPath$1(t);
  }
  static emptyPath() {
    return new FieldPath$1([]);
  }
}

class DocumentKey {
  constructor(e) {
    this.path = e;
  }
  static fromPath(e) {
    return new DocumentKey(ResourcePath.fromString(e));
  }
  static fromName(e) {
    return new DocumentKey(ResourcePath.fromString(e).popFirst(5));
  }
  static empty() {
    return new DocumentKey(ResourcePath.emptyPath());
  }
  get collectionGroup() {
    return this.path.popLast().lastSegment();
  }
  hasCollectionId(e) {
    return this.path.length >= 2 && this.path.get(this.path.length - 2) === e;
  }
  getCollectionGroup() {
    return this.path.get(this.path.length - 2);
  }
  getCollectionPath() {
    return this.path.popLast();
  }
  isEqual(e) {
    return e !== null && ResourcePath.comparator(this.path, e.path) === 0;
  }
  toString() {
    return this.path.toString();
  }
  static comparator(e, t) {
    return ResourcePath.comparator(e.path, t.path);
  }
  static isDocumentKey(e) {
    return e.length % 2 == 0;
  }
  static fromSegments(e) {
    return new DocumentKey(new ResourcePath(e.slice()));
  }
}

class FieldIndex {
  constructor(e, t, n, r) {
    this.indexId = e, this.collectionGroup = t, this.fields = n, this.indexState = r;
  }
}
FieldIndex.UNKNOWN_ID = -1;
function __PRIVATE_newIndexOffsetSuccessorFromReadTime(e, t) {
  const n = e.toTimestamp().seconds, r = e.toTimestamp().nanoseconds + 1, i = SnapshotVersion.fromTimestamp(r === 1e9 ? new Timestamp(n + 1, 0) : new Timestamp(n, r));
  return new IndexOffset(i, DocumentKey.empty(), t);
}
function __PRIVATE_newIndexOffsetFromDocument(e) {
  return new IndexOffset(e.readTime, e.key, -1);
}

class IndexOffset {
  constructor(e, t, n) {
    this.readTime = e, this.documentKey = t, this.largestBatchId = n;
  }
  static min() {
    return new IndexOffset(SnapshotVersion.min(), DocumentKey.empty(), -1);
  }
  static max() {
    return new IndexOffset(SnapshotVersion.max(), DocumentKey.empty(), -1);
  }
}
function __PRIVATE_indexOffsetComparator(e, t) {
  let n = e.readTime.compareTo(t.readTime);
  return n !== 0 ? n : (n = DocumentKey.comparator(e.documentKey, t.documentKey), n !== 0 ? n : __PRIVATE_primitiveComparator(e.largestBatchId, t.largestBatchId));
}
var F = "The current tab is not in the required state to perform this operation. It might be necessary to refresh the browser tab.";

class PersistenceTransaction {
  constructor() {
    this.onCommittedListeners = [];
  }
  addOnCommittedListener(e) {
    this.onCommittedListeners.push(e);
  }
  raiseOnCommittedEvent() {
    this.onCommittedListeners.forEach((e) => e());
  }
}
async function __PRIVATE_ignoreIfPrimaryLeaseLoss(e) {
  if (e.code !== v.FAILED_PRECONDITION || e.message !== F)
    throw e;
  __PRIVATE_logDebug("LocalStore", "Unexpectedly lost primary lease");
}

class PersistencePromise {
  constructor(e) {
    this.nextCallback = null, this.catchCallback = null, this.result = undefined, this.error = undefined, this.isDone = false, this.callbackAttached = false, e((e2) => {
      this.isDone = true, this.result = e2, this.nextCallback && this.nextCallback(e2);
    }, (e2) => {
      this.isDone = true, this.error = e2, this.catchCallback && this.catchCallback(e2);
    });
  }
  catch(e) {
    return this.next(undefined, e);
  }
  next(e, t) {
    return this.callbackAttached && fail(), this.callbackAttached = true, this.isDone ? this.error ? this.wrapFailure(t, this.error) : this.wrapSuccess(e, this.result) : new PersistencePromise((n, r) => {
      this.nextCallback = (t2) => {
        this.wrapSuccess(e, t2).next(n, r);
      }, this.catchCallback = (e2) => {
        this.wrapFailure(t, e2).next(n, r);
      };
    });
  }
  toPromise() {
    return new Promise((e, t) => {
      this.next(e, t);
    });
  }
  wrapUserFunction(e) {
    try {
      const t = e();
      return t instanceof PersistencePromise ? t : PersistencePromise.resolve(t);
    } catch (e2) {
      return PersistencePromise.reject(e2);
    }
  }
  wrapSuccess(e, t) {
    return e ? this.wrapUserFunction(() => e(t)) : PersistencePromise.resolve(t);
  }
  wrapFailure(e, t) {
    return e ? this.wrapUserFunction(() => e(t)) : PersistencePromise.reject(t);
  }
  static resolve(e) {
    return new PersistencePromise((t, n) => {
      t(e);
    });
  }
  static reject(e) {
    return new PersistencePromise((t, n) => {
      n(e);
    });
  }
  static waitFor(e) {
    return new PersistencePromise((t, n) => {
      let r = 0, i = 0, s = false;
      e.forEach((e2) => {
        ++r, e2.next(() => {
          ++i, s && i === r && t();
        }, (e3) => n(e3));
      }), s = true, i === r && t();
    });
  }
  static or(e) {
    let t = PersistencePromise.resolve(false);
    for (const n of e)
      t = t.next((e2) => e2 ? PersistencePromise.resolve(e2) : n());
    return t;
  }
  static forEach(e, t) {
    const n = [];
    return e.forEach((e2, r) => {
      n.push(t.call(this, e2, r));
    }), this.waitFor(n);
  }
  static mapArray(e, t) {
    return new PersistencePromise((n, r) => {
      const i = e.length, s = new Array(i);
      let o = 0;
      for (let _ = 0;_ < i; _++) {
        const a = _;
        t(e[a]).next((e2) => {
          s[a] = e2, ++o, o === i && n(s);
        }, (e2) => r(e2));
      }
    });
  }
  static doWhile(e, t) {
    return new PersistencePromise((n, r) => {
      const process2 = () => {
        e() === true ? t().next(() => {
          process2();
        }, r) : n();
      };
      process2();
    });
  }
}
function __PRIVATE_getAndroidVersion(e) {
  const t = e.match(/Android ([\d.]+)/i), n = t ? t[1].split(".").slice(0, 2).join(".") : "-1";
  return Number(n);
}
function __PRIVATE_isIndexedDbTransactionError(e) {
  return e.name === "IndexedDbTransactionError";
}
class __PRIVATE_ListenSequence {
  constructor(e, t) {
    this.previousValue = e, t && (t.sequenceNumberHandler = (e2) => this.ie(e2), this.se = (e2) => t.writeSequenceNumber(e2));
  }
  ie(e) {
    return this.previousValue = Math.max(e, this.previousValue), this.previousValue;
  }
  next() {
    const e = ++this.previousValue;
    return this.se && this.se(e), e;
  }
}
__PRIVATE_ListenSequence.oe = -1;
function __PRIVATE_isNullOrUndefined(e) {
  return e == null;
}
function __PRIVATE_isNegativeZero(e) {
  return e === 0 && 1 / e == -1 / 0;
}
function isSafeInteger(e) {
  return typeof e == "number" && Number.isInteger(e) && !__PRIVATE_isNegativeZero(e) && e <= Number.MAX_SAFE_INTEGER && e >= Number.MIN_SAFE_INTEGER;
}
var J = [...[...[...[...["mutationQueues", "mutations", "documentMutations", "remoteDocuments", "targets", "owner", "targetGlobal", "targetDocuments"], "clientMetadata"], "remoteDocumentGlobal"], "collectionParents"], "bundles", "namedQueries"];
var Y = [...J, "documentOverlays"];
var Z = ["mutationQueues", "mutations", "documentMutations", "remoteDocumentsV14", "targets", "owner", "targetGlobal", "targetDocuments", "clientMetadata", "remoteDocumentGlobal", "collectionParents", "bundles", "namedQueries", "documentOverlays"];
var X = Z;
var ee = [...X, "indexConfiguration", "indexState", "indexEntries"];
var ne = [...ee, "globals"];
function __PRIVATE_objectSize(e) {
  let t = 0;
  for (const n in e)
    Object.prototype.hasOwnProperty.call(e, n) && t++;
  return t;
}
function forEach(e, t) {
  for (const n in e)
    Object.prototype.hasOwnProperty.call(e, n) && t(n, e[n]);
}
function isEmpty(e) {
  for (const t in e)
    if (Object.prototype.hasOwnProperty.call(e, t))
      return false;
  return true;
}

class SortedMap {
  constructor(e, t) {
    this.comparator = e, this.root = t || LLRBNode.EMPTY;
  }
  insert(e, t) {
    return new SortedMap(this.comparator, this.root.insert(e, t, this.comparator).copy(null, null, LLRBNode.BLACK, null, null));
  }
  remove(e) {
    return new SortedMap(this.comparator, this.root.remove(e, this.comparator).copy(null, null, LLRBNode.BLACK, null, null));
  }
  get(e) {
    let t = this.root;
    for (;!t.isEmpty(); ) {
      const n = this.comparator(e, t.key);
      if (n === 0)
        return t.value;
      n < 0 ? t = t.left : n > 0 && (t = t.right);
    }
    return null;
  }
  indexOf(e) {
    let t = 0, n = this.root;
    for (;!n.isEmpty(); ) {
      const r = this.comparator(e, n.key);
      if (r === 0)
        return t + n.left.size;
      r < 0 ? n = n.left : (t += n.left.size + 1, n = n.right);
    }
    return -1;
  }
  isEmpty() {
    return this.root.isEmpty();
  }
  get size() {
    return this.root.size;
  }
  minKey() {
    return this.root.minKey();
  }
  maxKey() {
    return this.root.maxKey();
  }
  inorderTraversal(e) {
    return this.root.inorderTraversal(e);
  }
  forEach(e) {
    this.inorderTraversal((t, n) => (e(t, n), false));
  }
  toString() {
    const e = [];
    return this.inorderTraversal((t, n) => (e.push(`${t}:${n}`), false)), `{${e.join(", ")}}`;
  }
  reverseTraversal(e) {
    return this.root.reverseTraversal(e);
  }
  getIterator() {
    return new SortedMapIterator(this.root, null, this.comparator, false);
  }
  getIteratorFrom(e) {
    return new SortedMapIterator(this.root, e, this.comparator, false);
  }
  getReverseIterator() {
    return new SortedMapIterator(this.root, null, this.comparator, true);
  }
  getReverseIteratorFrom(e) {
    return new SortedMapIterator(this.root, e, this.comparator, true);
  }
}

class SortedMapIterator {
  constructor(e, t, n, r) {
    this.isReverse = r, this.nodeStack = [];
    let i = 1;
    for (;!e.isEmpty(); )
      if (i = t ? n(e.key, t) : 1, t && r && (i *= -1), i < 0)
        e = this.isReverse ? e.left : e.right;
      else {
        if (i === 0) {
          this.nodeStack.push(e);
          break;
        }
        this.nodeStack.push(e), e = this.isReverse ? e.right : e.left;
      }
  }
  getNext() {
    let e = this.nodeStack.pop();
    const t = {
      key: e.key,
      value: e.value
    };
    if (this.isReverse)
      for (e = e.left;!e.isEmpty(); )
        this.nodeStack.push(e), e = e.right;
    else
      for (e = e.right;!e.isEmpty(); )
        this.nodeStack.push(e), e = e.left;
    return t;
  }
  hasNext() {
    return this.nodeStack.length > 0;
  }
  peek() {
    if (this.nodeStack.length === 0)
      return null;
    const e = this.nodeStack[this.nodeStack.length - 1];
    return {
      key: e.key,
      value: e.value
    };
  }
}

class LLRBNode {
  constructor(e, t, n, r, i) {
    this.key = e, this.value = t, this.color = n != null ? n : LLRBNode.RED, this.left = r != null ? r : LLRBNode.EMPTY, this.right = i != null ? i : LLRBNode.EMPTY, this.size = this.left.size + 1 + this.right.size;
  }
  copy(e, t, n, r, i) {
    return new LLRBNode(e != null ? e : this.key, t != null ? t : this.value, n != null ? n : this.color, r != null ? r : this.left, i != null ? i : this.right);
  }
  isEmpty() {
    return false;
  }
  inorderTraversal(e) {
    return this.left.inorderTraversal(e) || e(this.key, this.value) || this.right.inorderTraversal(e);
  }
  reverseTraversal(e) {
    return this.right.reverseTraversal(e) || e(this.key, this.value) || this.left.reverseTraversal(e);
  }
  min() {
    return this.left.isEmpty() ? this : this.left.min();
  }
  minKey() {
    return this.min().key;
  }
  maxKey() {
    return this.right.isEmpty() ? this.key : this.right.maxKey();
  }
  insert(e, t, n) {
    let r = this;
    const i = n(e, r.key);
    return r = i < 0 ? r.copy(null, null, null, r.left.insert(e, t, n), null) : i === 0 ? r.copy(null, t, null, null, null) : r.copy(null, null, null, null, r.right.insert(e, t, n)), r.fixUp();
  }
  removeMin() {
    if (this.left.isEmpty())
      return LLRBNode.EMPTY;
    let e = this;
    return e.left.isRed() || e.left.left.isRed() || (e = e.moveRedLeft()), e = e.copy(null, null, null, e.left.removeMin(), null), e.fixUp();
  }
  remove(e, t) {
    let n, r = this;
    if (t(e, r.key) < 0)
      r.left.isEmpty() || r.left.isRed() || r.left.left.isRed() || (r = r.moveRedLeft()), r = r.copy(null, null, null, r.left.remove(e, t), null);
    else {
      if (r.left.isRed() && (r = r.rotateRight()), r.right.isEmpty() || r.right.isRed() || r.right.left.isRed() || (r = r.moveRedRight()), t(e, r.key) === 0) {
        if (r.right.isEmpty())
          return LLRBNode.EMPTY;
        n = r.right.min(), r = r.copy(n.key, n.value, null, null, r.right.removeMin());
      }
      r = r.copy(null, null, null, null, r.right.remove(e, t));
    }
    return r.fixUp();
  }
  isRed() {
    return this.color;
  }
  fixUp() {
    let e = this;
    return e.right.isRed() && !e.left.isRed() && (e = e.rotateLeft()), e.left.isRed() && e.left.left.isRed() && (e = e.rotateRight()), e.left.isRed() && e.right.isRed() && (e = e.colorFlip()), e;
  }
  moveRedLeft() {
    let e = this.colorFlip();
    return e.right.left.isRed() && (e = e.copy(null, null, null, null, e.right.rotateRight()), e = e.rotateLeft(), e = e.colorFlip()), e;
  }
  moveRedRight() {
    let e = this.colorFlip();
    return e.left.left.isRed() && (e = e.rotateRight(), e = e.colorFlip()), e;
  }
  rotateLeft() {
    const e = this.copy(null, null, LLRBNode.RED, null, this.right.left);
    return this.right.copy(null, null, this.color, e, null);
  }
  rotateRight() {
    const e = this.copy(null, null, LLRBNode.RED, this.left.right, null);
    return this.left.copy(null, null, this.color, null, e);
  }
  colorFlip() {
    const e = this.left.copy(null, null, !this.left.color, null, null), t = this.right.copy(null, null, !this.right.color, null, null);
    return this.copy(null, null, !this.color, e, t);
  }
  checkMaxDepth() {
    const e = this.check();
    return Math.pow(2, e) <= this.size + 1;
  }
  check() {
    if (this.isRed() && this.left.isRed())
      throw fail();
    if (this.right.isRed())
      throw fail();
    const e = this.left.check();
    if (e !== this.right.check())
      throw fail();
    return e + (this.isRed() ? 0 : 1);
  }
}
LLRBNode.EMPTY = null, LLRBNode.RED = true, LLRBNode.BLACK = false;
LLRBNode.EMPTY = new class LLRBEmptyNode {
  constructor() {
    this.size = 0;
  }
  get key() {
    throw fail();
  }
  get value() {
    throw fail();
  }
  get color() {
    throw fail();
  }
  get left() {
    throw fail();
  }
  get right() {
    throw fail();
  }
  copy(e, t, n, r, i) {
    return this;
  }
  insert(e, t, n) {
    return new LLRBNode(e, t);
  }
  remove(e, t) {
    return this;
  }
  isEmpty() {
    return true;
  }
  inorderTraversal(e) {
    return false;
  }
  reverseTraversal(e) {
    return false;
  }
  minKey() {
    return null;
  }
  maxKey() {
    return null;
  }
  isRed() {
    return false;
  }
  checkMaxDepth() {
    return true;
  }
  check() {
    return 0;
  }
};

class SortedSet {
  constructor(e) {
    this.comparator = e, this.data = new SortedMap(this.comparator);
  }
  has(e) {
    return this.data.get(e) !== null;
  }
  first() {
    return this.data.minKey();
  }
  last() {
    return this.data.maxKey();
  }
  get size() {
    return this.data.size;
  }
  indexOf(e) {
    return this.data.indexOf(e);
  }
  forEach(e) {
    this.data.inorderTraversal((t, n) => (e(t), false));
  }
  forEachInRange(e, t) {
    const n = this.data.getIteratorFrom(e[0]);
    for (;n.hasNext(); ) {
      const r = n.getNext();
      if (this.comparator(r.key, e[1]) >= 0)
        return;
      t(r.key);
    }
  }
  forEachWhile(e, t) {
    let n;
    for (n = t !== undefined ? this.data.getIteratorFrom(t) : this.data.getIterator();n.hasNext(); ) {
      if (!e(n.getNext().key))
        return;
    }
  }
  firstAfterOrEqual(e) {
    const t = this.data.getIteratorFrom(e);
    return t.hasNext() ? t.getNext().key : null;
  }
  getIterator() {
    return new SortedSetIterator(this.data.getIterator());
  }
  getIteratorFrom(e) {
    return new SortedSetIterator(this.data.getIteratorFrom(e));
  }
  add(e) {
    return this.copy(this.data.remove(e).insert(e, true));
  }
  delete(e) {
    return this.has(e) ? this.copy(this.data.remove(e)) : this;
  }
  isEmpty() {
    return this.data.isEmpty();
  }
  unionWith(e) {
    let t = this;
    return t.size < e.size && (t = e, e = this), e.forEach((e2) => {
      t = t.add(e2);
    }), t;
  }
  isEqual(e) {
    if (!(e instanceof SortedSet))
      return false;
    if (this.size !== e.size)
      return false;
    const t = this.data.getIterator(), n = e.data.getIterator();
    for (;t.hasNext(); ) {
      const e2 = t.getNext().key, r = n.getNext().key;
      if (this.comparator(e2, r) !== 0)
        return false;
    }
    return true;
  }
  toArray() {
    const e = [];
    return this.forEach((t) => {
      e.push(t);
    }), e;
  }
  toString() {
    const e = [];
    return this.forEach((t) => e.push(t)), "SortedSet(" + e.toString() + ")";
  }
  copy(e) {
    const t = new SortedSet(this.comparator);
    return t.data = e, t;
  }
}

class SortedSetIterator {
  constructor(e) {
    this.iter = e;
  }
  getNext() {
    return this.iter.getNext().key;
  }
  hasNext() {
    return this.iter.hasNext();
  }
}
class FieldMask {
  constructor(e) {
    this.fields = e, e.sort(FieldPath$1.comparator);
  }
  static empty() {
    return new FieldMask([]);
  }
  unionWith(e) {
    let t = new SortedSet(FieldPath$1.comparator);
    for (const e2 of this.fields)
      t = t.add(e2);
    for (const n of e)
      t = t.add(n);
    return new FieldMask(t.toArray());
  }
  covers(e) {
    for (const t of this.fields)
      if (t.isPrefixOf(e))
        return true;
    return false;
  }
  isEqual(e) {
    return __PRIVATE_arrayEquals(this.fields, e.fields, (e2, t) => e2.isEqual(t));
  }
}

class __PRIVATE_Base64DecodeError extends Error {
  constructor() {
    super(...arguments), this.name = "Base64DecodeError";
  }
}
class ByteString {
  constructor(e) {
    this.binaryString = e;
  }
  static fromBase64String(e) {
    const t = function __PRIVATE_decodeBase64(e2) {
      try {
        return atob(e2);
      } catch (e3) {
        throw typeof DOMException != "undefined" && e3 instanceof DOMException ? new __PRIVATE_Base64DecodeError("Invalid base64 string: " + e3) : e3;
      }
    }(e);
    return new ByteString(t);
  }
  static fromUint8Array(e) {
    const t = function __PRIVATE_binaryStringFromUint8Array(e2) {
      let t2 = "";
      for (let n = 0;n < e2.length; ++n)
        t2 += String.fromCharCode(e2[n]);
      return t2;
    }(e);
    return new ByteString(t);
  }
  [Symbol.iterator]() {
    let e = 0;
    return {
      next: () => e < this.binaryString.length ? {
        value: this.binaryString.charCodeAt(e++),
        done: false
      } : {
        value: undefined,
        done: true
      }
    };
  }
  toBase64() {
    return function __PRIVATE_encodeBase64(e) {
      return btoa(e);
    }(this.binaryString);
  }
  toUint8Array() {
    return function __PRIVATE_uint8ArrayFromBinaryString(e) {
      const t = new Uint8Array(e.length);
      for (let n = 0;n < e.length; n++)
        t[n] = e.charCodeAt(n);
      return t;
    }(this.binaryString);
  }
  approximateByteSize() {
    return 2 * this.binaryString.length;
  }
  compareTo(e) {
    return __PRIVATE_primitiveComparator(this.binaryString, e.binaryString);
  }
  isEqual(e) {
    return this.binaryString === e.binaryString;
  }
}
ByteString.EMPTY_BYTE_STRING = new ByteString("");
var re = new RegExp(/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.(\d+))?Z$/);
function __PRIVATE_normalizeTimestamp(e) {
  if (__PRIVATE_hardAssert(!!e), typeof e == "string") {
    let t = 0;
    const n = re.exec(e);
    if (__PRIVATE_hardAssert(!!n), n[1]) {
      let e2 = n[1];
      e2 = (e2 + "000000000").substr(0, 9), t = Number(e2);
    }
    const r = new Date(e);
    return {
      seconds: Math.floor(r.getTime() / 1000),
      nanos: t
    };
  }
  return {
    seconds: __PRIVATE_normalizeNumber(e.seconds),
    nanos: __PRIVATE_normalizeNumber(e.nanos)
  };
}
function __PRIVATE_normalizeNumber(e) {
  return typeof e == "number" ? e : typeof e == "string" ? Number(e) : 0;
}
function __PRIVATE_normalizeByteString(e) {
  return typeof e == "string" ? ByteString.fromBase64String(e) : ByteString.fromUint8Array(e);
}
function __PRIVATE_isServerTimestamp(e) {
  var t, n;
  return ((n = (((t = e == null ? undefined : e.mapValue) === null || t === undefined ? undefined : t.fields) || {}).__type__) === null || n === undefined ? undefined : n.stringValue) === "server_timestamp";
}
function __PRIVATE_getPreviousValue(e) {
  const t = e.mapValue.fields.__previous_value__;
  return __PRIVATE_isServerTimestamp(t) ? __PRIVATE_getPreviousValue(t) : t;
}
function __PRIVATE_getLocalWriteTime(e) {
  const t = __PRIVATE_normalizeTimestamp(e.mapValue.fields.__local_write_time__.timestampValue);
  return new Timestamp(t.seconds, t.nanos);
}

class DatabaseInfo {
  constructor(e, t, n, r, i, s, o, _, a) {
    this.databaseId = e, this.appId = t, this.persistenceKey = n, this.host = r, this.ssl = i, this.forceLongPolling = s, this.autoDetectLongPolling = o, this.longPollingOptions = _, this.useFetchStreams = a;
  }
}

class DatabaseId {
  constructor(e, t) {
    this.projectId = e, this.database = t || "(default)";
  }
  static empty() {
    return new DatabaseId("", "");
  }
  get isDefaultDatabase() {
    return this.database === "(default)";
  }
  isEqual(e) {
    return e instanceof DatabaseId && e.projectId === this.projectId && e.database === this.database;
  }
}
var ie = {
  mapValue: {
    fields: {
      __type__: {
        stringValue: "__max__"
      }
    }
  }
};
function __PRIVATE_typeOrder(e) {
  return "nullValue" in e ? 0 : ("booleanValue" in e) ? 1 : ("integerValue" in e) || ("doubleValue" in e) ? 2 : ("timestampValue" in e) ? 3 : ("stringValue" in e) ? 5 : ("bytesValue" in e) ? 6 : ("referenceValue" in e) ? 7 : ("geoPointValue" in e) ? 8 : ("arrayValue" in e) ? 9 : ("mapValue" in e) ? __PRIVATE_isServerTimestamp(e) ? 4 : __PRIVATE_isMaxValue(e) ? 9007199254740991 : __PRIVATE_isVectorValue(e) ? 10 : 11 : fail();
}
function __PRIVATE_valueEquals(e, t) {
  if (e === t)
    return true;
  const n = __PRIVATE_typeOrder(e);
  if (n !== __PRIVATE_typeOrder(t))
    return false;
  switch (n) {
    case 0:
    case 9007199254740991:
      return true;
    case 1:
      return e.booleanValue === t.booleanValue;
    case 4:
      return __PRIVATE_getLocalWriteTime(e).isEqual(__PRIVATE_getLocalWriteTime(t));
    case 3:
      return function __PRIVATE_timestampEquals(e2, t2) {
        if (typeof e2.timestampValue == "string" && typeof t2.timestampValue == "string" && e2.timestampValue.length === t2.timestampValue.length)
          return e2.timestampValue === t2.timestampValue;
        const n2 = __PRIVATE_normalizeTimestamp(e2.timestampValue), r = __PRIVATE_normalizeTimestamp(t2.timestampValue);
        return n2.seconds === r.seconds && n2.nanos === r.nanos;
      }(e, t);
    case 5:
      return e.stringValue === t.stringValue;
    case 6:
      return function __PRIVATE_blobEquals(e2, t2) {
        return __PRIVATE_normalizeByteString(e2.bytesValue).isEqual(__PRIVATE_normalizeByteString(t2.bytesValue));
      }(e, t);
    case 7:
      return e.referenceValue === t.referenceValue;
    case 8:
      return function __PRIVATE_geoPointEquals(e2, t2) {
        return __PRIVATE_normalizeNumber(e2.geoPointValue.latitude) === __PRIVATE_normalizeNumber(t2.geoPointValue.latitude) && __PRIVATE_normalizeNumber(e2.geoPointValue.longitude) === __PRIVATE_normalizeNumber(t2.geoPointValue.longitude);
      }(e, t);
    case 2:
      return function __PRIVATE_numberEquals(e2, t2) {
        if ("integerValue" in e2 && "integerValue" in t2)
          return __PRIVATE_normalizeNumber(e2.integerValue) === __PRIVATE_normalizeNumber(t2.integerValue);
        if ("doubleValue" in e2 && "doubleValue" in t2) {
          const n2 = __PRIVATE_normalizeNumber(e2.doubleValue), r = __PRIVATE_normalizeNumber(t2.doubleValue);
          return n2 === r ? __PRIVATE_isNegativeZero(n2) === __PRIVATE_isNegativeZero(r) : isNaN(n2) && isNaN(r);
        }
        return false;
      }(e, t);
    case 9:
      return __PRIVATE_arrayEquals(e.arrayValue.values || [], t.arrayValue.values || [], __PRIVATE_valueEquals);
    case 10:
    case 11:
      return function __PRIVATE_objectEquals(e2, t2) {
        const n2 = e2.mapValue.fields || {}, r = t2.mapValue.fields || {};
        if (__PRIVATE_objectSize(n2) !== __PRIVATE_objectSize(r))
          return false;
        for (const e3 in n2)
          if (n2.hasOwnProperty(e3) && (r[e3] === undefined || !__PRIVATE_valueEquals(n2[e3], r[e3])))
            return false;
        return true;
      }(e, t);
    default:
      return fail();
  }
}
function __PRIVATE_arrayValueContains(e, t) {
  return (e.values || []).find((e2) => __PRIVATE_valueEquals(e2, t)) !== undefined;
}
function __PRIVATE_valueCompare(e, t) {
  if (e === t)
    return 0;
  const n = __PRIVATE_typeOrder(e), r = __PRIVATE_typeOrder(t);
  if (n !== r)
    return __PRIVATE_primitiveComparator(n, r);
  switch (n) {
    case 0:
    case 9007199254740991:
      return 0;
    case 1:
      return __PRIVATE_primitiveComparator(e.booleanValue, t.booleanValue);
    case 2:
      return function __PRIVATE_compareNumbers(e2, t2) {
        const n2 = __PRIVATE_normalizeNumber(e2.integerValue || e2.doubleValue), r2 = __PRIVATE_normalizeNumber(t2.integerValue || t2.doubleValue);
        return n2 < r2 ? -1 : n2 > r2 ? 1 : n2 === r2 ? 0 : isNaN(n2) ? isNaN(r2) ? 0 : -1 : 1;
      }(e, t);
    case 3:
      return __PRIVATE_compareTimestamps(e.timestampValue, t.timestampValue);
    case 4:
      return __PRIVATE_compareTimestamps(__PRIVATE_getLocalWriteTime(e), __PRIVATE_getLocalWriteTime(t));
    case 5:
      return __PRIVATE_primitiveComparator(e.stringValue, t.stringValue);
    case 6:
      return function __PRIVATE_compareBlobs(e2, t2) {
        const n2 = __PRIVATE_normalizeByteString(e2), r2 = __PRIVATE_normalizeByteString(t2);
        return n2.compareTo(r2);
      }(e.bytesValue, t.bytesValue);
    case 7:
      return function __PRIVATE_compareReferences(e2, t2) {
        const n2 = e2.split("/"), r2 = t2.split("/");
        for (let e3 = 0;e3 < n2.length && e3 < r2.length; e3++) {
          const t3 = __PRIVATE_primitiveComparator(n2[e3], r2[e3]);
          if (t3 !== 0)
            return t3;
        }
        return __PRIVATE_primitiveComparator(n2.length, r2.length);
      }(e.referenceValue, t.referenceValue);
    case 8:
      return function __PRIVATE_compareGeoPoints(e2, t2) {
        const n2 = __PRIVATE_primitiveComparator(__PRIVATE_normalizeNumber(e2.latitude), __PRIVATE_normalizeNumber(t2.latitude));
        if (n2 !== 0)
          return n2;
        return __PRIVATE_primitiveComparator(__PRIVATE_normalizeNumber(e2.longitude), __PRIVATE_normalizeNumber(t2.longitude));
      }(e.geoPointValue, t.geoPointValue);
    case 9:
      return __PRIVATE_compareArrays(e.arrayValue, t.arrayValue);
    case 10:
      return function __PRIVATE_compareVectors(e2, t2) {
        var n2, r2, i, s;
        const o = e2.fields || {}, _ = t2.fields || {}, a = (n2 = o.value) === null || n2 === undefined ? undefined : n2.arrayValue, u = (r2 = _.value) === null || r2 === undefined ? undefined : r2.arrayValue, c = __PRIVATE_primitiveComparator(((i = a == null ? undefined : a.values) === null || i === undefined ? undefined : i.length) || 0, ((s = u == null ? undefined : u.values) === null || s === undefined ? undefined : s.length) || 0);
        if (c !== 0)
          return c;
        return __PRIVATE_compareArrays(a, u);
      }(e.mapValue, t.mapValue);
    case 11:
      return function __PRIVATE_compareMaps(e2, t2) {
        if (e2 === ie.mapValue && t2 === ie.mapValue)
          return 0;
        if (e2 === ie.mapValue)
          return 1;
        if (t2 === ie.mapValue)
          return -1;
        const n2 = e2.fields || {}, r2 = Object.keys(n2), i = t2.fields || {}, s = Object.keys(i);
        r2.sort(), s.sort();
        for (let e3 = 0;e3 < r2.length && e3 < s.length; ++e3) {
          const t3 = __PRIVATE_primitiveComparator(r2[e3], s[e3]);
          if (t3 !== 0)
            return t3;
          const o = __PRIVATE_valueCompare(n2[r2[e3]], i[s[e3]]);
          if (o !== 0)
            return o;
        }
        return __PRIVATE_primitiveComparator(r2.length, s.length);
      }(e.mapValue, t.mapValue);
    default:
      throw fail();
  }
}
function __PRIVATE_compareTimestamps(e, t) {
  if (typeof e == "string" && typeof t == "string" && e.length === t.length)
    return __PRIVATE_primitiveComparator(e, t);
  const n = __PRIVATE_normalizeTimestamp(e), r = __PRIVATE_normalizeTimestamp(t), i = __PRIVATE_primitiveComparator(n.seconds, r.seconds);
  return i !== 0 ? i : __PRIVATE_primitiveComparator(n.nanos, r.nanos);
}
function __PRIVATE_compareArrays(e, t) {
  const n = e.values || [], r = t.values || [];
  for (let e2 = 0;e2 < n.length && e2 < r.length; ++e2) {
    const t2 = __PRIVATE_valueCompare(n[e2], r[e2]);
    if (t2)
      return t2;
  }
  return __PRIVATE_primitiveComparator(n.length, r.length);
}
function canonicalId(e) {
  return __PRIVATE_canonifyValue(e);
}
function __PRIVATE_canonifyValue(e) {
  return "nullValue" in e ? "null" : ("booleanValue" in e) ? "" + e.booleanValue : ("integerValue" in e) ? "" + e.integerValue : ("doubleValue" in e) ? "" + e.doubleValue : ("timestampValue" in e) ? function __PRIVATE_canonifyTimestamp(e2) {
    const t = __PRIVATE_normalizeTimestamp(e2);
    return `time(${t.seconds},${t.nanos})`;
  }(e.timestampValue) : ("stringValue" in e) ? e.stringValue : ("bytesValue" in e) ? function __PRIVATE_canonifyByteString(e2) {
    return __PRIVATE_normalizeByteString(e2).toBase64();
  }(e.bytesValue) : ("referenceValue" in e) ? function __PRIVATE_canonifyReference(e2) {
    return DocumentKey.fromName(e2).toString();
  }(e.referenceValue) : ("geoPointValue" in e) ? function __PRIVATE_canonifyGeoPoint(e2) {
    return `geo(${e2.latitude},${e2.longitude})`;
  }(e.geoPointValue) : ("arrayValue" in e) ? function __PRIVATE_canonifyArray(e2) {
    let t = "[", n = true;
    for (const r of e2.values || [])
      n ? n = false : t += ",", t += __PRIVATE_canonifyValue(r);
    return t + "]";
  }(e.arrayValue) : ("mapValue" in e) ? function __PRIVATE_canonifyMap(e2) {
    const t = Object.keys(e2.fields || {}).sort();
    let n = "{", r = true;
    for (const i of t)
      r ? r = false : n += ",", n += `${i}:${__PRIVATE_canonifyValue(e2.fields[i])}`;
    return n + "}";
  }(e.mapValue) : fail();
}
function isInteger(e) {
  return !!e && "integerValue" in e;
}
function isArray(e) {
  return !!e && "arrayValue" in e;
}
function __PRIVATE_isMapValue(e) {
  return !!e && "mapValue" in e;
}
function __PRIVATE_isVectorValue(e) {
  var t, n;
  return ((n = (((t = e == null ? undefined : e.mapValue) === null || t === undefined ? undefined : t.fields) || {}).__type__) === null || n === undefined ? undefined : n.stringValue) === "__vector__";
}
function __PRIVATE_deepClone(e) {
  if (e.geoPointValue)
    return {
      geoPointValue: Object.assign({}, e.geoPointValue)
    };
  if (e.timestampValue && typeof e.timestampValue == "object")
    return {
      timestampValue: Object.assign({}, e.timestampValue)
    };
  if (e.mapValue) {
    const t = {
      mapValue: {
        fields: {}
      }
    };
    return forEach(e.mapValue.fields, (e2, n) => t.mapValue.fields[e2] = __PRIVATE_deepClone(n)), t;
  }
  if (e.arrayValue) {
    const t = {
      arrayValue: {
        values: []
      }
    };
    for (let n = 0;n < (e.arrayValue.values || []).length; ++n)
      t.arrayValue.values[n] = __PRIVATE_deepClone(e.arrayValue.values[n]);
    return t;
  }
  return Object.assign({}, e);
}
function __PRIVATE_isMaxValue(e) {
  return (((e.mapValue || {}).fields || {}).__type__ || {}).stringValue === "__max__";
}
class ObjectValue {
  constructor(e) {
    this.value = e;
  }
  static empty() {
    return new ObjectValue({
      mapValue: {}
    });
  }
  field(e) {
    if (e.isEmpty())
      return this.value;
    {
      let t = this.value;
      for (let n = 0;n < e.length - 1; ++n)
        if (t = (t.mapValue.fields || {})[e.get(n)], !__PRIVATE_isMapValue(t))
          return null;
      return t = (t.mapValue.fields || {})[e.lastSegment()], t || null;
    }
  }
  set(e, t) {
    this.getFieldsMap(e.popLast())[e.lastSegment()] = __PRIVATE_deepClone(t);
  }
  setAll(e) {
    let t = FieldPath$1.emptyPath(), n = {}, r = [];
    e.forEach((e2, i2) => {
      if (!t.isImmediateParentOf(i2)) {
        const e3 = this.getFieldsMap(t);
        this.applyChanges(e3, n, r), n = {}, r = [], t = i2.popLast();
      }
      e2 ? n[i2.lastSegment()] = __PRIVATE_deepClone(e2) : r.push(i2.lastSegment());
    });
    const i = this.getFieldsMap(t);
    this.applyChanges(i, n, r);
  }
  delete(e) {
    const t = this.field(e.popLast());
    __PRIVATE_isMapValue(t) && t.mapValue.fields && delete t.mapValue.fields[e.lastSegment()];
  }
  isEqual(e) {
    return __PRIVATE_valueEquals(this.value, e.value);
  }
  getFieldsMap(e) {
    let t = this.value;
    t.mapValue.fields || (t.mapValue = {
      fields: {}
    });
    for (let n = 0;n < e.length; ++n) {
      let r = t.mapValue.fields[e.get(n)];
      __PRIVATE_isMapValue(r) && r.mapValue.fields || (r = {
        mapValue: {
          fields: {}
        }
      }, t.mapValue.fields[e.get(n)] = r), t = r;
    }
    return t.mapValue.fields;
  }
  applyChanges(e, t, n) {
    forEach(t, (t2, n2) => e[t2] = n2);
    for (const t2 of n)
      delete e[t2];
  }
  clone() {
    return new ObjectValue(__PRIVATE_deepClone(this.value));
  }
}
function __PRIVATE_extractFieldMask(e) {
  const t = [];
  return forEach(e.fields, (e2, n) => {
    const r = new FieldPath$1([e2]);
    if (__PRIVATE_isMapValue(n)) {
      const e3 = __PRIVATE_extractFieldMask(n.mapValue).fields;
      if (e3.length === 0)
        t.push(r);
      else
        for (const n2 of e3)
          t.push(r.child(n2));
    } else
      t.push(r);
  }), new FieldMask(t);
}

class MutableDocument {
  constructor(e, t, n, r, i, s, o) {
    this.key = e, this.documentType = t, this.version = n, this.readTime = r, this.createTime = i, this.data = s, this.documentState = o;
  }
  static newInvalidDocument(e) {
    return new MutableDocument(e, 0, SnapshotVersion.min(), SnapshotVersion.min(), SnapshotVersion.min(), ObjectValue.empty(), 0);
  }
  static newFoundDocument(e, t, n, r) {
    return new MutableDocument(e, 1, t, SnapshotVersion.min(), n, r, 0);
  }
  static newNoDocument(e, t) {
    return new MutableDocument(e, 2, t, SnapshotVersion.min(), SnapshotVersion.min(), ObjectValue.empty(), 0);
  }
  static newUnknownDocument(e, t) {
    return new MutableDocument(e, 3, t, SnapshotVersion.min(), SnapshotVersion.min(), ObjectValue.empty(), 2);
  }
  convertToFoundDocument(e, t) {
    return !this.createTime.isEqual(SnapshotVersion.min()) || this.documentType !== 2 && this.documentType !== 0 || (this.createTime = e), this.version = e, this.documentType = 1, this.data = t, this.documentState = 0, this;
  }
  convertToNoDocument(e) {
    return this.version = e, this.documentType = 2, this.data = ObjectValue.empty(), this.documentState = 0, this;
  }
  convertToUnknownDocument(e) {
    return this.version = e, this.documentType = 3, this.data = ObjectValue.empty(), this.documentState = 2, this;
  }
  setHasCommittedMutations() {
    return this.documentState = 2, this;
  }
  setHasLocalMutations() {
    return this.documentState = 1, this.version = SnapshotVersion.min(), this;
  }
  setReadTime(e) {
    return this.readTime = e, this;
  }
  get hasLocalMutations() {
    return this.documentState === 1;
  }
  get hasCommittedMutations() {
    return this.documentState === 2;
  }
  get hasPendingWrites() {
    return this.hasLocalMutations || this.hasCommittedMutations;
  }
  isValidDocument() {
    return this.documentType !== 0;
  }
  isFoundDocument() {
    return this.documentType === 1;
  }
  isNoDocument() {
    return this.documentType === 2;
  }
  isUnknownDocument() {
    return this.documentType === 3;
  }
  isEqual(e) {
    return e instanceof MutableDocument && this.key.isEqual(e.key) && this.version.isEqual(e.version) && this.documentType === e.documentType && this.documentState === e.documentState && this.data.isEqual(e.data);
  }
  mutableCopy() {
    return new MutableDocument(this.key, this.documentType, this.version, this.readTime, this.createTime, this.data.clone(), this.documentState);
  }
  toString() {
    return `Document(${this.key}, ${this.version}, ${JSON.stringify(this.data.value)}, {createTime: ${this.createTime}}), {documentType: ${this.documentType}}), {documentState: ${this.documentState}})`;
  }
}

class Bound {
  constructor(e, t) {
    this.position = e, this.inclusive = t;
  }
}
function __PRIVATE_boundCompareToDocument(e, t, n) {
  let r = 0;
  for (let i = 0;i < e.position.length; i++) {
    const s = t[i], o = e.position[i];
    if (s.field.isKeyField())
      r = DocumentKey.comparator(DocumentKey.fromName(o.referenceValue), n.key);
    else {
      r = __PRIVATE_valueCompare(o, n.data.field(s.field));
    }
    if (s.dir === "desc" && (r *= -1), r !== 0)
      break;
  }
  return r;
}
function __PRIVATE_boundEquals(e, t) {
  if (e === null)
    return t === null;
  if (t === null)
    return false;
  if (e.inclusive !== t.inclusive || e.position.length !== t.position.length)
    return false;
  for (let n = 0;n < e.position.length; n++) {
    if (!__PRIVATE_valueEquals(e.position[n], t.position[n]))
      return false;
  }
  return true;
}

class OrderBy {
  constructor(e, t = "asc") {
    this.field = e, this.dir = t;
  }
}
function __PRIVATE_orderByEquals(e, t) {
  return e.dir === t.dir && e.field.isEqual(t.field);
}

class Filter {
}

class FieldFilter extends Filter {
  constructor(e, t, n) {
    super(), this.field = e, this.op = t, this.value = n;
  }
  static create(e, t, n) {
    return e.isKeyField() ? t === "in" || t === "not-in" ? this.createKeyFieldInFilter(e, t, n) : new __PRIVATE_KeyFieldFilter(e, t, n) : t === "array-contains" ? new __PRIVATE_ArrayContainsFilter(e, n) : t === "in" ? new __PRIVATE_InFilter(e, n) : t === "not-in" ? new __PRIVATE_NotInFilter(e, n) : t === "array-contains-any" ? new __PRIVATE_ArrayContainsAnyFilter(e, n) : new FieldFilter(e, t, n);
  }
  static createKeyFieldInFilter(e, t, n) {
    return t === "in" ? new __PRIVATE_KeyFieldInFilter(e, n) : new __PRIVATE_KeyFieldNotInFilter(e, n);
  }
  matches(e) {
    const t = e.data.field(this.field);
    return this.op === "!=" ? t !== null && this.matchesComparison(__PRIVATE_valueCompare(t, this.value)) : t !== null && __PRIVATE_typeOrder(this.value) === __PRIVATE_typeOrder(t) && this.matchesComparison(__PRIVATE_valueCompare(t, this.value));
  }
  matchesComparison(e) {
    switch (this.op) {
      case "<":
        return e < 0;
      case "<=":
        return e <= 0;
      case "==":
        return e === 0;
      case "!=":
        return e !== 0;
      case ">":
        return e > 0;
      case ">=":
        return e >= 0;
      default:
        return fail();
    }
  }
  isInequality() {
    return ["<", "<=", ">", ">=", "!=", "not-in"].indexOf(this.op) >= 0;
  }
  getFlattenedFilters() {
    return [this];
  }
  getFilters() {
    return [this];
  }
}

class CompositeFilter extends Filter {
  constructor(e, t) {
    super(), this.filters = e, this.op = t, this.ae = null;
  }
  static create(e, t) {
    return new CompositeFilter(e, t);
  }
  matches(e) {
    return __PRIVATE_compositeFilterIsConjunction(this) ? this.filters.find((t) => !t.matches(e)) === undefined : this.filters.find((t) => t.matches(e)) !== undefined;
  }
  getFlattenedFilters() {
    return this.ae !== null || (this.ae = this.filters.reduce((e, t) => e.concat(t.getFlattenedFilters()), [])), this.ae;
  }
  getFilters() {
    return Object.assign([], this.filters);
  }
}
function __PRIVATE_compositeFilterIsConjunction(e) {
  return e.op === "and";
}
function __PRIVATE_compositeFilterIsFlatConjunction(e) {
  return __PRIVATE_compositeFilterIsFlat(e) && __PRIVATE_compositeFilterIsConjunction(e);
}
function __PRIVATE_compositeFilterIsFlat(e) {
  for (const t of e.filters)
    if (t instanceof CompositeFilter)
      return false;
  return true;
}
function __PRIVATE_canonifyFilter(e) {
  if (e instanceof FieldFilter)
    return e.field.canonicalString() + e.op.toString() + canonicalId(e.value);
  if (__PRIVATE_compositeFilterIsFlatConjunction(e))
    return e.filters.map((e2) => __PRIVATE_canonifyFilter(e2)).join(",");
  {
    const t = e.filters.map((e2) => __PRIVATE_canonifyFilter(e2)).join(",");
    return `${e.op}(${t})`;
  }
}
function __PRIVATE_filterEquals(e, t) {
  return e instanceof FieldFilter ? function __PRIVATE_fieldFilterEquals(e2, t2) {
    return t2 instanceof FieldFilter && e2.op === t2.op && e2.field.isEqual(t2.field) && __PRIVATE_valueEquals(e2.value, t2.value);
  }(e, t) : e instanceof CompositeFilter ? function __PRIVATE_compositeFilterEquals(e2, t2) {
    if (t2 instanceof CompositeFilter && e2.op === t2.op && e2.filters.length === t2.filters.length) {
      return e2.filters.reduce((e3, n, r) => e3 && __PRIVATE_filterEquals(n, t2.filters[r]), true);
    }
    return false;
  }(e, t) : void fail();
}
function __PRIVATE_stringifyFilter(e) {
  return e instanceof FieldFilter ? function __PRIVATE_stringifyFieldFilter(e2) {
    return `${e2.field.canonicalString()} ${e2.op} ${canonicalId(e2.value)}`;
  }(e) : e instanceof CompositeFilter ? function __PRIVATE_stringifyCompositeFilter(e2) {
    return e2.op.toString() + " {" + e2.getFilters().map(__PRIVATE_stringifyFilter).join(" ,") + "}";
  }(e) : "Filter";
}

class __PRIVATE_KeyFieldFilter extends FieldFilter {
  constructor(e, t, n) {
    super(e, t, n), this.key = DocumentKey.fromName(n.referenceValue);
  }
  matches(e) {
    const t = DocumentKey.comparator(e.key, this.key);
    return this.matchesComparison(t);
  }
}

class __PRIVATE_KeyFieldInFilter extends FieldFilter {
  constructor(e, t) {
    super(e, "in", t), this.keys = __PRIVATE_extractDocumentKeysFromArrayValue("in", t);
  }
  matches(e) {
    return this.keys.some((t) => t.isEqual(e.key));
  }
}

class __PRIVATE_KeyFieldNotInFilter extends FieldFilter {
  constructor(e, t) {
    super(e, "not-in", t), this.keys = __PRIVATE_extractDocumentKeysFromArrayValue("not-in", t);
  }
  matches(e) {
    return !this.keys.some((t) => t.isEqual(e.key));
  }
}
function __PRIVATE_extractDocumentKeysFromArrayValue(e, t) {
  var n;
  return (((n = t.arrayValue) === null || n === undefined ? undefined : n.values) || []).map((e2) => DocumentKey.fromName(e2.referenceValue));
}

class __PRIVATE_ArrayContainsFilter extends FieldFilter {
  constructor(e, t) {
    super(e, "array-contains", t);
  }
  matches(e) {
    const t = e.data.field(this.field);
    return isArray(t) && __PRIVATE_arrayValueContains(t.arrayValue, this.value);
  }
}

class __PRIVATE_InFilter extends FieldFilter {
  constructor(e, t) {
    super(e, "in", t);
  }
  matches(e) {
    const t = e.data.field(this.field);
    return t !== null && __PRIVATE_arrayValueContains(this.value.arrayValue, t);
  }
}

class __PRIVATE_NotInFilter extends FieldFilter {
  constructor(e, t) {
    super(e, "not-in", t);
  }
  matches(e) {
    if (__PRIVATE_arrayValueContains(this.value.arrayValue, {
      nullValue: "NULL_VALUE"
    }))
      return false;
    const t = e.data.field(this.field);
    return t !== null && !__PRIVATE_arrayValueContains(this.value.arrayValue, t);
  }
}

class __PRIVATE_ArrayContainsAnyFilter extends FieldFilter {
  constructor(e, t) {
    super(e, "array-contains-any", t);
  }
  matches(e) {
    const t = e.data.field(this.field);
    return !(!isArray(t) || !t.arrayValue.values) && t.arrayValue.values.some((e2) => __PRIVATE_arrayValueContains(this.value.arrayValue, e2));
  }
}

class __PRIVATE_TargetImpl {
  constructor(e, t = null, n = [], r = [], i = null, s = null, o = null) {
    this.path = e, this.collectionGroup = t, this.orderBy = n, this.filters = r, this.limit = i, this.startAt = s, this.endAt = o, this.ue = null;
  }
}
function __PRIVATE_newTarget(e, t = null, n = [], r = [], i = null, s = null, o = null) {
  return new __PRIVATE_TargetImpl(e, t, n, r, i, s, o);
}
function __PRIVATE_canonifyTarget(e) {
  const t = __PRIVATE_debugCast(e);
  if (t.ue === null) {
    let e2 = t.path.canonicalString();
    t.collectionGroup !== null && (e2 += "|cg:" + t.collectionGroup), e2 += "|f:", e2 += t.filters.map((e3) => __PRIVATE_canonifyFilter(e3)).join(","), e2 += "|ob:", e2 += t.orderBy.map((e3) => function __PRIVATE_canonifyOrderBy(e4) {
      return e4.field.canonicalString() + e4.dir;
    }(e3)).join(","), __PRIVATE_isNullOrUndefined(t.limit) || (e2 += "|l:", e2 += t.limit), t.startAt && (e2 += "|lb:", e2 += t.startAt.inclusive ? "b:" : "a:", e2 += t.startAt.position.map((e3) => canonicalId(e3)).join(",")), t.endAt && (e2 += "|ub:", e2 += t.endAt.inclusive ? "a:" : "b:", e2 += t.endAt.position.map((e3) => canonicalId(e3)).join(",")), t.ue = e2;
  }
  return t.ue;
}
function __PRIVATE_targetEquals(e, t) {
  if (e.limit !== t.limit)
    return false;
  if (e.orderBy.length !== t.orderBy.length)
    return false;
  for (let n = 0;n < e.orderBy.length; n++)
    if (!__PRIVATE_orderByEquals(e.orderBy[n], t.orderBy[n]))
      return false;
  if (e.filters.length !== t.filters.length)
    return false;
  for (let n = 0;n < e.filters.length; n++)
    if (!__PRIVATE_filterEquals(e.filters[n], t.filters[n]))
      return false;
  return e.collectionGroup === t.collectionGroup && (!!e.path.isEqual(t.path) && (!!__PRIVATE_boundEquals(e.startAt, t.startAt) && __PRIVATE_boundEquals(e.endAt, t.endAt)));
}
class __PRIVATE_QueryImpl {
  constructor(e, t = null, n = [], r = [], i = null, s = "F", o = null, _ = null) {
    this.path = e, this.collectionGroup = t, this.explicitOrderBy = n, this.filters = r, this.limit = i, this.limitType = s, this.startAt = o, this.endAt = _, this.ce = null, this.le = null, this.he = null, this.startAt, this.endAt;
  }
}
function __PRIVATE_newQuery(e, t, n, r, i, s, o, _) {
  return new __PRIVATE_QueryImpl(e, t, n, r, i, s, o, _);
}
function __PRIVATE_newQueryForPath(e) {
  return new __PRIVATE_QueryImpl(e);
}
function __PRIVATE_queryMatchesAllDocuments(e) {
  return e.filters.length === 0 && e.limit === null && e.startAt == null && e.endAt == null && (e.explicitOrderBy.length === 0 || e.explicitOrderBy.length === 1 && e.explicitOrderBy[0].field.isKeyField());
}
function __PRIVATE_isCollectionGroupQuery(e) {
  return e.collectionGroup !== null;
}
function __PRIVATE_queryNormalizedOrderBy(e) {
  const t = __PRIVATE_debugCast(e);
  if (t.ce === null) {
    t.ce = [];
    const e2 = new Set;
    for (const n2 of t.explicitOrderBy)
      t.ce.push(n2), e2.add(n2.field.canonicalString());
    const n = t.explicitOrderBy.length > 0 ? t.explicitOrderBy[t.explicitOrderBy.length - 1].dir : "asc", r = function __PRIVATE_getInequalityFilterFields(e3) {
      let t2 = new SortedSet(FieldPath$1.comparator);
      return e3.filters.forEach((e4) => {
        e4.getFlattenedFilters().forEach((e5) => {
          e5.isInequality() && (t2 = t2.add(e5.field));
        });
      }), t2;
    }(t);
    r.forEach((r2) => {
      e2.has(r2.canonicalString()) || r2.isKeyField() || t.ce.push(new OrderBy(r2, n));
    }), e2.has(FieldPath$1.keyField().canonicalString()) || t.ce.push(new OrderBy(FieldPath$1.keyField(), n));
  }
  return t.ce;
}
function __PRIVATE_queryToTarget(e) {
  const t = __PRIVATE_debugCast(e);
  return t.le || (t.le = __PRIVATE__queryToTarget(t, __PRIVATE_queryNormalizedOrderBy(e))), t.le;
}
function __PRIVATE__queryToTarget(e, t) {
  if (e.limitType === "F")
    return __PRIVATE_newTarget(e.path, e.collectionGroup, t, e.filters, e.limit, e.startAt, e.endAt);
  {
    t = t.map((e2) => {
      const t2 = e2.dir === "desc" ? "asc" : "desc";
      return new OrderBy(e2.field, t2);
    });
    const n = e.endAt ? new Bound(e.endAt.position, e.endAt.inclusive) : null, r = e.startAt ? new Bound(e.startAt.position, e.startAt.inclusive) : null;
    return __PRIVATE_newTarget(e.path, e.collectionGroup, t, e.filters, e.limit, n, r);
  }
}
function __PRIVATE_queryWithLimit(e, t, n) {
  return new __PRIVATE_QueryImpl(e.path, e.collectionGroup, e.explicitOrderBy.slice(), e.filters.slice(), t, n, e.startAt, e.endAt);
}
function __PRIVATE_queryEquals(e, t) {
  return __PRIVATE_targetEquals(__PRIVATE_queryToTarget(e), __PRIVATE_queryToTarget(t)) && e.limitType === t.limitType;
}
function __PRIVATE_canonifyQuery(e) {
  return `${__PRIVATE_canonifyTarget(__PRIVATE_queryToTarget(e))}|lt:${e.limitType}`;
}
function __PRIVATE_stringifyQuery(e) {
  return `Query(target=${function __PRIVATE_stringifyTarget(e2) {
    let t = e2.path.canonicalString();
    return e2.collectionGroup !== null && (t += " collectionGroup=" + e2.collectionGroup), e2.filters.length > 0 && (t += `, filters: [${e2.filters.map((e3) => __PRIVATE_stringifyFilter(e3)).join(", ")}]`), __PRIVATE_isNullOrUndefined(e2.limit) || (t += ", limit: " + e2.limit), e2.orderBy.length > 0 && (t += `, orderBy: [${e2.orderBy.map((e3) => function __PRIVATE_stringifyOrderBy(e4) {
      return `${e4.field.canonicalString()} (${e4.dir})`;
    }(e3)).join(", ")}]`), e2.startAt && (t += ", startAt: ", t += e2.startAt.inclusive ? "b:" : "a:", t += e2.startAt.position.map((e3) => canonicalId(e3)).join(",")), e2.endAt && (t += ", endAt: ", t += e2.endAt.inclusive ? "a:" : "b:", t += e2.endAt.position.map((e3) => canonicalId(e3)).join(",")), `Target(${t})`;
  }(__PRIVATE_queryToTarget(e))}; limitType=${e.limitType})`;
}
function __PRIVATE_queryMatches(e, t) {
  return t.isFoundDocument() && function __PRIVATE_queryMatchesPathAndCollectionGroup(e2, t2) {
    const n = t2.key.path;
    return e2.collectionGroup !== null ? t2.key.hasCollectionId(e2.collectionGroup) && e2.path.isPrefixOf(n) : DocumentKey.isDocumentKey(e2.path) ? e2.path.isEqual(n) : e2.path.isImmediateParentOf(n);
  }(e, t) && function __PRIVATE_queryMatchesOrderBy(e2, t2) {
    for (const n of __PRIVATE_queryNormalizedOrderBy(e2))
      if (!n.field.isKeyField() && t2.data.field(n.field) === null)
        return false;
    return true;
  }(e, t) && function __PRIVATE_queryMatchesFilters(e2, t2) {
    for (const n of e2.filters)
      if (!n.matches(t2))
        return false;
    return true;
  }(e, t) && function __PRIVATE_queryMatchesBounds(e2, t2) {
    if (e2.startAt && !function __PRIVATE_boundSortsBeforeDocument(e3, t3, n) {
      const r = __PRIVATE_boundCompareToDocument(e3, t3, n);
      return e3.inclusive ? r <= 0 : r < 0;
    }(e2.startAt, __PRIVATE_queryNormalizedOrderBy(e2), t2))
      return false;
    if (e2.endAt && !function __PRIVATE_boundSortsAfterDocument(e3, t3, n) {
      const r = __PRIVATE_boundCompareToDocument(e3, t3, n);
      return e3.inclusive ? r >= 0 : r > 0;
    }(e2.endAt, __PRIVATE_queryNormalizedOrderBy(e2), t2))
      return false;
    return true;
  }(e, t);
}
function __PRIVATE_newQueryComparator(e) {
  return (t, n) => {
    let r = false;
    for (const i of __PRIVATE_queryNormalizedOrderBy(e)) {
      const e2 = __PRIVATE_compareDocs(i, t, n);
      if (e2 !== 0)
        return e2;
      r = r || i.field.isKeyField();
    }
    return 0;
  };
}
function __PRIVATE_compareDocs(e, t, n) {
  const r = e.field.isKeyField() ? DocumentKey.comparator(t.key, n.key) : function __PRIVATE_compareDocumentsByField(e2, t2, n2) {
    const r2 = t2.data.field(e2), i = n2.data.field(e2);
    return r2 !== null && i !== null ? __PRIVATE_valueCompare(r2, i) : fail();
  }(e.field, t, n);
  switch (e.dir) {
    case "asc":
      return r;
    case "desc":
      return -1 * r;
    default:
      return fail();
  }
}

class ObjectMap {
  constructor(e, t) {
    this.mapKeyFn = e, this.equalsFn = t, this.inner = {}, this.innerSize = 0;
  }
  get(e) {
    const t = this.mapKeyFn(e), n = this.inner[t];
    if (n !== undefined) {
      for (const [t2, r] of n)
        if (this.equalsFn(t2, e))
          return r;
    }
  }
  has(e) {
    return this.get(e) !== undefined;
  }
  set(e, t) {
    const n = this.mapKeyFn(e), r = this.inner[n];
    if (r === undefined)
      return this.inner[n] = [[e, t]], void this.innerSize++;
    for (let n2 = 0;n2 < r.length; n2++)
      if (this.equalsFn(r[n2][0], e))
        return void (r[n2] = [e, t]);
    r.push([e, t]), this.innerSize++;
  }
  delete(e) {
    const t = this.mapKeyFn(e), n = this.inner[t];
    if (n === undefined)
      return false;
    for (let r = 0;r < n.length; r++)
      if (this.equalsFn(n[r][0], e))
        return n.length === 1 ? delete this.inner[t] : n.splice(r, 1), this.innerSize--, true;
    return false;
  }
  forEach(e) {
    forEach(this.inner, (t, n) => {
      for (const [t2, r] of n)
        e(t2, r);
    });
  }
  isEmpty() {
    return isEmpty(this.inner);
  }
  size() {
    return this.innerSize;
  }
}
var _e = new SortedMap(DocumentKey.comparator);
function __PRIVATE_mutableDocumentMap() {
  return _e;
}
var ae = new SortedMap(DocumentKey.comparator);
function documentMap(...e) {
  let t = ae;
  for (const n of e)
    t = t.insert(n.key, n);
  return t;
}
function __PRIVATE_convertOverlayedDocumentMapToDocumentMap(e) {
  let t = ae;
  return e.forEach((e2, n) => t = t.insert(e2, n.overlayedDocument)), t;
}
function __PRIVATE_newOverlayMap() {
  return __PRIVATE_newDocumentKeyMap();
}
function __PRIVATE_newMutationMap() {
  return __PRIVATE_newDocumentKeyMap();
}
function __PRIVATE_newDocumentKeyMap() {
  return new ObjectMap((e) => e.toString(), (e, t) => e.isEqual(t));
}
var ue = new SortedMap(DocumentKey.comparator);
var ce = new SortedSet(DocumentKey.comparator);
function __PRIVATE_documentKeySet(...e) {
  let t = ce;
  for (const n of e)
    t = t.add(n);
  return t;
}
var le = new SortedSet(__PRIVATE_primitiveComparator);
function __PRIVATE_targetIdSet() {
  return le;
}
function __PRIVATE_toDouble(e, t) {
  if (e.useProto3Json) {
    if (isNaN(t))
      return {
        doubleValue: "NaN"
      };
    if (t === 1 / 0)
      return {
        doubleValue: "Infinity"
      };
    if (t === -1 / 0)
      return {
        doubleValue: "-Infinity"
      };
  }
  return {
    doubleValue: __PRIVATE_isNegativeZero(t) ? "-0" : t
  };
}
function __PRIVATE_toInteger(e) {
  return {
    integerValue: "" + e
  };
}
function toNumber(e, t) {
  return isSafeInteger(t) ? __PRIVATE_toInteger(t) : __PRIVATE_toDouble(e, t);
}

class TransformOperation {
  constructor() {
    this._ = undefined;
  }
}
function __PRIVATE_applyTransformOperationToLocalView(e, t, n) {
  return e instanceof __PRIVATE_ServerTimestampTransform ? function serverTimestamp$1(e2, t2) {
    const n2 = {
      fields: {
        __type__: {
          stringValue: "server_timestamp"
        },
        __local_write_time__: {
          timestampValue: {
            seconds: e2.seconds,
            nanos: e2.nanoseconds
          }
        }
      }
    };
    return t2 && __PRIVATE_isServerTimestamp(t2) && (t2 = __PRIVATE_getPreviousValue(t2)), t2 && (n2.fields.__previous_value__ = t2), {
      mapValue: n2
    };
  }(n, t) : e instanceof __PRIVATE_ArrayUnionTransformOperation ? __PRIVATE_applyArrayUnionTransformOperation(e, t) : e instanceof __PRIVATE_ArrayRemoveTransformOperation ? __PRIVATE_applyArrayRemoveTransformOperation(e, t) : function __PRIVATE_applyNumericIncrementTransformOperationToLocalView(e2, t2) {
    const n2 = __PRIVATE_computeTransformOperationBaseValue(e2, t2), r = asNumber(n2) + asNumber(e2.Pe);
    return isInteger(n2) && isInteger(e2.Pe) ? __PRIVATE_toInteger(r) : __PRIVATE_toDouble(e2.serializer, r);
  }(e, t);
}
function __PRIVATE_applyTransformOperationToRemoteDocument(e, t, n) {
  return e instanceof __PRIVATE_ArrayUnionTransformOperation ? __PRIVATE_applyArrayUnionTransformOperation(e, t) : e instanceof __PRIVATE_ArrayRemoveTransformOperation ? __PRIVATE_applyArrayRemoveTransformOperation(e, t) : n;
}
function __PRIVATE_computeTransformOperationBaseValue(e, t) {
  return e instanceof __PRIVATE_NumericIncrementTransformOperation ? function __PRIVATE_isNumber(e2) {
    return isInteger(e2) || function __PRIVATE_isDouble(e3) {
      return !!e3 && "doubleValue" in e3;
    }(e2);
  }(t) ? t : {
    integerValue: 0
  } : null;
}

class __PRIVATE_ServerTimestampTransform extends TransformOperation {
}

class __PRIVATE_ArrayUnionTransformOperation extends TransformOperation {
  constructor(e) {
    super(), this.elements = e;
  }
}
function __PRIVATE_applyArrayUnionTransformOperation(e, t) {
  const n = __PRIVATE_coercedFieldValuesArray(t);
  for (const t2 of e.elements)
    n.some((e2) => __PRIVATE_valueEquals(e2, t2)) || n.push(t2);
  return {
    arrayValue: {
      values: n
    }
  };
}

class __PRIVATE_ArrayRemoveTransformOperation extends TransformOperation {
  constructor(e) {
    super(), this.elements = e;
  }
}
function __PRIVATE_applyArrayRemoveTransformOperation(e, t) {
  let n = __PRIVATE_coercedFieldValuesArray(t);
  for (const t2 of e.elements)
    n = n.filter((e2) => !__PRIVATE_valueEquals(e2, t2));
  return {
    arrayValue: {
      values: n
    }
  };
}

class __PRIVATE_NumericIncrementTransformOperation extends TransformOperation {
  constructor(e, t) {
    super(), this.serializer = e, this.Pe = t;
  }
}
function asNumber(e) {
  return __PRIVATE_normalizeNumber(e.integerValue || e.doubleValue);
}
function __PRIVATE_coercedFieldValuesArray(e) {
  return isArray(e) && e.arrayValue.values ? e.arrayValue.values.slice() : [];
}
function __PRIVATE_fieldTransformEquals(e, t) {
  return e.field.isEqual(t.field) && function __PRIVATE_transformOperationEquals(e2, t2) {
    return e2 instanceof __PRIVATE_ArrayUnionTransformOperation && t2 instanceof __PRIVATE_ArrayUnionTransformOperation || e2 instanceof __PRIVATE_ArrayRemoveTransformOperation && t2 instanceof __PRIVATE_ArrayRemoveTransformOperation ? __PRIVATE_arrayEquals(e2.elements, t2.elements, __PRIVATE_valueEquals) : e2 instanceof __PRIVATE_NumericIncrementTransformOperation && t2 instanceof __PRIVATE_NumericIncrementTransformOperation ? __PRIVATE_valueEquals(e2.Pe, t2.Pe) : e2 instanceof __PRIVATE_ServerTimestampTransform && t2 instanceof __PRIVATE_ServerTimestampTransform;
  }(e.transform, t.transform);
}

class MutationResult {
  constructor(e, t) {
    this.version = e, this.transformResults = t;
  }
}

class Precondition {
  constructor(e, t) {
    this.updateTime = e, this.exists = t;
  }
  static none() {
    return new Precondition;
  }
  static exists(e) {
    return new Precondition(undefined, e);
  }
  static updateTime(e) {
    return new Precondition(e);
  }
  get isNone() {
    return this.updateTime === undefined && this.exists === undefined;
  }
  isEqual(e) {
    return this.exists === e.exists && (this.updateTime ? !!e.updateTime && this.updateTime.isEqual(e.updateTime) : !e.updateTime);
  }
}
function __PRIVATE_preconditionIsValidForDocument(e, t) {
  return e.updateTime !== undefined ? t.isFoundDocument() && t.version.isEqual(e.updateTime) : e.exists === undefined || e.exists === t.isFoundDocument();
}

class Mutation {
}
function __PRIVATE_calculateOverlayMutation(e, t) {
  if (!e.hasLocalMutations || t && t.fields.length === 0)
    return null;
  if (t === null)
    return e.isNoDocument() ? new __PRIVATE_DeleteMutation(e.key, Precondition.none()) : new __PRIVATE_SetMutation(e.key, e.data, Precondition.none());
  {
    const n = e.data, r = ObjectValue.empty();
    let i = new SortedSet(FieldPath$1.comparator);
    for (let e2 of t.fields)
      if (!i.has(e2)) {
        let t2 = n.field(e2);
        t2 === null && e2.length > 1 && (e2 = e2.popLast(), t2 = n.field(e2)), t2 === null ? r.delete(e2) : r.set(e2, t2), i = i.add(e2);
      }
    return new __PRIVATE_PatchMutation(e.key, r, new FieldMask(i.toArray()), Precondition.none());
  }
}
function __PRIVATE_mutationApplyToRemoteDocument(e, t, n) {
  e instanceof __PRIVATE_SetMutation ? function __PRIVATE_setMutationApplyToRemoteDocument(e2, t2, n2) {
    const r = e2.value.clone(), i = __PRIVATE_serverTransformResults(e2.fieldTransforms, t2, n2.transformResults);
    r.setAll(i), t2.convertToFoundDocument(n2.version, r).setHasCommittedMutations();
  }(e, t, n) : e instanceof __PRIVATE_PatchMutation ? function __PRIVATE_patchMutationApplyToRemoteDocument(e2, t2, n2) {
    if (!__PRIVATE_preconditionIsValidForDocument(e2.precondition, t2))
      return void t2.convertToUnknownDocument(n2.version);
    const r = __PRIVATE_serverTransformResults(e2.fieldTransforms, t2, n2.transformResults), i = t2.data;
    i.setAll(__PRIVATE_getPatch(e2)), i.setAll(r), t2.convertToFoundDocument(n2.version, i).setHasCommittedMutations();
  }(e, t, n) : function __PRIVATE_deleteMutationApplyToRemoteDocument(e2, t2, n2) {
    t2.convertToNoDocument(n2.version).setHasCommittedMutations();
  }(0, t, n);
}
function __PRIVATE_mutationApplyToLocalView(e, t, n, r) {
  return e instanceof __PRIVATE_SetMutation ? function __PRIVATE_setMutationApplyToLocalView(e2, t2, n2, r2) {
    if (!__PRIVATE_preconditionIsValidForDocument(e2.precondition, t2))
      return n2;
    const i = e2.value.clone(), s = __PRIVATE_localTransformResults(e2.fieldTransforms, r2, t2);
    return i.setAll(s), t2.convertToFoundDocument(t2.version, i).setHasLocalMutations(), null;
  }(e, t, n, r) : e instanceof __PRIVATE_PatchMutation ? function __PRIVATE_patchMutationApplyToLocalView(e2, t2, n2, r2) {
    if (!__PRIVATE_preconditionIsValidForDocument(e2.precondition, t2))
      return n2;
    const i = __PRIVATE_localTransformResults(e2.fieldTransforms, r2, t2), s = t2.data;
    if (s.setAll(__PRIVATE_getPatch(e2)), s.setAll(i), t2.convertToFoundDocument(t2.version, s).setHasLocalMutations(), n2 === null)
      return null;
    return n2.unionWith(e2.fieldMask.fields).unionWith(e2.fieldTransforms.map((e3) => e3.field));
  }(e, t, n, r) : function __PRIVATE_deleteMutationApplyToLocalView(e2, t2, n2) {
    if (__PRIVATE_preconditionIsValidForDocument(e2.precondition, t2))
      return t2.convertToNoDocument(t2.version).setHasLocalMutations(), null;
    return n2;
  }(e, t, n);
}
function __PRIVATE_mutationExtractBaseValue(e, t) {
  let n = null;
  for (const r of e.fieldTransforms) {
    const e2 = t.data.field(r.field), i = __PRIVATE_computeTransformOperationBaseValue(r.transform, e2 || null);
    i != null && (n === null && (n = ObjectValue.empty()), n.set(r.field, i));
  }
  return n || null;
}
function __PRIVATE_mutationEquals(e, t) {
  return e.type === t.type && (!!e.key.isEqual(t.key) && (!!e.precondition.isEqual(t.precondition) && (!!function __PRIVATE_fieldTransformsAreEqual(e2, t2) {
    return e2 === undefined && t2 === undefined || !(!e2 || !t2) && __PRIVATE_arrayEquals(e2, t2, (e3, t3) => __PRIVATE_fieldTransformEquals(e3, t3));
  }(e.fieldTransforms, t.fieldTransforms) && (e.type === 0 ? e.value.isEqual(t.value) : e.type !== 1 || e.data.isEqual(t.data) && e.fieldMask.isEqual(t.fieldMask)))));
}

class __PRIVATE_SetMutation extends Mutation {
  constructor(e, t, n, r = []) {
    super(), this.key = e, this.value = t, this.precondition = n, this.fieldTransforms = r, this.type = 0;
  }
  getFieldMask() {
    return null;
  }
}

class __PRIVATE_PatchMutation extends Mutation {
  constructor(e, t, n, r, i = []) {
    super(), this.key = e, this.data = t, this.fieldMask = n, this.precondition = r, this.fieldTransforms = i, this.type = 1;
  }
  getFieldMask() {
    return this.fieldMask;
  }
}
function __PRIVATE_getPatch(e) {
  const t = new Map;
  return e.fieldMask.fields.forEach((n) => {
    if (!n.isEmpty()) {
      const r = e.data.field(n);
      t.set(n, r);
    }
  }), t;
}
function __PRIVATE_serverTransformResults(e, t, n) {
  const r = new Map;
  __PRIVATE_hardAssert(e.length === n.length);
  for (let i = 0;i < n.length; i++) {
    const s = e[i], o = s.transform, _ = t.data.field(s.field);
    r.set(s.field, __PRIVATE_applyTransformOperationToRemoteDocument(o, _, n[i]));
  }
  return r;
}
function __PRIVATE_localTransformResults(e, t, n) {
  const r = new Map;
  for (const i of e) {
    const e2 = i.transform, s = n.data.field(i.field);
    r.set(i.field, __PRIVATE_applyTransformOperationToLocalView(e2, s, t));
  }
  return r;
}

class __PRIVATE_DeleteMutation extends Mutation {
  constructor(e, t) {
    super(), this.key = e, this.precondition = t, this.type = 2, this.fieldTransforms = [];
  }
  getFieldMask() {
    return null;
  }
}

class __PRIVATE_VerifyMutation extends Mutation {
  constructor(e, t) {
    super(), this.key = e, this.precondition = t, this.type = 3, this.fieldTransforms = [];
  }
  getFieldMask() {
    return null;
  }
}

class MutationBatch {
  constructor(e, t, n, r) {
    this.batchId = e, this.localWriteTime = t, this.baseMutations = n, this.mutations = r;
  }
  applyToRemoteDocument(e, t) {
    const n = t.mutationResults;
    for (let t2 = 0;t2 < this.mutations.length; t2++) {
      const r = this.mutations[t2];
      if (r.key.isEqual(e.key)) {
        __PRIVATE_mutationApplyToRemoteDocument(r, e, n[t2]);
      }
    }
  }
  applyToLocalView(e, t) {
    for (const n of this.baseMutations)
      n.key.isEqual(e.key) && (t = __PRIVATE_mutationApplyToLocalView(n, e, t, this.localWriteTime));
    for (const n of this.mutations)
      n.key.isEqual(e.key) && (t = __PRIVATE_mutationApplyToLocalView(n, e, t, this.localWriteTime));
    return t;
  }
  applyToLocalDocumentSet(e, t) {
    const n = __PRIVATE_newMutationMap();
    return this.mutations.forEach((r) => {
      const i = e.get(r.key), s = i.overlayedDocument;
      let o = this.applyToLocalView(s, i.mutatedFields);
      o = t.has(r.key) ? null : o;
      const _ = __PRIVATE_calculateOverlayMutation(s, o);
      _ !== null && n.set(r.key, _), s.isValidDocument() || s.convertToNoDocument(SnapshotVersion.min());
    }), n;
  }
  keys() {
    return this.mutations.reduce((e, t) => e.add(t.key), __PRIVATE_documentKeySet());
  }
  isEqual(e) {
    return this.batchId === e.batchId && __PRIVATE_arrayEquals(this.mutations, e.mutations, (e2, t) => __PRIVATE_mutationEquals(e2, t)) && __PRIVATE_arrayEquals(this.baseMutations, e.baseMutations, (e2, t) => __PRIVATE_mutationEquals(e2, t));
  }
}

class MutationBatchResult {
  constructor(e, t, n, r) {
    this.batch = e, this.commitVersion = t, this.mutationResults = n, this.docVersions = r;
  }
  static from(e, t, n) {
    __PRIVATE_hardAssert(e.mutations.length === n.length);
    let r = function __PRIVATE_documentVersionMap() {
      return ue;
    }();
    const i = e.mutations;
    for (let e2 = 0;e2 < i.length; e2++)
      r = r.insert(i[e2].key, n[e2].version);
    return new MutationBatchResult(e, t, n, r);
  }
}

class Overlay {
  constructor(e, t) {
    this.largestBatchId = e, this.mutation = t;
  }
  getKey() {
    return this.mutation.key;
  }
  isEqual(e) {
    return e !== null && this.mutation === e.mutation;
  }
  toString() {
    return `Overlay{
      largestBatchId: ${this.largestBatchId},
      mutation: ${this.mutation.toString()}
    }`;
  }
}
var he;
var Pe;
function __PRIVATE_isPermanentError(e) {
  switch (e) {
    default:
      return fail();
    case v.CANCELLED:
    case v.UNKNOWN:
    case v.DEADLINE_EXCEEDED:
    case v.RESOURCE_EXHAUSTED:
    case v.INTERNAL:
    case v.UNAVAILABLE:
    case v.UNAUTHENTICATED:
      return false;
    case v.INVALID_ARGUMENT:
    case v.NOT_FOUND:
    case v.ALREADY_EXISTS:
    case v.PERMISSION_DENIED:
    case v.FAILED_PRECONDITION:
    case v.ABORTED:
    case v.OUT_OF_RANGE:
    case v.UNIMPLEMENTED:
    case v.DATA_LOSS:
      return true;
  }
}
function __PRIVATE_mapCodeFromRpcCode(e) {
  if (e === undefined)
    return __PRIVATE_logError("GRPC error has no .code"), v.UNKNOWN;
  switch (e) {
    case he.OK:
      return v.OK;
    case he.CANCELLED:
      return v.CANCELLED;
    case he.UNKNOWN:
      return v.UNKNOWN;
    case he.DEADLINE_EXCEEDED:
      return v.DEADLINE_EXCEEDED;
    case he.RESOURCE_EXHAUSTED:
      return v.RESOURCE_EXHAUSTED;
    case he.INTERNAL:
      return v.INTERNAL;
    case he.UNAVAILABLE:
      return v.UNAVAILABLE;
    case he.UNAUTHENTICATED:
      return v.UNAUTHENTICATED;
    case he.INVALID_ARGUMENT:
      return v.INVALID_ARGUMENT;
    case he.NOT_FOUND:
      return v.NOT_FOUND;
    case he.ALREADY_EXISTS:
      return v.ALREADY_EXISTS;
    case he.PERMISSION_DENIED:
      return v.PERMISSION_DENIED;
    case he.FAILED_PRECONDITION:
      return v.FAILED_PRECONDITION;
    case he.ABORTED:
      return v.ABORTED;
    case he.OUT_OF_RANGE:
      return v.OUT_OF_RANGE;
    case he.UNIMPLEMENTED:
      return v.UNIMPLEMENTED;
    case he.DATA_LOSS:
      return v.DATA_LOSS;
    default:
      return fail();
  }
}
(Pe = he || (he = {}))[Pe.OK = 0] = "OK", Pe[Pe.CANCELLED = 1] = "CANCELLED", Pe[Pe.UNKNOWN = 2] = "UNKNOWN", Pe[Pe.INVALID_ARGUMENT = 3] = "INVALID_ARGUMENT", Pe[Pe.DEADLINE_EXCEEDED = 4] = "DEADLINE_EXCEEDED", Pe[Pe.NOT_FOUND = 5] = "NOT_FOUND", Pe[Pe.ALREADY_EXISTS = 6] = "ALREADY_EXISTS", Pe[Pe.PERMISSION_DENIED = 7] = "PERMISSION_DENIED", Pe[Pe.UNAUTHENTICATED = 16] = "UNAUTHENTICATED", Pe[Pe.RESOURCE_EXHAUSTED = 8] = "RESOURCE_EXHAUSTED", Pe[Pe.FAILED_PRECONDITION = 9] = "FAILED_PRECONDITION", Pe[Pe.ABORTED = 10] = "ABORTED", Pe[Pe.OUT_OF_RANGE = 11] = "OUT_OF_RANGE", Pe[Pe.UNIMPLEMENTED = 12] = "UNIMPLEMENTED", Pe[Pe.INTERNAL = 13] = "INTERNAL", Pe[Pe.UNAVAILABLE = 14] = "UNAVAILABLE", Pe[Pe.DATA_LOSS = 15] = "DATA_LOSS";
var Te = new Integer([4294967295, 4294967295], 0);
var Ee = (() => {
  const e = {
    asc: "ASCENDING",
    desc: "DESCENDING"
  };
  return e;
})();
var de = (() => {
  const e = {
    "<": "LESS_THAN",
    "<=": "LESS_THAN_OR_EQUAL",
    ">": "GREATER_THAN",
    ">=": "GREATER_THAN_OR_EQUAL",
    "==": "EQUAL",
    "!=": "NOT_EQUAL",
    "array-contains": "ARRAY_CONTAINS",
    in: "IN",
    "not-in": "NOT_IN",
    "array-contains-any": "ARRAY_CONTAINS_ANY"
  };
  return e;
})();
var Ae = (() => {
  const e = {
    and: "AND",
    or: "OR"
  };
  return e;
})();

class JsonProtoSerializer {
  constructor(e, t) {
    this.databaseId = e, this.useProto3Json = t;
  }
}
function toTimestamp(e, t) {
  if (e.useProto3Json) {
    return `${new Date(1000 * t.seconds).toISOString().replace(/\.\d*/, "").replace("Z", "")}.${("000000000" + t.nanoseconds).slice(-9)}Z`;
  }
  return {
    seconds: "" + t.seconds,
    nanos: t.nanoseconds
  };
}
function __PRIVATE_toBytes(e, t) {
  return e.useProto3Json ? t.toBase64() : t.toUint8Array();
}
function __PRIVATE_toVersion(e, t) {
  return toTimestamp(e, t.toTimestamp());
}
function __PRIVATE_fromVersion(e) {
  return __PRIVATE_hardAssert(!!e), SnapshotVersion.fromTimestamp(function fromTimestamp(e2) {
    const t = __PRIVATE_normalizeTimestamp(e2);
    return new Timestamp(t.seconds, t.nanos);
  }(e));
}
function __PRIVATE_toResourceName(e, t) {
  return __PRIVATE_toResourcePath(e, t).canonicalString();
}
function __PRIVATE_toResourcePath(e, t) {
  const n = function __PRIVATE_fullyQualifiedPrefixPath(e2) {
    return new ResourcePath(["projects", e2.projectId, "databases", e2.database]);
  }(e).child("documents");
  return t === undefined ? n : n.child(t);
}
function __PRIVATE_fromResourceName(e) {
  const t = ResourcePath.fromString(e);
  return __PRIVATE_hardAssert(__PRIVATE_isValidResourceName(t)), t;
}
function __PRIVATE_toName(e, t) {
  return __PRIVATE_toResourceName(e.databaseId, t.path);
}
function __PRIVATE_fromQueryPath(e) {
  const t = __PRIVATE_fromResourceName(e);
  return t.length === 4 ? ResourcePath.emptyPath() : __PRIVATE_extractLocalPathFromResourceName(t);
}
function __PRIVATE_getEncodedDatabaseId(e) {
  return new ResourcePath(["projects", e.databaseId.projectId, "databases", e.databaseId.database]).canonicalString();
}
function __PRIVATE_extractLocalPathFromResourceName(e) {
  return __PRIVATE_hardAssert(e.length > 4 && e.get(4) === "documents"), e.popFirst(5);
}
function __PRIVATE_toMutationDocument(e, t, n) {
  return {
    name: __PRIVATE_toName(e, t),
    fields: n.value.mapValue.fields
  };
}
function toMutation(e, t) {
  let n;
  if (t instanceof __PRIVATE_SetMutation)
    n = {
      update: __PRIVATE_toMutationDocument(e, t.key, t.value)
    };
  else if (t instanceof __PRIVATE_DeleteMutation)
    n = {
      delete: __PRIVATE_toName(e, t.key)
    };
  else if (t instanceof __PRIVATE_PatchMutation)
    n = {
      update: __PRIVATE_toMutationDocument(e, t.key, t.data),
      updateMask: __PRIVATE_toDocumentMask(t.fieldMask)
    };
  else {
    if (!(t instanceof __PRIVATE_VerifyMutation))
      return fail();
    n = {
      verify: __PRIVATE_toName(e, t.key)
    };
  }
  return t.fieldTransforms.length > 0 && (n.updateTransforms = t.fieldTransforms.map((e2) => function __PRIVATE_toFieldTransform(e3, t2) {
    const n2 = t2.transform;
    if (n2 instanceof __PRIVATE_ServerTimestampTransform)
      return {
        fieldPath: t2.field.canonicalString(),
        setToServerValue: "REQUEST_TIME"
      };
    if (n2 instanceof __PRIVATE_ArrayUnionTransformOperation)
      return {
        fieldPath: t2.field.canonicalString(),
        appendMissingElements: {
          values: n2.elements
        }
      };
    if (n2 instanceof __PRIVATE_ArrayRemoveTransformOperation)
      return {
        fieldPath: t2.field.canonicalString(),
        removeAllFromArray: {
          values: n2.elements
        }
      };
    if (n2 instanceof __PRIVATE_NumericIncrementTransformOperation)
      return {
        fieldPath: t2.field.canonicalString(),
        increment: n2.Pe
      };
    throw fail();
  }(0, e2))), t.precondition.isNone || (n.currentDocument = function __PRIVATE_toPrecondition(e2, t2) {
    return t2.updateTime !== undefined ? {
      updateTime: __PRIVATE_toVersion(e2, t2.updateTime)
    } : t2.exists !== undefined ? {
      exists: t2.exists
    } : fail();
  }(e, t.precondition)), n;
}
function __PRIVATE_fromWriteResults(e, t) {
  return e && e.length > 0 ? (__PRIVATE_hardAssert(t !== undefined), e.map((e2) => function __PRIVATE_fromWriteResult(e3, t2) {
    let n = e3.updateTime ? __PRIVATE_fromVersion(e3.updateTime) : __PRIVATE_fromVersion(t2);
    return n.isEqual(SnapshotVersion.min()) && (n = __PRIVATE_fromVersion(t2)), new MutationResult(n, e3.transformResults || []);
  }(e2, t))) : [];
}
function __PRIVATE_convertQueryTargetToQuery(e) {
  let t = __PRIVATE_fromQueryPath(e.parent);
  const n = e.structuredQuery, r = n.from ? n.from.length : 0;
  let i = null;
  if (r > 0) {
    __PRIVATE_hardAssert(r === 1);
    const e2 = n.from[0];
    e2.allDescendants ? i = e2.collectionId : t = t.child(e2.collectionId);
  }
  let s = [];
  n.where && (s = function __PRIVATE_fromFilters(e2) {
    const t2 = __PRIVATE_fromFilter(e2);
    if (t2 instanceof CompositeFilter && __PRIVATE_compositeFilterIsFlatConjunction(t2))
      return t2.getFilters();
    return [t2];
  }(n.where));
  let o = [];
  n.orderBy && (o = function __PRIVATE_fromOrder(e2) {
    return e2.map((e3) => function __PRIVATE_fromPropertyOrder(e4) {
      return new OrderBy(__PRIVATE_fromFieldPathReference(e4.field), function __PRIVATE_fromDirection(e5) {
        switch (e5) {
          case "ASCENDING":
            return "asc";
          case "DESCENDING":
            return "desc";
          default:
            return;
        }
      }(e4.direction));
    }(e3));
  }(n.orderBy));
  let _ = null;
  n.limit && (_ = function __PRIVATE_fromInt32Proto(e2) {
    let t2;
    return t2 = typeof e2 == "object" ? e2.value : e2, __PRIVATE_isNullOrUndefined(t2) ? null : t2;
  }(n.limit));
  let a = null;
  n.startAt && (a = function __PRIVATE_fromStartAtCursor(e2) {
    const t2 = !!e2.before, n2 = e2.values || [];
    return new Bound(n2, t2);
  }(n.startAt));
  let u = null;
  return n.endAt && (u = function __PRIVATE_fromEndAtCursor(e2) {
    const t2 = !e2.before, n2 = e2.values || [];
    return new Bound(n2, t2);
  }(n.endAt)), __PRIVATE_newQuery(t, i, o, s, _, "F", a, u);
}
function __PRIVATE_fromFilter(e) {
  return e.unaryFilter !== undefined ? function __PRIVATE_fromUnaryFilter(e2) {
    switch (e2.unaryFilter.op) {
      case "IS_NAN":
        const t = __PRIVATE_fromFieldPathReference(e2.unaryFilter.field);
        return FieldFilter.create(t, "==", {
          doubleValue: NaN
        });
      case "IS_NULL":
        const n = __PRIVATE_fromFieldPathReference(e2.unaryFilter.field);
        return FieldFilter.create(n, "==", {
          nullValue: "NULL_VALUE"
        });
      case "IS_NOT_NAN":
        const r = __PRIVATE_fromFieldPathReference(e2.unaryFilter.field);
        return FieldFilter.create(r, "!=", {
          doubleValue: NaN
        });
      case "IS_NOT_NULL":
        const i = __PRIVATE_fromFieldPathReference(e2.unaryFilter.field);
        return FieldFilter.create(i, "!=", {
          nullValue: "NULL_VALUE"
        });
      default:
        return fail();
    }
  }(e) : e.fieldFilter !== undefined ? function __PRIVATE_fromFieldFilter(e2) {
    return FieldFilter.create(__PRIVATE_fromFieldPathReference(e2.fieldFilter.field), function __PRIVATE_fromOperatorName(e3) {
      switch (e3) {
        case "EQUAL":
          return "==";
        case "NOT_EQUAL":
          return "!=";
        case "GREATER_THAN":
          return ">";
        case "GREATER_THAN_OR_EQUAL":
          return ">=";
        case "LESS_THAN":
          return "<";
        case "LESS_THAN_OR_EQUAL":
          return "<=";
        case "ARRAY_CONTAINS":
          return "array-contains";
        case "IN":
          return "in";
        case "NOT_IN":
          return "not-in";
        case "ARRAY_CONTAINS_ANY":
          return "array-contains-any";
        default:
          return fail();
      }
    }(e2.fieldFilter.op), e2.fieldFilter.value);
  }(e) : e.compositeFilter !== undefined ? function __PRIVATE_fromCompositeFilter(e2) {
    return CompositeFilter.create(e2.compositeFilter.filters.map((e3) => __PRIVATE_fromFilter(e3)), function __PRIVATE_fromCompositeOperatorName(e3) {
      switch (e3) {
        case "AND":
          return "and";
        case "OR":
          return "or";
        default:
          return fail();
      }
    }(e2.compositeFilter.op));
  }(e) : fail();
}
function __PRIVATE_fromFieldPathReference(e) {
  return FieldPath$1.fromServerFormat(e.fieldPath);
}
function __PRIVATE_toDocumentMask(e) {
  const t = [];
  return e.fields.forEach((e2) => t.push(e2.canonicalString())), {
    fieldPaths: t
  };
}
function __PRIVATE_isValidResourceName(e) {
  return e.length >= 4 && e.get(0) === "projects" && e.get(2) === "databases";
}
class __PRIVATE_LocalSerializer {
  constructor(e) {
    this.ct = e;
  }
}
function __PRIVATE_fromBundledQuery(e) {
  const t = __PRIVATE_convertQueryTargetToQuery({
    parent: e.parent,
    structuredQuery: e.structuredQuery
  });
  return e.limitType === "LAST" ? __PRIVATE_queryWithLimit(t, t.limit, "L") : t;
}
class __PRIVATE_FirestoreIndexValueWriter {
  constructor() {
  }
  It(e, t) {
    this.Tt(e, t), t.Et();
  }
  Tt(e, t) {
    if ("nullValue" in e)
      this.dt(t, 5);
    else if ("booleanValue" in e)
      this.dt(t, 10), t.At(e.booleanValue ? 1 : 0);
    else if ("integerValue" in e)
      this.dt(t, 15), t.At(__PRIVATE_normalizeNumber(e.integerValue));
    else if ("doubleValue" in e) {
      const n = __PRIVATE_normalizeNumber(e.doubleValue);
      isNaN(n) ? this.dt(t, 13) : (this.dt(t, 15), __PRIVATE_isNegativeZero(n) ? t.At(0) : t.At(n));
    } else if ("timestampValue" in e) {
      let n = e.timestampValue;
      this.dt(t, 20), typeof n == "string" && (n = __PRIVATE_normalizeTimestamp(n)), t.Rt(`${n.seconds || ""}`), t.At(n.nanos || 0);
    } else if ("stringValue" in e)
      this.Vt(e.stringValue, t), this.ft(t);
    else if ("bytesValue" in e)
      this.dt(t, 30), t.gt(__PRIVATE_normalizeByteString(e.bytesValue)), this.ft(t);
    else if ("referenceValue" in e)
      this.yt(e.referenceValue, t);
    else if ("geoPointValue" in e) {
      const n = e.geoPointValue;
      this.dt(t, 45), t.At(n.latitude || 0), t.At(n.longitude || 0);
    } else
      "mapValue" in e ? __PRIVATE_isMaxValue(e) ? this.dt(t, Number.MAX_SAFE_INTEGER) : __PRIVATE_isVectorValue(e) ? this.wt(e.mapValue, t) : (this.St(e.mapValue, t), this.ft(t)) : ("arrayValue" in e) ? (this.bt(e.arrayValue, t), this.ft(t)) : fail();
  }
  Vt(e, t) {
    this.dt(t, 25), this.Dt(e, t);
  }
  Dt(e, t) {
    t.Rt(e);
  }
  St(e, t) {
    const n = e.fields || {};
    this.dt(t, 55);
    for (const e2 of Object.keys(n))
      this.Vt(e2, t), this.Tt(n[e2], t);
  }
  wt(e, t) {
    var n, r;
    const i = e.fields || {};
    this.dt(t, 53);
    const s = "value", o = ((r = (n = i[s].arrayValue) === null || n === undefined ? undefined : n.values) === null || r === undefined ? undefined : r.length) || 0;
    this.dt(t, 15), t.At(__PRIVATE_normalizeNumber(o)), this.Vt(s, t), this.Tt(i[s], t);
  }
  bt(e, t) {
    const n = e.values || [];
    this.dt(t, 50);
    for (const e2 of n)
      this.Tt(e2, t);
  }
  yt(e, t) {
    this.dt(t, 37);
    DocumentKey.fromName(e).path.forEach((e2) => {
      this.dt(t, 60), this.Dt(e2, t);
    });
  }
  dt(e, t) {
    e.At(t);
  }
  ft(e) {
    e.At(2);
  }
}
__PRIVATE_FirestoreIndexValueWriter.vt = new __PRIVATE_FirestoreIndexValueWriter;
class __PRIVATE_MemoryIndexManager {
  constructor() {
    this.un = new __PRIVATE_MemoryCollectionParentIndex;
  }
  addToCollectionParentIndex(e, t) {
    return this.un.add(t), PersistencePromise.resolve();
  }
  getCollectionParents(e, t) {
    return PersistencePromise.resolve(this.un.getEntries(t));
  }
  addFieldIndex(e, t) {
    return PersistencePromise.resolve();
  }
  deleteFieldIndex(e, t) {
    return PersistencePromise.resolve();
  }
  deleteAllFieldIndexes(e) {
    return PersistencePromise.resolve();
  }
  createTargetIndexes(e, t) {
    return PersistencePromise.resolve();
  }
  getDocumentsMatchingTarget(e, t) {
    return PersistencePromise.resolve(null);
  }
  getIndexType(e, t) {
    return PersistencePromise.resolve(0);
  }
  getFieldIndexes(e, t) {
    return PersistencePromise.resolve([]);
  }
  getNextCollectionGroupToUpdate(e) {
    return PersistencePromise.resolve(null);
  }
  getMinOffset(e, t) {
    return PersistencePromise.resolve(IndexOffset.min());
  }
  getMinOffsetFromCollectionGroup(e, t) {
    return PersistencePromise.resolve(IndexOffset.min());
  }
  updateCollectionGroup(e, t, n) {
    return PersistencePromise.resolve();
  }
  updateIndexEntries(e, t) {
    return PersistencePromise.resolve();
  }
}

class __PRIVATE_MemoryCollectionParentIndex {
  constructor() {
    this.index = {};
  }
  add(e) {
    const t = e.lastSegment(), n = e.popLast(), r = this.index[t] || new SortedSet(ResourcePath.comparator), i = !r.has(n);
    return this.index[t] = r.add(n), i;
  }
  has(e) {
    const t = e.lastSegment(), n = e.popLast(), r = this.index[t];
    return r && r.has(n);
  }
  getEntries(e) {
    return (this.index[e] || new SortedSet(ResourcePath.comparator)).toArray();
  }
}
var Re = new Uint8Array(0);
class LruParams {
  constructor(e, t, n) {
    this.cacheSizeCollectionThreshold = e, this.percentileToCollect = t, this.maximumSequenceNumbersToCollect = n;
  }
  static withCacheSize(e) {
    return new LruParams(e, LruParams.DEFAULT_COLLECTION_PERCENTILE, LruParams.DEFAULT_MAX_SEQUENCE_NUMBERS_TO_COLLECT);
  }
}
LruParams.DEFAULT_COLLECTION_PERCENTILE = 10, LruParams.DEFAULT_MAX_SEQUENCE_NUMBERS_TO_COLLECT = 1000, LruParams.DEFAULT = new LruParams(41943040, LruParams.DEFAULT_COLLECTION_PERCENTILE, LruParams.DEFAULT_MAX_SEQUENCE_NUMBERS_TO_COLLECT), LruParams.DISABLED = new LruParams(-1, 0, 0);
class __PRIVATE_TargetIdGenerator {
  constructor(e) {
    this.Ln = e;
  }
  next() {
    return this.Ln += 2, this.Ln;
  }
  static Bn() {
    return new __PRIVATE_TargetIdGenerator(0);
  }
  static kn() {
    return new __PRIVATE_TargetIdGenerator(-1);
  }
}
class RemoteDocumentChangeBuffer {
  constructor() {
    this.changes = new ObjectMap((e) => e.toString(), (e, t) => e.isEqual(t)), this.changesApplied = false;
  }
  addEntry(e) {
    this.assertNotApplied(), this.changes.set(e.key, e);
  }
  removeEntry(e, t) {
    this.assertNotApplied(), this.changes.set(e, MutableDocument.newInvalidDocument(e).setReadTime(t));
  }
  getEntry(e, t) {
    this.assertNotApplied();
    const n = this.changes.get(t);
    return n !== undefined ? PersistencePromise.resolve(n) : this.getFromCache(e, t);
  }
  getEntries(e, t) {
    return this.getAllFromCache(e, t);
  }
  apply(e) {
    return this.assertNotApplied(), this.changesApplied = true, this.applyChanges(e);
  }
  assertNotApplied() {
  }
}
class OverlayedDocument {
  constructor(e, t) {
    this.overlayedDocument = e, this.mutatedFields = t;
  }
}

class LocalDocumentsView {
  constructor(e, t, n, r) {
    this.remoteDocumentCache = e, this.mutationQueue = t, this.documentOverlayCache = n, this.indexManager = r;
  }
  getDocument(e, t) {
    let n = null;
    return this.documentOverlayCache.getOverlay(e, t).next((r) => (n = r, this.remoteDocumentCache.getEntry(e, t))).next((e2) => (n !== null && __PRIVATE_mutationApplyToLocalView(n.mutation, e2, FieldMask.empty(), Timestamp.now()), e2));
  }
  getDocuments(e, t) {
    return this.remoteDocumentCache.getEntries(e, t).next((t2) => this.getLocalViewOfDocuments(e, t2, __PRIVATE_documentKeySet()).next(() => t2));
  }
  getLocalViewOfDocuments(e, t, n = __PRIVATE_documentKeySet()) {
    const r = __PRIVATE_newOverlayMap();
    return this.populateOverlays(e, r, t).next(() => this.computeViews(e, t, r, n).next((e2) => {
      let t2 = documentMap();
      return e2.forEach((e3, n2) => {
        t2 = t2.insert(e3, n2.overlayedDocument);
      }), t2;
    }));
  }
  getOverlayedDocuments(e, t) {
    const n = __PRIVATE_newOverlayMap();
    return this.populateOverlays(e, n, t).next(() => this.computeViews(e, t, n, __PRIVATE_documentKeySet()));
  }
  populateOverlays(e, t, n) {
    const r = [];
    return n.forEach((e2) => {
      t.has(e2) || r.push(e2);
    }), this.documentOverlayCache.getOverlays(e, r).next((e2) => {
      e2.forEach((e3, n2) => {
        t.set(e3, n2);
      });
    });
  }
  computeViews(e, t, n, r) {
    let i = __PRIVATE_mutableDocumentMap();
    const s = __PRIVATE_newDocumentKeyMap(), o = function __PRIVATE_newOverlayedDocumentMap() {
      return __PRIVATE_newDocumentKeyMap();
    }();
    return t.forEach((e2, t2) => {
      const o2 = n.get(t2.key);
      r.has(t2.key) && (o2 === undefined || o2.mutation instanceof __PRIVATE_PatchMutation) ? i = i.insert(t2.key, t2) : o2 !== undefined ? (s.set(t2.key, o2.mutation.getFieldMask()), __PRIVATE_mutationApplyToLocalView(o2.mutation, t2, o2.mutation.getFieldMask(), Timestamp.now())) : s.set(t2.key, FieldMask.empty());
    }), this.recalculateAndSaveOverlays(e, i).next((e2) => (e2.forEach((e3, t2) => s.set(e3, t2)), t.forEach((e3, t2) => {
      var n2;
      return o.set(e3, new OverlayedDocument(t2, (n2 = s.get(e3)) !== null && n2 !== undefined ? n2 : null));
    }), o));
  }
  recalculateAndSaveOverlays(e, t) {
    const n = __PRIVATE_newDocumentKeyMap();
    let r = new SortedMap((e2, t2) => e2 - t2), i = __PRIVATE_documentKeySet();
    return this.mutationQueue.getAllMutationBatchesAffectingDocumentKeys(e, t).next((e2) => {
      for (const i2 of e2)
        i2.keys().forEach((e3) => {
          const s = t.get(e3);
          if (s === null)
            return;
          let o = n.get(e3) || FieldMask.empty();
          o = i2.applyToLocalView(s, o), n.set(e3, o);
          const _ = (r.get(i2.batchId) || __PRIVATE_documentKeySet()).add(e3);
          r = r.insert(i2.batchId, _);
        });
    }).next(() => {
      const s = [], o = r.getReverseIterator();
      for (;o.hasNext(); ) {
        const r2 = o.getNext(), _ = r2.key, a = r2.value, u = __PRIVATE_newMutationMap();
        a.forEach((e2) => {
          if (!i.has(e2)) {
            const r3 = __PRIVATE_calculateOverlayMutation(t.get(e2), n.get(e2));
            r3 !== null && u.set(e2, r3), i = i.add(e2);
          }
        }), s.push(this.documentOverlayCache.saveOverlays(e, _, u));
      }
      return PersistencePromise.waitFor(s);
    }).next(() => n);
  }
  recalculateAndSaveOverlaysForDocumentKeys(e, t) {
    return this.remoteDocumentCache.getEntries(e, t).next((t2) => this.recalculateAndSaveOverlays(e, t2));
  }
  getDocumentsMatchingQuery(e, t, n, r) {
    return function __PRIVATE_isDocumentQuery$1(e2) {
      return DocumentKey.isDocumentKey(e2.path) && e2.collectionGroup === null && e2.filters.length === 0;
    }(t) ? this.getDocumentsMatchingDocumentQuery(e, t.path) : __PRIVATE_isCollectionGroupQuery(t) ? this.getDocumentsMatchingCollectionGroupQuery(e, t, n, r) : this.getDocumentsMatchingCollectionQuery(e, t, n, r);
  }
  getNextDocuments(e, t, n, r) {
    return this.remoteDocumentCache.getAllFromCollectionGroup(e, t, n, r).next((i) => {
      const s = r - i.size > 0 ? this.documentOverlayCache.getOverlaysForCollectionGroup(e, t, n.largestBatchId, r - i.size) : PersistencePromise.resolve(__PRIVATE_newOverlayMap());
      let o = -1, _ = i;
      return s.next((t2) => PersistencePromise.forEach(t2, (t3, n2) => (o < n2.largestBatchId && (o = n2.largestBatchId), i.get(t3) ? PersistencePromise.resolve() : this.remoteDocumentCache.getEntry(e, t3).next((e2) => {
        _ = _.insert(t3, e2);
      }))).next(() => this.populateOverlays(e, t2, i)).next(() => this.computeViews(e, _, t2, __PRIVATE_documentKeySet())).next((e2) => ({
        batchId: o,
        changes: __PRIVATE_convertOverlayedDocumentMapToDocumentMap(e2)
      })));
    });
  }
  getDocumentsMatchingDocumentQuery(e, t) {
    return this.getDocument(e, new DocumentKey(t)).next((e2) => {
      let t2 = documentMap();
      return e2.isFoundDocument() && (t2 = t2.insert(e2.key, e2)), t2;
    });
  }
  getDocumentsMatchingCollectionGroupQuery(e, t, n, r) {
    const i = t.collectionGroup;
    let s = documentMap();
    return this.indexManager.getCollectionParents(e, i).next((o) => PersistencePromise.forEach(o, (o2) => {
      const _ = function __PRIVATE_asCollectionQueryAtPath(e2, t2) {
        return new __PRIVATE_QueryImpl(t2, null, e2.explicitOrderBy.slice(), e2.filters.slice(), e2.limit, e2.limitType, e2.startAt, e2.endAt);
      }(t, o2.child(i));
      return this.getDocumentsMatchingCollectionQuery(e, _, n, r).next((e2) => {
        e2.forEach((e3, t2) => {
          s = s.insert(e3, t2);
        });
      });
    }).next(() => s));
  }
  getDocumentsMatchingCollectionQuery(e, t, n, r) {
    let i;
    return this.documentOverlayCache.getOverlaysForCollection(e, t.path, n.largestBatchId).next((s) => (i = s, this.remoteDocumentCache.getDocumentsMatchingQuery(e, t, n, i, r))).next((e2) => {
      i.forEach((t2, n3) => {
        const r2 = n3.getKey();
        e2.get(r2) === null && (e2 = e2.insert(r2, MutableDocument.newInvalidDocument(r2)));
      });
      let n2 = documentMap();
      return e2.forEach((e3, r2) => {
        const s = i.get(e3);
        s !== undefined && __PRIVATE_mutationApplyToLocalView(s.mutation, r2, FieldMask.empty(), Timestamp.now()), __PRIVATE_queryMatches(t, r2) && (n2 = n2.insert(e3, r2));
      }), n2;
    });
  }
}

class __PRIVATE_MemoryBundleCache {
  constructor(e) {
    this.serializer = e, this.hr = new Map, this.Pr = new Map;
  }
  getBundleMetadata(e, t) {
    return PersistencePromise.resolve(this.hr.get(t));
  }
  saveBundleMetadata(e, t) {
    return this.hr.set(t.id, function __PRIVATE_fromBundleMetadata(e2) {
      return {
        id: e2.id,
        version: e2.version,
        createTime: __PRIVATE_fromVersion(e2.createTime)
      };
    }(t)), PersistencePromise.resolve();
  }
  getNamedQuery(e, t) {
    return PersistencePromise.resolve(this.Pr.get(t));
  }
  saveNamedQuery(e, t) {
    return this.Pr.set(t.name, function __PRIVATE_fromProtoNamedQuery(e2) {
      return {
        name: e2.name,
        query: __PRIVATE_fromBundledQuery(e2.bundledQuery),
        readTime: __PRIVATE_fromVersion(e2.readTime)
      };
    }(t)), PersistencePromise.resolve();
  }
}

class __PRIVATE_MemoryDocumentOverlayCache {
  constructor() {
    this.overlays = new SortedMap(DocumentKey.comparator), this.Ir = new Map;
  }
  getOverlay(e, t) {
    return PersistencePromise.resolve(this.overlays.get(t));
  }
  getOverlays(e, t) {
    const n = __PRIVATE_newOverlayMap();
    return PersistencePromise.forEach(t, (t2) => this.getOverlay(e, t2).next((e2) => {
      e2 !== null && n.set(t2, e2);
    })).next(() => n);
  }
  saveOverlays(e, t, n) {
    return n.forEach((n2, r) => {
      this.ht(e, t, r);
    }), PersistencePromise.resolve();
  }
  removeOverlaysForBatchId(e, t, n) {
    const r = this.Ir.get(n);
    return r !== undefined && (r.forEach((e2) => this.overlays = this.overlays.remove(e2)), this.Ir.delete(n)), PersistencePromise.resolve();
  }
  getOverlaysForCollection(e, t, n) {
    const r = __PRIVATE_newOverlayMap(), i = t.length + 1, s = new DocumentKey(t.child("")), o = this.overlays.getIteratorFrom(s);
    for (;o.hasNext(); ) {
      const e2 = o.getNext().value, s2 = e2.getKey();
      if (!t.isPrefixOf(s2.path))
        break;
      s2.path.length === i && (e2.largestBatchId > n && r.set(e2.getKey(), e2));
    }
    return PersistencePromise.resolve(r);
  }
  getOverlaysForCollectionGroup(e, t, n, r) {
    let i = new SortedMap((e2, t2) => e2 - t2);
    const s = this.overlays.getIterator();
    for (;s.hasNext(); ) {
      const e2 = s.getNext().value;
      if (e2.getKey().getCollectionGroup() === t && e2.largestBatchId > n) {
        let t2 = i.get(e2.largestBatchId);
        t2 === null && (t2 = __PRIVATE_newOverlayMap(), i = i.insert(e2.largestBatchId, t2)), t2.set(e2.getKey(), e2);
      }
    }
    const o = __PRIVATE_newOverlayMap(), _ = i.getIterator();
    for (;_.hasNext(); ) {
      if (_.getNext().value.forEach((e2, t2) => o.set(e2, t2)), o.size() >= r)
        break;
    }
    return PersistencePromise.resolve(o);
  }
  ht(e, t, n) {
    const r = this.overlays.get(n.key);
    if (r !== null) {
      const e2 = this.Ir.get(r.largestBatchId).delete(n.key);
      this.Ir.set(r.largestBatchId, e2);
    }
    this.overlays = this.overlays.insert(n.key, new Overlay(t, n));
    let i = this.Ir.get(t);
    i === undefined && (i = __PRIVATE_documentKeySet(), this.Ir.set(t, i)), this.Ir.set(t, i.add(n.key));
  }
}

class __PRIVATE_MemoryGlobalsCache {
  constructor() {
    this.sessionToken = ByteString.EMPTY_BYTE_STRING;
  }
  getSessionToken(e) {
    return PersistencePromise.resolve(this.sessionToken);
  }
  setSessionToken(e, t) {
    return this.sessionToken = t, PersistencePromise.resolve();
  }
}

class __PRIVATE_ReferenceSet {
  constructor() {
    this.Tr = new SortedSet(__PRIVATE_DocReference.Er), this.dr = new SortedSet(__PRIVATE_DocReference.Ar);
  }
  isEmpty() {
    return this.Tr.isEmpty();
  }
  addReference(e, t) {
    const n = new __PRIVATE_DocReference(e, t);
    this.Tr = this.Tr.add(n), this.dr = this.dr.add(n);
  }
  Rr(e, t) {
    e.forEach((e2) => this.addReference(e2, t));
  }
  removeReference(e, t) {
    this.Vr(new __PRIVATE_DocReference(e, t));
  }
  mr(e, t) {
    e.forEach((e2) => this.removeReference(e2, t));
  }
  gr(e) {
    const t = new DocumentKey(new ResourcePath([])), n = new __PRIVATE_DocReference(t, e), r = new __PRIVATE_DocReference(t, e + 1), i = [];
    return this.dr.forEachInRange([n, r], (e2) => {
      this.Vr(e2), i.push(e2.key);
    }), i;
  }
  pr() {
    this.Tr.forEach((e) => this.Vr(e));
  }
  Vr(e) {
    this.Tr = this.Tr.delete(e), this.dr = this.dr.delete(e);
  }
  yr(e) {
    const t = new DocumentKey(new ResourcePath([])), n = new __PRIVATE_DocReference(t, e), r = new __PRIVATE_DocReference(t, e + 1);
    let i = __PRIVATE_documentKeySet();
    return this.dr.forEachInRange([n, r], (e2) => {
      i = i.add(e2.key);
    }), i;
  }
  containsKey(e) {
    const t = new __PRIVATE_DocReference(e, 0), n = this.Tr.firstAfterOrEqual(t);
    return n !== null && e.isEqual(n.key);
  }
}

class __PRIVATE_DocReference {
  constructor(e, t) {
    this.key = e, this.wr = t;
  }
  static Er(e, t) {
    return DocumentKey.comparator(e.key, t.key) || __PRIVATE_primitiveComparator(e.wr, t.wr);
  }
  static Ar(e, t) {
    return __PRIVATE_primitiveComparator(e.wr, t.wr) || DocumentKey.comparator(e.key, t.key);
  }
}

class __PRIVATE_MemoryMutationQueue {
  constructor(e, t) {
    this.indexManager = e, this.referenceDelegate = t, this.mutationQueue = [], this.Sr = 1, this.br = new SortedSet(__PRIVATE_DocReference.Er);
  }
  checkEmpty(e) {
    return PersistencePromise.resolve(this.mutationQueue.length === 0);
  }
  addMutationBatch(e, t, n, r) {
    const i = this.Sr;
    this.Sr++, this.mutationQueue.length > 0 && this.mutationQueue[this.mutationQueue.length - 1];
    const s = new MutationBatch(i, t, n, r);
    this.mutationQueue.push(s);
    for (const t2 of r)
      this.br = this.br.add(new __PRIVATE_DocReference(t2.key, i)), this.indexManager.addToCollectionParentIndex(e, t2.key.path.popLast());
    return PersistencePromise.resolve(s);
  }
  lookupMutationBatch(e, t) {
    return PersistencePromise.resolve(this.Dr(t));
  }
  getNextMutationBatchAfterBatchId(e, t) {
    const n = t + 1, r = this.vr(n), i = r < 0 ? 0 : r;
    return PersistencePromise.resolve(this.mutationQueue.length > i ? this.mutationQueue[i] : null);
  }
  getHighestUnacknowledgedBatchId() {
    return PersistencePromise.resolve(this.mutationQueue.length === 0 ? -1 : this.Sr - 1);
  }
  getAllMutationBatches(e) {
    return PersistencePromise.resolve(this.mutationQueue.slice());
  }
  getAllMutationBatchesAffectingDocumentKey(e, t) {
    const n = new __PRIVATE_DocReference(t, 0), r = new __PRIVATE_DocReference(t, Number.POSITIVE_INFINITY), i = [];
    return this.br.forEachInRange([n, r], (e2) => {
      const t2 = this.Dr(e2.wr);
      i.push(t2);
    }), PersistencePromise.resolve(i);
  }
  getAllMutationBatchesAffectingDocumentKeys(e, t) {
    let n = new SortedSet(__PRIVATE_primitiveComparator);
    return t.forEach((e2) => {
      const t2 = new __PRIVATE_DocReference(e2, 0), r = new __PRIVATE_DocReference(e2, Number.POSITIVE_INFINITY);
      this.br.forEachInRange([t2, r], (e3) => {
        n = n.add(e3.wr);
      });
    }), PersistencePromise.resolve(this.Cr(n));
  }
  getAllMutationBatchesAffectingQuery(e, t) {
    const n = t.path, r = n.length + 1;
    let i = n;
    DocumentKey.isDocumentKey(i) || (i = i.child(""));
    const s = new __PRIVATE_DocReference(new DocumentKey(i), 0);
    let o = new SortedSet(__PRIVATE_primitiveComparator);
    return this.br.forEachWhile((e2) => {
      const t2 = e2.key.path;
      return !!n.isPrefixOf(t2) && (t2.length === r && (o = o.add(e2.wr)), true);
    }, s), PersistencePromise.resolve(this.Cr(o));
  }
  Cr(e) {
    const t = [];
    return e.forEach((e2) => {
      const n = this.Dr(e2);
      n !== null && t.push(n);
    }), t;
  }
  removeMutationBatch(e, t) {
    __PRIVATE_hardAssert(this.Fr(t.batchId, "removed") === 0), this.mutationQueue.shift();
    let n = this.br;
    return PersistencePromise.forEach(t.mutations, (r) => {
      const i = new __PRIVATE_DocReference(r.key, t.batchId);
      return n = n.delete(i), this.referenceDelegate.markPotentiallyOrphaned(e, r.key);
    }).next(() => {
      this.br = n;
    });
  }
  On(e) {
  }
  containsKey(e, t) {
    const n = new __PRIVATE_DocReference(t, 0), r = this.br.firstAfterOrEqual(n);
    return PersistencePromise.resolve(t.isEqual(r && r.key));
  }
  performConsistencyCheck(e) {
    return this.mutationQueue.length, PersistencePromise.resolve();
  }
  Fr(e, t) {
    return this.vr(e);
  }
  vr(e) {
    if (this.mutationQueue.length === 0)
      return 0;
    return e - this.mutationQueue[0].batchId;
  }
  Dr(e) {
    const t = this.vr(e);
    if (t < 0 || t >= this.mutationQueue.length)
      return null;
    return this.mutationQueue[t];
  }
}

class __PRIVATE_MemoryRemoteDocumentCacheImpl {
  constructor(e) {
    this.Mr = e, this.docs = function __PRIVATE_documentEntryMap() {
      return new SortedMap(DocumentKey.comparator);
    }(), this.size = 0;
  }
  setIndexManager(e) {
    this.indexManager = e;
  }
  addEntry(e, t) {
    const n = t.key, r = this.docs.get(n), i = r ? r.size : 0, s = this.Mr(t);
    return this.docs = this.docs.insert(n, {
      document: t.mutableCopy(),
      size: s
    }), this.size += s - i, this.indexManager.addToCollectionParentIndex(e, n.path.popLast());
  }
  removeEntry(e) {
    const t = this.docs.get(e);
    t && (this.docs = this.docs.remove(e), this.size -= t.size);
  }
  getEntry(e, t) {
    const n = this.docs.get(t);
    return PersistencePromise.resolve(n ? n.document.mutableCopy() : MutableDocument.newInvalidDocument(t));
  }
  getEntries(e, t) {
    let n = __PRIVATE_mutableDocumentMap();
    return t.forEach((e2) => {
      const t2 = this.docs.get(e2);
      n = n.insert(e2, t2 ? t2.document.mutableCopy() : MutableDocument.newInvalidDocument(e2));
    }), PersistencePromise.resolve(n);
  }
  getDocumentsMatchingQuery(e, t, n, r) {
    let i = __PRIVATE_mutableDocumentMap();
    const s = t.path, o = new DocumentKey(s.child("")), _ = this.docs.getIteratorFrom(o);
    for (;_.hasNext(); ) {
      const { key: e2, value: { document: o2 } } = _.getNext();
      if (!s.isPrefixOf(e2.path))
        break;
      e2.path.length > s.length + 1 || (__PRIVATE_indexOffsetComparator(__PRIVATE_newIndexOffsetFromDocument(o2), n) <= 0 || (r.has(o2.key) || __PRIVATE_queryMatches(t, o2)) && (i = i.insert(o2.key, o2.mutableCopy())));
    }
    return PersistencePromise.resolve(i);
  }
  getAllFromCollectionGroup(e, t, n, r) {
    fail();
  }
  Or(e, t) {
    return PersistencePromise.forEach(this.docs, (e2) => t(e2));
  }
  newChangeBuffer(e) {
    return new __PRIVATE_MemoryRemoteDocumentChangeBuffer(this);
  }
  getSize(e) {
    return PersistencePromise.resolve(this.size);
  }
}

class __PRIVATE_MemoryRemoteDocumentChangeBuffer extends RemoteDocumentChangeBuffer {
  constructor(e) {
    super(), this.cr = e;
  }
  applyChanges(e) {
    const t = [];
    return this.changes.forEach((n, r) => {
      r.isValidDocument() ? t.push(this.cr.addEntry(e, r)) : this.cr.removeEntry(n);
    }), PersistencePromise.waitFor(t);
  }
  getFromCache(e, t) {
    return this.cr.getEntry(e, t);
  }
  getAllFromCache(e, t) {
    return this.cr.getEntries(e, t);
  }
}

class __PRIVATE_MemoryTargetCache {
  constructor(e) {
    this.persistence = e, this.Nr = new ObjectMap((e2) => __PRIVATE_canonifyTarget(e2), __PRIVATE_targetEquals), this.lastRemoteSnapshotVersion = SnapshotVersion.min(), this.highestTargetId = 0, this.Lr = 0, this.Br = new __PRIVATE_ReferenceSet, this.targetCount = 0, this.kr = __PRIVATE_TargetIdGenerator.Bn();
  }
  forEachTarget(e, t) {
    return this.Nr.forEach((e2, n) => t(n)), PersistencePromise.resolve();
  }
  getLastRemoteSnapshotVersion(e) {
    return PersistencePromise.resolve(this.lastRemoteSnapshotVersion);
  }
  getHighestSequenceNumber(e) {
    return PersistencePromise.resolve(this.Lr);
  }
  allocateTargetId(e) {
    return this.highestTargetId = this.kr.next(), PersistencePromise.resolve(this.highestTargetId);
  }
  setTargetsMetadata(e, t, n) {
    return n && (this.lastRemoteSnapshotVersion = n), t > this.Lr && (this.Lr = t), PersistencePromise.resolve();
  }
  Kn(e) {
    this.Nr.set(e.target, e);
    const t = e.targetId;
    t > this.highestTargetId && (this.kr = new __PRIVATE_TargetIdGenerator(t), this.highestTargetId = t), e.sequenceNumber > this.Lr && (this.Lr = e.sequenceNumber);
  }
  addTargetData(e, t) {
    return this.Kn(t), this.targetCount += 1, PersistencePromise.resolve();
  }
  updateTargetData(e, t) {
    return this.Kn(t), PersistencePromise.resolve();
  }
  removeTargetData(e, t) {
    return this.Nr.delete(t.target), this.Br.gr(t.targetId), this.targetCount -= 1, PersistencePromise.resolve();
  }
  removeTargets(e, t, n) {
    let r = 0;
    const i = [];
    return this.Nr.forEach((s, o) => {
      o.sequenceNumber <= t && n.get(o.targetId) === null && (this.Nr.delete(s), i.push(this.removeMatchingKeysForTargetId(e, o.targetId)), r++);
    }), PersistencePromise.waitFor(i).next(() => r);
  }
  getTargetCount(e) {
    return PersistencePromise.resolve(this.targetCount);
  }
  getTargetData(e, t) {
    const n = this.Nr.get(t) || null;
    return PersistencePromise.resolve(n);
  }
  addMatchingKeys(e, t, n) {
    return this.Br.Rr(t, n), PersistencePromise.resolve();
  }
  removeMatchingKeys(e, t, n) {
    this.Br.mr(t, n);
    const r = this.persistence.referenceDelegate, i = [];
    return r && t.forEach((t2) => {
      i.push(r.markPotentiallyOrphaned(e, t2));
    }), PersistencePromise.waitFor(i);
  }
  removeMatchingKeysForTargetId(e, t) {
    return this.Br.gr(t), PersistencePromise.resolve();
  }
  getMatchingKeysForTargetId(e, t) {
    const n = this.Br.yr(t);
    return PersistencePromise.resolve(n);
  }
  containsKey(e, t) {
    return PersistencePromise.resolve(this.Br.containsKey(t));
  }
}

class __PRIVATE_MemoryPersistence {
  constructor(e, t) {
    this.qr = {}, this.overlays = {}, this.Qr = new __PRIVATE_ListenSequence(0), this.Kr = false, this.Kr = true, this.$r = new __PRIVATE_MemoryGlobalsCache, this.referenceDelegate = e(this), this.Ur = new __PRIVATE_MemoryTargetCache(this);
    this.indexManager = new __PRIVATE_MemoryIndexManager, this.remoteDocumentCache = function __PRIVATE_newMemoryRemoteDocumentCache(e2) {
      return new __PRIVATE_MemoryRemoteDocumentCacheImpl(e2);
    }((e2) => this.referenceDelegate.Wr(e2)), this.serializer = new __PRIVATE_LocalSerializer(t), this.Gr = new __PRIVATE_MemoryBundleCache(this.serializer);
  }
  start() {
    return Promise.resolve();
  }
  shutdown() {
    return this.Kr = false, Promise.resolve();
  }
  get started() {
    return this.Kr;
  }
  setDatabaseDeletedListener() {
  }
  setNetworkEnabled() {
  }
  getIndexManager(e) {
    return this.indexManager;
  }
  getDocumentOverlayCache(e) {
    let t = this.overlays[e.toKey()];
    return t || (t = new __PRIVATE_MemoryDocumentOverlayCache, this.overlays[e.toKey()] = t), t;
  }
  getMutationQueue(e, t) {
    let n = this.qr[e.toKey()];
    return n || (n = new __PRIVATE_MemoryMutationQueue(t, this.referenceDelegate), this.qr[e.toKey()] = n), n;
  }
  getGlobalsCache() {
    return this.$r;
  }
  getTargetCache() {
    return this.Ur;
  }
  getRemoteDocumentCache() {
    return this.remoteDocumentCache;
  }
  getBundleCache() {
    return this.Gr;
  }
  runTransaction(e, t, n) {
    __PRIVATE_logDebug("MemoryPersistence", "Starting transaction:", e);
    const r = new __PRIVATE_MemoryTransaction(this.Qr.next());
    return this.referenceDelegate.zr(), n(r).next((e2) => this.referenceDelegate.jr(r).next(() => e2)).toPromise().then((e2) => (r.raiseOnCommittedEvent(), e2));
  }
  Hr(e, t) {
    return PersistencePromise.or(Object.values(this.qr).map((n) => () => n.containsKey(e, t)));
  }
}

class __PRIVATE_MemoryTransaction extends PersistenceTransaction {
  constructor(e) {
    super(), this.currentSequenceNumber = e;
  }
}

class __PRIVATE_MemoryEagerDelegate {
  constructor(e) {
    this.persistence = e, this.Jr = new __PRIVATE_ReferenceSet, this.Yr = null;
  }
  static Zr(e) {
    return new __PRIVATE_MemoryEagerDelegate(e);
  }
  get Xr() {
    if (this.Yr)
      return this.Yr;
    throw fail();
  }
  addReference(e, t, n) {
    return this.Jr.addReference(n, t), this.Xr.delete(n.toString()), PersistencePromise.resolve();
  }
  removeReference(e, t, n) {
    return this.Jr.removeReference(n, t), this.Xr.add(n.toString()), PersistencePromise.resolve();
  }
  markPotentiallyOrphaned(e, t) {
    return this.Xr.add(t.toString()), PersistencePromise.resolve();
  }
  removeTarget(e, t) {
    this.Jr.gr(t.targetId).forEach((e2) => this.Xr.add(e2.toString()));
    const n = this.persistence.getTargetCache();
    return n.getMatchingKeysForTargetId(e, t.targetId).next((e2) => {
      e2.forEach((e3) => this.Xr.add(e3.toString()));
    }).next(() => n.removeTargetData(e, t));
  }
  zr() {
    this.Yr = new Set;
  }
  jr(e) {
    const t = this.persistence.getRemoteDocumentCache().newChangeBuffer();
    return PersistencePromise.forEach(this.Xr, (n) => {
      const r = DocumentKey.fromPath(n);
      return this.ei(e, r).next((e2) => {
        e2 || t.removeEntry(r, SnapshotVersion.min());
      });
    }).next(() => (this.Yr = null, t.apply(e)));
  }
  updateLimboDocument(e, t) {
    return this.ei(e, t).next((e2) => {
      e2 ? this.Xr.delete(t.toString()) : this.Xr.add(t.toString());
    });
  }
  Wr(e) {
    return 0;
  }
  ei(e, t) {
    return PersistencePromise.or([() => PersistencePromise.resolve(this.Jr.containsKey(t)), () => this.persistence.getTargetCache().containsKey(e, t), () => this.persistence.Hr(e, t)]);
  }
}
class __PRIVATE_LocalViewChanges {
  constructor(e, t, n, r) {
    this.targetId = e, this.fromCache = t, this.$i = n, this.Ui = r;
  }
  static Wi(e, t) {
    let n = __PRIVATE_documentKeySet(), r = __PRIVATE_documentKeySet();
    for (const e2 of t.docChanges)
      switch (e2.type) {
        case 0:
          n = n.add(e2.doc.key);
          break;
        case 1:
          r = r.add(e2.doc.key);
      }
    return new __PRIVATE_LocalViewChanges(e, t.fromCache, n, r);
  }
}

class QueryContext {
  constructor() {
    this._documentReadCount = 0;
  }
  get documentReadCount() {
    return this._documentReadCount;
  }
  incrementDocumentReadCount(e) {
    this._documentReadCount += e;
  }
}

class __PRIVATE_QueryEngine {
  constructor() {
    this.Gi = false, this.zi = false, this.ji = 100, this.Hi = function __PRIVATE_getDefaultRelativeIndexReadCostPerDocument() {
      return isSafari() ? 8 : __PRIVATE_getAndroidVersion(getUA()) > 0 ? 6 : 4;
    }();
  }
  initialize(e, t) {
    this.Ji = e, this.indexManager = t, this.Gi = true;
  }
  getDocumentsMatchingQuery(e, t, n, r) {
    const i = {
      result: null
    };
    return this.Yi(e, t).next((e2) => {
      i.result = e2;
    }).next(() => {
      if (!i.result)
        return this.Zi(e, t, r, n).next((e2) => {
          i.result = e2;
        });
    }).next(() => {
      if (i.result)
        return;
      const n2 = new QueryContext;
      return this.Xi(e, t, n2).next((r2) => {
        if (i.result = r2, this.zi)
          return this.es(e, t, n2, r2.size);
      });
    }).next(() => i.result);
  }
  es(e, t, n, r) {
    return n.documentReadCount < this.ji ? (__PRIVATE_getLogLevel() <= LogLevel.DEBUG && __PRIVATE_logDebug("QueryEngine", "SDK will not create cache indexes for query:", __PRIVATE_stringifyQuery(t), "since it only creates cache indexes for collection contains", "more than or equal to", this.ji, "documents"), PersistencePromise.resolve()) : (__PRIVATE_getLogLevel() <= LogLevel.DEBUG && __PRIVATE_logDebug("QueryEngine", "Query:", __PRIVATE_stringifyQuery(t), "scans", n.documentReadCount, "local documents and returns", r, "documents as results."), n.documentReadCount > this.Hi * r ? (__PRIVATE_getLogLevel() <= LogLevel.DEBUG && __PRIVATE_logDebug("QueryEngine", "The SDK decides to create cache indexes for query:", __PRIVATE_stringifyQuery(t), "as using cache indexes may help improve performance."), this.indexManager.createTargetIndexes(e, __PRIVATE_queryToTarget(t))) : PersistencePromise.resolve());
  }
  Yi(e, t) {
    if (__PRIVATE_queryMatchesAllDocuments(t))
      return PersistencePromise.resolve(null);
    let n = __PRIVATE_queryToTarget(t);
    return this.indexManager.getIndexType(e, n).next((r) => r === 0 ? null : (t.limit !== null && r === 1 && (t = __PRIVATE_queryWithLimit(t, null, "F"), n = __PRIVATE_queryToTarget(t)), this.indexManager.getDocumentsMatchingTarget(e, n).next((r2) => {
      const i = __PRIVATE_documentKeySet(...r2);
      return this.Ji.getDocuments(e, i).next((r3) => this.indexManager.getMinOffset(e, n).next((n2) => {
        const s = this.ts(t, r3);
        return this.ns(t, s, i, n2.readTime) ? this.Yi(e, __PRIVATE_queryWithLimit(t, null, "F")) : this.rs(e, s, t, n2);
      }));
    })));
  }
  Zi(e, t, n, r) {
    return __PRIVATE_queryMatchesAllDocuments(t) || r.isEqual(SnapshotVersion.min()) ? PersistencePromise.resolve(null) : this.Ji.getDocuments(e, n).next((i) => {
      const s = this.ts(t, i);
      return this.ns(t, s, n, r) ? PersistencePromise.resolve(null) : (__PRIVATE_getLogLevel() <= LogLevel.DEBUG && __PRIVATE_logDebug("QueryEngine", "Re-using previous result from %s to execute query: %s", r.toString(), __PRIVATE_stringifyQuery(t)), this.rs(e, s, t, __PRIVATE_newIndexOffsetSuccessorFromReadTime(r, -1)).next((e2) => e2));
    });
  }
  ts(e, t) {
    let n = new SortedSet(__PRIVATE_newQueryComparator(e));
    return t.forEach((t2, r) => {
      __PRIVATE_queryMatches(e, r) && (n = n.add(r));
    }), n;
  }
  ns(e, t, n, r) {
    if (e.limit === null)
      return false;
    if (n.size !== t.size)
      return true;
    const i = e.limitType === "F" ? t.last() : t.first();
    return !!i && (i.hasPendingWrites || i.version.compareTo(r) > 0);
  }
  Xi(e, t, n) {
    return __PRIVATE_getLogLevel() <= LogLevel.DEBUG && __PRIVATE_logDebug("QueryEngine", "Using full collection scan to execute query:", __PRIVATE_stringifyQuery(t)), this.Ji.getDocumentsMatchingQuery(e, t, IndexOffset.min(), n);
  }
  rs(e, t, n, r) {
    return this.Ji.getDocumentsMatchingQuery(e, n, r).next((e2) => (t.forEach((t2) => {
      e2 = e2.insert(t2.key, t2);
    }), e2));
  }
}

class __PRIVATE_LocalStoreImpl {
  constructor(e, t, n, r) {
    this.persistence = e, this.ss = t, this.serializer = r, this.os = new SortedMap(__PRIVATE_primitiveComparator), this._s = new ObjectMap((e2) => __PRIVATE_canonifyTarget(e2), __PRIVATE_targetEquals), this.us = new Map, this.cs = e.getRemoteDocumentCache(), this.Ur = e.getTargetCache(), this.Gr = e.getBundleCache(), this.ls(n);
  }
  ls(e) {
    this.documentOverlayCache = this.persistence.getDocumentOverlayCache(e), this.indexManager = this.persistence.getIndexManager(e), this.mutationQueue = this.persistence.getMutationQueue(e, this.indexManager), this.localDocuments = new LocalDocumentsView(this.cs, this.mutationQueue, this.documentOverlayCache, this.indexManager), this.cs.setIndexManager(this.indexManager), this.ss.initialize(this.localDocuments, this.indexManager);
  }
  collectGarbage(e) {
    return this.persistence.runTransaction("Collect garbage", "readwrite-primary", (t) => e.collect(t, this.os));
  }
}
function __PRIVATE_newLocalStore(e, t, n, r) {
  return new __PRIVATE_LocalStoreImpl(e, t, n, r);
}
async function __PRIVATE_localStoreHandleUserChange(e, t) {
  const n = __PRIVATE_debugCast(e);
  return await n.persistence.runTransaction("Handle user change", "readonly", (e2) => {
    let r;
    return n.mutationQueue.getAllMutationBatches(e2).next((i) => (r = i, n.ls(t), n.mutationQueue.getAllMutationBatches(e2))).next((t2) => {
      const i = [], s = [];
      let o = __PRIVATE_documentKeySet();
      for (const e3 of r) {
        i.push(e3.batchId);
        for (const t3 of e3.mutations)
          o = o.add(t3.key);
      }
      for (const e3 of t2) {
        s.push(e3.batchId);
        for (const t3 of e3.mutations)
          o = o.add(t3.key);
      }
      return n.localDocuments.getDocuments(e2, o).next((e3) => ({
        hs: e3,
        removedBatchIds: i,
        addedBatchIds: s
      }));
    });
  });
}
function __PRIVATE_localStoreAcknowledgeBatch(e, t) {
  const n = __PRIVATE_debugCast(e);
  return n.persistence.runTransaction("Acknowledge batch", "readwrite-primary", (e2) => {
    const r = t.batch.keys(), i = n.cs.newChangeBuffer({
      trackRemovals: true
    });
    return function __PRIVATE_applyWriteToRemoteDocuments(e3, t2, n2, r2) {
      const i2 = n2.batch, s = i2.keys();
      let o = PersistencePromise.resolve();
      return s.forEach((e4) => {
        o = o.next(() => r2.getEntry(t2, e4)).next((t3) => {
          const s2 = n2.docVersions.get(e4);
          __PRIVATE_hardAssert(s2 !== null), t3.version.compareTo(s2) < 0 && (i2.applyToRemoteDocument(t3, n2), t3.isValidDocument() && (t3.setReadTime(n2.commitVersion), r2.addEntry(t3)));
        });
      }), o.next(() => e3.mutationQueue.removeMutationBatch(t2, i2));
    }(n, e2, t, i).next(() => i.apply(e2)).next(() => n.mutationQueue.performConsistencyCheck(e2)).next(() => n.documentOverlayCache.removeOverlaysForBatchId(e2, r, t.batch.batchId)).next(() => n.localDocuments.recalculateAndSaveOverlaysForDocumentKeys(e2, function __PRIVATE_getKeysWithTransformResults(e3) {
      let t2 = __PRIVATE_documentKeySet();
      for (let n2 = 0;n2 < e3.mutationResults.length; ++n2) {
        e3.mutationResults[n2].transformResults.length > 0 && (t2 = t2.add(e3.batch.mutations[n2].key));
      }
      return t2;
    }(t))).next(() => n.localDocuments.getDocuments(e2, r));
  });
}
function __PRIVATE_localStoreGetLastRemoteSnapshotVersion(e) {
  const t = __PRIVATE_debugCast(e);
  return t.persistence.runTransaction("Get last remote snapshot version", "readonly", (e2) => t.Ur.getLastRemoteSnapshotVersion(e2));
}
function __PRIVATE_localStoreGetNextMutationBatch(e, t) {
  const n = __PRIVATE_debugCast(e);
  return n.persistence.runTransaction("Get next mutation batch", "readonly", (e2) => (t === undefined && (t = -1), n.mutationQueue.getNextMutationBatchAfterBatchId(e2, t)));
}
class __PRIVATE_LocalClientState {
  constructor() {
    this.activeTargetIds = __PRIVATE_targetIdSet();
  }
  fs(e) {
    this.activeTargetIds = this.activeTargetIds.add(e);
  }
  gs(e) {
    this.activeTargetIds = this.activeTargetIds.delete(e);
  }
  Vs() {
    const e = {
      activeTargetIds: this.activeTargetIds.toArray(),
      updateTimeMs: Date.now()
    };
    return JSON.stringify(e);
  }
}
class __PRIVATE_MemorySharedClientState {
  constructor() {
    this.so = new __PRIVATE_LocalClientState, this.oo = {}, this.onlineStateHandler = null, this.sequenceNumberHandler = null;
  }
  addPendingMutation(e) {
  }
  updateMutationState(e, t, n) {
  }
  addLocalQueryTarget(e) {
    return this.so.fs(e), this.oo[e] || "not-current";
  }
  updateQueryState(e, t, n) {
    this.oo[e] = t;
  }
  removeLocalQueryTarget(e) {
    this.so.gs(e);
  }
  isLocalQueryTarget(e) {
    return this.so.activeTargetIds.has(e);
  }
  clearQueryState(e) {
    delete this.oo[e];
  }
  getAllActiveQueryTargets() {
    return this.so.activeTargetIds;
  }
  isActiveQueryTarget(e) {
    return this.so.activeTargetIds.has(e);
  }
  start() {
    return this.so = new __PRIVATE_LocalClientState, Promise.resolve();
  }
  handleUserChange(e, t, n) {
  }
  setOnlineState(e) {
  }
  shutdown() {
  }
  writeSequenceNumber(e) {
  }
  notifyBundleLoaded(e) {
  }
}

class __PRIVATE_NoopConnectivityMonitor {
  _o(e) {
  }
  shutdown() {
  }
}

class __PRIVATE_BrowserConnectivityMonitor {
  constructor() {
    this.ao = () => this.uo(), this.co = () => this.lo(), this.ho = [], this.Po();
  }
  _o(e) {
    this.ho.push(e);
  }
  shutdown() {
    window.removeEventListener("online", this.ao), window.removeEventListener("offline", this.co);
  }
  Po() {
    window.addEventListener("online", this.ao), window.addEventListener("offline", this.co);
  }
  uo() {
    __PRIVATE_logDebug("ConnectivityMonitor", "Network connectivity changed: AVAILABLE");
    for (const e of this.ho)
      e(0);
  }
  lo() {
    __PRIVATE_logDebug("ConnectivityMonitor", "Network connectivity changed: UNAVAILABLE");
    for (const e of this.ho)
      e(1);
  }
  static D() {
    return typeof window != "undefined" && window.addEventListener !== undefined && window.removeEventListener !== undefined;
  }
}
var fe = null;
function __PRIVATE_generateUniqueDebugId() {
  return fe === null ? fe = function __PRIVATE_generateInitialUniqueDebugId() {
    return 268435456 + Math.round(2147483648 * Math.random());
  }() : fe++, "0x" + fe.toString(16);
}
var ge = {
  BatchGetDocuments: "batchGet",
  Commit: "commit",
  RunQuery: "runQuery",
  RunAggregationQuery: "runAggregationQuery"
};

class __PRIVATE_StreamBridge {
  constructor(e) {
    this.Io = e.Io, this.To = e.To;
  }
  Eo(e) {
    this.Ao = e;
  }
  Ro(e) {
    this.Vo = e;
  }
  mo(e) {
    this.fo = e;
  }
  onMessage(e) {
    this.po = e;
  }
  close() {
    this.To();
  }
  send(e) {
    this.Io(e);
  }
  yo() {
    this.Ao();
  }
  wo() {
    this.Vo();
  }
  So(e) {
    this.fo(e);
  }
  bo(e) {
    this.po(e);
  }
}
var pe = "WebChannelConnection";

class __PRIVATE_WebChannelConnection extends class __PRIVATE_RestConnection {
  constructor(e) {
    this.databaseInfo = e, this.databaseId = e.databaseId;
    const t = e.ssl ? "https" : "http", n = encodeURIComponent(this.databaseId.projectId), r = encodeURIComponent(this.databaseId.database);
    this.Do = t + "://" + e.host, this.vo = `projects/${n}/databases/${r}`, this.Co = this.databaseId.database === "(default)" ? `project_id=${n}` : `project_id=${n}&database_id=${r}`;
  }
  get Fo() {
    return false;
  }
  Mo(e, t, n, r, i) {
    const s = __PRIVATE_generateUniqueDebugId(), o = this.xo(e, t.toUriEncodedString());
    __PRIVATE_logDebug("RestConnection", `Sending RPC '${e}' ${s}:`, o, n);
    const _ = {
      "google-cloud-resource-prefix": this.vo,
      "x-goog-request-params": this.Co
    };
    return this.Oo(_, r, i), this.No(e, o, _, n).then((t2) => (__PRIVATE_logDebug("RestConnection", `Received RPC '${e}' ${s}: `, t2), t2), (t2) => {
      throw __PRIVATE_logWarn("RestConnection", `RPC '${e}' ${s} failed with error: `, t2, "url: ", o, "request:", n), t2;
    });
  }
  Lo(e, t, n, r, i, s) {
    return this.Mo(e, t, n, r, i);
  }
  Oo(e, t, n) {
    e["X-Goog-Api-Client"] = function __PRIVATE_getGoogApiClientValue() {
      return "gl-js/ fire/" + b;
    }(), e["Content-Type"] = "text/plain", this.databaseInfo.appId && (e["X-Firebase-GMPID"] = this.databaseInfo.appId), t && t.headers.forEach((t2, n2) => e[n2] = t2), n && n.headers.forEach((t2, n2) => e[n2] = t2);
  }
  xo(e, t) {
    const n = ge[e];
    return `${this.Do}/v1/${t}:${n}`;
  }
  terminate() {
  }
} {
  constructor(e) {
    super(e), this.forceLongPolling = e.forceLongPolling, this.autoDetectLongPolling = e.autoDetectLongPolling, this.useFetchStreams = e.useFetchStreams, this.longPollingOptions = e.longPollingOptions;
  }
  No(e, t, n, r) {
    const i = __PRIVATE_generateUniqueDebugId();
    return new Promise((s, o) => {
      const _ = new XhrIo;
      _.setWithCredentials(true), _.listenOnce(EventType.COMPLETE, () => {
        try {
          switch (_.getLastErrorCode()) {
            case ErrorCode.NO_ERROR:
              const t2 = _.getResponseJson();
              __PRIVATE_logDebug(pe, `XHR for RPC '${e}' ${i} received:`, JSON.stringify(t2)), s(t2);
              break;
            case ErrorCode.TIMEOUT:
              __PRIVATE_logDebug(pe, `RPC '${e}' ${i} timed out`), o(new FirestoreError(v.DEADLINE_EXCEEDED, "Request time out"));
              break;
            case ErrorCode.HTTP_ERROR:
              const n2 = _.getStatus();
              if (__PRIVATE_logDebug(pe, `RPC '${e}' ${i} failed with status:`, n2, "response text:", _.getResponseText()), n2 > 0) {
                let e2 = _.getResponseJson();
                Array.isArray(e2) && (e2 = e2[0]);
                const t3 = e2 == null ? undefined : e2.error;
                if (t3 && t3.status && t3.message) {
                  const e3 = function __PRIVATE_mapCodeFromHttpResponseErrorStatus(e4) {
                    const t4 = e4.toLowerCase().replace(/_/g, "-");
                    return Object.values(v).indexOf(t4) >= 0 ? t4 : v.UNKNOWN;
                  }(t3.status);
                  o(new FirestoreError(e3, t3.message));
                } else
                  o(new FirestoreError(v.UNKNOWN, "Server responded with status " + _.getStatus()));
              } else
                o(new FirestoreError(v.UNAVAILABLE, "Connection failed."));
              break;
            default:
              fail();
          }
        } finally {
          __PRIVATE_logDebug(pe, `RPC '${e}' ${i} completed.`);
        }
      });
      const a = JSON.stringify(r);
      __PRIVATE_logDebug(pe, `RPC '${e}' ${i} sending request:`, r), _.send(t, "POST", a, n, 15);
    });
  }
  Bo(e, t, n) {
    const r = __PRIVATE_generateUniqueDebugId(), i = [this.Do, "/", "google.firestore.v1.Firestore", "/", e, "/channel"], s = createWebChannelTransport(), o = getStatEventTarget(), _ = {
      httpSessionIdParam: "gsessionid",
      initMessageHeaders: {},
      messageUrlParams: {
        database: `projects/${this.databaseId.projectId}/databases/${this.databaseId.database}`
      },
      sendRawJson: true,
      supportsCrossDomainXhr: true,
      internalChannelParams: {
        forwardChannelRequestTimeoutMs: 600000
      },
      forceLongPolling: this.forceLongPolling,
      detectBufferingProxy: this.autoDetectLongPolling
    }, a = this.longPollingOptions.timeoutSeconds;
    a !== undefined && (_.longPollingTimeout = Math.round(1000 * a)), this.useFetchStreams && (_.xmlHttpFactory = new FetchXmlHttpFactory({})), this.Oo(_.initMessageHeaders, t, n), _.encodeInitMessageHeaders = true;
    const u = i.join("");
    __PRIVATE_logDebug(pe, `Creating RPC '${e}' stream ${r}: ${u}`, _);
    const c = s.createWebChannel(u, _);
    let l = false, h = false;
    const P = new __PRIVATE_StreamBridge({
      Io: (t2) => {
        h ? __PRIVATE_logDebug(pe, `Not sending because RPC '${e}' stream ${r} is closed:`, t2) : (l || (__PRIVATE_logDebug(pe, `Opening RPC '${e}' stream ${r} transport.`), c.open(), l = true), __PRIVATE_logDebug(pe, `RPC '${e}' stream ${r} sending:`, t2), c.send(t2));
      },
      To: () => c.close()
    }), __PRIVATE_unguardedEventListen = (e2, t2, n2) => {
      e2.listen(t2, (e3) => {
        try {
          n2(e3);
        } catch (e4) {
          setTimeout(() => {
            throw e4;
          }, 0);
        }
      });
    };
    return __PRIVATE_unguardedEventListen(c, WebChannel.EventType.OPEN, () => {
      h || (__PRIVATE_logDebug(pe, `RPC '${e}' stream ${r} transport opened.`), P.yo());
    }), __PRIVATE_unguardedEventListen(c, WebChannel.EventType.CLOSE, () => {
      h || (h = true, __PRIVATE_logDebug(pe, `RPC '${e}' stream ${r} transport closed`), P.So());
    }), __PRIVATE_unguardedEventListen(c, WebChannel.EventType.ERROR, (t2) => {
      h || (h = true, __PRIVATE_logWarn(pe, `RPC '${e}' stream ${r} transport errored:`, t2), P.So(new FirestoreError(v.UNAVAILABLE, "The operation could not be completed")));
    }), __PRIVATE_unguardedEventListen(c, WebChannel.EventType.MESSAGE, (t2) => {
      var n2;
      if (!h) {
        const i2 = t2.data[0];
        __PRIVATE_hardAssert(!!i2);
        const s2 = i2, o2 = s2.error || ((n2 = s2[0]) === null || n2 === undefined ? undefined : n2.error);
        if (o2) {
          __PRIVATE_logDebug(pe, `RPC '${e}' stream ${r} received error:`, o2);
          const t3 = o2.status;
          let n3 = function __PRIVATE_mapCodeFromRpcStatus(e2) {
            const t4 = he[e2];
            if (t4 !== undefined)
              return __PRIVATE_mapCodeFromRpcCode(t4);
          }(t3), i3 = o2.message;
          n3 === undefined && (n3 = v.INTERNAL, i3 = "Unknown error status: " + t3 + " with message " + o2.message), h = true, P.So(new FirestoreError(n3, i3)), c.close();
        } else
          __PRIVATE_logDebug(pe, `RPC '${e}' stream ${r} received:`, i2), P.bo(i2);
      }
    }), __PRIVATE_unguardedEventListen(o, Event.STAT_EVENT, (t2) => {
      t2.stat === Stat.PROXY ? __PRIVATE_logDebug(pe, `RPC '${e}' stream ${r} detected buffering proxy`) : t2.stat === Stat.NOPROXY && __PRIVATE_logDebug(pe, `RPC '${e}' stream ${r} detected no buffering proxy`);
    }), setTimeout(() => {
      P.wo();
    }, 0), P;
  }
}
function getDocument() {
  return typeof document != "undefined" ? document : null;
}
function __PRIVATE_newSerializer(e) {
  return new JsonProtoSerializer(e, true);
}

class __PRIVATE_ExponentialBackoff {
  constructor(e, t, n = 1000, r = 1.5, i = 60000) {
    this.ui = e, this.timerId = t, this.ko = n, this.qo = r, this.Qo = i, this.Ko = 0, this.$o = null, this.Uo = Date.now(), this.reset();
  }
  reset() {
    this.Ko = 0;
  }
  Wo() {
    this.Ko = this.Qo;
  }
  Go(e) {
    this.cancel();
    const t = Math.floor(this.Ko + this.zo()), n = Math.max(0, Date.now() - this.Uo), r = Math.max(0, t - n);
    r > 0 && __PRIVATE_logDebug("ExponentialBackoff", `Backing off for ${r} ms (base delay: ${this.Ko} ms, delay with jitter: ${t} ms, last attempt: ${n} ms ago)`), this.$o = this.ui.enqueueAfterDelay(this.timerId, r, () => (this.Uo = Date.now(), e())), this.Ko *= this.qo, this.Ko < this.ko && (this.Ko = this.ko), this.Ko > this.Qo && (this.Ko = this.Qo);
  }
  jo() {
    this.$o !== null && (this.$o.skipDelay(), this.$o = null);
  }
  cancel() {
    this.$o !== null && (this.$o.cancel(), this.$o = null);
  }
  zo() {
    return (Math.random() - 0.5) * this.Ko;
  }
}

class __PRIVATE_PersistentStream {
  constructor(e, t, n, r, i, s, o, _) {
    this.ui = e, this.Ho = n, this.Jo = r, this.connection = i, this.authCredentialsProvider = s, this.appCheckCredentialsProvider = o, this.listener = _, this.state = 0, this.Yo = 0, this.Zo = null, this.Xo = null, this.stream = null, this.e_ = 0, this.t_ = new __PRIVATE_ExponentialBackoff(e, t);
  }
  n_() {
    return this.state === 1 || this.state === 5 || this.r_();
  }
  r_() {
    return this.state === 2 || this.state === 3;
  }
  start() {
    this.e_ = 0, this.state !== 4 ? this.auth() : this.i_();
  }
  async stop() {
    this.n_() && await this.close(0);
  }
  s_() {
    this.state = 0, this.t_.reset();
  }
  o_() {
    this.r_() && this.Zo === null && (this.Zo = this.ui.enqueueAfterDelay(this.Ho, 60000, () => this.__()));
  }
  a_(e) {
    this.u_(), this.stream.send(e);
  }
  async __() {
    if (this.r_())
      return this.close(0);
  }
  u_() {
    this.Zo && (this.Zo.cancel(), this.Zo = null);
  }
  c_() {
    this.Xo && (this.Xo.cancel(), this.Xo = null);
  }
  async close(e, t) {
    this.u_(), this.c_(), this.t_.cancel(), this.Yo++, e !== 4 ? this.t_.reset() : t && t.code === v.RESOURCE_EXHAUSTED ? (__PRIVATE_logError(t.toString()), __PRIVATE_logError("Using maximum backoff delay to prevent overloading the backend."), this.t_.Wo()) : t && t.code === v.UNAUTHENTICATED && this.state !== 3 && (this.authCredentialsProvider.invalidateToken(), this.appCheckCredentialsProvider.invalidateToken()), this.stream !== null && (this.l_(), this.stream.close(), this.stream = null), this.state = e, await this.listener.mo(t);
  }
  l_() {
  }
  auth() {
    this.state = 1;
    const e = this.h_(this.Yo), t = this.Yo;
    Promise.all([this.authCredentialsProvider.getToken(), this.appCheckCredentialsProvider.getToken()]).then(([e2, n]) => {
      this.Yo === t && this.P_(e2, n);
    }, (t2) => {
      e(() => {
        const e2 = new FirestoreError(v.UNKNOWN, "Fetching auth token failed: " + t2.message);
        return this.I_(e2);
      });
    });
  }
  P_(e, t) {
    const n = this.h_(this.Yo);
    this.stream = this.T_(e, t), this.stream.Eo(() => {
      n(() => this.listener.Eo());
    }), this.stream.Ro(() => {
      n(() => (this.state = 2, this.Xo = this.ui.enqueueAfterDelay(this.Jo, 1e4, () => (this.r_() && (this.state = 3), Promise.resolve())), this.listener.Ro()));
    }), this.stream.mo((e2) => {
      n(() => this.I_(e2));
    }), this.stream.onMessage((e2) => {
      n(() => ++this.e_ == 1 ? this.E_(e2) : this.onNext(e2));
    });
  }
  i_() {
    this.state = 5, this.t_.Go(async () => {
      this.state = 0, this.start();
    });
  }
  I_(e) {
    return __PRIVATE_logDebug("PersistentStream", `close with error: ${e}`), this.stream = null, this.close(4, e);
  }
  h_(e) {
    return (t) => {
      this.ui.enqueueAndForget(() => this.Yo === e ? t() : (__PRIVATE_logDebug("PersistentStream", "stream callback skipped by getCloseGuardedDispatcher."), Promise.resolve()));
    };
  }
}
class __PRIVATE_PersistentWriteStream extends __PRIVATE_PersistentStream {
  constructor(e, t, n, r, i, s) {
    super(e, "write_stream_connection_backoff", "write_stream_idle", "health_check_timeout", t, n, r, s), this.serializer = i;
  }
  get V_() {
    return this.e_ > 0;
  }
  start() {
    this.lastStreamToken = undefined, super.start();
  }
  l_() {
    this.V_ && this.m_([]);
  }
  T_(e, t) {
    return this.connection.Bo("Write", e, t);
  }
  E_(e) {
    return __PRIVATE_hardAssert(!!e.streamToken), this.lastStreamToken = e.streamToken, __PRIVATE_hardAssert(!e.writeResults || e.writeResults.length === 0), this.listener.f_();
  }
  onNext(e) {
    __PRIVATE_hardAssert(!!e.streamToken), this.lastStreamToken = e.streamToken, this.t_.reset();
    const t = __PRIVATE_fromWriteResults(e.writeResults, e.commitTime), n = __PRIVATE_fromVersion(e.commitTime);
    return this.listener.g_(n, t);
  }
  p_() {
    const e = {};
    e.database = __PRIVATE_getEncodedDatabaseId(this.serializer), this.a_(e);
  }
  m_(e) {
    const t = {
      streamToken: this.lastStreamToken,
      writes: e.map((e2) => toMutation(this.serializer, e2))
    };
    this.a_(t);
  }
}

class __PRIVATE_DatastoreImpl extends class Datastore {
} {
  constructor(e, t, n, r) {
    super(), this.authCredentials = e, this.appCheckCredentials = t, this.connection = n, this.serializer = r, this.y_ = false;
  }
  w_() {
    if (this.y_)
      throw new FirestoreError(v.FAILED_PRECONDITION, "The client has already been terminated.");
  }
  Mo(e, t, n, r) {
    return this.w_(), Promise.all([this.authCredentials.getToken(), this.appCheckCredentials.getToken()]).then(([i, s]) => this.connection.Mo(e, __PRIVATE_toResourcePath(t, n), r, i, s)).catch((e2) => {
      throw e2.name === "FirebaseError" ? (e2.code === v.UNAUTHENTICATED && (this.authCredentials.invalidateToken(), this.appCheckCredentials.invalidateToken()), e2) : new FirestoreError(v.UNKNOWN, e2.toString());
    });
  }
  Lo(e, t, n, r, i) {
    return this.w_(), Promise.all([this.authCredentials.getToken(), this.appCheckCredentials.getToken()]).then(([s, o]) => this.connection.Lo(e, __PRIVATE_toResourcePath(t, n), r, s, o, i)).catch((e2) => {
      throw e2.name === "FirebaseError" ? (e2.code === v.UNAUTHENTICATED && (this.authCredentials.invalidateToken(), this.appCheckCredentials.invalidateToken()), e2) : new FirestoreError(v.UNKNOWN, e2.toString());
    });
  }
  terminate() {
    this.y_ = true, this.connection.terminate();
  }
}

class __PRIVATE_OnlineStateTracker {
  constructor(e, t) {
    this.asyncQueue = e, this.onlineStateHandler = t, this.state = "Unknown", this.S_ = 0, this.b_ = null, this.D_ = true;
  }
  v_() {
    this.S_ === 0 && (this.C_("Unknown"), this.b_ = this.asyncQueue.enqueueAfterDelay("online_state_timeout", 1e4, () => (this.b_ = null, this.F_("Backend didn't respond within 10 seconds."), this.C_("Offline"), Promise.resolve())));
  }
  M_(e) {
    this.state === "Online" ? this.C_("Unknown") : (this.S_++, this.S_ >= 1 && (this.x_(), this.F_(`Connection failed 1 times. Most recent error: ${e.toString()}`), this.C_("Offline")));
  }
  set(e) {
    this.x_(), this.S_ = 0, e === "Online" && (this.D_ = false), this.C_(e);
  }
  C_(e) {
    e !== this.state && (this.state = e, this.onlineStateHandler(e));
  }
  F_(e) {
    const t = `Could not reach Cloud Firestore backend. ${e}
This typically indicates that your device does not have a healthy Internet connection at the moment. The client will operate in offline mode until it is able to successfully connect to the backend.`;
    this.D_ ? (__PRIVATE_logError(t), this.D_ = false) : __PRIVATE_logDebug("OnlineStateTracker", t);
  }
  x_() {
    this.b_ !== null && (this.b_.cancel(), this.b_ = null);
  }
}

class __PRIVATE_RemoteStoreImpl {
  constructor(e, t, n, r, i) {
    this.localStore = e, this.datastore = t, this.asyncQueue = n, this.remoteSyncer = {}, this.O_ = [], this.N_ = new Map, this.L_ = new Set, this.B_ = [], this.k_ = i, this.k_._o((e2) => {
      n.enqueueAndForget(async () => {
        __PRIVATE_canUseNetwork(this) && (__PRIVATE_logDebug("RemoteStore", "Restarting streams for network reachability change."), await async function __PRIVATE_restartNetwork(e3) {
          const t2 = __PRIVATE_debugCast(e3);
          t2.L_.add(4), await __PRIVATE_disableNetworkInternal(t2), t2.q_.set("Unknown"), t2.L_.delete(4), await __PRIVATE_enableNetworkInternal(t2);
        }(this));
      });
    }), this.q_ = new __PRIVATE_OnlineStateTracker(n, r);
  }
}
async function __PRIVATE_enableNetworkInternal(e) {
  if (__PRIVATE_canUseNetwork(e))
    for (const t of e.B_)
      await t(true);
}
async function __PRIVATE_disableNetworkInternal(e) {
  for (const t of e.B_)
    await t(false);
}
function __PRIVATE_canUseNetwork(e) {
  return __PRIVATE_debugCast(e).L_.size === 0;
}
async function __PRIVATE_disableNetworkUntilRecovery(e, t, n) {
  if (!__PRIVATE_isIndexedDbTransactionError(t))
    throw t;
  e.L_.add(1), await __PRIVATE_disableNetworkInternal(e), e.q_.set("Offline"), n || (n = () => __PRIVATE_localStoreGetLastRemoteSnapshotVersion(e.localStore)), e.asyncQueue.enqueueRetryable(async () => {
    __PRIVATE_logDebug("RemoteStore", "Retrying IndexedDB access"), await n(), e.L_.delete(1), await __PRIVATE_enableNetworkInternal(e);
  });
}
function __PRIVATE_executeWithRecovery(e, t) {
  return t().catch((n) => __PRIVATE_disableNetworkUntilRecovery(e, n, t));
}
async function __PRIVATE_fillWritePipeline(e) {
  const t = __PRIVATE_debugCast(e), n = __PRIVATE_ensureWriteStream(t);
  let r = t.O_.length > 0 ? t.O_[t.O_.length - 1].batchId : -1;
  for (;__PRIVATE_canAddToWritePipeline(t); )
    try {
      const e2 = await __PRIVATE_localStoreGetNextMutationBatch(t.localStore, r);
      if (e2 === null) {
        t.O_.length === 0 && n.o_();
        break;
      }
      r = e2.batchId, __PRIVATE_addToWritePipeline(t, e2);
    } catch (e2) {
      await __PRIVATE_disableNetworkUntilRecovery(t, e2);
    }
  __PRIVATE_shouldStartWriteStream(t) && __PRIVATE_startWriteStream(t);
}
function __PRIVATE_canAddToWritePipeline(e) {
  return __PRIVATE_canUseNetwork(e) && e.O_.length < 10;
}
function __PRIVATE_addToWritePipeline(e, t) {
  e.O_.push(t);
  const n = __PRIVATE_ensureWriteStream(e);
  n.r_() && n.V_ && n.m_(t.mutations);
}
function __PRIVATE_shouldStartWriteStream(e) {
  return __PRIVATE_canUseNetwork(e) && !__PRIVATE_ensureWriteStream(e).n_() && e.O_.length > 0;
}
function __PRIVATE_startWriteStream(e) {
  __PRIVATE_ensureWriteStream(e).start();
}
async function __PRIVATE_onWriteStreamOpen(e) {
  __PRIVATE_ensureWriteStream(e).p_();
}
async function __PRIVATE_onWriteHandshakeComplete(e) {
  const t = __PRIVATE_ensureWriteStream(e);
  for (const n of e.O_)
    t.m_(n.mutations);
}
async function __PRIVATE_onMutationResult(e, t, n) {
  const r = e.O_.shift(), i = MutationBatchResult.from(r, t, n);
  await __PRIVATE_executeWithRecovery(e, () => e.remoteSyncer.applySuccessfulWrite(i)), await __PRIVATE_fillWritePipeline(e);
}
async function __PRIVATE_onWriteStreamClose(e, t) {
  t && __PRIVATE_ensureWriteStream(e).V_ && await async function __PRIVATE_handleWriteError(e2, t2) {
    if (function __PRIVATE_isPermanentWriteError(e3) {
      return __PRIVATE_isPermanentError(e3) && e3 !== v.ABORTED;
    }(t2.code)) {
      const n = e2.O_.shift();
      __PRIVATE_ensureWriteStream(e2).s_(), await __PRIVATE_executeWithRecovery(e2, () => e2.remoteSyncer.rejectFailedWrite(n.batchId, t2)), await __PRIVATE_fillWritePipeline(e2);
    }
  }(e, t), __PRIVATE_shouldStartWriteStream(e) && __PRIVATE_startWriteStream(e);
}
async function __PRIVATE_remoteStoreHandleCredentialChange(e, t) {
  const n = __PRIVATE_debugCast(e);
  n.asyncQueue.verifyOperationInProgress(), __PRIVATE_logDebug("RemoteStore", "RemoteStore received new credentials");
  const r = __PRIVATE_canUseNetwork(n);
  n.L_.add(3), await __PRIVATE_disableNetworkInternal(n), r && n.q_.set("Unknown"), await n.remoteSyncer.handleCredentialChange(t), n.L_.delete(3), await __PRIVATE_enableNetworkInternal(n);
}
async function __PRIVATE_remoteStoreApplyPrimaryState(e, t) {
  const n = __PRIVATE_debugCast(e);
  t ? (n.L_.delete(2), await __PRIVATE_enableNetworkInternal(n)) : t || (n.L_.add(2), await __PRIVATE_disableNetworkInternal(n), n.q_.set("Unknown"));
}
function __PRIVATE_ensureWriteStream(e) {
  return e.U_ || (e.U_ = function __PRIVATE_newPersistentWriteStream(e2, t, n) {
    const r = __PRIVATE_debugCast(e2);
    return r.w_(), new __PRIVATE_PersistentWriteStream(t, r.connection, r.authCredentials, r.appCheckCredentials, r.serializer, n);
  }(e.datastore, e.asyncQueue, {
    Eo: () => Promise.resolve(),
    Ro: __PRIVATE_onWriteStreamOpen.bind(null, e),
    mo: __PRIVATE_onWriteStreamClose.bind(null, e),
    f_: __PRIVATE_onWriteHandshakeComplete.bind(null, e),
    g_: __PRIVATE_onMutationResult.bind(null, e)
  }), e.B_.push(async (t) => {
    t ? (e.U_.s_(), await __PRIVATE_fillWritePipeline(e)) : (await e.U_.stop(), e.O_.length > 0 && (__PRIVATE_logDebug("RemoteStore", `Stopping write stream with ${e.O_.length} pending writes`), e.O_ = []));
  })), e.U_;
}

class DelayedOperation {
  constructor(e, t, n, r, i) {
    this.asyncQueue = e, this.timerId = t, this.targetTimeMs = n, this.op = r, this.removalCallback = i, this.deferred = new __PRIVATE_Deferred, this.then = this.deferred.promise.then.bind(this.deferred.promise), this.deferred.promise.catch((e2) => {
    });
  }
  get promise() {
    return this.deferred.promise;
  }
  static createAndSchedule(e, t, n, r, i) {
    const s = Date.now() + n, o = new DelayedOperation(e, t, s, r, i);
    return o.start(n), o;
  }
  start(e) {
    this.timerHandle = setTimeout(() => this.handleDelayElapsed(), e);
  }
  skipDelay() {
    return this.handleDelayElapsed();
  }
  cancel(e) {
    this.timerHandle !== null && (this.clearTimeout(), this.deferred.reject(new FirestoreError(v.CANCELLED, "Operation cancelled" + (e ? ": " + e : ""))));
  }
  handleDelayElapsed() {
    this.asyncQueue.enqueueAndForget(() => this.timerHandle !== null ? (this.clearTimeout(), this.op().then((e) => this.deferred.resolve(e))) : Promise.resolve());
  }
  clearTimeout() {
    this.timerHandle !== null && (this.removalCallback(this), clearTimeout(this.timerHandle), this.timerHandle = null);
  }
}
function __PRIVATE_wrapInUserErrorIfRecoverable(e, t) {
  if (__PRIVATE_logError("AsyncQueue", `${t}: ${e}`), __PRIVATE_isIndexedDbTransactionError(e))
    return new FirestoreError(v.UNAVAILABLE, `${t}: ${e}`);
  throw e;
}
class __PRIVATE_EventManagerImpl {
  constructor() {
    this.queries = __PRIVATE_newQueriesObjectMap(), this.onlineState = "Unknown", this.Y_ = new Set;
  }
  terminate() {
    (function __PRIVATE_errorAllTargets(e, t) {
      const n = __PRIVATE_debugCast(e), r = n.queries;
      n.queries = __PRIVATE_newQueriesObjectMap(), r.forEach((e2, n2) => {
        for (const e3 of n2.j_)
          e3.onError(t);
      });
    })(this, new FirestoreError(v.ABORTED, "Firestore shutting down"));
  }
}
function __PRIVATE_newQueriesObjectMap() {
  return new ObjectMap((e) => __PRIVATE_canonifyQuery(e), __PRIVATE_queryEquals);
}
function __PRIVATE_raiseSnapshotsInSyncEvent(e) {
  e.Y_.forEach((e2) => {
    e2.next();
  });
}
var ye;
var we;
(we = ye || (ye = {})).ea = "default", we.Cache = "cache";
class __PRIVATE_SyncEngineImpl {
  constructor(e, t, n, r, i, s) {
    this.localStore = e, this.remoteStore = t, this.eventManager = n, this.sharedClientState = r, this.currentUser = i, this.maxConcurrentLimboResolutions = s, this.Ca = {}, this.Fa = new ObjectMap((e2) => __PRIVATE_canonifyQuery(e2), __PRIVATE_queryEquals), this.Ma = new Map, this.xa = new Set, this.Oa = new SortedMap(DocumentKey.comparator), this.Na = new Map, this.La = new __PRIVATE_ReferenceSet, this.Ba = {}, this.ka = new Map, this.qa = __PRIVATE_TargetIdGenerator.kn(), this.onlineState = "Unknown", this.Qa = undefined;
  }
  get isPrimaryClient() {
    return this.Qa === true;
  }
}
async function __PRIVATE_syncEngineWrite(e, t, n) {
  const r = __PRIVATE_syncEngineEnsureWriteCallbacks(e);
  try {
    const e2 = await function __PRIVATE_localStoreWriteLocally(e3, t2) {
      const n2 = __PRIVATE_debugCast(e3), r2 = Timestamp.now(), i = t2.reduce((e4, t3) => e4.add(t3.key), __PRIVATE_documentKeySet());
      let s, o;
      return n2.persistence.runTransaction("Locally write mutations", "readwrite", (e4) => {
        let _ = __PRIVATE_mutableDocumentMap(), a = __PRIVATE_documentKeySet();
        return n2.cs.getEntries(e4, i).next((e5) => {
          _ = e5, _.forEach((e6, t3) => {
            t3.isValidDocument() || (a = a.add(e6));
          });
        }).next(() => n2.localDocuments.getOverlayedDocuments(e4, _)).next((i2) => {
          s = i2;
          const o2 = [];
          for (const e5 of t2) {
            const t3 = __PRIVATE_mutationExtractBaseValue(e5, s.get(e5.key).overlayedDocument);
            t3 != null && o2.push(new __PRIVATE_PatchMutation(e5.key, t3, __PRIVATE_extractFieldMask(t3.value.mapValue), Precondition.exists(true)));
          }
          return n2.mutationQueue.addMutationBatch(e4, r2, o2, t2);
        }).next((t3) => {
          o = t3;
          const r3 = t3.applyToLocalDocumentSet(s, a);
          return n2.documentOverlayCache.saveOverlays(e4, t3.batchId, r3);
        });
      }).then(() => ({
        batchId: o.batchId,
        changes: __PRIVATE_convertOverlayedDocumentMapToDocumentMap(s)
      }));
    }(r.localStore, t);
    r.sharedClientState.addPendingMutation(e2.batchId), function __PRIVATE_addMutationCallback(e3, t2, n2) {
      let r2 = e3.Ba[e3.currentUser.toKey()];
      r2 || (r2 = new SortedMap(__PRIVATE_primitiveComparator));
      r2 = r2.insert(t2, n2), e3.Ba[e3.currentUser.toKey()] = r2;
    }(r, e2.batchId, n), await __PRIVATE_syncEngineEmitNewSnapsAndNotifyLocalStore(r, e2.changes), await __PRIVATE_fillWritePipeline(r.remoteStore);
  } catch (e2) {
    const t2 = __PRIVATE_wrapInUserErrorIfRecoverable(e2, "Failed to persist write");
    n.reject(t2);
  }
}
function __PRIVATE_syncEngineApplyOnlineStateChange(e, t, n) {
  const r = __PRIVATE_debugCast(e);
  if (r.isPrimaryClient && n === 0 || !r.isPrimaryClient && n === 1) {
    const e2 = [];
    r.Fa.forEach((n2, r2) => {
      const i = r2.view.Z_(t);
      i.snapshot && e2.push(i.snapshot);
    }), function __PRIVATE_eventManagerOnOnlineStateChange(e3, t2) {
      const n2 = __PRIVATE_debugCast(e3);
      n2.onlineState = t2;
      let r2 = false;
      n2.queries.forEach((e4, n3) => {
        for (const e5 of n3.j_)
          e5.Z_(t2) && (r2 = true);
      }), r2 && __PRIVATE_raiseSnapshotsInSyncEvent(n2);
    }(r.eventManager, t), e2.length && r.Ca.d_(e2), r.onlineState = t, r.isPrimaryClient && r.sharedClientState.setOnlineState(t);
  }
}
async function __PRIVATE_syncEngineApplySuccessfulWrite(e, t) {
  const n = __PRIVATE_debugCast(e), r = t.batch.batchId;
  try {
    const e2 = await __PRIVATE_localStoreAcknowledgeBatch(n.localStore, t);
    __PRIVATE_processUserCallback(n, r, null), __PRIVATE_triggerPendingWritesCallbacks(n, r), n.sharedClientState.updateMutationState(r, "acknowledged"), await __PRIVATE_syncEngineEmitNewSnapsAndNotifyLocalStore(n, e2);
  } catch (e2) {
    await __PRIVATE_ignoreIfPrimaryLeaseLoss(e2);
  }
}
async function __PRIVATE_syncEngineRejectFailedWrite(e, t, n) {
  const r = __PRIVATE_debugCast(e);
  try {
    const e2 = await function __PRIVATE_localStoreRejectBatch(e3, t2) {
      const n2 = __PRIVATE_debugCast(e3);
      return n2.persistence.runTransaction("Reject batch", "readwrite-primary", (e4) => {
        let r2;
        return n2.mutationQueue.lookupMutationBatch(e4, t2).next((t3) => (__PRIVATE_hardAssert(t3 !== null), r2 = t3.keys(), n2.mutationQueue.removeMutationBatch(e4, t3))).next(() => n2.mutationQueue.performConsistencyCheck(e4)).next(() => n2.documentOverlayCache.removeOverlaysForBatchId(e4, r2, t2)).next(() => n2.localDocuments.recalculateAndSaveOverlaysForDocumentKeys(e4, r2)).next(() => n2.localDocuments.getDocuments(e4, r2));
      });
    }(r.localStore, t);
    __PRIVATE_processUserCallback(r, t, n), __PRIVATE_triggerPendingWritesCallbacks(r, t), r.sharedClientState.updateMutationState(t, "rejected", n), await __PRIVATE_syncEngineEmitNewSnapsAndNotifyLocalStore(r, e2);
  } catch (n2) {
    await __PRIVATE_ignoreIfPrimaryLeaseLoss(n2);
  }
}
function __PRIVATE_triggerPendingWritesCallbacks(e, t) {
  (e.ka.get(t) || []).forEach((e2) => {
    e2.resolve();
  }), e.ka.delete(t);
}
function __PRIVATE_processUserCallback(e, t, n) {
  const r = __PRIVATE_debugCast(e);
  let i = r.Ba[r.currentUser.toKey()];
  if (i) {
    const e2 = i.get(t);
    e2 && (n ? e2.reject(n) : e2.resolve(), i = i.remove(t)), r.Ba[r.currentUser.toKey()] = i;
  }
}
async function __PRIVATE_syncEngineEmitNewSnapsAndNotifyLocalStore(e, t, n) {
  const r = __PRIVATE_debugCast(e), i = [], s = [], o = [];
  r.Fa.isEmpty() || (r.Fa.forEach((e2, _) => {
    o.push(r.Ka(_, t, n).then((e3) => {
      var t2;
      if ((e3 || n) && r.isPrimaryClient) {
        const i2 = e3 ? !e3.fromCache : (t2 = n == null ? undefined : n.targetChanges.get(_.targetId)) === null || t2 === undefined ? undefined : t2.current;
        r.sharedClientState.updateQueryState(_.targetId, i2 ? "current" : "not-current");
      }
      if (e3) {
        i.push(e3);
        const t3 = __PRIVATE_LocalViewChanges.Wi(_.targetId, e3);
        s.push(t3);
      }
    }));
  }), await Promise.all(o), r.Ca.d_(i), await async function __PRIVATE_localStoreNotifyLocalViewChanges(e2, t2) {
    const n2 = __PRIVATE_debugCast(e2);
    try {
      await n2.persistence.runTransaction("notifyLocalViewChanges", "readwrite", (e3) => PersistencePromise.forEach(t2, (t3) => PersistencePromise.forEach(t3.$i, (r2) => n2.persistence.referenceDelegate.addReference(e3, t3.targetId, r2)).next(() => PersistencePromise.forEach(t3.Ui, (r2) => n2.persistence.referenceDelegate.removeReference(e3, t3.targetId, r2)))));
    } catch (e3) {
      if (!__PRIVATE_isIndexedDbTransactionError(e3))
        throw e3;
      __PRIVATE_logDebug("LocalStore", "Failed to update sequence numbers: " + e3);
    }
    for (const e3 of t2) {
      const t3 = e3.targetId;
      if (!e3.fromCache) {
        const e4 = n2.os.get(t3), r2 = e4.snapshotVersion, i2 = e4.withLastLimboFreeSnapshotVersion(r2);
        n2.os = n2.os.insert(t3, i2);
      }
    }
  }(r.localStore, s));
}
async function __PRIVATE_syncEngineHandleCredentialChange(e, t) {
  const n = __PRIVATE_debugCast(e);
  if (!n.currentUser.isEqual(t)) {
    __PRIVATE_logDebug("SyncEngine", "User change. New user:", t.toKey());
    const e2 = await __PRIVATE_localStoreHandleUserChange(n.localStore, t);
    n.currentUser = t, function __PRIVATE_rejectOutstandingPendingWritesCallbacks(e3, t2) {
      e3.ka.forEach((e4) => {
        e4.forEach((e5) => {
          e5.reject(new FirestoreError(v.CANCELLED, t2));
        });
      }), e3.ka.clear();
    }(n, "'waitForPendingWrites' promise is rejected due to a user change."), n.sharedClientState.handleUserChange(t, e2.removedBatchIds, e2.addedBatchIds), await __PRIVATE_syncEngineEmitNewSnapsAndNotifyLocalStore(n, e2.hs);
  }
}
function __PRIVATE_syncEngineEnsureWriteCallbacks(e) {
  const t = __PRIVATE_debugCast(e);
  return t.remoteStore.remoteSyncer.applySuccessfulWrite = __PRIVATE_syncEngineApplySuccessfulWrite.bind(null, t), t.remoteStore.remoteSyncer.rejectFailedWrite = __PRIVATE_syncEngineRejectFailedWrite.bind(null, t), t;
}
class MemoryOfflineComponentProvider {
  constructor() {
    this.synchronizeTabs = false;
  }
  async initialize(e) {
    this.serializer = __PRIVATE_newSerializer(e.databaseInfo.databaseId), this.sharedClientState = this.createSharedClientState(e), this.persistence = this.createPersistence(e), await this.persistence.start(), this.localStore = this.createLocalStore(e), this.gcScheduler = this.createGarbageCollectionScheduler(e, this.localStore), this.indexBackfillerScheduler = this.createIndexBackfillerScheduler(e, this.localStore);
  }
  createGarbageCollectionScheduler(e, t) {
    return null;
  }
  createIndexBackfillerScheduler(e, t) {
    return null;
  }
  createLocalStore(e) {
    return __PRIVATE_newLocalStore(this.persistence, new __PRIVATE_QueryEngine, e.initialUser, this.serializer);
  }
  createPersistence(e) {
    return new __PRIVATE_MemoryPersistence(__PRIVATE_MemoryEagerDelegate.Zr, this.serializer);
  }
  createSharedClientState(e) {
    return new __PRIVATE_MemorySharedClientState;
  }
  async terminate() {
    var e, t;
    (e = this.gcScheduler) === null || e === undefined || e.stop(), (t = this.indexBackfillerScheduler) === null || t === undefined || t.stop(), this.sharedClientState.shutdown(), await this.persistence.shutdown();
  }
}
class OnlineComponentProvider {
  async initialize(e, t) {
    this.localStore || (this.localStore = e.localStore, this.sharedClientState = e.sharedClientState, this.datastore = this.createDatastore(t), this.remoteStore = this.createRemoteStore(t), this.eventManager = this.createEventManager(t), this.syncEngine = this.createSyncEngine(t, !e.synchronizeTabs), this.sharedClientState.onlineStateHandler = (e2) => __PRIVATE_syncEngineApplyOnlineStateChange(this.syncEngine, e2, 1), this.remoteStore.remoteSyncer.handleCredentialChange = __PRIVATE_syncEngineHandleCredentialChange.bind(null, this.syncEngine), await __PRIVATE_remoteStoreApplyPrimaryState(this.remoteStore, this.syncEngine.isPrimaryClient));
  }
  createEventManager(e) {
    return function __PRIVATE_newEventManager() {
      return new __PRIVATE_EventManagerImpl;
    }();
  }
  createDatastore(e) {
    const t = __PRIVATE_newSerializer(e.databaseInfo.databaseId), n = function __PRIVATE_newConnection(e2) {
      return new __PRIVATE_WebChannelConnection(e2);
    }(e.databaseInfo);
    return function __PRIVATE_newDatastore(e2, t2, n2, r) {
      return new __PRIVATE_DatastoreImpl(e2, t2, n2, r);
    }(e.authCredentials, e.appCheckCredentials, n, t);
  }
  createRemoteStore(e) {
    return function __PRIVATE_newRemoteStore(e2, t, n, r, i) {
      return new __PRIVATE_RemoteStoreImpl(e2, t, n, r, i);
    }(this.localStore, this.datastore, e.asyncQueue, (e2) => __PRIVATE_syncEngineApplyOnlineStateChange(this.syncEngine, e2, 0), function __PRIVATE_newConnectivityMonitor() {
      return __PRIVATE_BrowserConnectivityMonitor.D() ? new __PRIVATE_BrowserConnectivityMonitor : new __PRIVATE_NoopConnectivityMonitor;
    }());
  }
  createSyncEngine(e, t) {
    return function __PRIVATE_newSyncEngine(e2, t2, n, r, i, s, o) {
      const _ = new __PRIVATE_SyncEngineImpl(e2, t2, n, r, i, s);
      return o && (_.Qa = true), _;
    }(this.localStore, this.remoteStore, this.eventManager, this.sharedClientState, e.initialUser, e.maxConcurrentLimboResolutions, t);
  }
  async terminate() {
    var e, t;
    await async function __PRIVATE_remoteStoreShutdown(e2) {
      const t2 = __PRIVATE_debugCast(e2);
      __PRIVATE_logDebug("RemoteStore", "RemoteStore shutting down."), t2.L_.add(5), await __PRIVATE_disableNetworkInternal(t2), t2.k_.shutdown(), t2.q_.set("Unknown");
    }(this.remoteStore), (e = this.datastore) === null || e === undefined || e.terminate(), (t = this.eventManager) === null || t === undefined || t.terminate();
  }
}
class FirestoreClient {
  constructor(e, t, n, r) {
    this.authCredentials = e, this.appCheckCredentials = t, this.asyncQueue = n, this.databaseInfo = r, this.user = User.UNAUTHENTICATED, this.clientId = __PRIVATE_AutoId.newId(), this.authCredentialListener = () => Promise.resolve(), this.appCheckCredentialListener = () => Promise.resolve(), this.authCredentials.start(n, async (e2) => {
      __PRIVATE_logDebug("FirestoreClient", "Received user=", e2.uid), await this.authCredentialListener(e2), this.user = e2;
    }), this.appCheckCredentials.start(n, (e2) => (__PRIVATE_logDebug("FirestoreClient", "Received new app check token=", e2), this.appCheckCredentialListener(e2, this.user)));
  }
  get configuration() {
    return {
      asyncQueue: this.asyncQueue,
      databaseInfo: this.databaseInfo,
      clientId: this.clientId,
      authCredentials: this.authCredentials,
      appCheckCredentials: this.appCheckCredentials,
      initialUser: this.user,
      maxConcurrentLimboResolutions: 100
    };
  }
  setCredentialChangeListener(e) {
    this.authCredentialListener = e;
  }
  setAppCheckTokenChangeListener(e) {
    this.appCheckCredentialListener = e;
  }
  verifyNotTerminated() {
    if (this.asyncQueue.isShuttingDown)
      throw new FirestoreError(v.FAILED_PRECONDITION, "The client has already been terminated.");
  }
  terminate() {
    this.asyncQueue.enterRestrictedMode();
    const e = new __PRIVATE_Deferred;
    return this.asyncQueue.enqueueAndForgetEvenWhileRestricted(async () => {
      try {
        this._onlineComponents && await this._onlineComponents.terminate(), this._offlineComponents && await this._offlineComponents.terminate(), this.authCredentials.shutdown(), this.appCheckCredentials.shutdown(), e.resolve();
      } catch (t) {
        const n = __PRIVATE_wrapInUserErrorIfRecoverable(t, "Failed to shutdown persistence");
        e.reject(n);
      }
    }), e.promise;
  }
}
async function __PRIVATE_setOfflineComponentProvider(e, t) {
  e.asyncQueue.verifyOperationInProgress(), __PRIVATE_logDebug("FirestoreClient", "Initializing OfflineComponentProvider");
  const n = e.configuration;
  await t.initialize(n);
  let r = n.initialUser;
  e.setCredentialChangeListener(async (e2) => {
    r.isEqual(e2) || (await __PRIVATE_localStoreHandleUserChange(t.localStore, e2), r = e2);
  }), t.persistence.setDatabaseDeletedListener(() => e.terminate()), e._offlineComponents = t;
}
async function __PRIVATE_setOnlineComponentProvider(e, t) {
  e.asyncQueue.verifyOperationInProgress();
  const n = await __PRIVATE_ensureOfflineComponents(e);
  __PRIVATE_logDebug("FirestoreClient", "Initializing OnlineComponentProvider"), await t.initialize(n, e.configuration), e.setCredentialChangeListener((e2) => __PRIVATE_remoteStoreHandleCredentialChange(t.remoteStore, e2)), e.setAppCheckTokenChangeListener((e2, n2) => __PRIVATE_remoteStoreHandleCredentialChange(t.remoteStore, n2)), e._onlineComponents = t;
}
function __PRIVATE_canFallbackFromIndexedDbError(e) {
  return e.name === "FirebaseError" ? e.code === v.FAILED_PRECONDITION || e.code === v.UNIMPLEMENTED : !(typeof DOMException != "undefined" && e instanceof DOMException) || (e.code === 22 || e.code === 20 || e.code === 11);
}
async function __PRIVATE_ensureOfflineComponents(e) {
  if (!e._offlineComponents)
    if (e._uninitializedComponentsProvider) {
      __PRIVATE_logDebug("FirestoreClient", "Using user provided OfflineComponentProvider");
      try {
        await __PRIVATE_setOfflineComponentProvider(e, e._uninitializedComponentsProvider._offline);
      } catch (t) {
        const n = t;
        if (!__PRIVATE_canFallbackFromIndexedDbError(n))
          throw n;
        __PRIVATE_logWarn("Error using user provided cache. Falling back to memory cache: " + n), await __PRIVATE_setOfflineComponentProvider(e, new MemoryOfflineComponentProvider);
      }
    } else
      __PRIVATE_logDebug("FirestoreClient", "Using default OfflineComponentProvider"), await __PRIVATE_setOfflineComponentProvider(e, new MemoryOfflineComponentProvider);
  return e._offlineComponents;
}
async function __PRIVATE_ensureOnlineComponents(e) {
  return e._onlineComponents || (e._uninitializedComponentsProvider ? (__PRIVATE_logDebug("FirestoreClient", "Using user provided OnlineComponentProvider"), await __PRIVATE_setOnlineComponentProvider(e, e._uninitializedComponentsProvider._online)) : (__PRIVATE_logDebug("FirestoreClient", "Using default OnlineComponentProvider"), await __PRIVATE_setOnlineComponentProvider(e, new OnlineComponentProvider))), e._onlineComponents;
}
function __PRIVATE_getSyncEngine(e) {
  return __PRIVATE_ensureOnlineComponents(e).then((e2) => e2.syncEngine);
}
function __PRIVATE_cloneLongPollingOptions(e) {
  const t = {};
  return e.timeoutSeconds !== undefined && (t.timeoutSeconds = e.timeoutSeconds), t;
}
var Se = new Map;
function __PRIVATE_validateNonEmptyArgument(e, t, n) {
  if (!n)
    throw new FirestoreError(v.INVALID_ARGUMENT, `Function ${e}() cannot be called with an empty ${t}.`);
}
function __PRIVATE_validateIsNotUsedTogether(e, t, n, r) {
  if (t === true && r === true)
    throw new FirestoreError(v.INVALID_ARGUMENT, `${e} and ${n} cannot be used together.`);
}
function __PRIVATE_validateDocumentPath(e) {
  if (!DocumentKey.isDocumentKey(e))
    throw new FirestoreError(v.INVALID_ARGUMENT, `Invalid document reference. Document references must have an even number of segments, but ${e} has ${e.length}.`);
}
function __PRIVATE_validateCollectionPath(e) {
  if (DocumentKey.isDocumentKey(e))
    throw new FirestoreError(v.INVALID_ARGUMENT, `Invalid collection reference. Collection references must have an odd number of segments, but ${e} has ${e.length}.`);
}
function __PRIVATE_valueDescription(e) {
  if (e === undefined)
    return "undefined";
  if (e === null)
    return "null";
  if (typeof e == "string")
    return e.length > 20 && (e = `${e.substring(0, 20)}...`), JSON.stringify(e);
  if (typeof e == "number" || typeof e == "boolean")
    return "" + e;
  if (typeof e == "object") {
    if (e instanceof Array)
      return "an array";
    {
      const t = function __PRIVATE_tryGetCustomObjectType(e2) {
        if (e2.constructor)
          return e2.constructor.name;
        return null;
      }(e);
      return t ? `a custom ${t} object` : "an object";
    }
  }
  return typeof e == "function" ? "a function" : fail();
}
function __PRIVATE_cast(e, t) {
  if ("_delegate" in e && (e = e._delegate), !(e instanceof t)) {
    if (t.name === e.constructor.name)
      throw new FirestoreError(v.INVALID_ARGUMENT, "Type does not match the expected instance. Did you pass a reference from a different Firestore SDK?");
    {
      const n = __PRIVATE_valueDescription(e);
      throw new FirestoreError(v.INVALID_ARGUMENT, `Expected type '${t.name}', but it was: ${n}`);
    }
  }
  return e;
}
class FirestoreSettingsImpl {
  constructor(e) {
    var t, n;
    if (e.host === undefined) {
      if (e.ssl !== undefined)
        throw new FirestoreError(v.INVALID_ARGUMENT, "Can't provide ssl option if host option is not set");
      this.host = "firestore.googleapis.com", this.ssl = true;
    } else
      this.host = e.host, this.ssl = (t = e.ssl) === null || t === undefined || t;
    if (this.credentials = e.credentials, this.ignoreUndefinedProperties = !!e.ignoreUndefinedProperties, this.localCache = e.localCache, e.cacheSizeBytes === undefined)
      this.cacheSizeBytes = 41943040;
    else {
      if (e.cacheSizeBytes !== -1 && e.cacheSizeBytes < 1048576)
        throw new FirestoreError(v.INVALID_ARGUMENT, "cacheSizeBytes must be at least 1048576");
      this.cacheSizeBytes = e.cacheSizeBytes;
    }
    __PRIVATE_validateIsNotUsedTogether("experimentalForceLongPolling", e.experimentalForceLongPolling, "experimentalAutoDetectLongPolling", e.experimentalAutoDetectLongPolling), this.experimentalForceLongPolling = !!e.experimentalForceLongPolling, this.experimentalForceLongPolling ? this.experimentalAutoDetectLongPolling = false : e.experimentalAutoDetectLongPolling === undefined ? this.experimentalAutoDetectLongPolling = true : this.experimentalAutoDetectLongPolling = !!e.experimentalAutoDetectLongPolling, this.experimentalLongPollingOptions = __PRIVATE_cloneLongPollingOptions((n = e.experimentalLongPollingOptions) !== null && n !== undefined ? n : {}), function __PRIVATE_validateLongPollingOptions(e2) {
      if (e2.timeoutSeconds !== undefined) {
        if (isNaN(e2.timeoutSeconds))
          throw new FirestoreError(v.INVALID_ARGUMENT, `invalid long polling timeout: ${e2.timeoutSeconds} (must not be NaN)`);
        if (e2.timeoutSeconds < 5)
          throw new FirestoreError(v.INVALID_ARGUMENT, `invalid long polling timeout: ${e2.timeoutSeconds} (minimum allowed value is 5)`);
        if (e2.timeoutSeconds > 30)
          throw new FirestoreError(v.INVALID_ARGUMENT, `invalid long polling timeout: ${e2.timeoutSeconds} (maximum allowed value is 30)`);
      }
    }(this.experimentalLongPollingOptions), this.useFetchStreams = !!e.useFetchStreams;
  }
  isEqual(e) {
    return this.host === e.host && this.ssl === e.ssl && this.credentials === e.credentials && this.cacheSizeBytes === e.cacheSizeBytes && this.experimentalForceLongPolling === e.experimentalForceLongPolling && this.experimentalAutoDetectLongPolling === e.experimentalAutoDetectLongPolling && function __PRIVATE_longPollingOptionsEqual(e2, t) {
      return e2.timeoutSeconds === t.timeoutSeconds;
    }(this.experimentalLongPollingOptions, e.experimentalLongPollingOptions) && this.ignoreUndefinedProperties === e.ignoreUndefinedProperties && this.useFetchStreams === e.useFetchStreams;
  }
}

class Firestore$1 {
  constructor(e, t, n, r) {
    this._authCredentials = e, this._appCheckCredentials = t, this._databaseId = n, this._app = r, this.type = "firestore-lite", this._persistenceKey = "(lite)", this._settings = new FirestoreSettingsImpl({}), this._settingsFrozen = false;
  }
  get app() {
    if (!this._app)
      throw new FirestoreError(v.FAILED_PRECONDITION, "Firestore was not initialized using the Firebase SDK. 'app' is not available");
    return this._app;
  }
  get _initialized() {
    return this._settingsFrozen;
  }
  get _terminated() {
    return this._terminateTask !== undefined;
  }
  _setSettings(e) {
    if (this._settingsFrozen)
      throw new FirestoreError(v.FAILED_PRECONDITION, "Firestore has already been started and its settings can no longer be changed. You can only modify settings before calling any other methods on a Firestore object.");
    this._settings = new FirestoreSettingsImpl(e), e.credentials !== undefined && (this._authCredentials = function __PRIVATE_makeAuthCredentialsProvider(e2) {
      if (!e2)
        return new __PRIVATE_EmptyAuthCredentialsProvider;
      switch (e2.type) {
        case "firstParty":
          return new __PRIVATE_FirstPartyAuthCredentialsProvider(e2.sessionIndex || "0", e2.iamToken || null, e2.authTokenFactory || null);
        case "provider":
          return e2.client;
        default:
          throw new FirestoreError(v.INVALID_ARGUMENT, "makeAuthCredentialsProvider failed due to invalid credential type");
      }
    }(e.credentials));
  }
  _getSettings() {
    return this._settings;
  }
  _freezeSettings() {
    return this._settingsFrozen = true, this._settings;
  }
  _delete() {
    return this._terminateTask || (this._terminateTask = this._terminate()), this._terminateTask;
  }
  toJSON() {
    return {
      app: this._app,
      databaseId: this._databaseId,
      settings: this._settings
    };
  }
  _terminate() {
    return function __PRIVATE_removeComponents(e) {
      const t = Se.get(e);
      t && (__PRIVATE_logDebug("ComponentProvider", "Removing Datastore"), Se.delete(e), t.terminate());
    }(this), Promise.resolve();
  }
}
function connectFirestoreEmulator(e, t, n, r = {}) {
  var i;
  const s = (e = __PRIVATE_cast(e, Firestore$1))._getSettings(), o = `${t}:${n}`;
  if (s.host !== "firestore.googleapis.com" && s.host !== o && __PRIVATE_logWarn("Host has been set in both settings() and connectFirestoreEmulator(), emulator host will be used."), e._setSettings(Object.assign(Object.assign({}, s), {
    host: o,
    ssl: false
  })), r.mockUserToken) {
    let t2, n2;
    if (typeof r.mockUserToken == "string")
      t2 = r.mockUserToken, n2 = User.MOCK_USER;
    else {
      t2 = createMockUserToken(r.mockUserToken, (i = e._app) === null || i === undefined ? undefined : i.options.projectId);
      const s2 = r.mockUserToken.sub || r.mockUserToken.user_id;
      if (!s2)
        throw new FirestoreError(v.INVALID_ARGUMENT, "mockUserToken must contain 'sub' or 'user_id' field!");
      n2 = new User(s2);
    }
    e._authCredentials = new __PRIVATE_EmulatorAuthCredentialsProvider(new __PRIVATE_OAuthToken(t2, n2));
  }
}

class Query {
  constructor(e, t, n) {
    this.converter = t, this._query = n, this.type = "query", this.firestore = e;
  }
  withConverter(e) {
    return new Query(this.firestore, e, this._query);
  }
}

class DocumentReference {
  constructor(e, t, n) {
    this.converter = t, this._key = n, this.type = "document", this.firestore = e;
  }
  get _path() {
    return this._key.path;
  }
  get id() {
    return this._key.path.lastSegment();
  }
  get path() {
    return this._key.path.canonicalString();
  }
  get parent() {
    return new CollectionReference(this.firestore, this.converter, this._key.path.popLast());
  }
  withConverter(e) {
    return new DocumentReference(this.firestore, e, this._key);
  }
}

class CollectionReference extends Query {
  constructor(e, t, n) {
    super(e, t, __PRIVATE_newQueryForPath(n)), this._path = n, this.type = "collection";
  }
  get id() {
    return this._query.path.lastSegment();
  }
  get path() {
    return this._query.path.canonicalString();
  }
  get parent() {
    const e = this._path.popLast();
    return e.isEmpty() ? null : new DocumentReference(this.firestore, null, new DocumentKey(e));
  }
  withConverter(e) {
    return new CollectionReference(this.firestore, e, this._path);
  }
}
function collection(e, t, ...n) {
  if (e = getModularInstance(e), __PRIVATE_validateNonEmptyArgument("collection", "path", t), e instanceof Firestore$1) {
    const r = ResourcePath.fromString(t, ...n);
    return __PRIVATE_validateCollectionPath(r), new CollectionReference(e, null, r);
  }
  {
    if (!(e instanceof DocumentReference || e instanceof CollectionReference))
      throw new FirestoreError(v.INVALID_ARGUMENT, "Expected first argument to collection() to be a CollectionReference, a DocumentReference or FirebaseFirestore");
    const r = e._path.child(ResourcePath.fromString(t, ...n));
    return __PRIVATE_validateCollectionPath(r), new CollectionReference(e.firestore, null, r);
  }
}
function doc(e, t, ...n) {
  if (e = getModularInstance(e), arguments.length === 1 && (t = __PRIVATE_AutoId.newId()), __PRIVATE_validateNonEmptyArgument("doc", "path", t), e instanceof Firestore$1) {
    const r = ResourcePath.fromString(t, ...n);
    return __PRIVATE_validateDocumentPath(r), new DocumentReference(e, null, new DocumentKey(r));
  }
  {
    if (!(e instanceof DocumentReference || e instanceof CollectionReference))
      throw new FirestoreError(v.INVALID_ARGUMENT, "Expected first argument to collection() to be a CollectionReference, a DocumentReference or FirebaseFirestore");
    const r = e._path.child(ResourcePath.fromString(t, ...n));
    return __PRIVATE_validateDocumentPath(r), new DocumentReference(e.firestore, e instanceof CollectionReference ? e.converter : null, new DocumentKey(r));
  }
}
class __PRIVATE_AsyncQueueImpl {
  constructor() {
    this.au = Promise.resolve(), this.uu = [], this.cu = false, this.lu = [], this.hu = null, this.Pu = false, this.Iu = false, this.Tu = [], this.t_ = new __PRIVATE_ExponentialBackoff(this, "async_queue_retry"), this.Eu = () => {
      const e2 = getDocument();
      e2 && __PRIVATE_logDebug("AsyncQueue", "Visibility state changed to " + e2.visibilityState), this.t_.jo();
    };
    const e = getDocument();
    e && typeof e.addEventListener == "function" && e.addEventListener("visibilitychange", this.Eu);
  }
  get isShuttingDown() {
    return this.cu;
  }
  enqueueAndForget(e) {
    this.enqueue(e);
  }
  enqueueAndForgetEvenWhileRestricted(e) {
    this.du(), this.Au(e);
  }
  enterRestrictedMode(e) {
    if (!this.cu) {
      this.cu = true, this.Iu = e || false;
      const t = getDocument();
      t && typeof t.removeEventListener == "function" && t.removeEventListener("visibilitychange", this.Eu);
    }
  }
  enqueue(e) {
    if (this.du(), this.cu)
      return new Promise(() => {
      });
    const t = new __PRIVATE_Deferred;
    return this.Au(() => this.cu && this.Iu ? Promise.resolve() : (e().then(t.resolve, t.reject), t.promise)).then(() => t.promise);
  }
  enqueueRetryable(e) {
    this.enqueueAndForget(() => (this.uu.push(e), this.Ru()));
  }
  async Ru() {
    if (this.uu.length !== 0) {
      try {
        await this.uu[0](), this.uu.shift(), this.t_.reset();
      } catch (e) {
        if (!__PRIVATE_isIndexedDbTransactionError(e))
          throw e;
        __PRIVATE_logDebug("AsyncQueue", "Operation failed with retryable error: " + e);
      }
      this.uu.length > 0 && this.t_.Go(() => this.Ru());
    }
  }
  Au(e) {
    const t = this.au.then(() => (this.Pu = true, e().catch((e2) => {
      this.hu = e2, this.Pu = false;
      const t2 = function __PRIVATE_getMessageOrStack(e3) {
        let t3 = e3.message || "";
        e3.stack && (t3 = e3.stack.includes(e3.message) ? e3.stack : e3.message + `
` + e3.stack);
        return t3;
      }(e2);
      throw __PRIVATE_logError("INTERNAL UNHANDLED ERROR: ", t2), e2;
    }).then((e2) => (this.Pu = false, e2))));
    return this.au = t, t;
  }
  enqueueAfterDelay(e, t, n) {
    this.du(), this.Tu.indexOf(e) > -1 && (t = 0);
    const r = DelayedOperation.createAndSchedule(this, e, t, n, (e2) => this.Vu(e2));
    return this.lu.push(r), r;
  }
  du() {
    this.hu && fail();
  }
  verifyOperationInProgress() {
  }
  async mu() {
    let e;
    do {
      e = this.au, await e;
    } while (e !== this.au);
  }
  fu(e) {
    for (const t of this.lu)
      if (t.timerId === e)
        return true;
    return false;
  }
  gu(e) {
    return this.mu().then(() => {
      this.lu.sort((e2, t) => e2.targetTimeMs - t.targetTimeMs);
      for (const t of this.lu)
        if (t.skipDelay(), e !== "all" && t.timerId === e)
          break;
      return this.mu();
    });
  }
  pu(e) {
    this.Tu.push(e);
  }
  Vu(e) {
    const t = this.lu.indexOf(e);
    this.lu.splice(t, 1);
  }
}
class Firestore extends Firestore$1 {
  constructor(e, t, n, r) {
    super(e, t, n, r), this.type = "firestore", this._queue = function __PRIVATE_newAsyncQueue() {
      return new __PRIVATE_AsyncQueueImpl;
    }(), this._persistenceKey = (r == null ? undefined : r.name) || "[DEFAULT]";
  }
  _terminate() {
    return this._firestoreClient || __PRIVATE_configureFirestore(this), this._firestoreClient.terminate();
  }
}
function getFirestore(t, n) {
  const r = typeof t == "object" ? t : getApp(), i = typeof t == "string" ? t : n || "(default)", s = _getProvider(r, "firestore").getImmediate({
    identifier: i
  });
  if (!s._initialized) {
    const e = getDefaultEmulatorHostnameAndPort("firestore");
    e && connectFirestoreEmulator(s, ...e);
  }
  return s;
}
function ensureFirestoreConfigured(e) {
  return e._firestoreClient || __PRIVATE_configureFirestore(e), e._firestoreClient.verifyNotTerminated(), e._firestoreClient;
}
function __PRIVATE_configureFirestore(e) {
  var t, n, r;
  const i = e._freezeSettings(), s = function __PRIVATE_makeDatabaseInfo(e2, t2, n2, r2) {
    return new DatabaseInfo(e2, t2, n2, r2.host, r2.ssl, r2.experimentalForceLongPolling, r2.experimentalAutoDetectLongPolling, __PRIVATE_cloneLongPollingOptions(r2.experimentalLongPollingOptions), r2.useFetchStreams);
  }(e._databaseId, ((t = e._app) === null || t === undefined ? undefined : t.options.appId) || "", e._persistenceKey, i);
  e._firestoreClient = new FirestoreClient(e._authCredentials, e._appCheckCredentials, e._queue, s), ((n = i.localCache) === null || n === undefined ? undefined : n._offlineComponentProvider) && ((r = i.localCache) === null || r === undefined ? undefined : r._onlineComponentProvider) && (e._firestoreClient._uninitializedComponentsProvider = {
    _offlineKind: i.localCache.kind,
    _offline: i.localCache._offlineComponentProvider,
    _online: i.localCache._onlineComponentProvider
  });
}
class Bytes {
  constructor(e) {
    this._byteString = e;
  }
  static fromBase64String(e) {
    try {
      return new Bytes(ByteString.fromBase64String(e));
    } catch (e2) {
      throw new FirestoreError(v.INVALID_ARGUMENT, "Failed to construct data from Base64 string: " + e2);
    }
  }
  static fromUint8Array(e) {
    return new Bytes(ByteString.fromUint8Array(e));
  }
  toBase64() {
    return this._byteString.toBase64();
  }
  toUint8Array() {
    return this._byteString.toUint8Array();
  }
  toString() {
    return "Bytes(base64: " + this.toBase64() + ")";
  }
  isEqual(e) {
    return this._byteString.isEqual(e._byteString);
  }
}

class FieldPath {
  constructor(...e) {
    for (let t = 0;t < e.length; ++t)
      if (e[t].length === 0)
        throw new FirestoreError(v.INVALID_ARGUMENT, "Invalid field name at argument $(i + 1). Field names must not be empty.");
    this._internalPath = new FieldPath$1(e);
  }
  isEqual(e) {
    return this._internalPath.isEqual(e._internalPath);
  }
}
class FieldValue {
  constructor(e) {
    this._methodName = e;
  }
}

class GeoPoint {
  constructor(e, t) {
    if (!isFinite(e) || e < -90 || e > 90)
      throw new FirestoreError(v.INVALID_ARGUMENT, "Latitude must be a number between -90 and 90, but was: " + e);
    if (!isFinite(t) || t < -180 || t > 180)
      throw new FirestoreError(v.INVALID_ARGUMENT, "Longitude must be a number between -180 and 180, but was: " + t);
    this._lat = e, this._long = t;
  }
  get latitude() {
    return this._lat;
  }
  get longitude() {
    return this._long;
  }
  isEqual(e) {
    return this._lat === e._lat && this._long === e._long;
  }
  toJSON() {
    return {
      latitude: this._lat,
      longitude: this._long
    };
  }
  _compareTo(e) {
    return __PRIVATE_primitiveComparator(this._lat, e._lat) || __PRIVATE_primitiveComparator(this._long, e._long);
  }
}

class VectorValue {
  constructor(e) {
    this._values = (e || []).map((e2) => e2);
  }
  toArray() {
    return this._values.map((e) => e);
  }
  isEqual(e) {
    return function __PRIVATE_isPrimitiveArrayEqual(e2, t) {
      if (e2.length !== t.length)
        return false;
      for (let n = 0;n < e2.length; ++n)
        if (e2[n] !== t[n])
          return false;
      return true;
    }(this._values, e._values);
  }
}
var De = /^__.*__$/;

class ParsedSetData {
  constructor(e, t, n) {
    this.data = e, this.fieldMask = t, this.fieldTransforms = n;
  }
  toMutation(e, t) {
    return this.fieldMask !== null ? new __PRIVATE_PatchMutation(e, this.data, this.fieldMask, t, this.fieldTransforms) : new __PRIVATE_SetMutation(e, this.data, t, this.fieldTransforms);
  }
}
function __PRIVATE_isWrite(e) {
  switch (e) {
    case 0:
    case 2:
    case 1:
      return true;
    case 3:
    case 4:
      return false;
    default:
      throw fail();
  }
}

class __PRIVATE_ParseContextImpl {
  constructor(e, t, n, r, i, s) {
    this.settings = e, this.databaseId = t, this.serializer = n, this.ignoreUndefinedProperties = r, i === undefined && this.yu(), this.fieldTransforms = i || [], this.fieldMask = s || [];
  }
  get path() {
    return this.settings.path;
  }
  get wu() {
    return this.settings.wu;
  }
  Su(e) {
    return new __PRIVATE_ParseContextImpl(Object.assign(Object.assign({}, this.settings), e), this.databaseId, this.serializer, this.ignoreUndefinedProperties, this.fieldTransforms, this.fieldMask);
  }
  bu(e) {
    var t;
    const n = (t = this.path) === null || t === undefined ? undefined : t.child(e), r = this.Su({
      path: n,
      Du: false
    });
    return r.vu(e), r;
  }
  Cu(e) {
    var t;
    const n = (t = this.path) === null || t === undefined ? undefined : t.child(e), r = this.Su({
      path: n,
      Du: false
    });
    return r.yu(), r;
  }
  Fu(e) {
    return this.Su({
      path: undefined,
      Du: true
    });
  }
  Mu(e) {
    return __PRIVATE_createError(e, this.settings.methodName, this.settings.xu || false, this.path, this.settings.Ou);
  }
  contains(e) {
    return this.fieldMask.find((t) => e.isPrefixOf(t)) !== undefined || this.fieldTransforms.find((t) => e.isPrefixOf(t.field)) !== undefined;
  }
  yu() {
    if (this.path)
      for (let e = 0;e < this.path.length; e++)
        this.vu(this.path.get(e));
  }
  vu(e) {
    if (e.length === 0)
      throw this.Mu("Document fields must not be empty");
    if (__PRIVATE_isWrite(this.wu) && De.test(e))
      throw this.Mu('Document fields cannot begin and end with "__"');
  }
}

class __PRIVATE_UserDataReader {
  constructor(e, t, n) {
    this.databaseId = e, this.ignoreUndefinedProperties = t, this.serializer = n || __PRIVATE_newSerializer(e);
  }
  Nu(e, t, n, r = false) {
    return new __PRIVATE_ParseContextImpl({
      wu: e,
      methodName: t,
      Ou: n,
      path: FieldPath$1.emptyPath(),
      Du: false,
      xu: r
    }, this.databaseId, this.serializer, this.ignoreUndefinedProperties);
  }
}
function __PRIVATE_newUserDataReader(e) {
  const t = e._freezeSettings(), n = __PRIVATE_newSerializer(e._databaseId);
  return new __PRIVATE_UserDataReader(e._databaseId, !!t.ignoreUndefinedProperties, n);
}
function __PRIVATE_parseSetData(e, t, n, r, i, s = {}) {
  const o = e.Nu(s.merge || s.mergeFields ? 2 : 0, t, n, i);
  __PRIVATE_validatePlainObject("Data must be an object, but it was:", o, r);
  const _ = __PRIVATE_parseObject(r, o);
  let a, u;
  if (s.merge)
    a = new FieldMask(o.fieldMask), u = o.fieldTransforms;
  else if (s.mergeFields) {
    const e2 = [];
    for (const r2 of s.mergeFields) {
      const i2 = __PRIVATE_fieldPathFromArgument$1(t, r2, n);
      if (!o.contains(i2))
        throw new FirestoreError(v.INVALID_ARGUMENT, `Field '${i2}' is specified in your field mask but missing from your input data.`);
      __PRIVATE_fieldMaskContains(e2, i2) || e2.push(i2);
    }
    a = new FieldMask(e2), u = o.fieldTransforms.filter((e3) => a.covers(e3.field));
  } else
    a = null, u = o.fieldTransforms;
  return new ParsedSetData(new ObjectValue(_), a, u);
}
function __PRIVATE_parseData(e, t) {
  if (__PRIVATE_looksLikeJsonObject(e = getModularInstance(e)))
    return __PRIVATE_validatePlainObject("Unsupported field value:", t, e), __PRIVATE_parseObject(e, t);
  if (e instanceof FieldValue)
    return function __PRIVATE_parseSentinelFieldValue(e2, t2) {
      if (!__PRIVATE_isWrite(t2.wu))
        throw t2.Mu(`${e2._methodName}() can only be used with update() and set()`);
      if (!t2.path)
        throw t2.Mu(`${e2._methodName}() is not currently supported inside arrays`);
      const n = e2._toFieldTransform(t2);
      n && t2.fieldTransforms.push(n);
    }(e, t), null;
  if (e === undefined && t.ignoreUndefinedProperties)
    return null;
  if (t.path && t.fieldMask.push(t.path), e instanceof Array) {
    if (t.settings.Du && t.wu !== 4)
      throw t.Mu("Nested arrays are not supported");
    return function __PRIVATE_parseArray(e2, t2) {
      const n = [];
      let r = 0;
      for (const i of e2) {
        let e3 = __PRIVATE_parseData(i, t2.Fu(r));
        e3 == null && (e3 = {
          nullValue: "NULL_VALUE"
        }), n.push(e3), r++;
      }
      return {
        arrayValue: {
          values: n
        }
      };
    }(e, t);
  }
  return function __PRIVATE_parseScalarValue(e2, t2) {
    if ((e2 = getModularInstance(e2)) === null)
      return {
        nullValue: "NULL_VALUE"
      };
    if (typeof e2 == "number")
      return toNumber(t2.serializer, e2);
    if (typeof e2 == "boolean")
      return {
        booleanValue: e2
      };
    if (typeof e2 == "string")
      return {
        stringValue: e2
      };
    if (e2 instanceof Date) {
      const n = Timestamp.fromDate(e2);
      return {
        timestampValue: toTimestamp(t2.serializer, n)
      };
    }
    if (e2 instanceof Timestamp) {
      const n = new Timestamp(e2.seconds, 1000 * Math.floor(e2.nanoseconds / 1000));
      return {
        timestampValue: toTimestamp(t2.serializer, n)
      };
    }
    if (e2 instanceof GeoPoint)
      return {
        geoPointValue: {
          latitude: e2.latitude,
          longitude: e2.longitude
        }
      };
    if (e2 instanceof Bytes)
      return {
        bytesValue: __PRIVATE_toBytes(t2.serializer, e2._byteString)
      };
    if (e2 instanceof DocumentReference) {
      const n = t2.databaseId, r = e2.firestore._databaseId;
      if (!r.isEqual(n))
        throw t2.Mu(`Document reference is for database ${r.projectId}/${r.database} but should be for database ${n.projectId}/${n.database}`);
      return {
        referenceValue: __PRIVATE_toResourceName(e2.firestore._databaseId || t2.databaseId, e2._key.path)
      };
    }
    if (e2 instanceof VectorValue)
      return function __PRIVATE_parseVectorValue(e3, t3) {
        return {
          mapValue: {
            fields: {
              __type__: {
                stringValue: "__vector__"
              },
              value: {
                arrayValue: {
                  values: e3.toArray().map((e4) => {
                    if (typeof e4 != "number")
                      throw t3.Mu("VectorValues must only contain numeric values.");
                    return __PRIVATE_toDouble(t3.serializer, e4);
                  })
                }
              }
            }
          }
        };
      }(e2, t2);
    throw t2.Mu(`Unsupported field value: ${__PRIVATE_valueDescription(e2)}`);
  }(e, t);
}
function __PRIVATE_parseObject(e, t) {
  const n = {};
  return isEmpty(e) ? t.path && t.path.length > 0 && t.fieldMask.push(t.path) : forEach(e, (e2, r) => {
    const i = __PRIVATE_parseData(r, t.bu(e2));
    i != null && (n[e2] = i);
  }), {
    mapValue: {
      fields: n
    }
  };
}
function __PRIVATE_looksLikeJsonObject(e) {
  return !(typeof e != "object" || e === null || e instanceof Array || e instanceof Date || e instanceof Timestamp || e instanceof GeoPoint || e instanceof Bytes || e instanceof DocumentReference || e instanceof FieldValue || e instanceof VectorValue);
}
function __PRIVATE_validatePlainObject(e, t, n) {
  if (!__PRIVATE_looksLikeJsonObject(n) || !function __PRIVATE_isPlainObject(e2) {
    return typeof e2 == "object" && e2 !== null && (Object.getPrototypeOf(e2) === Object.prototype || Object.getPrototypeOf(e2) === null);
  }(n)) {
    const r = __PRIVATE_valueDescription(n);
    throw r === "an object" ? t.Mu(e + " a custom object") : t.Mu(e + " " + r);
  }
}
function __PRIVATE_fieldPathFromArgument$1(e, t, n) {
  if ((t = getModularInstance(t)) instanceof FieldPath)
    return t._internalPath;
  if (typeof t == "string")
    return __PRIVATE_fieldPathFromDotSeparatedString(e, t);
  throw __PRIVATE_createError("Field path arguments must be of type string or ", e, false, undefined, n);
}
var ve = new RegExp("[~\\*/\\[\\]]");
function __PRIVATE_fieldPathFromDotSeparatedString(e, t, n) {
  if (t.search(ve) >= 0)
    throw __PRIVATE_createError(`Invalid field path (${t}). Paths must not contain '~', '*', '/', '[', or ']'`, e, false, undefined, n);
  try {
    return new FieldPath(...t.split("."))._internalPath;
  } catch (r) {
    throw __PRIVATE_createError(`Invalid field path (${t}). Paths must not be empty, begin with '.', end with '.', or contain '..'`, e, false, undefined, n);
  }
}
function __PRIVATE_createError(e, t, n, r, i) {
  const s = r && !r.isEmpty(), o = i !== undefined;
  let _ = `Function ${t}() called with invalid data`;
  n && (_ += " (via `toFirestore()`)"), _ += ". ";
  let a = "";
  return (s || o) && (a += " (found", s && (a += ` in field ${r}`), o && (a += ` in document ${i}`), a += ")"), new FirestoreError(v.INVALID_ARGUMENT, _ + e + a);
}
function __PRIVATE_fieldMaskContains(e, t) {
  return e.some((e2) => e2.isEqual(t));
}
function __PRIVATE_applyFirestoreDataConverter(e, t, n) {
  let r;
  return r = e ? n && (n.merge || n.mergeFields) ? e.toFirestore(t, n) : e.toFirestore(t) : t, r;
}
function addDoc(e, t) {
  const n = __PRIVATE_cast(e.firestore, Firestore), r = doc(e), i = __PRIVATE_applyFirestoreDataConverter(e.converter, t);
  return executeWrite(n, [__PRIVATE_parseSetData(__PRIVATE_newUserDataReader(e.firestore), "addDoc", r._key, i, e.converter !== null, {}).toMutation(r._key, Precondition.exists(false))]).then(() => r);
}
function executeWrite(e, t) {
  return function __PRIVATE_firestoreClientWrite(e2, t2) {
    const n = new __PRIVATE_Deferred;
    return e2.asyncQueue.enqueueAndForget(async () => __PRIVATE_syncEngineWrite(await __PRIVATE_getSyncEngine(e2), t2, n)), n.promise;
  }(ensureFirestoreConfigured(e), t);
}
var Fe = new WeakMap;
(function __PRIVATE_registerFirestore(e, t = true) {
  (function __PRIVATE_setSDKVersion(e2) {
    b = e2;
  })(SDK_VERSION), _registerComponent(new Component3("firestore", (e2, { instanceIdentifier: n, options: r }) => {
    const i = e2.getProvider("app").getImmediate(), s = new Firestore(new __PRIVATE_FirebaseAuthCredentialsProvider(e2.getProvider("auth-internal")), new __PRIVATE_FirebaseAppCheckTokenProvider(e2.getProvider("app-check-internal")), function __PRIVATE_databaseIdFromApp(e3, t2) {
      if (!Object.prototype.hasOwnProperty.apply(e3.options, ["projectId"]))
        throw new FirestoreError(v.INVALID_ARGUMENT, '"projectId" not provided in firebase.initializeApp.');
      return new DatabaseId(e3.options.projectId, t2);
    }(i, n), i);
    return r = Object.assign({
      useFetchStreams: t
    }, r), s._setSettings(r), s;
  }, "PUBLIC").setMultipleInstances(true)), registerVersion(S2, "4.7.0", e), registerVersion(S2, "4.7.0", "esm2017");
})();
// src/Database.ts
class DB {
  static db;
  static init() {
    const app2 = initializeApp({
      apiKey: "AIzaSyD6v26BmHUqqngOx7Bu6REP2t5mJNJlhlk",
      authDomain: "exag-dungeongrams-study.firebaseapp.com",
      projectId: "exag-dungeongrams-study",
      storageBucket: "exag-dungeongrams-study.appspot.com",
      messagingSenderId: "970729390672",
      appId: "1:970729390672:web:c6231d60bdd477c7dec755",
      measurementId: "G-VEPF12WK7P"
    });
    DB.db = getFirestore(app2);
  }
  static submitAttempt() {
    const submission = {
      diedFrom: Global.diedFrom,
      "stamina-left": Global.staminaLeft,
      time: Global.time,
      won: Global.playerWon,
      order: Global.order,
      playerID: Global.playerID,
      levels: Global.levels
    };
    console.log(submission);
    if (Global.playerID === "null") {
      console.log("Data not submitted:", submission);
    } else {
      addDoc(collection(DB.db, `rq2.2_play_${Global.director}_${Global.version}`), submission);
    }
  }
  static submitSurvey(survey) {
    survey["playerID"] = Global.playerID;
    addDoc(collection(DB.db, `rq2.2_survey_${Global.director}_${Global.version}`), survey);
    console.log("Survey submitted.");
  }
}

// src/Scenes/Game.ts
class Game extends ECSScene {
  playerWonIndex = 0;
  playerLostIndex = 0;
  selfIndex = 0;
  mainMenuIndex = 0;
  director;
  start = 0;
  constructor() {
    super();
    this.director = new LevelDirector;
    this.setBB("game over", 0);
    this.setBB("restart", false);
  }
  onEnter(engine) {
    const xMod = 20;
    const yMod = 20;
    const offsetX = 8;
    const offsetY = 7;
    let xMin = 1000;
    let xMax = 0;
    let yMin = 1000;
    let yMax = 0;
    const gc = new exports_Utility.GridCollisions;
    let switchCount = 0;
    const lvl = this.director.get(2);
    const columns = lvl[0].length;
    const modColumns = columns + 4;
    for (let y = 0;y < NUM_ROWS; ++y) {
      let row = [...`--${lvl[y]}--`];
      if (y == 0) {
        row[0] = "@";
      } else if (y == NUM_ROWS - 1) {
        row[modColumns - 1] = "O";
      }
      for (let x = 0;x < modColumns; ++x) {
        const char = row[x];
        const id = this.addEntity();
        const xPos = offsetX + x;
        const yPos = offsetY + y;
        xMin = Math.min(xMin, xPos);
        xMax = Math.max(xMax, xPos);
        yMin = Math.min(yMin, yPos);
        yMax = Math.max(yMax, yPos);
        if (char == "-") {
          continue;
        }
        this.addComponent(id, new C.Render(char));
        const pos = new exports_Components.Position2d(xPos, yPos);
        this.addComponent(id, pos);
        gc.set(pos, id);
        if (char == "O") {
          this.addComponent(id, new C.Portal);
          this.setBB("portal id", id);
        } else if (char == "@") {
          this.addComponent(id, new C.Player(MAX_STAMINA, 0));
          this.addComponent(id, new C.Movable);
          this.setBB("player id", id);
        } else if (char == "*") {
          this.addComponent(id, new C.Switch);
          switchCount += 1;
        } else if (char == "#") {
          this.addComponent(id, new C.Movable);
          this.addComponent(id, new C.Enemy("Enemy", new exports_Components.Position2d(xPos, yPos)));
          this.addComponent(id, new C.Territory(pos));
        } else if (char == "^") {
          this.addComponent(id, new C.Enemy("Spike", new exports_Components.Position2d(xPos, yPos)));
        } else if (char == "/" || char == "\\" || char == "X") {
          this.addComponent(id, new Collider);
        } else if (char == "&") {
          this.addComponent(id, new C.Food);
        }
      }
    }
    for (let y = 3;y < engine.height / yMod - 1; ++y) {
      for (let x = 1;x < engine.width / xMod - 1; ++x) {
        if (x < xMin || x > xMax || y < yMin || y > yMax) {
          const id = this.addEntity();
          this.addComponent(id, new C.Render("X"));
          const pos = new exports_Components.Position2d(x, y);
          this.addComponent(id, pos);
          if (x == xMin - 1 || y == yMin - 1 || x == xMax + 1 || y == yMax + 1) {
            gc.set(pos, id);
            this.addComponent(id, new C.Collider);
          }
        }
      }
    }
    this.setBB("switch count", switchCount);
    this.setBB("offset x", offsetX);
    this.setBB("offset y", offsetY);
    this.setBB("x mod", xMod);
    this.setBB("y mod", yMod);
    this.setBB("grid collisions", gc);
    this.setBB("time step", 0);
    this.addSystem(0, new S.PlayerMovement);
    this.addSystem(10, new S.PlayerCollision);
    this.addSystem(20, new S.EnemyAI);
    this.addSystem(90, new S.PortalSystem);
    this.addSystem(95, new S.RenderEnemyTerritory);
    this.addSystem(100, new S.RenderSystem);
    this.addSystem(110, new S.RenderGameInfo);
    this.addSystem(900, new S.UpdatePlayerTurn);
    Global.diedFrom = "";
    Global.playerWon = false;
    Global.levels = this.director.keys;
    this.start = Date.now();
  }
  onExit(engine) {
    const gameOver = this.getBB("game over");
    const playerID = this.getBB("player id");
    const furthestColumn = this.getComponents(playerID).get(Player).furthestColumn;
    this.director.update(gameOver === 1, furthestColumn);
    ++Global.order;
    this.clear();
  }
  customUpdate(engine) {
    const gameOver = this.getBB("game over");
    console.log(`is game over: ${gameOver}`);
    if (gameOver == -1 || gameOver == 1) {
      const end = Date.now();
      const elapsed = (end - this.start) / 1000;
      Global.time = elapsed;
      DB.submitAttempt();
      return gameOver == 1 ? this.playerWonIndex : this.playerLostIndex;
    } else if (engine.keyDown.has(9 /* R */)) {
      return this.selfIndex;
    } else if (engine.keyDown.has(8 /* Q */)) {
      return this.mainMenuIndex;
    }
    return -1;
  }
}

// src/Scenes/PlayerLost.ts
class PlayerLost extends Scene {
  sceneIndex = 0;
  timer = 0;
  constructor() {
    super();
  }
  onEnter(engine) {
    this.timer = 0;
  }
  onExit(engine) {
  }
  update(engine) {
    this.timer += engine.delta;
    if (this.timer > 2 || engine.keyDown.has(12 /* ENTER */)) {
      return this.sceneIndex;
    } else {
      engine.setFont(40);
      engine.drawText(360, 240, "You lost! :/", "red");
      return -1;
    }
  }
}

// src/Scenes/PlayerWon.ts
class PlayerWon extends Scene {
  sceneIndex = 0;
  timer = 0;
  constructor() {
    super();
  }
  onEnter(engine) {
    this.timer = 0;
  }
  onExit(engine) {
  }
  update(engine) {
    this.timer += engine.delta;
    if (this.timer > 2 || engine.keyDown.has(12 /* ENTER */)) {
      exports_Utility.Cookie.set(engine.getBB("level"), "b");
      return this.sceneIndex;
    } else {
      engine.setFont(40);
      engine.drawText(420, 240, "You won!", "green");
      return -1;
    }
  }
}

// src/Scenes/StartMenu.ts
class StartMenu extends Scene {
  sceneIndex = 0;
  gameIndex = 0;
  tutorialIndex = 0;
  surveyIndex = 0;
  timer = 0;
  constructor() {
    super();
  }
  onEnter(engine) {
  }
  onExit(engine) {
  }
  update(engine) {
    if (engine.keyDown.has(12 /* ENTER */)) {
      engine.keyDown.clear();
      if (exports_Cookie.get("completed tutorial")) {
        return this.gameIndex;
      }
      return this.tutorialIndex;
    } else {
      engine.setFont(40);
      engine.drawText(360, 100, "DungeonGrams");
      engine.setFont(20);
      engine.drawText(385, 150, "Press Enter to Start");
      engine.drawText(250, 200, "& gives you stamina", "yellow");
      engine.drawText(250, 222, "Collect all * to open the portal.", "yellow");
      engine.drawText(250, 244, "Step through the portal O to win!", "yellow");
      engine.drawText(250, 266, "But make sure to avoid the enemies # and traps ^", "yellow");
      engine.drawText(250, 350, "WASD or Arrows to move", "green");
      engine.drawText(250, 375, "Space to do nothing for a turn", "green");
      engine.drawText(250, 400, "R to restart", "green");
      engine.drawText(250, 425, "Q to quit", "green");
      return -1;
    }
  }
}

// src/Scenes/Tutorial.ts
class Tutorial extends ECSScene {
  gameSceneIndex = 0;
  constructor() {
    super();
    this.setBB("x mod", 20);
    this.setBB("y mod", 20);
    this.setBB("turn", 0);
    this.setBB("tutorial over", false);
    this.setBB("time step", 0);
    const playerID = this.addEntity();
    this.setBB("player id", playerID);
    this.addComponent(playerID, new exports_Components.Position2d(25, 5));
    this.addComponent(playerID, new Movable);
    this.addComponent(playerID, new Player(MAX_STAMINA, 0));
    this.addComponent(playerID, new Render("@"));
    const instructions = this.addEntity();
    this.addComponent(instructions, new exports_Components.Position2d(5, 20));
    this.addComponent(instructions, new VisibleText("Press 'A' to move left."));
    this.addSystem(0, new TutorialSystem(playerID, instructions));
    this.addSystem(90, new TutorialRenderSystem);
    this.addSystem(100, new RenderSystem);
  }
  customUpdate(engine) {
    if (this.getBB("tutorial over")) {
      console.log(this.gameSceneIndex, "done");
      return this.gameSceneIndex;
    }
    return -1;
  }
  onEnter(engine) {
  }
  onExit(engine) {
  }
}

// src/Scenes/Survey.ts
class Survey extends Scene {
  constructor() {
    super();
  }
  onEnter(engine) {
    document.getElementById("game").style.display = "none";
    document.getElementById("survey").style.display = "block";
    engine.shutoff();
  }
  onExit(engine) {
  }
  update(engine) {
    return -1;
  }
}

// src/Scenes/index.ts
var Scene2 = {
  Game,
  PlayerLost,
  PlayerWon,
  StartMenu,
  Tutorial,
  Survey
};

// src/questions.ts
var QUESTIONS = [
  "I liked the look and feel of the game.",
  "The game was not too easy and not too hard to play.",
  "It was easy to know how to perform actions in the game.",
  "The goals of the game were clear to me.",
  "The game gave clear feedback on my progress towards the goals.",
  "I felt free to play the game in my own way.",
  "I wanted to explore how the game evolved.",
  "I was fully focused on the game.",
  "I felt I was good at playing this game.",
  "Playing the game was meaningful to me.",
  "I had a good time playing this game."
];

// src/Random.ts
function fischerYatesShuffle(array) {
  let i = array.length - 1;
  for (;i > 0; --i) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = array[i];
    array[i] = array[j];
    array[j] = tmp;
  }
}

// src/index.ts
DB.init();
if (location.hostname === "localhost" || location.hostname === "127.0.0.1" || location.hostname === "") {
  Global.playerID = "-1";
} else {
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.has("id")) {
    Global.playerID = crypto.randomUUID();
  } else {
    Global.playerID = "-1";
  }
}
console.log(`Player ID: ${Global.playerID}`);
var engine = new Engine;
engine.displayFPS = false;
var startScene = new Scene2.StartMenu;
var gameScene = new Scene2.Game;
var playerLostScene = new Scene2.PlayerLost;
var playerWonScene = new Scene2.PlayerWon;
var tutorialScene = new Scene2.Tutorial;
var surveyScene = new Scene2.Survey;
var startIndex = engine.addScene(startScene);
var gameIndex = engine.addScene(gameScene);
var lostIndex = engine.addScene(playerLostScene);
var wonIndex = engine.addScene(playerWonScene);
var tutorialIndex = engine.addScene(tutorialScene);
var surveyIndex = engine.addScene(surveyScene);
startScene.tutorialIndex = tutorialIndex;
startScene.gameIndex = gameIndex;
startScene.surveyIndex = surveyIndex;
gameScene.playerLostIndex = lostIndex;
gameScene.playerWonIndex = wonIndex;
gameScene.selfIndex = gameIndex;
gameScene.mainMenuIndex = startIndex;
playerLostScene.sceneIndex = gameIndex;
playerWonScene.sceneIndex = gameIndex;
tutorialScene.gameSceneIndex = gameIndex;
engine.start();
fischerYatesShuffle(QUESTIONS);
fischerYatesShuffle(QUESTIONS);
var questionnaire = document.getElementById("questionnaire");
var i = 0;
for (;i < QUESTIONS.length; ++i) {
  const q = QUESTIONS[i];
  const id = q.split(" ").join("_");
  const formElement = `<fieldset id="${id}">
  <label for="${id}" required><b>${q}</b></label>
    <br/>
    <br/>
    <table>
      <tr>
        <td></td>
        <td>-3</td>
        <td>-2</td>
        <td>-1</td>
        <td>&#20;0</td>
        <td>&#20;1</td>
        <td>&#20;2</td>
        <td>&#20;3</td>
        <td></td>
      </tr>
      <tr>
        <td>Strongly disagree</td>
        <td><input type="radio" name="${id}" value="-3"/></td>
        <td><input type="radio" name="${id}" value="-2"/></td>
        <td><input type="radio" name="${id}" value="-1"/></td>
        <td><input type="radio" name="${id}" value="0"/></td>
        <td><input type="radio" name="${id}" value="1"/></td>
        <td><input type="radio" name="${id}" value="2"/></td>
        <td><input type="radio" name="${id}" value="3"/></td>
        <td>Strongly agree</td>
      </tr>
    </table>
  </fieldset>
  <br/>`;
  questionnaire.innerHTML += formElement;
}
var submitButton = document.createElement("button");
submitButton.type = "submit";
submitButton.innerText = "Submit";
questionnaire.appendChild(submitButton);
questionnaire.onsubmit = (event) => {
  event.preventDefault();
  let answers = {};
  for (i = 0;i < QUESTIONS.length; ++i) {
    const Q = QUESTIONS[i];
    const N = Q.split(" ").join("_");
    let elements = document.getElementsByName(N);
    let found = false;
    for (let j = 0;j < 7; ++j) {
      const E = elements[j];
      if (E.checked) {
        answers[Q] = Number(E.value);
        found = true;
        break;
      }
    }
    document.getElementById(N).style.borderColor = found ? "white" : "red";
  }
  if (Object.keys(answers).length == QUESTIONS.length) {
    DB.submitSurvey(answers);
    console.log("Survey submitted");
    document.getElementById("survey").style.display = "none";
    document.getElementById("complete").style.display = "block";
  } else {
    document.getElementById("errorText").innerText = "Please fill in the whole questionnaire. Red boxes indicate missed answers.";
  }
};
document.getElementById("done").onclick = () => {
  engine.shutoff();
  document.getElementById("game").style.display = "none";
  document.getElementById("survey").style.display = "block";
};
