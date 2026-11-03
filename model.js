const DEFAULT_COLORS = ['#D8B650', '#C7869E', '#6CA89E', '#7196BD', '#CC7F70', '#A48DB9', '#D59B6A', '#8BA07B'];

export function createModel(definition) {
  if (!definition || typeof definition.id !== 'string' || !definition.id || typeof definition.title !== 'string' || !Array.isArray(definition.categories) || !definition.categories.length) {
    throw new Error('A wheel needs an ID, a title, and at least one category.');
  }
  const nodes = new Map();
  const rootId = '__root__';
  nodes.set(rootId, { id: rootId, label: definition.title, parentId: null, children: [], depth: 0, color: '#9B9C8B', description: definition.subtitle || '' });
  const visit = (source, parentId, depth, color) => {
    if (!source || typeof source.id !== 'string' || !source.id || typeof source.label !== 'string' || !source.label.trim()) throw new Error('Every feeling needs a stable ID and a label.');
    if (nodes.has(source.id)) throw new Error(`Duplicate feeling ID: ${source.id}`);
    if (source.children !== undefined && !Array.isArray(source.children)) throw new Error(`Children must be an array: ${source.id}`);
    const nodeColor = /^#[\da-f]{6}$/i.test(source.color || '') ? source.color : color;
    const node = { id: source.id, label: source.label, description: typeof source.description === 'string' ? source.description : '', parentId, children: [], depth, color: nodeColor };
    nodes.set(node.id, node);
    nodes.get(parentId).children.push(node.id);
    for (const child of source.children || []) visit(child, node.id, depth + 1, nodeColor);
  };
  definition.categories.forEach((category, index) => visit(category, rootId, 1, DEFAULT_COLORS[index % DEFAULT_COLORS.length]));
  return { definition, rootId, nodes };
}
