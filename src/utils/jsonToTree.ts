export type PrimitiveEntry = { key: string; value: any; type: string };

export type TreeNodeData =
  | { key: string; type: 'grouped-primitives'; value: string; primitives: PrimitiveEntry[]; children?: TreeNodeData[]; _nodeLines?: string[]; name: string }
  | { key: string; type: 'object'; children: TreeNodeData[]; _nodeLines?: string[]; name: string }
  | { key: string; type: 'array'; children: TreeNodeData[]; _nodeLines?: string[]; name: string }
  | { key: string; type: 'primitive'; value: any; _nodeLines?: string[]; name: string };

function isObjectLike(value: any): value is Record<string, any> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function jsonToTree(key: string, value: any, isRoot = false): TreeNodeData {
  if (Array.isArray(value)) {
    const children = value.map((v, i) => jsonToTree(String(i), v, false));
    return { key, type: 'array', children, name: key };
  }
  if (isObjectLike(value)) {
    const primitives: PrimitiveEntry[] = [];
    const nonPrimitives: TreeNodeData[] = [];
    Object.entries(value).forEach(([k, v]) => {
      if (isObjectLike(v) || Array.isArray(v)) {
        nonPrimitives.push(jsonToTree(k, v, false));
      } else {
        const t = v === null ? 'null' : typeof v;
        primitives.push({ key: k, value: v, type: t });
      }
    });
    if (isRoot) {
      if (primitives.length === 0) {
        return { key: 'root', type: 'object', children: nonPrimitives, name: 'root' };
      }
      const gpKey = primitives.map(p => p.key).join(', ');
      const gpValue = primitives.map(p => `${p.key}: ${JSON.stringify(p.value)}`).join(', ');
      return {
        key: gpKey,
        value: gpValue,
        type: 'grouped-primitives',
        primitives,
        children: nonPrimitives,
        name: gpValue
      };
    }
    const grouped: TreeNodeData[] = [];
    if (primitives.length > 0) {
      const gpKey = primitives.map(p => p.key).join(', ');
      const gpValue = primitives.map(p => `${p.key}: ${JSON.stringify(p.value)}`).join(', ');
      grouped.push({
        key: gpKey,
        value: gpValue,
        type: 'grouped-primitives',
        primitives,
        name: gpValue
      });
    }
    grouped.push(...nonPrimitives);
    return { key, type: 'object', children: grouped, name: key };
  }
  return { key, value, type: 'primitive', name: `${key}: ${JSON.stringify(value)}` };
}