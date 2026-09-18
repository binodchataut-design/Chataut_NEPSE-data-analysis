export class ForwardOutcomeEngine {
  static determineEntry() { return { entryIndex: 0, entryPrice: 100 }; }
  static calculateForwardReturns() { return { returns: [], maxReturn: 0, minReturn: 0 }; }
  static calculateExcursions() { return { mfe: 0, mae: 0 }; }
  static simulateTargetStop() { return { hitTarget: false, hitStop: false, returnPct: 0 }; }
}
