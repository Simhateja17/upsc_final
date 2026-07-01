import type { Node, Edge } from '@xyflow/react';

// ---------- Types ----------

export type TreeNode = {
  label: string;
  children?: TreeNode[];
};

export type MindmapTree = {
  title: string;
  subject: string;
  color?: string;
  root: TreeNode;
};

export type MindmapNodeData = {
  label: string;
  depth: number;
  branchIndex: number;
  branchColor: string;
  childCount: number;
  isExpanded: boolean;
  isRoot: boolean;
  isLeaf: boolean;
  width: number;
  height: number;
};

// ---------- Color palette ----------

const BRANCH_COLORS = [
  '#3B82F6', // blue
  '#A855F7', // purple
  '#10B981', // emerald
  '#F59E0B', // amber
  '#EC4899', // pink
  '#EF4444', // red
  '#06B6D4', // cyan
  '#8B5CF6', // violet
  '#F97316', // orange
  '#14B8A6', // teal
];

export function getBranchColor(index: number): string {
  return BRANCH_COLORS[index % BRANCH_COLORS.length];
}

/**
 * Lighten a hex color by mixing with white based on depth.
 * depth 0 = full color, depth 1 = slightly lighter, etc.
 */
export function getDepthColor(baseColor: string, depth: number): string {
  if (depth <= 1) return baseColor;
  const factor = Math.min((depth - 1) * 0.15, 0.55);
  const hex = baseColor.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  const lr = Math.round(r + (255 - r) * factor);
  const lg = Math.round(g + (255 - g) * factor);
  const lb = Math.round(b + (255 - b) * factor);
  return `#${lr.toString(16).padStart(2, '0')}${lg.toString(16).padStart(2, '0')}${lb.toString(16).padStart(2, '0')}`;
}

// ---------- Flatten tree into nodes + edges ----------

type FlatResult = {
  nodes: Node<MindmapNodeData>[];
  edges: Edge[];
};

function estimateNodeSize(label: string, isRoot: boolean): { width: number; height: number } {
  const chars = Math.max(label.length, isRoot ? 18 : 10);
  const maxLineChars = isRoot ? 34 : 32;
  const lines = Math.max(1, Math.ceil(chars / maxLineChars));
  const width = Math.min(isRoot ? 420 : 360, Math.max(isRoot ? 220 : 170, chars * 8.5 + (isRoot ? 72 : 88)));
  const height = Math.max(isRoot ? 58 : 52, 26 + lines * 22);

  return { width: Math.round(width), height: Math.round(height) };
}

function flattenTree(
  tree: TreeNode,
  parentId: string | null,
  depth: number,
  branchIndex: number,
  branchColor: string,
  expandedIds: Set<string>,
  idPrefix: string,
  result: FlatResult,
  counter: { val: number }
): void {
  const id = idPrefix;
  const children = tree.children ?? [];
  const isExpanded = expandedIds.has(id);
  const isRoot = depth === 0;
  const isLeaf = children.length === 0;
  const size = estimateNodeSize(tree.label, isRoot);

  result.nodes.push({
    id,
    type: 'mindmapNode',
    position: { x: 0, y: 0 },
    data: {
      label: tree.label,
      depth,
      branchIndex,
      branchColor,
      childCount: children.length,
      isExpanded,
      isRoot,
      isLeaf,
      width: size.width,
      height: size.height,
    },
  });

  if (parentId) {
    result.edges.push({
      id: `e-${parentId}-${id}`,
      source: parentId,
      target: id,
      sourceHandle: 'right-source',
      targetHandle: 'left-target',
      type: 'animatedEdge',
      data: { color: branchColor },
    });
  }

  // Only render children if expanded (or root always shows level 1)
  if (isExpanded || isRoot) {
    children.forEach((child, i) => {
      counter.val++;
      const childBranchIndex = depth === 0 ? i : branchIndex;
      const childBranchColor = depth === 0 ? getBranchColor(i) : branchColor;
      flattenTree(
        child,
        id,
        depth + 1,
        childBranchIndex,
        childBranchColor,
        expandedIds,
        `${id}-${i}`,
        result,
        counter
      );
    });
  }
}

