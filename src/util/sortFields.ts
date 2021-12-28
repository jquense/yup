// @ts-expect-error
import toposort from 'toposort';
import { split } from 'property-expr';

import Ref from '../Reference';
import isSchema from './isSchema';
import { ObjectShape } from './objectTypes';

export default function sortFields(
  fields: ObjectShape,
  excludedEdges: readonly [string, string][] = [],
) {
  let edges = [] as Array<[string, string]>;
  let nodes = new Set<string>();
  let excludes = new Set(excludedEdges.map(([a, b]) => `${a}-${b}`));

  function addNode(depPath: string, key: string) {
    let node = split(depPath)[0];

    nodes.add(node);
    if (!excludes.has(`${key}-${node}`)) edges.push([key, node]);
  }

  for (const key of Object.keys(fields)) {
    let value = fields[key];

    nodes.add(key);

    if (Ref.isRef(value) && value.isSibling) addNode(value.path, key);
    else if (isSchema(value) && 'deps' in value)
      (value as any).deps.forEach((path: string) => addNode(path, key));
  }

  return toposort.array(Array.from(nodes), edges).reverse() as string[];
}
