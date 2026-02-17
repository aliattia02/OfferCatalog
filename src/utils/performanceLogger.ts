// src/utils/performanceLogger.ts - ENHANCED VERSION
// Performance logger with navigation transition tracking
// ✅ All methods are no-ops in production builds (__DEV__ === false)

interface TransitionMetrics {
  from: string;
  to: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  phases: {
    unmount?: number;
    mount?: number;
    firstRender?: number;
    dataLoad?: number;
    imageLoad?: number;
  };
}

class PerformanceLogger {
  private timers: Map<string, number> = new Map();
  private renderCounts: Map<string, number> = new Map();
  private transitions: TransitionMetrics[] = [];
  private currentTransition: TransitionMetrics | null = null;
  private sessionStats = {
    totalRenders: 0,
    slowOperations: 0,
    criticalOperations: 0,
    avgOperationTime: 0,
    operations: [] as number[],
  };

  /** Start timing an operation */
  start(name: string) {
    if (!__DEV__) return;
    this.timers.set(name, Date.now());
  }

  /** End timing and log result */
  end(name: string): number | undefined {
    if (!__DEV__) return undefined;

    const startTime = this.timers.get(name);
    if (!startTime) {
      console.warn(`⚠️ No timer found for: ${name}`);
      return undefined;
    }

    const duration = Date.now() - startTime;
    this.timers.delete(name);

    this.sessionStats.operations.push(duration);

    if (duration < 300) {
      console.log(`✅ FAST [${name}]: ${duration}ms`);
    } else if (duration < 1000) {
      console.log(`🟡 OK [${name}]: ${duration}ms`);
    } else if (duration < 3000) {
      console.warn(`⚠️ SLOW [${name}]: ${duration}ms`);
      this.sessionStats.slowOperations++;
    } else {
      console.error(`🔴 CRITICAL [${name}]: ${duration}ms`);
      this.sessionStats.criticalOperations++;
    }

    return duration;
  }

  /** Track component render count */
  trackRender(componentName: string, maxRenders: number = 3): number {
    if (!__DEV__) return 0;

    const count = (this.renderCounts.get(componentName) || 0) + 1;
    this.renderCounts.set(componentName, count);
    this.sessionStats.totalRenders++;

    if (count > maxRenders) {
      console.warn(`🔄 EXCESSIVE RENDERS [${componentName}]: ${count} times`);
    }

    return count;
  }

  /** Reset render count for a component */
  resetRenderCount(componentName: string) {
    if (!__DEV__) return;
    this.renderCounts.delete(componentName);
  }

  /** Start tracking a navigation transition */
  startTransition(from: string, to: string) {
    if (!__DEV__) return;

    console.log(`🚀 TRANSITION START: ${from} → ${to}`);
    this.currentTransition = {
      from,
      to,
      startTime: Date.now(),
      phases: {},
    };
  }

  /** Mark a phase in the current transition */
  markTransitionPhase(phase: keyof TransitionMetrics['phases']) {
    if (!__DEV__) return;
    if (!this.currentTransition) {
      console.warn(`⚠️ No active transition for phase: ${phase}`);
      return;
    }

    const elapsed = Date.now() - this.currentTransition.startTime;
    this.currentTransition.phases[phase] = elapsed;
    console.log(`  📍 ${phase}: ${elapsed}ms`);
  }

  /** End the current transition */
  endTransition() {
    if (!__DEV__) return;
    if (!this.currentTransition) {
      console.warn('⚠️ No active transition to end');
      return;
    }

    const duration = Date.now() - this.currentTransition.startTime;
    this.currentTransition.endTime = Date.now();
    this.currentTransition.duration = duration;

    console.log(`✅ TRANSITION COMPLETE: ${this.currentTransition.from} → ${this.currentTransition.to}`);
    console.log(`   Total: ${duration}ms`);
    console.log(`   Phases:`, this.currentTransition.phases);

    if (duration > 2000) {
      console.warn(`⚠️ SLOW TRANSITION: ${duration}ms`);
    } else if (duration > 800) {
      console.log(`🟡 ACCEPTABLE TRANSITION: ${duration}ms`);
    }

    this.transitions.push({ ...this.currentTransition });
    this.currentTransition = null;
  }

