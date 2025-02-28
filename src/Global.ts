export class Global {
  public static playerID = "-1"; // indicates that data should not be used in analysis
  public static playerWon = false;
  public static order = 0;
  public static staminaLeft = 0;
  public static time = 0;
  public static levels: string[] = [];
  public static diedFrom = "Stamina"; // Enemy | Stamina | Spike | ""
  public static gamesPlayed = 0;
  public static director = "-1";
  public static version = "1.1.0";

  // Tutorial data
  public static tutorialDiedToEnemy = 0;
  public static tutorialDiedToStamina = 0;

  // firebase doesn't allow for nested arrays, so two arrays. One for x and
  // another for y
  public static playerPathX: number[] = [];
  public static playerPathY: number[] = [];

  public static customData: { [id: string]: string } = {};
}
