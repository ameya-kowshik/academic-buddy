/**
 * Application metrics tracking system
 * Tracks request counts, response times, and error rates by endpoint
 */

interface EndpointMetrics {
  requestCount: number;
  totalResponseTime: number;
  errorCount: number;
  lastRequestTime: number;
}

interface MetricsData {
  [endpoint: string]: EndpointMetrics;
}

/**
 * In-memory metrics storage
 * In production, this should be replaced with a persistent store like Redis
 */
class MetricsCollector {
  private metrics: MetricsData = {};
  private startTime: number = Date.now();

  /**
   * Record a request for an endpoint
   */
  recordRequest(endpoint: string, responseTime: number, isError: boolean = false): void {
    if (!this.metrics[endpoint]) {
      this.metrics[endpoint] = {
        requestCount: 0,
        totalResponseTime: 0,
        errorCount: 0,
        lastRequestTime: Date.now(),
      };
    }

    const metric = this.metrics[endpoint];
    metric.requestCount++;
    metric.totalResponseTime += responseTime;
    metric.lastRequestTime = Date.now();

    if (isError) {
      metric.errorCount++;
    }
  }

  /**
   * Get metrics for a specific endpoint
   */
  getEndpointMetrics(endpoint: string): EndpointMetrics | null {
    return this.metrics[endpoint] || null;
  }

  /**
   * Get all metrics
   */
  getAllMetrics(): MetricsData {
    return { ...this.metrics };
  }

  /**
   * Get aggregated metrics summary
   */
  getSummary() {
    const endpoints = Object.keys(this.metrics);
    const totalRequests = endpoints.reduce(
      (sum, endpoint) => sum + this.metrics[endpoint].requestCount,
      0
    );
    const totalErrors = endpoints.reduce(
      (sum, endpoint) => sum + this.metrics[endpoint].errorCount,
      0
    );
    const totalResponseTime = endpoints.reduce(
      (sum, endpoint) => sum + this.metrics[endpoint].totalResponseTime,
      0
    );

    const avgResponseTime = totalRequests > 0 ? totalResponseTime / totalRequests : 0;
    const errorRate = totalRequests > 0 ? (totalErrors / totalRequests) * 100 : 0;
    const uptime = Date.now() - this.startTime;

    return {
      totalRequests,
      totalErrors,
      errorRate: parseFloat(errorRate.toFixed(2)),
      avgResponseTime: parseFloat(avgResponseTime.toFixed(2)),
      uptime,
      uptimeFormatted: this.formatUptime(uptime),
      endpointCount: endpoints.length,
    };
  }

  /**
   * Get detailed metrics by endpoint
   */
  getDetailedMetrics() {
    const endpoints = Object.keys(this.metrics);
    
    return endpoints.map((endpoint) => {
      const metric = this.metrics[endpoint];
      const avgResponseTime = metric.requestCount > 0 
        ? metric.totalResponseTime / metric.requestCount 
        : 0;
      const errorRate = metric.requestCount > 0 
        ? (metric.errorCount / metric.requestCount) * 100 
        : 0;

      return {
        endpoint,
        requestCount: metric.requestCount,
        errorCount: metric.errorCount,
        errorRate: parseFloat(errorRate.toFixed(2)),
        avgResponseTime: parseFloat(avgResponseTime.toFixed(2)),
        lastRequestTime: new Date(metric.lastRequestTime).toISOString(),
      };
    }).sort((a, b) => b.requestCount - a.requestCount); // Sort by request count descending
  }

  /**
   * Reset all metrics
   */
  reset(): void {
    this.metrics = {};
    this.startTime = Date.now();
  }

  /**
   * Format uptime in human-readable format
   */
  private formatUptime(ms: number): string {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) {
      return `${days}d ${hours % 24}h ${minutes % 60}m`;
    } else if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  }
}

// Singleton instance
const globalForMetrics = global as unknown as { metricsCollector: MetricsCollector };

export const metricsCollector =
  globalForMetrics.metricsCollector || new MetricsCollector();

if (process.env.NODE_ENV !== 'production') {
  globalForMetrics.metricsCollector = metricsCollector;
}
