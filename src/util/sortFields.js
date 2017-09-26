import has from 'lodash/has';
import toposort from 'toposort';
import { split } from 'property-expr';

import Ref from '../Reference';
import isSchema from './isSchema';

export default function sortFields(fields, excludes = []) {
  const edges = [];
  const nodes = [];

  function addNode(depPath, key) {
    const node = split(depPath)[0];

    if (nodes.indexOf(node) === -1) {
      nodes.push(node);
    }

    if (excludes.indexOf(`${key}-${node}`) === -1) {
      edges.push([key, node]);
    }
  }

  Object.keys(fields).forEach((key) => {
    if (!has(fields, key)) {
      return;
    }
    const value = fields[key];

    if (nodes.indexOf(key) === -1) {
      nodes.push(key);
    }

    if (Ref.isRef(value) && !value.isContext) {
      addNode(value.path, key);
    } else if (isSchema(value) && value._deps) {
      value._deps.forEach(path => addNode(path, key));
    }
  });

  return toposort.array(nodes, edges).reverse();
}
