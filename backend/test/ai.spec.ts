/**
 * Unit tests for checking the model's output. No database or network needed.
 */
import { parseBrief } from '../src/ai/ai.service';

const valid = {
  summary: '  List renders twice.  ',
  openingQuestions: ['Q1', 'Q2', 'Q3', 'Q4'],
  missingInfo: null,
  confirmationMessage: 'See you soon!',
};

describe('parseBrief', () => {
  it('accepts a valid brief, trims text and keeps at most 3 questions', () => {
    const brief = parseBrief(JSON.stringify(valid));
    expect(brief).toEqual({
      summary: 'List renders twice.',
      openingQuestions: ['Q1', 'Q2', 'Q3'],
      missingInfo: null,
      confirmationMessage: 'See you soon!',
    });
  });

  it('rejects empty output and invalid JSON', () => {
    expect(parseBrief(undefined)).toBeNull();
    expect(parseBrief('Sure! Here is your brief: ...')).toBeNull();
  });

  it('rejects JSON with the wrong shape', () => {
    expect(parseBrief(JSON.stringify({ ...valid, summary: 42 }))).toBeNull();
    expect(parseBrief(JSON.stringify({ ...valid, openingQuestions: 'not a list' }))).toBeNull();
    expect(parseBrief(JSON.stringify({ summary: 'only one field' }))).toBeNull();
  });
});
