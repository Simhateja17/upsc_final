import Dagre from '@dagrejs/dagre';
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

  result.nodes.push({
    id,
    type: 'mindmapNode',
    position: { x: 0, y: 0 }, // Dagre will compute
    data: {
      label: tree.label,
      depth,
      branchIndex,
      branchColor,
      childCount: children.length,
      isExpanded,
      isRoot,
      isLeaf,
    },
  });

  if (parentId) {
    result.edges.push({
      id: `e-${parentId}-${id}`,
      source: parentId,
      target: id,
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

// ---------- Dagre layout ----------

const NODE_WIDTH = 180;
const NODE_HEIGHT = 48;
const ROOT_NODE_WIDTH = 200;
const ROOT_NODE_HEIGHT = 56;

function applyDagreLayout(
  nodes: Node<MindmapNodeData>[],
  edges: Edge[],
  direction: 'LR' | 'RL' = 'LR'
): Node<MindmapNodeData>[] {
  const g = new Dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}));
  g.setGraph({
    rankdir: direction,
    nodesep: 24,
    ranksep: 80,
    marginx: 40,
    marginy: 40,
  });

  nodes.forEach((node) => {
    const isRoot = node.data.isRoot;
    g.setNode(node.id, {
      width: isRoot ? ROOT_NODE_WIDTH : NODE_WIDTH,
      height: isRoot ? ROOT_NODE_HEIGHT : NODE_HEIGHT,
    });
  });

  edges.forEach((edge) => {
    g.setEdge(edge.source, edge.target);
  });

  Dagre.layout(g);

  return nodes.map((node) => {
    const pos = g.node(node.id);
    const w = node.data.isRoot ? ROOT_NODE_WIDTH : NODE_WIDTH;
    const h = node.data.isRoot ? ROOT_NODE_HEIGHT : NODE_HEIGHT;
    return {
      ...node,
      position: {
        x: pos.x - w / 2,
        y: pos.y - h / 2,
      },
    };
  });
}

// ---------- Balanced horizontal layout ----------

/**
 * Splits the root's children into left and right halves,
 * lays out each side with Dagre, then merges them centered on root.
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
          },
        },
      ],
      edges: [],
    };
  }

  // Always treat root as expanded
  const expIds = new Set(expandedIds);
  expIds.add('root');

  // Split children into left and right halves
  const mid = Math.ceil(children.length / 2);
  const leftChildren = children.slice(0, mid);
  const rightChildren = children.slice(mid);

  // Build left subtree
  const leftResult: FlatResult = { nodes: [], edges: [] };
  const leftRoot: TreeNode = { label: root.label, children: leftChildren };
  const counter = { val: 0 };
  flattenTree(leftRoot, null, 0, 0, '#1C2E45', expIds, 'root', leftResult, counter);

  // Build right subtree (separate, root excluded)
  const rightResult: FlatResult = { nodes: [], edges: [] };
  rightChildren.forEach((child, i) => {
    const globalIdx = mid + i;
    const branchColor = getBranchColor(globalIdx);
    counter.val++;
    flattenTree(
      child,
      'root',
      1,
      globalIdx,
      branchColor,
      expIds,
      `root-${globalIdx}`,
      rightResult,
      counter
    );
  });

  // Fix left tree: reassign branch colors for left children
  leftResult.nodes.forEach((n) => {
    if (n.data.isRoot) return;
    // Left children use indices 0..mid-1
    n.data.branchColor = getBranchColor(n.data.branchIndex);
  });

  // Layout left side (right-to-left so root is on right edge)
  const leftNodes = applyDagreLayout(leftResult.nodes, leftResult.edges, 'RL');

  // Layout right side (left-to-right so root is on left edge)
  // Add a temporary root node for right side to anchor edges
  const rightNodesWithRoot: Node<MindmapNodeData>[] = [
    {
      id: 'root-right-anchor',
      type: 'mindmapNode',
      position: { x: 0, y: 0 },
      data: {
        label: root.label,
        depth: 0,
        branchIndex: 0,
        branchColor: '#1C2E45',
        childCount: rightChildren.length,
        isExpanded: true,
        isRoot: true,
        isLeaf: false,
      },
    },
    ...rightResult.nodes,
  ];
  const rightEdgesWithRoot: Edge[] = rightResult.edges.map((e) =>
    e.source === 'root' ? { ...e, source: 'root-right-anchor' } : e
  );

  const rightNodesLayouted = applyDagreLayout(rightNodesWithRoot, rightEdgesWithRoot, 'LR');

  // Find root positions in each layout
  const leftRootNode = leftNodes.find((n) => n.id === 'root')!;
  const rightAnchorNode = rightNodesLayouted.find((n) => n.id === 'root-right-anchor')!;

  // Merge: center root at (0,0), offset everything else
  const leftOffsetX = -leftRootNode.position.x;
  const leftOffsetY = -leftRootNode.position.y;
  const rightOffsetX = -rightAnchorNode.position.x;
  const rightOffsetY = -rightAnchorNode.position.y;

  const mergedNodes: Node<MindmapNodeData>[] = [];
  const mergedEdges: Edge[] = [...leftResult.edges];

  // Add left nodes (root included)
  leftNodes.forEach((n) => {
    mergedNodes.push({
      ...n,
      position: {
        x: n.position.x + leftOffsetX,
        y: n.position.y + leftOffsetY,
      },
    });
  });

  // Add right nodes (skip the temporary anchor)
  rightNodesLayouted.forEach((n) => {
    if (n.id === 'root-right-anchor') return;
    mergedNodes.push({
      ...n,
      position: {
        x: n.position.x + rightOffsetX,
        y: n.position.y + rightOffsetY,
      },
    });
  });

  // Add right edges (remap anchor back to root)
  rightResult.edges.forEach((e) => {
    mergedEdges.push(e);
  });

  return { nodes: mergedNodes, edges: mergedEdges };
}
