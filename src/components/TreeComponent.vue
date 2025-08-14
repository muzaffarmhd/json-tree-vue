<template>
  <div class="json-tree-container">
    <div ref="chartContainer" class="chart-container" :style="{ width: width, height: height }"></div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from 'vue-property-decorator'
import * as echarts from 'echarts'

@Component({
  name: 'JsonTreeVisualizer'
})
export default class TreeComponent extends Vue {
  @Prop({ required: true }) readonly data!: object | any[]
  @Prop({ default: '100%' }) readonly width!: string
  @Prop({ default: '900px' }) readonly height!: string

  private chart: echarts.ECharts | null = null

  mounted() {
    this.initChart()
    this.renderTree()
  }

  beforeDestroy() {
    if (this.chart) {
      this.chart.dispose()
    }
  }

  @Watch('data', { deep: true })
  onDataChange() {
    this.renderTree()
  }

  private initChart() {
    this.chart = echarts.init(this.$refs.chartContainer as HTMLElement)
    window.addEventListener('resize', () => {
      if (this.chart) this.chart.resize()
    })
  }

  // ---------- Helpers ----------
  private valueType(v: any): string {
    if (v === null) return 'null'
    if (Array.isArray(v)) return 'array'
    if (typeof v === 'object') return 'object'
    return typeof v // string | number | boolean | undefined
  }

  private keyBadge(text: string): string {
    return `{key|${text}}`
  }

  private typeBadge(text: string): string {
    return `{meta|${text}}`
  }

  private valBadge(v: any): string {
    const t = this.valueType(v)
    if (t === 'string') return `{string|"${v}"}`
    if (t === 'number') return `{number|${String(v)}}`
    if (t === 'boolean') return `{boolean|${String(v)}}`
    if (t === 'null') return `{null|null}`
    if (t === 'undefined') return `{null|undefined}`
    if (t === 'array') return `{meta|Array[${v.length}]}`
    if (t === 'object') return `{meta|Object{${Object.keys(v).length}}}`
    return `{meta|${String(v)}}`
  }

  // Convert JSON -> ECharts Tree nodes enriched with key/type/value
  private convertJsonToTreeData(value: any, key: string = 'root', path: string = ''): any {
    const id = path || key
    const t = this.valueType(value)

    const node: any = {
      id,
      key,
      vtype: t,
      raw: value,
      name: '',
      // card background color per type
      itemStyle: { color: this.colorForType(t), borderColor: '#cbd5e1', borderWidth: 1, borderRadius: 8 },
      label: { color: '#1f2937', fontSize: 12 }
    }

    // title text like payload {4}, readings [3], foo: "bar"
    if (t === 'object') {
      const c = Object.keys(value).length
      node.name = `${this.keyBadge(key)} ${this.typeBadge('{' + c + '}')}`
    } else if (t === 'array') {
      node.name = `${this.keyBadge(key)} ${this.typeBadge('[' + value.length + ']')}`
    } else {
      node.name = `${this.keyBadge(key)}: ${this.valBadge(value)}`
    }

    // children with grouped primitives
    if (t === 'object') {
      const entries = Object.entries(value)
      const primitiveObject: any = {}
      const nonPrimitiveChildren: any[] = []
      entries.forEach(([k, v]) => {
        const vt = this.valueType(v)
        if (vt === 'object' || vt === 'array') {
          nonPrimitiveChildren.push(this.convertJsonToTreeData(v, k, `${path}.${k}`))
        } else {
          primitiveObject[k] = v
        }
      })
      const children: any[] = []
      const primitiveKeys = Object.keys(primitiveObject)
      if (primitiveKeys.length > 0) {
        children.push({
          id: path || key, // Use parent's path instead of adding __primitives
          key: '(primitives)',
          vtype: 'group',
          raw: primitiveObject,
          name: primitiveKeys.map(k => `${this.keyBadge(k)}: ${this.valBadge(primitiveObject[k])}`).join('\n'),
          itemStyle: { color: this.colorForType('group'), borderColor: '#cbd5e1', borderWidth: 1, borderRadius: 8 },
          label: { color: '#1f2937', fontSize: 12 }
        })
      }
      children.push(...nonPrimitiveChildren)
      if (children.length > 0) node.children = children
    } else if (t === 'array') {
      const primitiveArray: any[] = []
      const complexChildren: any[] = []
      value.forEach((v: any, i: number) => {
        const vt = this.valueType(v)
        if (vt === 'object' || vt === 'array') {
          complexChildren.push(this.convertJsonToTreeData(v, String(i), `${path}.${i}`))
        } else {
          primitiveArray.push({ index: i, value: v })
        }
      })
      const children: any[] = []
      if (primitiveArray.length > 0) {
        children.push({
          id: path || key, // Use parent's path instead of adding __primitives
          key: '(primitives)',
          vtype: 'group',
          raw: primitiveArray.map(p => p.value),
          name: primitiveArray.map(p => `${this.keyBadge(String(p.index))}: ${this.valBadge(p.value)}`).join('\n'),
          itemStyle: { color: this.colorForType('group'), borderColor: '#cbd5e1', borderWidth: 1, borderRadius: 8 },
          label: { color: '#1f2937', fontSize: 12 }
        })
      }
      children.push(...complexChildren)
      if (children.length > 0) node.children = children
    }

    return node
  }

