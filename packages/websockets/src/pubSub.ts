type CallbackType<T> = (value: T) => void;

export class PubSub<T, V> {
  subscribers = new Map<T, CallbackType<V>[]>();

  constructor() {
    this.subscribe = this.subscribe.bind(this);
    this.unsubscribe = this.unsubscribe.bind(this);
    this.publish = this.publish.bind(this);
  }

  subscribe<E extends T = T, S extends V = V>(type: E, callback: CallbackType<S>) {
    if (!this.subscribers.has(type)) {
      this.subscribers.set(type, []);
    }

    this.subscribers.get(type)?.push(callback as any);

    return () => this.unsubscribe(type, callback as any);
  }

  unsubscribe(type: T, callback: CallbackType<V>) {
    if (!this.subscribers.has(type)) {
      return;
    }

    const callbacks = (this.subscribers.get(type) ?? []).filter((cb) => cb && cb !== callback);
    this.subscribers.set(type, callbacks);
  }

  publish(type: T, value: V) {
    this.subscribers.get(type)?.forEach((cb) => cb(value));
  }
}
