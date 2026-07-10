'use client';

import React, { useCallback, useMemo, useState, useEffect } from 'react';
import {
  ReactFlow,
  Controls,
  Background,
  BackgroundVariant,
  Panel,
  useReactFlow,
  ReactFlowProvider,
  type Node,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import MindmapNode from './MindmapNode';
import AnimatedEdge from './AnimatedEdge';
import {
  buildMindmapFlow,
  collectExpandableIds,
  type MindmapTree,
  type MindmapNodeData,
} from './tree-to-flow';

const nodeTypes = { mindmapNode: MindmapNode };
const edgeTypes = { animatedEdge: AnimatedEdge };

type Props = {
  tree: MindmapTree;
  onNodeClick?: (nodeId: string, data: MindmapNodeData) => void;
  className?: string;
};

function MindmapFlowInner({ tree, onNodeClick, className }: Props) {
  const { fitView } = useReactFlow();
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => {
    // Root is expanded by the layout builder; child branches stay collapsed initially.
    return new Set<string>(['root']);
  });

  const { nodes, edges } = useMemo(
    () => buildMindmapFlow(tree, expandedIds),
    [tree, expandedIds]
  );

  const expandableIds = useMemo(() => collectExpandableIds(tree.root), [tree.root]);

  // 'root' is force-expanded by the layout builder, so it never counts either way.
  const allExpanded = useMemo(
    () => Array.from(expandableIds).every((id) => id === 'root' || expandedIds.has(id)),
    [expandableIds, expandedIds]
  );
  const allCollapsed = useMemo(
    () => Array.from(expandedIds).every((id) => id === 'root'),
    [expandedIds]
  );

  const expandAll = useCallback(() => {
    setExpandedIds(new Set(expandableIds));
  }, [expandableIds]);

  const collapseAll = useCallback(() => {
    setExpandedIds(new Set<string>(['root']));
  }, []);

  // Fit view when layout changes
  useEffect(() => {
    const timer = setTimeout(() => {
      fitView({ padding: 0.3, duration: 500 });
    }, 100);
    return () => clearTimeout(timer);
  }, [nodes.length, fitView]);

  const handleNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      const data = node.data as MindmapNodeData;

      // Toggle expand/collapse for non-leaf nodes.
      if (data.childCount > 0) {
        setExpandedIds((prev) => {
          const next = new Set(prev);
          if (next.has(node.id)) {
            // Collapse: remove this node and all descendants
            Array.from(next).forEach((id) => {
              if (id.startsWith(node.id + '-') || id === node.id) {
                next.delete(id);
              }
            });
          } else {
            next.add(node.id);
          }
          return next;
        });
      }

      onNodeClick?.(node.id, data);
    },
    [onNodeClick]
  );

  return (
    <div className={`w-full h-full ${className ?? ''}`}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodeClick={handleNodeClick}
        fitView
        fitViewOptions={{ padding: 0.3 }}
        minZoom={0.2}
        maxZoom={2}
        proOptions={{ hideAttribution: true }}
        nodesDraggable={false}
        nodesConnectable={false}
        panOnScroll
        onlyRenderVisibleElements
        zoomOnDoubleClick={false}
        className="!bg-[#F8FAFC]"
      >
        <Panel position="top-right" className="!m-3">
          <div className="flex items-center gap-1 rounded-xl border border-gray-200 bg-white p-1 shadow-sm">
            <button
              type="button"
              onClick={expandAll}
              disabled={allExpanded}
              className="rounded-lg px-2.5 py-1.5 text-[12px] font-medium text-[#6B7280] transition-colors hover:bg-gray-50 hover:text-[#101828] disabled:cursor-default disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-[#6B7280]"
            >
              Expand All
            </button>
            <span aria-hidden className="h-4 w-px bg-gray-200" />
            <button
              type="button"
              onClick={collapseAll}
              disabled={allCollapsed}
              className="rounded-lg px-2.5 py-1.5 text-[12px] font-medium text-[#6B7280] transition-colors hover:bg-gray-50 hover:text-[#101828] disabled:cursor-default disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-[#6B7280]"
            >
              Collapse All
            </button>
          </div>
        </Panel>

        <Background variant={BackgroundVariant.Dots} gap={24} size={1} color="#E2E8F0" />
        <Controls
          showInteractive={false}
          className="!bg-white !border !border-gray-200 !rounded-xl !shadow-sm"
        />
      </ReactFlow>
    </div>
  );
}

export default function MindmapRenderer(props: Props) {
  return (
    <ReactFlowProvider>
      <MindmapFlowInner {...props} />
    </ReactFlowProvider>
  );
}
