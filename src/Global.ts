
export class Global {
  public static playerID = "-1"; // indicates that data should not be used in analysis
  public static playerWon = false;
  public static order = 0;
  public static staminaLeft = 0;
  public static time = 0;
  public static levels: string[] = [];
  public static diedFrom = "Stamina"; // Enemy | Stamina | Spike
  public static playerGaveUp = false;
  public static gamesPlayed = 0;
  public static director = "-1";
  public static version = "0.0.1";
}
