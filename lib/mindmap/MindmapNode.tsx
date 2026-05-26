'use client';

import React, { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { motion } from 'framer-motion';
import type { MindmapNodeData } from './tree-to-flow';
import { getDepthColor } from './tree-to-flow';

type Props = NodeProps & { data: MindmapNodeData };

const MindmapNode = memo(function MindmapNode({ data, id }: Props) {
  const {
    label,
    depth,
    branchColor,
    childCount,
    isExpanded,
    isRoot,
    isLeaf,
  } = data;

  const nodeColor = isRoot ? '#1C2E45' : getDepthColor(branchColor, depth);

  if (isRoot) {
    return (
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 22, delay: 0 }}
        className="relative"
      >
        <div
          className="px-6 py-3.5 rounded-2xl font-bold text-[15px] text-white text-center shadow-lg select-none"
          style={{
            background: 'linear-gradient(135deg, #1C2E45 0%, #10182D 100%)',
            minWidth: 180,
            boxShadow: '0 4px 20px rgba(16,24,45,0.25), 0 1px 3px rgba(0,0,0,0.1)',
          }}
        >
          {label}
        </div>
        <Handle type="source" position={Position.Right} className="!bg-transparent !border-0 !w-0 !h-0" />
        <Handle type="source" position={Position.Left} className="!bg-transparent !border-0 !w-0 !h-0" id="left" />
      </motion.div>
    );
  }

  // Depth-based stagger delay
  const staggerDelay = depth * 0.15 + (data.branchIndex * 0.05);

  return (
    <motion.div
      initial={{ scale: 0.3, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{
        type: 'spring',
        stiffness: 300,
        damping: 24,
        delay: staggerDelay,
      }}
      className="relative group"
    >
      <div
        className="px-4 py-2.5 rounded-xl text-[13px] font-semibold text-center cursor-pointer select-none transition-shadow duration-300 hover:shadow-md"
        style={{
          background: '#FFFFFF',
          color: nodeColor,
          borderWidth: 1.5,
          borderStyle: 'solid',
          borderColor: nodeColor,
          minWidth: 120,
          maxWidth: 200,
          boxShadow: '0 1px 2px rgba(0,0,0,0.04), 0 3px 10px rgba(0,0,0,0.06)',
        }}
      >
        <div className="flex items-center justify-center gap-2">
          <span className="truncate">{label}</span>
          {!isLeaf && (
            <span
              className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white transition-transform duration-200"
              style={{
                background: nodeColor,
                transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
              }}
            >
              {isExpanded ? '−' : '+'}
            </span>
          )}
        </div>
      </div>

      {/* Handles — both sides for balanced layout */}
      <Handle type="target" position={Position.Right} className="!bg-transparent !border-0 !w-0 !h-0" />
      <Handle type="target" position={Position.Left} className="!bg-transparent !border-0 !w-0 !h-0" id="left-target" />
      <Handle type="source" position={Position.Right} className="!bg-transparent !border-0 !w-0 !h-0" id="right-source" />
      <Handle type="source" position={Position.Left} className="!bg-transparent !border-0 !w-0 !h-0" id="left-source" />
    </motion.div>
  );
});

export default MindmapNode;
