// The kinds of sessions a mentee can book. Must match the CHECK constraint in the migration.
export const SESSION_TYPES = ['code_review', 'debugging', 'career_chat'] as const;

export type SessionType = (typeof SESSION_TYPES)[number];
