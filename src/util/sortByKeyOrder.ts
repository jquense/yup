import ValidationError from '../ValidationError';

function findIndex(arr: readonly string[], err: ValidationError) {
  let idx = Infinity;
  arr.some((key, ii) => {
    if (err.path?.includes(key)) {
      idx = ii;
      return true;
    }
  });
  return idx;
}

export default function sortByKeyOrder(keys: readonly string[]) {
  return (a: ValidationError, b: ValidationError) => {
    return findIndex(keys, a) - findIndex(keys, b);
  };
}

// WeakMap used for caching schema path results per schema instance.
// This ensures no redundant recursion and avoids memory leaks,
// since WeakMap entries are garbage collected when schema objects are no longer referenced.
const pathCache = new WeakMap<any, string[]>();

/**
 * Recursively collects all dot-notated field paths from a Yup object schema.
 *
 * Example:
 * Given a schema like:
 *   object({
 *     user: object({
 *       name: string(),
 *       email: string(),
 *     }),
 *     settings: object({
 *       theme: string(),
 *     }),
 *   })
 *
 * It returns:
 * [
 *   'user.name',
 *   'user.email',
 *   'settings.theme'
 * ]
 *
 * This version includes:
 *  ✅ Caching (top-level only)
 *  ✅ Max depth protection (default: 25)
 *
 * @param schema    The Yup schema to collect field paths from
 * @param basePath  Used internally during recursion to build nested keys
 * @param depth     Current recursion depth (internal)
 * @param maxDepth  Maximum allowed depth (default: 25)
 * @returns         A list of full paths in the schema declaration order
 */
export const collectFieldPaths = (
  schema: any,
  basePath = '',
  depth = 0,
  maxDepth = 25,
): string[] => {
  // 🛡️ Prevent infinite recursion or excessive depth in nested schemas
  if (depth > maxDepth) {
    throw new Error(
      `[collectFieldPaths] Max schema depth of ${maxDepth} exceeded at path: ${basePath}`,
    );
  }

  // ✅ Return cached result if top-level schema has already been processed
  if (!basePath && pathCache.has(schema)) {
    return pathCache.get(schema)!;
  }

  const shape = schema.fields || {};
  let paths: string[] = [];

  // 🔁 Iterate through each field in the current schema level
  for (const key of Object.keys(shape)) {
    const fullPath = basePath ? `${basePath}.${key}` : key;
    const field = shape[key];

    // 📦 Recurse if field is an object schema (i.e., has its own fields)
    if (field?.fields) {
      paths = paths.concat(
        collectFieldPaths(field, fullPath, depth + 1, maxDepth),
      );
    } else {
      // ✅ Leaf field — add full path
      paths.push(fullPath);
    }
  }

  // 💾 Cache full result only for top-level calls (to prevent caching partial paths)
  if (!basePath) {
    pathCache.set(schema, paths);
  }

  return paths;
};
