import { describe, it, expect } from 'vitest';
import { parseBulkNames } from '../../lib/utils/nameParser';

describe('parseBulkNames', () => {
  // ---- Basic parsing ----
  it('returns empty result for empty input', () => {
    const result = parseBulkNames('');
    expect(result.success).toEqual([]);
    expect(result.errors).toEqual([]);
  });

  it('returns empty result for whitespace-only input', () => {
    const result = parseBulkNames('   \n\t  ');
    expect(result.success).toEqual([]);
    expect(result.errors).toEqual([]);
  });

  it('parses a single name', () => {
    const result = parseBulkNames('Alice Smith');
    expect(result.success).toHaveLength(1);
    expect(result.success[0].name).toBe('Alice Smith');
  });

  // ---- Comma-separated ----
  it('parses comma-separated names', () => {
    const result = parseBulkNames('Alice, Bob, Charlie');
    expect(result.success).toHaveLength(3);
    expect(result.success.map(n => n.name)).toContain('Alice');
    expect(result.success.map(n => n.name)).toContain('Bob');
    expect(result.success.map(n => n.name)).toContain('Charlie');
  });

  // ---- Newline-separated ----
  it('parses newline-separated names', () => {
    const result = parseBulkNames('Alice Smith\nBob Jones\nCharlie Brown');
    expect(result.success).toHaveLength(3);
    expect(result.success[0].name).toBe('Alice Smith');
    expect(result.success[1].name).toBe('Bob Jones');
    expect(result.success[2].name).toBe('Charlie Brown');
  });

  // ---- Tab-separated ----
  it('parses tab-separated names', () => {
    const result = parseBulkNames('Alice\tBob\tCharlie');
    expect(result.success).toHaveLength(3);
  });

  // ---- "Last, First" format ----
  it('splits comma-separated single input into separate names', () => {
    // When the only delimiter is comma, the parser splits by comma
    const result = parseBulkNames('Smith, Alice');
    expect(result.success).toHaveLength(2);
    expect(result.success.map(n => n.name)).toContain('Smith');
    expect(result.success.map(n => n.name)).toContain('Alice');
  });

  it('converts multiple "Last, First" entries (newline-separated)', () => {
    const result = parseBulkNames('Smith, Alice\nJones, Bob');
    expect(result.success).toHaveLength(2);
    expect(result.success[0].name).toBe('Alice Smith');
    expect(result.success[1].name).toBe('Bob Jones');
  });

  // ---- Validation ----
  it('reports error for name exceeding 200 characters', () => {
    const longName = 'A'.repeat(201);
    const result = parseBulkNames(longName);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].error).toContain('200 characters');
  });

  it('reports error for names with invalid characters', () => {
    const result = parseBulkNames('Alice <script>');
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].error).toContain('invalid characters');
  });

  it('reports error for name with brackets', () => {
    const result = parseBulkNames('Alice [test]');
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].error).toContain('invalid characters');
  });

  it('reports error for name with curly braces', () => {
    const result = parseBulkNames('Alice {test}');
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].error).toContain('invalid characters');
  });

  it('reports error for name with backslash', () => {
    const result = parseBulkNames('Alice\\Bob');
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].error).toContain('invalid characters');
  });

  // ---- Duplicate detection ----
  it('detects duplicate names (case-insensitive)', () => {
    const result = parseBulkNames('Alice\nalice');
    expect(result.success).toHaveLength(1);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].error).toContain('Duplicate');
  });

  it('detects duplicates with different casing', () => {
    const result = parseBulkNames('ALICE SMITH\nalice smith');
    expect(result.success).toHaveLength(1);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].error).toContain('Duplicate');
  });

  // ---- Mixed format handling ----
  it('handles mixed delimiters (newlines take precedence)', () => {
    const result = parseBulkNames('Alice Smith\nBob Jones');
    expect(result.success).toHaveLength(2);
  });

  it('preserves original text in result', () => {
    const result = parseBulkNames('Alice Smith');
    expect(result.success[0].original).toBe('Alice Smith');
    expect(result.success[0].name).toBe('Alice Smith');
  });

  it('trims whitespace from names', () => {
    const result = parseBulkNames('  Alice Smith  \n  Bob Jones  ');
    expect(result.success[0].name).toBe('Alice Smith');
    expect(result.success[1].name).toBe('Bob Jones');
  });

  it('skips empty lines', () => {
    const result = parseBulkNames('Alice\n\n\nBob');
    expect(result.success).toHaveLength(2);
  });

  it('includes line numbers in errors', () => {
    const result = parseBulkNames('Alice\n<invalid>');
    expect(result.errors[0].line).toBe(2);
  });

  // ---- Single-word names ----
  it('accepts single-word names', () => {
    const result = parseBulkNames('Madonna');
    expect(result.success).toHaveLength(1);
    expect(result.success[0].name).toBe('Madonna');
  });

  // ---- Multi-word names ----
  it('preserves multi-word names (First Middle Last)', () => {
    const result = parseBulkNames('John Michael Smith');
    expect(result.success).toHaveLength(1);
    expect(result.success[0].name).toBe('John Michael Smith');
  });
});
