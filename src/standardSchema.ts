/**
 * Copied from @standard-schema/spec to avoid having a dependency on it.
 * https://github.com/standard-schema/standard-schema/blob/main/packages/spec/src/index.ts
 */

import type { AnySchema } from './types';
import ValidationError from './ValidationError';

export interface StandardSchema<Input = unknown, Output = Input> {
  readonly '~standard': StandardSchemaProps<Input, Output>;
}

export interface StandardSchemaProps<Input = unknown, Output = Input> {
  readonly version: 1;
  readonly vendor: string;
  readonly validate: (
    value: unknown,
  ) => StandardResult<Output> | Promise<StandardResult<Output>>;
  readonly types?: StandardTypes<Input, Output> | undefined;
}

type StandardResult<Output> =
  | StandardSuccessResult<Output>
  | StandardFailureResult;

interface StandardSuccessResult<Output> {
  readonly value: Output;
  readonly issues?: undefined;
}

interface StandardFailureResult {
  readonly issues: ReadonlyArray<StandardIssue>;
}

interface StandardIssue {
  readonly message: string;
  readonly path?: ReadonlyArray<PropertyKey | StandardPathSegment> | undefined;
}

interface StandardPathSegment {
  readonly key: PropertyKey;
}

interface StandardTypes<Input, Output> {
  readonly input: Input;
  readonly output: Output;
}

export function createStandardSchemaProps<TIn, Output>(
  schema: AnySchema,
): StandardSchemaProps<TIn, Output> {
  /**
   * Adapts the schema's validate method to the standard schema's validate method.
   */
  async function validate(value: unknown): Promise<StandardResult<Output>> {
    try {
      const result = await schema.validate(value, {
        abortEarly: false,
      });

      return {
        value: result as Output,
      };
    } catch (err) {
      if (err instanceof ValidationError) {
        return {
          issues: issuesFromValidationError(err),
        };
      }

      throw err;
    }
  }

  return {
    version: 1,
    vendor: 'yup',
    validate,
  };
}

function createStandardPath(path: string | undefined): StandardIssue['path'] {
  if (!path?.length) {
    return undefined;
  }

  // Array to store the final path segments
  const segments: string[] = [];
  // Buffer for building the current segment
  let currentSegment = '';
  // Track if we're inside square brackets (array/property access)
  let inBrackets = false;
  // Track if we're inside quotes (for property names with special chars)
  let inQuotes = false;

  for (let i = 0; i < path.length; i++) {
    const char = path[i];

    if (char === '[' && !inQuotes) {
      // When entering brackets, push any accumulated segment after splitting on dots
      if (currentSegment) {
        segments.push(...currentSegment.split('.').filter(Boolean));
        currentSegment = '';
      }
      inBrackets = true;
      continue;
    }

    if (char === ']' && !inQuotes) {
      if (currentSegment) {
        // Handle numeric indices (e.g. arr[0])
        if (/^\d+$/.test(currentSegment)) {
          segments.push(currentSegment);
        } else {
          // Handle quoted property names (e.g. obj["foo.bar"])
          segments.push(currentSegment.replace(/^"|"$/g, ''));
        }
        currentSegment = '';
      }
      inBrackets = false;
      continue;
    }

    if (char === '"') {
      // Toggle quote state for handling quoted property names
      inQuotes = !inQuotes;
      continue;
    }

    if (char === '.' && !inBrackets && !inQuotes) {
      // On dots outside brackets/quotes, push current segment
      if (currentSegment) {
        segments.push(currentSegment);
        currentSegment = '';
      }
      continue;
    }

    currentSegment += char;
  }

  // Push any remaining segment after splitting on dots
  if (currentSegment) {
    segments.push(...currentSegment.split('.').filter(Boolean));
  }

  return segments;
}

function createStandardIssues(
  error: ValidationError,
  parentPath?: string,
): StandardIssue[] {
  const path = parentPath ? `${parentPath}.${error.path}` : error.path;

  return error.errors.map(
    (err) =>
      ({
        message: err,
        path: createStandardPath(path),
      } satisfies StandardIssue),
  );
}

function issuesFromValidationError(
  error: ValidationError,
  parentPath?: string,
): StandardIssue[] {
  if (!error.inner?.length && error.errors.length) {
    return createStandardIssues(error, parentPath);
  }

  const path = parentPath ? `${parentPath}.${error.path}` : error.path;

  return error.inner.flatMap((err) => issuesFromValidationError(err, path));
}
