/**
 * Smart Name Parser Utility
 * Handles bulk import of names in various formats
 * Supports: comma-separated, newline-separated, tab-separated, and mixed formats
 */

export interface ParsedName {
  firstName: string;
  lastName: string;
  original: string;
}

export interface ParseResult {
  success: ParsedName[];
  errors: { line: number; text: string; error: string }[];
}

/**
 * Detects the delimiter used in a text block
 */
function detectDelimiter(text: string): 'comma' | 'newline' | 'tab' | 'mixed' {
  const commaCount = (text.match(/,(?![^,]*,)/g) || []).length; // Count commas not used in "Last, First"
  const newlineCount = (text.match(/\n/g) || []).length;
  const tabCount = (text.match(/\t/g) || []).length;

  // If we have tabs and names appear to be tab-separated (e.g., from Excel)
  if (tabCount > 0 && tabCount >= commaCount && tabCount >= newlineCount) {
    return 'tab';
  }

  // If we have newlines and each line appears to be a name
  if (newlineCount > 0 && newlineCount >= commaCount) {
    return 'newline';
  }

  // If we have commas (likely "Name1, Name2, Name3")
  // But need to distinguish from "Last, First" format within single entries
  if (commaCount > 0) {
    return 'comma';
  }

  return 'mixed';
}

/**
 * Splits text into individual name strings based on detected delimiter
 */
function splitNames(text: string): string[] {
  const delimiter = detectDelimiter(text);

  let rawNames: string[];

  switch (delimiter) {
    case 'comma':
      // Split by comma, but be careful with "Last, First" format
      // If we have newlines, split by newlines first
      if (text.includes('\n')) {
        rawNames = text.split(/\r?\n/);
      } else {
        // Split by comma but preserve "Last, First" pairs
        // This is tricky - we'll use a simple heuristic:
        // If text has multiple commas and spaces after commas suggest list format
        const parts = text.split(',');
        // If every part after comma starts with space, it's likely a list
        rawNames = parts;
      }
      break;
    case 'newline':
      rawNames = text.split(/\r?\n/);
      break;
    case 'tab':
      rawNames = text.split(/\t/);
      break;
    default:
      // Try to split by any of the delimiters
      // Prefer newlines, then tabs, then commas
      if (text.includes('\n')) {
        rawNames = text.split(/\r?\n/);
      } else if (text.includes('\t')) {
        rawNames = text.split(/\t/);
      } else {
        rawNames = text.split(',');
      }
  }

  // Clean up: trim whitespace, remove empty entries
  return rawNames
    .map((name) => name.trim())
    .filter((name) => name.length > 0);
}

/**
 * Parses a single name into first and last name
 * Handles formats:
 * - "First Last" → first: "First", last: "Last"
 * - "Last, First" → first: "First", last: "Last"
 * - "First Middle Last" → first: "First Middle", last: "Last"
 * - "SingleName" → first: "", last: "SingleName"
 */
function parseIndividualName(nameStr: string): {
  firstName: string;
  lastName: string;
} {
  const trimmed = nameStr.trim();

  // Handle empty
  if (!trimmed) {
    throw new Error('Empty name');
  }

  // Handle "Last, First" format (comma inside the name string)
  if (trimmed.includes(',')) {
    const parts = trimmed.split(',').map((p) => p.trim());
    if (parts.length === 2) {
      return {
        firstName: parts[1], // First name after comma
        lastName: parts[0], // Last name before comma
      };
    }
    // If multiple commas, treat as malformed
    throw new Error('Invalid comma-separated format');
  }

  // Handle "First Last" or "First Middle Last" format
  const words = trimmed.split(/\s+/).filter((w) => w.length > 0);

  if (words.length === 0) {
    throw new Error('Empty name');
  }

  if (words.length === 1) {
    // Single word - treat as last name only
    return {
      firstName: '',
      lastName: words[0],
    };
  }

  // Multiple words: last word is last name, everything else is first name
  const lastName = words[words.length - 1];
  const firstName = words.slice(0, -1).join(' ');

  return { firstName, lastName };
}

/**
 * Validates a parsed name
 */
function validateName(
  firstName: string,
  lastName: string
): { valid: boolean; error?: string } {
  // Last name is required
  if (!lastName || lastName.trim().length === 0) {
    return { valid: false, error: 'Last name is required' };
  }

  // Check length limits (100 chars each as per DB schema)
  if (firstName.length > 100) {
    return { valid: false, error: 'First name exceeds 100 characters' };
  }

  if (lastName.length > 100) {
    return { valid: false, error: 'Last name exceeds 100 characters' };
  }

  // Check for invalid characters (optional - adjust based on requirements)
  const invalidChars = /[<>{}[\]\\]/;
  if (invalidChars.test(firstName) || invalidChars.test(lastName)) {
    return { valid: false, error: 'Name contains invalid characters' };
  }

  return { valid: true };
}

/**
 * Main parsing function - parses bulk text input into individual names
 */
export function parseBulkNames(text: string): ParseResult {
  const result: ParseResult = {
    success: [],
    errors: [],
  };

  if (!text || text.trim().length === 0) {
    return result;
  }

  const nameStrings = splitNames(text);

  nameStrings.forEach((nameStr, index) => {
    try {
      const { firstName, lastName } = parseIndividualName(nameStr);

      // Validate
      const validation = validateName(firstName, lastName);
      if (!validation.valid) {
        result.errors.push({
          line: index + 1,
          text: nameStr,
          error: validation.error || 'Validation failed',
        });
        return;
      }

      // Check for duplicates within this batch (case-insensitive)
      const isDuplicate = result.success.some(
        (name) =>
          name.firstName.toLowerCase() === firstName.toLowerCase() &&
          name.lastName.toLowerCase() === lastName.toLowerCase()
      );

      if (isDuplicate) {
        result.errors.push({
          line: index + 1,
          text: nameStr,
          error: 'Duplicate name in list',
        });
        return;
      }

      result.success.push({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        original: nameStr,
      });
    } catch (err) {
      result.errors.push({
        line: index + 1,
        text: nameStr,
        error: err instanceof Error ? err.message : 'Failed to parse name',
      });
    }
  });

  return result;
}

/**
 * Formats a name for display
 */
export function formatName(firstName: string, lastName: string): string {
  if (!firstName || firstName.trim().length === 0) {
    return lastName;
  }
  return `${firstName} ${lastName}`;
}

/**
 * Sorts names by last name, then first name
 */
export function sortByName<T extends { firstName: string; lastName: string }>(
  members: T[]
): T[] {
  return [...members].sort((a, b) => {
    const lastNameCompare = a.lastName.localeCompare(b.lastName, undefined, {
      sensitivity: 'base',
    });
    if (lastNameCompare !== 0) return lastNameCompare;

    return a.firstName.localeCompare(b.firstName, undefined, {
      sensitivity: 'base',
    });
  });
}
