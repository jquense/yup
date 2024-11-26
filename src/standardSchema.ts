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
      const result = await schema.validate(value);

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

function createStandardPath(path: string | undefined) {
  return path?.split('.').map((key) => ({ key })) ?? [];
}

function createStandardIssues(error: ValidationError): StandardIssue[] {
  return error.errors.map(
    (err) =>
      ({
        message: err,
        path: createStandardPath(error.path),
      } satisfies StandardIssue),
  );
}

function issuesFromValidationError(error: ValidationError): StandardIssue[] {
  if (!error.inner?.length && error.errors.length) {
    return createStandardIssues(error);
  }

  return error.inner.flatMap(issuesFromValidationError);
}
