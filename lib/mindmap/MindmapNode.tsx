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
    isExpanded,
    isRoot,
    isLeaf,
    width,
    height,
  } = data;

  const nodeColor = isRoot ? '#1C2E45' : getDepthColor(branchColor, depth);
  const hiddenHandleStyle = {
    width: 0,
    height: 0,
    minWidth: 0,
    minHeight: 0,
    opacity: 0,
    border: 0,
    background: 'transparent',
    pointerEvents: 'none' as const,
  };

  if (isRoot) {
    return (
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 22, delay: 0 }}
        className="relative"
      >
        <div
          className="flex items-center justify-center px-7 py-4 rounded-xl font-bold text-[15px] leading-snug text-white text-center shadow-lg select-none"
          style={{
            background: 'linear-gradient(135deg, #1C2E45 0%, #10182D 100%)',
            width,
            minHeight: height,
            boxShadow: '0 4px 20px rgba(16,24,45,0.25), 0 1px 3px rgba(0,0,0,0.1)',
          }}
        >
          {label}
        </div>
        <Handle
          id="right-source"
          type="source"
          position={Position.Right}
          style={hiddenHandleStyle}
          isConnectable={false}
        />
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
        className="flex items-center justify-between gap-3 rounded-xl px-4 py-3 text-[13px] font-semibold leading-snug cursor-pointer select-none transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
        style={{
          background: '#FFFFFF',
          color: '#172033',
          borderWidth: 1,
          borderStyle: 'solid',
          borderColor: `${nodeColor}66`,
          borderLeftWidth: 5,
          borderLeftColor: nodeColor,
          width,
          minHeight: height,
          boxShadow: '0 8px 20px rgba(15,23,42,0.08), 0 1px 2px rgba(15,23,42,0.06)',
        }}
      >
        <span className="block min-w-0 whitespace-normal break-words text-left">{label}</span>
        {!isLeaf && (
          <span
            className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-white transition-transform duration-200"
            style={{
              background: nodeColor,
              transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
            }}
            aria-hidden="true"
          >
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M5 3.25L8.25 6.5L5 9.75" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
        )}
      </div>

      <Handle
        id="left-target"
        type="target"
        position={Position.Left}
        style={hiddenHandleStyle}
        isConnectable={false}
      />
      <Handle
        id="right-source"
        type="source"
        position={Position.Right}
        style={hiddenHandleStyle}
        isConnectable={false}
      />
    </motion.div>
  );
});

export default MindmapNode;
