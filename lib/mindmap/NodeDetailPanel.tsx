'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { MindmapNodeData } from './tree-to-flow';
import type { TreeNode } from './tree-to-flow';
import { getDepthColor } from './tree-to-flow';

type Props = {
  nodeId: string | null;
  nodeData: MindmapNodeData | null;
  treeNode: TreeNode | null;
  onClose: () => void;
};

/**
 * Find a TreeNode by its path-based ID (e.g. "root-0-2-1")
 */
export function findTreeNodeById(root: TreeNode, nodeId: string): TreeNode | null {
  if (nodeId === 'root') return root;
  const parts = nodeId.split('-').slice(1); // remove 'root' prefix
  let current: TreeNode = root;
  for (const part of parts) {
    const idx = parseInt(part, 10);
    if (!current.children || idx >= current.children.length) return null;
    current = current.children[idx];
  }
  return current;
}

export default function NodeDetailPanel({ nodeId, nodeData, treeNode, onClose }: Props) {
  const isOpen = nodeId !== null && nodeData !== null;

  return (
    <AnimatePresence>
      {isOpen && nodeData && treeNode && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
          transition={{ type: 'spring', stiffness: 300, damping: 28 }}
          className="w-full max-w-[320px] bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden h-fit"
        >
          {/* Header */}
          <div
            className="px-5 py-4 flex items-center justify-between"
            style={{
              background: nodeData.isRoot
                ? 'linear-gradient(135deg, #1C2E45 0%, #10182D 100%)'
                : getDepthColor(nodeData.branchColor, nodeData.depth),
            }}
          >
            <h3
              className="text-[15px] font-bold truncate pr-3"
              style={{ color: nodeData.isRoot || nodeData.depth <= 1 ? '#FFFFFF' : '#1C2E45' }}
            >
              {nodeData.label}
            </h3>
            <button
              onClick={onClose}
              className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-[12px] transition-colors"
              style={{
                background: 'rgba(255,255,255,0.2)',
                color: nodeData.isRoot || nodeData.depth <= 1 ? '#FFFFFF' : '#374151',
              }}
            >
              ✕
            </button>
          </div>

          {/* Content */}
          <div className="p-5">
            {/* Breadcrumb-like depth indicator */}
            <div className="flex items-center gap-1.5 mb-4">
              <span className="text-[11px] text-[#9CA3AF] font-medium">
                Depth {nodeData.depth}
              </span>
              {nodeData.isLeaf && (
                <span className="text-[10px] bg-emerald-50 text-emerald-600 font-semibold px-2 py-0.5 rounded-full">
                  Leaf
                </span>
              )}
              {!nodeData.isLeaf && (
                <span className="text-[10px] bg-blue-50 text-blue-600 font-semibold px-2 py-0.5 rounded-full">
                  {nodeData.childCount} children
                </span>
              )}
            </div>

            {/* Children list */}
            {treeNode.children && treeNode.children.length > 0 && (
              <div>
                <h4 className="text-[12px] font-semibold text-[#6B7280] uppercase tracking-wide mb-3">
                  Sub-topics
                </h4>
                <ul className="space-y-2">
                  {treeNode.children.map((child, i) => (
                    <li key={i} className="flex items-center gap-2.5">
                      <div
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ background: getDepthColor(nodeData.branchColor, nodeData.depth + 1) }}
                      />
                      <span className="text-[13px] text-[#374151]">{child.label}</span>
                      {child.children && child.children.length > 0 && (
                        <span className="text-[10px] text-[#9CA3AF] ml-auto">
                          +{child.children.length}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Leaf node message */}
            {nodeData.isLeaf && (
              <div className="text-center py-4">
                <div className="text-[24px] mb-2">📝</div>
                <p className="text-[12px] text-[#9CA3AF]">
                  This is a key point. Click other nodes to explore the topic further.
                </p>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