  /** Get transition history */
  getTransitions(): TransitionMetrics[] {
    if (!__DEV__) return [];
    return [...this.transitions];
  }

  /** Get the last transition */
  getLastTransition(): TransitionMetrics | undefined {
    if (!__DEV__) return undefined;
    return this.transitions[this.transitions.length - 1];
  }

  /** Log state for debugging */
  logState(label: string, data: any) {
    if (!__DEV__) return;
    console.log(`📊 [${label}]:`, JSON.stringify(data, null, 2));
  }

  /** Measure synchronous operation */
  measure<T>(name: string, fn: () => T): T {
    if (!__DEV__) return fn();
    this.start(name);
    const result = fn();
    this.end(name);
    return result;
  }

  /** Measure async operation */
  async measureAsync<T>(name: string, fn: () => Promise<T>): Promise<T> {
    if (!__DEV__) return fn();
    this.start(name);
    try {
      const result = await fn();
      this.end(name);
      return result;
    } catch (error) {
      this.end(name);
      throw error;
    }
  }

  /** Get session statistics */
  getSessionStats() {
    if (!__DEV__) return {
      totalRenders: 0,
      slowOperations: 0,
      criticalOperations: 0,
      avgOperationTime: 0,
      operations: [],
      totalOperations: 0,
    };

    const ops = this.sessionStats.operations;
    const avg = ops.length > 0
      ? ops.reduce((a, b) => a + b, 0) / ops.length
      : 0;

    return {
      ...this.sessionStats,
      avgOperationTime: Math.round(avg),
      totalOperations: ops.length,
    };
  }

  /** Reset all statistics */
  resetStats() {
    if (!__DEV__) return;

    this.renderCounts.clear();
    this.transitions = [];
    this.sessionStats = {
      totalRenders: 0,
      slowOperations: 0,
      criticalOperations: 0,
      avgOperationTime: 0,
      operations: [],
    };
    console.log('🔄 Performance stats reset');
  }

  /** Log comprehensive performance report */
  logReport() {
    if (!__DEV__) return;

    console.log('\n📊 ===== PERFORMANCE REPORT =====');
    const stats = this.getSessionStats();
    console.log('Session Stats:');
    console.log(`  Total Operations: ${stats.totalOperations}`);
    console.log(`  Average Time: ${stats.avgOperationTime}ms`);
    console.log(`  Slow Operations: ${stats.slowOperations}`);
    console.log(`  Critical Operations: ${stats.criticalOperations}`);
    console.log(`  Total Renders: ${stats.totalRenders}`);

    if (this.transitions.length > 0) {
      console.log('\nTransition History:');
      this.transitions.forEach((t, i) => {
        console.log(`  ${i + 1}. ${t.from} → ${t.to}: ${t.duration}ms`);
      });
    }

    console.log('================================\n');
  }
}

// Export singleton instance
export const perfLogger = new PerformanceLogger();

// Export hook for components
export const usePerformanceLogger = (componentName: string) => {
  return {
    start: (operation: string) => perfLogger.start(`${componentName}.${operation}`),
    end: (operation: string) => perfLogger.end(`${componentName}.${operation}`),
    trackRender: () => perfLogger.trackRender(componentName),
    markPhase: (phase: string) => perfLogger.markTransitionPhase(phase as any),
  };
};

// Export navigation helper
export const trackNavigation = {
  start: (from: string, to: string) => perfLogger.startTransition(from, to),
  markPhase: (phase: keyof TransitionMetrics['phases']) => perfLogger.markTransitionPhase(phase),
  end: () => perfLogger.endTransition(),
};