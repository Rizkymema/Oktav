type HermesEventHandler<T = unknown> = (payload: T) => void;

export class EventBus {
  private readonly handlers = new Map<string, Set<HermesEventHandler>>();

  subscribe<T>(eventName: string, handler: HermesEventHandler<T>) {
    const existing = this.handlers.get(eventName) ?? new Set<HermesEventHandler>();
    existing.add(handler as HermesEventHandler);
    this.handlers.set(eventName, existing);

    return () => {
      existing.delete(handler as HermesEventHandler);
      if (existing.size === 0) {
        this.handlers.delete(eventName);
      }
    };
  }

  emit<T>(eventName: string, payload: T) {
    const scopedHandlers = this.handlers.get(eventName);
    if (!scopedHandlers) {
      return;
    }
    for (const handler of scopedHandlers) {
      handler(payload);
    }
  }
}
