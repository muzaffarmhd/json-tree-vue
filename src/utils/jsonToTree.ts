export type PrimitiveEntry = { key: string; value: any; type: string };

export type TreeNodeData =
  | { key: string; type: 'grouped-primitives'; value: string; primitives: PrimitiveEntry[]; children?: TreeNodeData[] }
  | { key: string; type: 'object'; children: TreeNodeData[] }
  | { key: string; type: 'array'; children: TreeNodeData[] }
  | { key: string; type: 'primitive'; value: any };

function isObjectLike(value: any): value is Record<string, any> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function jsonToTree(key: string, value: any, isRoot = false): TreeNodeData {
  if (Array.isArray(value)) {
    const children = value.map((v, i) => jsonToTree(String(i), v, false));
    return { key, type: 'array', children };
  }

  if (isObjectLike(value)) {
    const primitives: PrimitiveEntry[] = [];
    const nonPrimitives: TreeNodeData[] = [];

    Object.entries(value).forEach(([k, v]) => {
      if (isObjectLike(v) || Array.isArray(v)) {
        nonPrimitives.push(jsonToTree(k, v, false));
      } else {
        primitives.push({ key: k, value: v, type: typeof v });
      }
    });

    if (isRoot) {
      return {
        key: primitives.map(p => p.key).join(', '),
        value: primitives.map(p => `${p.key}: ${JSON.stringify(p.value)}`).join(', '),
        type: 'grouped-primitives',
        primitives,
        children: nonPrimitives
      };
    }

    const grouped: TreeNodeData[] = [];
    if (primitives.length > 0) {
      grouped.push({
        key: primitives.map(p => p.key).join(', '),
        value: primitives.map(p => `${p.key}: ${JSON.stringify(p.value)}`).join(', '),
        type: 'grouped-primitives',
        primitives
      });
    }
    grouped.push(...nonPrimitives);
    return { key, type: 'object', children: grouped };
  }

  return { key, value, type: 'primitive' };
} 