'use client';

import { useMemo, useState, useCallback } from 'react';
import { sankey as d3Sankey, sankeyLinkHorizontal } from 'd3-sankey';
import { philippineCascade, CATEGORY_COLORS, SEVERITY_COLORS } from '@/data/cascade';
import type { CascadeNode, CascadeLink, CascadeCategory } from '@/types/cascade';
import { NodeTooltip, LinkTooltip } from './SankeyTooltip';
import { SankeyNodeDetail } from './SankeyNodeDetail';
import type { SankeyExtraProperties, SankeyNode, SankeyLink } from 'd3-sankey';

/* ------------------------------------------------------------------ */
/*  Types for d3-sankey generics                                      */
/* ------------------------------------------------------------------ */

interface NodeExtra extends SankeyExtraProperties {
  id: string;
  nodeData: CascadeNode;
}

interface LinkExtra extends SankeyExtraProperties {
  linkData: CascadeLink;
}

type SNode = SankeyNode<NodeExtra, LinkExtra>;
type SLink = SankeyLink<NodeExtra, LinkExtra>;

/* ------------------------------------------------------------------ */
/*  Category layout                                                   */
/* ------------------------------------------------------------------ */

const CATEGORY_ORDER: CascadeCategory[] = ['energy', 'agriculture', 'transport', 'consumer'];

const CATEGORY_LABELS: Record<string, string> = {
  energy: 'Energy',
  agriculture: 'Agriculture & Food',
  transport: 'Transport & Logistics',
  consumer: 'Consumer Impact',
  industry: 'Industry',
};

const SVG_W = 900;
const SVG_H = 500;
const MARGIN = { top: 40, right: 20, bottom: 20, left: 20 };

/* ------------------------------------------------------------------ */
/*  Component                                                         */
/* ------------------------------------------------------------------ */

interface SankeyDiagramProps {
  activeStage?: CascadeCategory | null;
}

