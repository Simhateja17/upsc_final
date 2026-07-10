'use client';

import React, { useCallback, useMemo, useState, useEffect, useRef } from 'react';
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
  const { fitView, zoomIn, zoomOut } = useReactFlow();
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
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

  // Keep local fullscreen state in sync with the browser (covers Esc / F11 exits).
  useEffect(() => {
    const handler = () => setIsFullscreen(document.fullscreenElement === containerRef.current);
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  const toggleFullscreen = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    if (document.fullscreenElement) {
      document.exitFullscreen?.();
    } else {
      el.requestFullscreen?.();
    }
    // Re-fit shortly after the viewport size changes.
    setTimeout(() => fitView({ padding: 0.3, duration: 400 }), 250);
  }, [fitView]);

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
    <div ref={containerRef} className={`w-full h-full bg-[#F8FAFC] ${className ?? ''}`}>
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
          <div className="flex flex-col items-end gap-2">
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

            {/* Zoom + Full Screen toolbar */}
            <div className="flex items-center gap-1 rounded-xl border border-gray-200 bg-white p-1 shadow-sm">
              <button
                type="button"
                onClick={() => zoomIn({ duration: 200 })}
                title="Zoom in"
                aria-label="Zoom in"
                className="flex items-center justify-center rounded-lg p-1.5 text-[#6B7280] transition-colors hover:bg-gray-50 hover:text-[#101828]"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="7" /><line x1="21" y1="21" x2="16.65" y2="16.65" /><line x1="11" y1="8" x2="11" y2="14" /><line x1="8" y1="11" x2="14" y2="11" />
                </svg>
              </button>
              <button
                type="button"
                onClick={() => zoomOut({ duration: 200 })}
                title="Zoom out"
                aria-label="Zoom out"
                className="flex items-center justify-center rounded-lg p-1.5 text-[#6B7280] transition-colors hover:bg-gray-50 hover:text-[#101828]"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="7" /><line x1="21" y1="21" x2="16.65" y2="16.65" /><line x1="8" y1="11" x2="14" y2="11" />
                </svg>
              </button>
              <span aria-hidden className="h-4 w-px bg-gray-200" />
              <button
                type="button"
                onClick={toggleFullscreen}
                title={isFullscreen ? 'Exit full screen' : 'Full screen'}
                aria-label={isFullscreen ? 'Exit full screen' : 'Full screen'}
                className="flex items-center justify-center rounded-lg p-1.5 text-[#6B7280] transition-colors hover:bg-gray-50 hover:text-[#101828]"
              >
                {isFullscreen ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M8 3v3a2 2 0 0 1-2 2H3M21 8h-3a2 2 0 0 1-2-2V3M3 16h3a2 2 0 0 1 2 2v3M16 21v-3a2 2 0 0 1 2-2h3" />
                  </svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M8 3H5a2 2 0 0 0-2 2v3M21 8V5a2 2 0 0 0-2-2h-3M3 16v3a2 2 0 0 0 2 2h3M16 21h3a2 2 0 0 0 2-2v-3" />
                  </svg>
                )}
              </button>
            </div>
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
