import has from 'lodash/has';
// @ts-expect-error
import toposort from 'toposort';
import { split } from 'property-expr';

import Ref from '../Reference';
import isSchema from './isSchema';
import { ObjectShape } from '../object';

export default function sortFields(
  fields: ObjectShape,
  excludedEdges: readonly [string, string][] = [],
) {
  let edges = [] as Array<[string, string]>;
  let nodes = new Set<string>();
  let excludes = new Set(excludedEdges.map(([a, b]) => `${a}-${b}`));

  function addNode(depPath: string, key: string) {
    var node = split(depPath)[0];

    nodes.add(node);
    if (!excludes.has(`${key}-${node}`)) edges.push([key, node]);
  }

  for (const key in fields)
    if (has(fields, key)) {
      let value = fields[key];

      nodes.add(key);

      if (Ref.isRef(value) && value.isSibling) addNode(value.path, key);
      else if (isSchema(value) && 'deps' in value)
        value.deps.forEach((path) => addNode(path, key));
    }

  return toposort.array(Array.from(nodes), edges).reverse() as string[];
}
