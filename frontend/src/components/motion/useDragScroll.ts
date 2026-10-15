"use client";

import { useEffect, useRef, useState, type RefObject } from "react";

/**
 * Manual sideways scrolling for a native overflow-x container: click-and-drag with a mouse,
 * and Shift + mouse wheel. Touch and trackpad swipes already scroll natively.
 */
export function useDragScroll(ref: RefObject<HTMLElement | null>, onUserScroll?: () => void) {
  const drag = useRef<{ x: number; left: number; moved: boolean } | null>(null);
  const [dragging, setDragging] = useState(false);
  // Survives until the next press, so the click that ends a drag can be swallowed
  const dragged = useRef(false);
  const notify = useRef(onUserScroll);
  useEffect(() => {
    notify.current = onUserScroll;
  });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // Handled on the element, before the smooth-scroll library on the window turns it into a page scroll
    const onWheel = (e: WheelEvent) => {
      if (!e.shiftKey || Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
      e.preventDefault();
      e.stopPropagation();
      el.scrollBy({ left: e.deltaY });
      notify.current?.();
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [ref]);

  const end = () => {
    drag.current = null;
    setDragging(false);
  };

  const handlers = {
    onPointerDown: (e: React.PointerEvent) => {
      if (e.pointerType !== "mouse" || e.button !== 0 || !ref.current) return;
      drag.current = { x: e.clientX, left: ref.current.scrollLeft, moved: false };
      dragged.current = false;
    },
    onPointerMove: (e: React.PointerEvent) => {
      const d = drag.current;
      const el = ref.current;
      if (!d || !el) return;
      const dx = e.clientX - d.x;
      if (!d.moved && Math.abs(dx) < 6) return;
      if (!d.moved) {
        d.moved = true;
        dragged.current = true;
        setDragging(true);
        el.setPointerCapture(e.pointerId);
      }
      el.scrollLeft = d.left - dx;
      notify.current?.();
    },
    onPointerUp: end,
    onPointerCancel: end,
    // A drag that moved the rail must not also open the card under the pointer
    onClickCapture: (e: React.MouseEvent) => {
      if (dragged.current) e.preventDefault();
    },
    onDragStart: (e: React.DragEvent) => e.preventDefault(),
  };

  return { dragging, handlers };
}
