<template>
  <div class="tree-root" ref="container">
    <svg ref="svg" :width="cw" :height="ch"></svg>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from 'vue-property-decorator';
import * as d3 from 'd3';
import { flextree } from 'd3-flextree';
import { jsonToTree, TreeNodeData } from '@/utils/jsonToTree';

@Component({ name: 'TreeComponent' })
export default class TreeComponent extends Vue {
  @Prop({ required: true, type: Object }) readonly data!: any;

  private durationMs = 300;
  private f: any = flextree<any>({ children: (d: any) => d.children });
  private root: any = null;

  // container-driven sizing
  private cw: number = 800;
  private ch: number = 600;
  private ro: ResizeObserver | null = null;

  // zoom persistence
  private zoomBehavior: any = null;
  private currentTransform: any = null;

  // persistent selections
  private gRoot: any = null;
  private linksSel: any = null;
  private nodesSel: any = null;

  private colorForType(t: string): string {
    switch (t) {
      case 'string': return '#6f42c1';
      case 'number': return '#2e7d32';
      case 'boolean': return '#0d47a1';
      case 'null': return '#6b7280';
      case 'meta': return '#e67e22';
      default: return '#007fd4';
    }
  }

  private nodeFill(d: any): string {
    if (d.data.type === 'array') return '#f0f7ff';
    if (d.data.type === 'object') return '#f7f7ff';
    if (d.data.type === 'grouped-primitives') return '#ffffff';
    return '#ffffff';
  }

  private nodeStroke(d: any): string {
    if (d.data.type === 'array') return '#90caf9';
    if (d.data.type === 'object') return '#c5cae9';
    return '#e5e7eb';
  }

  mounted() {
    window.addEventListener('resize', this.onResize, { passive: true } as AddEventListenerOptions);
    this.measure();
    if ('ResizeObserver' in window) {
      this.ro = new ResizeObserver(() => {
        this.measure();
        this.layoutAndRender();
      });
      this.ro.observe(this.$refs.container as Element);
    }
    this.rebuildAndRender();
  }

  beforeDestroy() {
    window.removeEventListener('resize', this.onResize);
    if (this.ro) {
      this.ro.disconnect();
      this.ro = null;
    }
  }

  @Watch('data', { deep: true })
  onDataChanged() {
    this.rebuildAndRender();
  }

  private onResize = () => {
    this.measure();
    this.layoutAndRender();
  };

  private measure() {
    const el = this.$refs.container as HTMLElement | undefined;
    if (el) {
      this.cw = el.clientWidth || this.cw;
      this.ch = el.clientHeight || this.ch;
    } else {
      this.cw = window.innerWidth;
      this.ch = window.innerHeight;
    }
  }

  private computeSizes(root: any) {
    const getTextLines = (d: any) => {
      if (d.type === 'grouped-primitives') {
        return d.primitives.map((p: any) => `${p.key}: ${JSON.stringify(p.value)}::${p.type}`);
      } else if (d.type === 'array') {
        const count = Array.isArray(d.children) ? d.children.length : 0;
        return [`${d.key} [${count}]::meta`];
      } else if (d.type === 'object') {
        const count = Array.isArray(d.children) ? d.children.length : 0;
        return [`${d.key} {${count}}::meta`];
      } else {
        const typeHint = (d as any).value === null ? 'null' : typeof (d as any).value;
        return [`${d.key}: ${JSON.stringify((d as any).value)}::${typeHint}`];
      }
    };

    const estimateTextWidth = (text: string, fontSize = 15) => text.replace(/::.+$/, '').length * fontSize * 0.62 + 28;

    root.each((n: any) => {
      const lines = getTextLines(n.data);
      n.data._nodeLines = lines;
      const lineHeight = 18;
      const verticalPad = 10;
      n.data._nodeHeight = Math.max(32, lines.length * lineHeight + verticalPad * 2);
      n.data._nodeWidth = Math.max(150, Math.max(...lines.map((l: string) => estimateTextWidth(l))));
      n.data._lineHeight = lineHeight;
      n.data._verticalPad = verticalPad;
    });
  }

  private rebuildAndRender() {
    const treeData: TreeNodeData = jsonToTree('root', this.data, true);
    this.root = this.f.hierarchy(treeData as any);
    this.computeSizes(this.root);
    this.layoutAndRender();
  }

  private layoutAndRender() {
    if (!this.root) return;

    const verticalGap = 20;
    const horizontalGap = 80;
    this.f.nodeSize((node: any) => [node.data._nodeHeight + verticalGap, node.data._nodeWidth + horizontalGap]);
    this.f(this.root);

    this.renderGraph();
  }