export function SankeyDiagram({ activeStage = null }: SankeyDiagramProps) {
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [hoveredLinkIdx, setHoveredLinkIdx] = useState<number | null>(null);
  const [selectedNode, setSelectedNode] = useState<CascadeNode | null>(null);
  const [tooltip, setTooltip] = useState<{
    type: 'node' | 'link';
    node?: CascadeNode;
    link?: CascadeLink;
    x: number;
    y: number;
  } | null>(null);

  /* ---------- build sankey layout ---------- */
  const graph = useMemo(() => {
    const nodeMap = new Map<string, number>();
    const nodes: Array<{ id: string; nodeData: CascadeNode }> = [];
    philippineCascade.nodes.forEach((n, i) => {
      nodeMap.set(n.id, i);
      nodes.push({ id: n.id, nodeData: n });
    });

    const links: Array<{ source: string; target: string; value: number; linkData: CascadeLink }> =
      philippineCascade.links.map((l) => ({
        source: l.from,
        target: l.to,
        value: l.magnitude,
        linkData: l,
      }));

    const generator = d3Sankey<NodeExtra, LinkExtra>()
      .nodeId((d) => (d as unknown as { id: string }).id)
      .nodeWidth(18)
      .nodePadding(14)
      .nodeSort(null)
      .extent([
        [MARGIN.left, MARGIN.top],
        [SVG_W - MARGIN.right, SVG_H - MARGIN.bottom],
      ]);

    const result = generator({
      nodes: nodes.map((n) => ({ ...n })),
      links: links.map((l) => ({ ...l })),
    });

    return result;
  }, []);

  const linkPathGen = useMemo(() => sankeyLinkHorizontal<SNode, SLink>(), []);

  /* ---------- highlight helpers ---------- */
  const getConnectedNodeIds = useCallback(
    (nodeId: string): Set<string> => {
      const ids = new Set<string>([nodeId]);
      for (const link of graph.links) {
        const srcId = typeof link.source === 'object' ? (link.source as SNode).id : String(link.source);
        const tgtId = typeof link.target === 'object' ? (link.target as SNode).id : String(link.target);
        if (srcId === nodeId) ids.add(tgtId);
        if (tgtId === nodeId) ids.add(srcId);
      }
      return ids;
    },
    [graph.links],
  );

  const isLinkConnected = useCallback(
    (link: SLink, nodeId: string): boolean => {
      const srcId = typeof link.source === 'object' ? (link.source as SNode).id : String(link.source);
      const tgtId = typeof link.target === 'object' ? (link.target as SNode).id : String(link.target);
      return srcId === nodeId || tgtId === nodeId;
    },
    [],
  );

  /* ---------- category headers ---------- */
  const categoryPositions = useMemo(() => {
    const positions: Array<{ category: CascadeCategory; x: number; label: string; color: string }> = [];
    const catMinX: Record<string, number> = {};

    for (const node of graph.nodes) {
      const cat = (node as SNode).nodeData.category;
      const x0 = (node as SNode).x0 ?? 0;
      if (catMinX[cat] === undefined || x0 < catMinX[cat]) {
        catMinX[cat] = x0;
      }
    }

    for (const cat of CATEGORY_ORDER) {
      if (catMinX[cat] !== undefined) {
        positions.push({
          category: cat,
          x: catMinX[cat],
          label: CATEGORY_LABELS[cat],
          color: CATEGORY_COLORS[cat],
        });
      }
    }

    return positions;
  }, [graph.nodes]);

  /* ---------- event handlers ---------- */
  const handleNodeEnter = (node: SNode, e: React.MouseEvent) => {
    setHoveredNodeId(node.id);
    setTooltip({ type: 'node', node: node.nodeData, x: e.clientX, y: e.clientY });
  };

  const handleNodeLeave = () => {
    setHoveredNodeId(null);
    setTooltip(null);
  };

  const handleNodeClick = (node: SNode) => {
    setSelectedNode(selectedNode?.id === node.nodeData.id ? null : node.nodeData);
  };

  const handleLinkEnter = (link: SLink, idx: number, e: React.MouseEvent) => {
    setHoveredLinkIdx(idx);
    setTooltip({ type: 'link', link: link.linkData, x: e.clientX, y: e.clientY });
  };

  const handleLinkLeave = () => {
    setHoveredLinkIdx(null);
    setTooltip(null);
  };

  /* ---------- compute opacities ---------- */
  const connectedIds = hoveredNodeId ? getConnectedNodeIds(hoveredNodeId) : null;

  return (
    <div>
      {/* Category headers — HTML labels for crisp rendering */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-1 mb-2">
        {categoryPositions.map((cp) => (
          <div key={cp.category} className="flex items-center gap-1.5">
            <div
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ backgroundColor: cp.color }}
            />
            <span className="font-mono text-[10px] uppercase tracking-widest text-text-label">
              {cp.label}
            </span>
          </div>
        ))}
      </div>

      {/* Sankey SVG */}
      <svg
        width="100%"
        viewBox={`0 0 ${SVG_W} ${SVG_H}`}
        preserveAspectRatio="xMidYMid meet"
        className="overflow-visible"
      >
        {/* Links */}
        <g fill="none">
          {graph.links.map((link, i) => {
            const srcNode = link.source as SNode;
            const severityColor = SEVERITY_COLORS[srcNode.nodeData.severity];

            const tgtNode = link.target as SNode;

            let opacity = 0.3;
            if (activeStage) {
              const srcMatches = srcNode.nodeData.category === activeStage;
              const tgtMatches = tgtNode.nodeData.category === activeStage;
              opacity = srcMatches || tgtMatches ? 0.5 : 0.05;
            }
            if (hoveredLinkIdx !== null) {
              opacity = hoveredLinkIdx === i ? 0.6 : 0.1;
            } else if (hoveredNodeId) {
              opacity = isLinkConnected(link, hoveredNodeId) ? 0.6 : 0.08;
            }

            const d = linkPathGen(link as unknown as SLink);

            return (
              <path
                key={i}
                d={d || undefined}
                stroke={severityColor}
                strokeOpacity={opacity}
                strokeWidth={Math.max(1, link.width ?? 1)}
                style={{ transition: 'stroke-opacity 0.2s ease' }}
                onMouseEnter={(e) => handleLinkEnter(link, i, e)}
                onMouseLeave={handleLinkLeave}
                className="cursor-pointer"
              />
            );
          })}
        </g>

        {/* Nodes */}
        <g>
          {graph.nodes.map((node) => {
            const sNode = node as SNode;
            const x0 = sNode.x0 ?? 0;
            const y0 = sNode.y0 ?? 0;
            const x1 = sNode.x1 ?? 0;
            const y1 = sNode.y1 ?? 0;
            const color = SEVERITY_COLORS[sNode.nodeData.severity];

            let nodeOpacity = 1;
            if (activeStage && sNode.nodeData.category !== activeStage) {
              nodeOpacity = 0.15;
            } else if (hoveredNodeId && connectedIds && !connectedIds.has(sNode.id)) {
              nodeOpacity = 0.2;
            }

            return (
              <g
                key={sNode.id}
                style={{ transition: 'opacity 0.2s ease', opacity: nodeOpacity }}
                onMouseEnter={(e) => handleNodeEnter(sNode, e)}
                onMouseLeave={handleNodeLeave}
                onClick={() => handleNodeClick(sNode)}
                className="cursor-pointer"
              >
                <rect
                  x={x0}
                  y={y0}
                  width={x1 - x0}
                  height={Math.max(y1 - y0, 2)}
                  fill={color}
                  rx={3}
                  ry={3}
                />
                {/* Node label */}
                <text
                  x={x1 + 6}
                  y={(y0 + y1) / 2}
                  dy="0.35em"
                  fill="rgba(255,255,255,0.7)"
                  fontSize={10}
                  fontFamily="var(--font-mono), monospace"
                  textAnchor="start"
                >
                  {sNode.nodeData.icon} {sNode.nodeData.label}
                </text>
              </g>
            );
          })}
        </g>
      </svg>

      {/* Tooltips */}
      {tooltip?.type === 'node' && tooltip.node && (
        <NodeTooltip node={tooltip.node} x={tooltip.x} y={tooltip.y} />
      )}
      {tooltip?.type === 'link' && tooltip.link && (
        <LinkTooltip link={tooltip.link} x={tooltip.x} y={tooltip.y} />
      )}

      {/* Detail panel */}
      {selectedNode && (
        <SankeyNodeDetail node={selectedNode} onClose={() => setSelectedNode(null)} />
      )}
    </div>
  );
}
