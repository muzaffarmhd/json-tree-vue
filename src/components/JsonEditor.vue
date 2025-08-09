<template>
  <div class="editor-root">
    <div ref="container" class="editor-container"></div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from 'vue-property-decorator';
import loader from '@monaco-editor/loader';

@Component({ name: 'JsonEditor' })
export default class JsonEditor extends Vue {
  @Prop({ type: String, required: true }) readonly value!: string;
  @Prop({ type: String, default: 'vs' }) readonly theme!: string;

  private editor: any = null;

  async mounted() {
    const monaco = await loader.init();
    this.editor = monaco.editor.create(this.$refs.container as HTMLElement, {
      value: this.value,
      language: 'json',
      automaticLayout: true,
      minimap: { enabled: false },
      fontSize: 13,
      lineNumbers: 'on',
      scrollBeyondLastLine: false,
      roundedSelection: false,
      theme: this.theme,
    });

    this.editor.onDidChangeModelContent(() => {
      const next = this.editor.getValue();
      this.$emit('input', next);
      this.$emit('change', next);
    });
  }

  beforeDestroy() {
    if (this.editor) {
      this.editor.dispose();
      this.editor = null;
    }
  }

  @Watch('value')
  onValueChanged(next: string) {
    if (!this.editor) return;
    const current = this.editor.getValue();
    if (current !== next) {
      this.editor.setValue(next);
    }
  }
}
</script>

<style scoped>
.editor-root {
  width: 100%;
  height: 100%;
  display: flex;
}
.editor-container {
  width: 100%;
  height: 100%;
  border-right: 1px solid #e5e7eb;
}
</style> 