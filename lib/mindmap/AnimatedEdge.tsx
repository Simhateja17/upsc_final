'use client';

import React from 'react';
import { BaseEdge, getBezierPath, type EdgeProps } from '@xyflow/react';
import { motion } from 'framer-motion';

type AnimatedEdgeData = { color?: string };

export default function AnimatedEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  style,
}: EdgeProps & { data?: AnimatedEdgeData }) {
  const color = data?.color ?? '#94A3B8';

  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    curvature: 0.4,
  });

  return (
    <>
      {/* Shadow / glow under the edge */}
      <BaseEdge
        id={`${id}-shadow`}
        path={edgePath}
        style={{
          stroke: color,
          strokeWidth: 4,
          opacity: 0.08,
          filter: 'blur(3px)',
          ...style,
        }}
      />
      {/* Main animated edge */}
      <motion.path
        d={edgePath}
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{
          pathLength: { duration: 0.6, ease: 'easeOut', delay: 0.2 },
          opacity: { duration: 0.3, delay: 0.1 },
        }}
        style={{ pointerEvents: 'none' }}
      />
    </>
  );
}
