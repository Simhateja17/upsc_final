'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { TreeNode } from './tree-to-flow';
import { getBranchColor, getDepthColor } from './tree-to-flow';

type ListNodeProps = {
  node: TreeNode;
  depth: number;
  branchIndex: number;
  branchColor: string;
};

function ListNode({ node, depth, branchIndex, branchColor }: ListNodeProps) {
  const [isOpen, setIsOpen] = useState(depth < 2);
  const hasChildren = node.children && node.children.length > 0;
  const color = getDepthColor(branchColor, depth);

  return (
    <div>
      <button
        onClick={() => hasChildren && setIsOpen((v) => !v)}
        className="w-full flex items-center gap-2.5 py-2 px-3 rounded-lg text-left transition-colors hover:bg-gray-50"
        style={{ paddingLeft: depth * 20 + 12 }}
      >
        {/* Expand/collapse indicator */}
        {hasChildren ? (
          <motion.span
            animate={{ rotate: isOpen ? 90 : 0 }}
            transition={{ duration: 0.2 }}
            className="text-[11px] text-[#9CA3AF] flex-shrink-0 w-4 text-center"
          >
            ▶
          </motion.span>
        ) : (
          <span
            className="w-2 h-2 rounded-full flex-shrink-0 ml-1 mr-1"
            style={{ background: color }}
          />
        )}

        <span
          className="text-[13px] font-medium"
          style={{
            color: depth === 0 ? '#101828' : depth === 1 ? color : '#374151',
            fontWeight: depth <= 1 ? 600 : 500,
          }}
        >
          {node.label}
        </span>

        {hasChildren && (
          <span className="text-[10px] text-[#9CA3AF] ml-auto">
            {node.children!.length}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && hasChildren && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            {node.children!.map((child, i) => (
              <ListNode
                key={i}
                node={child}
                depth={depth + 1}
                branchIndex={depth === 0 ? i : branchIndex}
                branchColor={depth === 0 ? getBranchColor(i) : branchColor}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

type Props = {
  root: TreeNode;
  className?: string;
};

export default function MindmapListView({ root, className }: Props) {
  return (
    <div className={`bg-white rounded-2xl border border-gray-100 shadow-sm p-4 ${className ?? ''}`}>
      <div className="flex items-center gap-2 mb-3 px-3">
        <span className="text-[16px]">📋</span>
        <h3 className="text-[14px] font-bold text-[#101828]">Outline View</h3>
      </div>
      <ListNode node={root} depth={0} branchIndex={0} branchColor="#1C2E45" />
    </div>
  );
}
