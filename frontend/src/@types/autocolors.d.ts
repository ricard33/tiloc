import {ChartType, Plugin} from 'chart.js';

declare module 'chart.js' {
  interface PluginOptionsByType<TType extends ChartType> {
    autocolors?: {
      mode: 'dataset'|'data',
      enabled: boolean,
      offset?: number
    }
  }
}
