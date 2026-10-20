// React hook over the WebSocket singleton: subscribe on mount, filter frames by
// `type`, and call onItem(item) for each match. The onItem callback is held in a
// ref so a new inline function on every render doesn't churn the subscription.

import { useEffect, useRef } from "react";
import { subscribe } from "./socket";

export function useRealtime(type, onItem) {
  const onItemRef = useRef(onItem);
  onItemRef.current = onItem;

  useEffect(() => {
    const unsubscribe = subscribe((message) => {
      if (message && message.type === type) {
        onItemRef.current(message.item);
      }
    });
    return unsubscribe;
  }, [type]);
}
