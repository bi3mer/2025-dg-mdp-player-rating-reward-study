
export class Global {
  public static playerID = "-1"; // indicates that data should not be used in analysis
  public static playerWon = false;
  public static playerCurrentLevel = '0_0';
  public static formSubmitted = false;
  public static attempts = 0;
  public static staminaLeft = 0;
  public static time = 0;
  // public static keys: string[] = Object.keys(LEVELS);
  public static diedFrom = "Stamina"; // Enemy | Stamina | Spike
  public static playerGaveUp = false;
  public static gamesPlayed = 0;
  public static maxGames = 11;
  public static version = "0.0.1";
}
