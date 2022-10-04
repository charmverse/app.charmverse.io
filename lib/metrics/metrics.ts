import StatsD from 'hot-shots';

import log from 'lib/log';

const dogstatsd = new StatsD({
  prefix: 'charm.',
  errorHandler (error) {
    log.warn('Cannot submit metrics to StatsD: ', error);
  }
});

// Gauges are used to periodically take measurements or snapshots of a metric at a single point in time
export function gauge (metricName: string, value: number) {
  dogstatsd.gauge(metricName, value);
}

export function count (metricName: string, value: number) {
  dogstatsd.increment(metricName, value);
}
