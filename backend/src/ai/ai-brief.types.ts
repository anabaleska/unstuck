/** What Gemini writes for each booking. Stored as JSON in bookings.ai_brief. */
export interface AiBrief {
  /** For the mentor: the problem in one sentence. */
  summary: string;
  /** For the mentor: 2–3 questions to open the session with. */
  openingQuestions: string[];
  /** For the mentor: important context the mentee didn't share, or null if nothing is missing. */
  missingInfo: string | null;
  /** For the mentee: a short, friendly confirmation that mentions their topic. */
  confirmationMessage: string;
}

/** What the AI needs to know about a booking. */
export interface BriefInput {
  menteeName: string;
  sessionType: string;
  topic: string;
  resourceUrl: string | null;
}
