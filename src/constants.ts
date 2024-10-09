export const NUM_ROWS = 11;
export const MAX_STAMINA = 40;
export const FOOD_STAMINA = 30;

export const PLAYER_LOST = -1;
export const PLAYER_WON = 1;
export const CONTINUE = 0;

export const OFFSET_COL = 8;
export const OFFSET_ROW = 7;

export const ENEMY_RANGE = 3;

export const GRID_X = 19.7;
export const GRID_Y = 18.9;

// MDP keys
export const KEY_START = "start";
export const KEY_DEATH = "death";
export const KEY_END = "end";

// colors
export const ENEMY_TURN_NEXT_COLOR = '#FF000022';
export const ENEMY_PAUSE_COLOR = '#FF440011';

// level director: types
export const LD_RANDOM = 'random';
export const LD_ENJOYMENT = 'enjoyment';
export const LD_DIFFICULTY = 'difficulty';
export const LD_BOTH = 'both';

// level director: how often to switch optimization types between enjoyment and difficulty
export const LD_SWITCH = 3;

// time info
export const START_TIME = performance.now();
export const MAX_TIME = 15 * 1000 * 60; // 1000 & 60 is ms to second to minute, and max of 15 minutes
