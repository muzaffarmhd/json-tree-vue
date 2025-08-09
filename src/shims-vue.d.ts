declare module '*.vue' {
  import Vue from 'vue';
  export default Vue;
}

declare module 'd3-flextree' {
  export function flextree<T = any>(options?: { children?: (d: any) => any[] | undefined }): any;
}

declare module 'd3';