// ---------- Deterministic tree layout ----------

const RANK_GAP = 110;
const SIBLING_GAP = 36;
const CANVAS_MARGIN = 40;

function getDepth(id: string): number {
  return id === 'root' ? 0 : id.split('-').length - 1;
}

function applyOrderedTreeLayout(
  nodes: Node<MindmapNodeData>[],
  edges: Edge[]
): Node<MindmapNodeData>[] {
  const nodeById = new Map(nodes.map((node) => [node.id, node]));
  const childrenByParent = new Map<string, string[]>();

  edges.forEach((edge) => {
    const children = childrenByParent.get(edge.source) ?? [];
    children.push(edge.target);
    childrenByParent.set(edge.source, children);
  });

  const maxWidthByDepth = new Map<number, number>();
  nodes.forEach((node) => {
    const depth = getDepth(node.id);
    maxWidthByDepth.set(depth, Math.max(maxWidthByDepth.get(depth) ?? 0, node.data.width));
  });

  const xByDepth = new Map<number, number>();
  let nextX = CANVAS_MARGIN;
  Array.from(maxWidthByDepth.keys())
    .sort((a, b) => a - b)
    .forEach((depth) => {
      const width = maxWidthByDepth.get(depth) ?? 0;
      xByDepth.set(depth, nextX + width / 2);
      nextX += width + RANK_GAP;
    });

  const centerYById = new Map<string, number>();

  function measureAndPlace(id: string, top: number): number {
    const node = nodeById.get(id);
    if (!node) return 0;

    const children = childrenByParent.get(id) ?? [];
    if (children.length === 0) {
      const height = node.data.height;
      centerYById.set(id, top + height / 2);
      return height;
    }

    let childTop = top;
    const childCenters: number[] = [];
    children.forEach((childId, index) => {
      if (index > 0) childTop += SIBLING_GAP;
      const childHeight = measureAndPlace(childId, childTop);
      childCenters.push(centerYById.get(childId) ?? childTop + childHeight / 2);
      childTop += childHeight;
    });

    const childrenHeight = childTop - top;
    const height = Math.max(node.data.height, childrenHeight);
    const firstCenter = childCenters[0] ?? top + height / 2;
    const lastCenter = childCenters[childCenters.length - 1] ?? firstCenter;
    centerYById.set(id, (firstCenter + lastCenter) / 2);
    return height;
  }

  measureAndPlace('root', CANVAS_MARGIN);

  return nodes.map((node) => {
    const depth = getDepth(node.id);
    const x = (xByDepth.get(depth) ?? CANVAS_MARGIN) - node.data.width / 2;
    const y = (centerYById.get(node.id) ?? CANVAS_MARGIN) - node.data.height / 2;
    return {
      ...node,
      position: { x, y },
    };
  });
}

// ---------- One-sided horizontal layout ----------

/**
 * Lays the whole tree out left-to-right so every branch opens on one side.
 */
export function buildMindmapFlow(
  tree: MindmapTree,
  expandedIds: Set<string>
): { nodes: Node<MindmapNodeData>[]; edges: Edge[] } {
  const root = tree.root;
  const children = root.children ?? [];

  // If no children, just return root node
  if (children.length === 0) {
    return {
      nodes: [
        {
          id: 'root',
          type: 'mindmapNode',
          position: { x: 0, y: 0 },
          data: {
            label: root.label,
            depth: 0,
            branchIndex: 0,
            branchColor: '#1C2E45',
            childCount: 0,
            isExpanded: true,
            isRoot: true,
            isLeaf: true,
            width: estimateNodeSize(root.label, true).width,
            height: estimateNodeSize(root.label, true).height,
          },
        },
      ],
      edges: [],
    };
  }

  // Always treat root as expanded
  const expIds = new Set(expandedIds);
  expIds.add('root');

  const result: FlatResult = { nodes: [], edges: [] };
  flattenTree(root, null, 0, 0, '#1C2E45', expIds, 'root', result, { val: 0 });

  return {
    nodes: applyOrderedTreeLayout(result.nodes, result.edges),
    edges: result.edges,
  };
}