  private colorForType(t: string): string {
    switch (t) {
      case 'object': return '#eef2ff'
      case 'array': return '#e0f2fe'
      case 'string': return '#ecfccb'
      case 'number': return '#fef3c7'
      case 'boolean': return '#dcfce7'
      case 'null': return '#f1f5f9'
      case 'group': return '#e7f3ff'
      default: return '#ffffff'
    }
  }

  private renderTree() {
    if (!this.chart || this.data == null) return

    const treeData = this.convertJsonToTreeData(this.data, 'root')

    const rich = {
      key: { color: '#2563eb', fontWeight: 'bold' },
      string: { color: '#7c3aed' },
      number: { color: '#065f46' },
      boolean: { color: '#0d9488' },
      null: { color: '#6b7280' },
      meta: { color: '#1f2937' }
    }

    const option = {
      tooltip: {
        trigger: 'item',
        triggerOn: 'mousemove',
        confine: true,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderColor: '#cbd5e1',
        borderWidth: 1,
        textStyle: { color: '#1f2937', fontSize: 12 },
        formatter: (params: any) => {
          const data = params.data
          
          const lines: string[] = []
          lines.push(`<div style="font-weight: bold; color: #2563eb; margin-bottom: 4px;">${data.id}</div>`)
          lines.push(`<div style="color: #6b7280; font-size: 11px;">Type: ${data.vtype}</div>`)
          const childCount = data.children ? data.children.length : 0
          lines.push(`<div style="color: #059669; margin-top: 2px;">Children: ${childCount}</div>`)
          
          return `<div style="max-width: 320px; line-height: 1.4;">${lines.join('')}</div>`
        }
      },
      animationDuration: 300,
      // Add zoom and pan controls
      dataZoom: [
        {
          type: 'inside',
          orient: 'horizontal',
          start: 0,
          end: 100,
          zoomLock: false
        },
        {
          type: 'inside',
          orient: 'vertical',
          start: 0,
          end: 100,
          zoomLock: false
        }
      ],
      // Add toolbox for zoom controls
      toolbox: {
        feature: {
          dataZoom: {
            yAxisIndex: 'none'
          },
          restore: {},
          saveAsImage: {}
        }
      },
      series: [
        {
          type: 'tree',
          data: [treeData],
          top: '8%',
          left: '8%',
          bottom: '8%',
          right: '8%',
          orient: 'LR',
          expandAndCollapse: true,
          initialTreeDepth: -1,
          symbolSize: 10,
          lineStyle: { width: 1.5, color: '#94a3b8' },
          edgeShape: 'curve',
          edgeForkPosition: '60%',
          // Set initial zoom to fit content
          roam: true,
          scaleLimit: {
            min: 0.1,
            max: 3
          },
          label: {
            position: 'left',
            align: 'right',
            verticalAlign: 'middle',
            fontFamily: 'monospace',
            backgroundColor: '#ffffff',
            borderColor: '#cbd5e1',
            borderWidth: 1,
            borderRadius: 8,
            padding: [6, 8],
            rich,
            formatter: (params: any) => params.data.name
          },
          leaves: {
            label: {
              position: 'right',
              align: 'left',
              verticalAlign: 'middle',
              backgroundColor: '#ffffff',
              borderColor: '#cbd5e1',
              borderWidth: 1,
              borderRadius: 8,
              padding: [6, 8],
              rich,
              formatter: (params: any) => params.data.name
            }
          },
          emphasis: {
            focus: 'descendant'
          }
        }
      ]
    }

    this.chart.setOption(option, true)
    
    // Auto-fit the tree to ensure all labels are visible
    setTimeout(() => {
      if (this.chart) {
        this.chart.dispatchAction({
          type: 'dataZoom',
          start: 0,
          end: 100
        })
      }
    }, 100)
  }
}
</script>

<style scoped>
.json-tree-container {
  width: 100%;
  height: 100%;
  position: relative;
}

.chart-container { 
  width: 100%; 
  height: 100%; 
}
</style> 