  private renderGraph() {
    const root = this.root;
    const nodes = root.descendants();
    const links = root.links();

    const svg = d3.select(this.$refs.svg as any);
    svg.selectAll('*').remove();

    const g = svg.append('g');
    this.gRoot = g;
    const zoom = d3.zoom().scaleExtent([0.1, 3]).on('zoom', (event: any) => {
      g.attr('transform', event.transform);
      this.currentTransform = event.transform;
    });
    svg.call(zoom as any);
    this.zoomBehavior = zoom;

    const t = d3.transition().duration(this.durationMs);

    const linksBase = g.append('g')
      .attr('stroke', '#475872')
      .attr('stroke-width', 1.33333)
      .selectAll('path.link')
      .data(links)
      .enter()
      .append('path')
      .attr('class', 'link')
      .attr('fill', 'none')
      .attr('d', (d: any) => {
        const sy = d.source.x;
        const ty = d.target.x;
        const startX = d.source.y + d.source.data._nodeWidth;
        const endX = d.target.y;
        const midX = (startX + endX) / 2;
        return `M${startX},${sy} C${midX},${sy} ${midX},${ty} ${endX},${ty}`;
      })
      .attr('opacity', 0);
    linksBase.transition(t).attr('opacity', 1);
    this.linksSel = linksBase;

    this.nodesSel = g.append('g')
      .selectAll('g.node')
      .data(nodes)
      .enter()
      .append('g')
      .attr('class', 'node')
      .attr('transform', (d: any) => `translate(${d.y},${d.x})`)
      .style('cursor', (d: any) => (d.children && d.children.length > 0) ? 'pointer' : 'default')
      .on('click', (event: any, d: any) => {
        if (!(d.children && d.children.length > 0)) return;
        d.data._collapsed = !d.data._collapsed;
        this.updateVisibility();
      })
      .on('mouseover', (event: any) => { d3.select(event.currentTarget).select('rect').attr('stroke', '#007fd4'); })
      .on('mouseout', (event: any) => { d3.select(event.currentTarget).select('rect').attr('stroke', '#e5e7eb'); });

    this.nodesSel.append('rect')
      .attr('width', (d: any) => d.data._nodeWidth)
      .attr('height', (d: any) => d.data._nodeHeight)
      .attr('x', 0)
      .attr('y', (d: any) => -d.data._nodeHeight / 2)
      .attr('rx', 8)
      .attr('fill', (d: any) => this.nodeFill(d))
      .attr('stroke', (d: any) => this.nodeStroke(d))
      .attr('stroke-width', 1.33333)
      .attr('style', 'box-sizing: border-box; transition: stroke 0.1s ease-in-out;')
      .attr('opacity', 0)
      .transition(t)
      .attr('opacity', 1);

    this.nodesSel.append('text')
      .attr('text-anchor', 'start')
      .attr('x', 10)
      .attr('y', (d: any) => -d.data._nodeHeight / 2 + d.data._verticalPad + d.data._lineHeight - 3)
      .attr('font-size', 15)
      .attr('font-family', 'monospace')
      .attr('font-weight', 'normal')
      .html(null as any)
      .each((d: any, i: number, nodesEls: any[]) => {
        const el = d3.select(nodesEls[i] as SVGTextElement);
        el.selectAll('*').remove();
        d.data._nodeLines.forEach((line: string, idx: number) => {
          const [text, typeHint] = line.split('::');
          const keyVal = text.split(/:(.+)/);
          if (keyVal.length === 3) {
            el.append('tspan')
              .attr('x', 10)
              .attr('dy', idx === 0 ? 0 : d.data._lineHeight)
              .attr('fill', '#007fd4')
              .attr('font-weight', 'normal')
              .text(keyVal[0] + ':');
            el.append('tspan')
              .attr('fill', this.colorForType(typeHint || 'string'))
              .attr('font-weight', 'normal')
              .text(keyVal[1]);
          } else {
            el.append('tspan')
              .attr('x', 10)
              .attr('dy', idx === 0 ? 0 : d.data._lineHeight)
              .attr('fill', this.colorForType(typeHint || 'string'))
              .attr('font-weight', 'normal')
              .text(text);
          }
        });
      });

    // Apply initial transform and visibility
    this.$nextTick(() => {
      if (this.currentTransform) {
        svg.call((this.zoomBehavior as any).transform, this.currentTransform);
      } else {
        type Box = { x: number; y: number; width: number; height: number };
        const nodeBoxes: Box[] = nodes.map((d: any): Box => ({
          x: d.y,
          y: d.x - d.data._nodeHeight / 2,
          width: d.data._nodeWidth,
          height: d.data._nodeHeight
        }));
        const minX = Math.min(...nodeBoxes.map((b: Box) => b.x));
        const maxX = Math.max(...nodeBoxes.map((b: Box) => b.x + b.width));
        const minY = Math.min(...nodeBoxes.map((b: Box) => b.y));
        const maxY = Math.max(...nodeBoxes.map((b: Box) => b.y + b.height));
        const treeWidth = Math.max(1, maxX - minX);
        const treeHeight = Math.max(1, maxY - minY);
        const scale = Math.min(0.7 * this.cw / treeWidth, 0.7 * this.ch / treeHeight, 1);
        const tx = (this.cw - treeWidth * scale) / 2 - minX * scale;
        const ty = (this.ch - treeHeight * scale) / 2 - minY * scale;
        const transform = (d3 as any).zoomIdentity.translate(tx, ty).scale(scale);
        this.currentTransform = transform;
        svg.transition().duration(300).call((this.zoomBehavior as any).transform, transform);
      }
      this.updateVisibility();
    });
  }

  private isHidden(d: any): boolean {
    let cur = d.parent; // hide descendants when any ancestor is collapsed
    while (cur) {
      if (cur.data && cur.data._collapsed) return true;
      cur = cur.parent;
    }
    return false;
  }

  private updateVisibility() {
    if (!this.nodesSel || !this.linksSel) return;
    // nodes
    this.nodesSel.attr('display', (d: any) => (this.isHidden(d) ? 'none' : null));
    // links -> hide if target is hidden or source is hidden
    this.linksSel.attr('display', (l: any) => (this.isHidden(l.target) || this.isHidden(l.source) ? 'none' : null));
  }
}
</script>

<style scoped>
.tree-root {
  width: 100%;
  height: 100%;
  display: block;
  margin: 0;
  padding: 0;
  background: #f5f5f5;
}
svg { display: block; }
</style> 