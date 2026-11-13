"use client";

import { DndContext, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, arrayMove, rectSortingStrategy, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { DotsSixVerticalIcon } from "@phosphor-icons/react";
import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@admin/lib/utils";

export type HandleProps = HTMLAttributes<HTMLElement>;

function Item({ id, children }: { id: string; children: (handle: HandleProps, dragging: boolean) => ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  return (
    <div ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition, zIndex: isDragging ? 10 : undefined }} className={cn("relative", isDragging && "opacity-80")}>
      {children({ ...attributes, ...listeners } as HandleProps, isDragging)}
    </div>
  );
}

/** Drag-to-reorder list or grid. Keys must be stable strings. */
export function Sortable<T>({
  items,
  getId,
  onReorder,
  render,
  grid,
  className,
}: {
  items: T[];
  getId: (item: T, index: number) => string;
  onReorder: (next: T[]) => void;
  render: (item: T, index: number, handle: HandleProps, dragging: boolean) => ReactNode;
  grid?: boolean;
  className?: string;
}) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));
  const ids = items.map(getId);
  const onDragEnd = (e: DragEndEvent) => {
    if (!e.over || e.active.id === e.over.id) return;
    onReorder(arrayMove(items, ids.indexOf(String(e.active.id)), ids.indexOf(String(e.over.id))));
  };
  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
      <SortableContext items={ids} strategy={grid ? rectSortingStrategy : verticalListSortingStrategy}>
        <div className={className}>
          {items.map((item, i) => (
            <Item key={ids[i]} id={ids[i]}>
              {(handle, dragging) => render(item, i, handle, dragging)}
            </Item>
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}

export function DragHandle({ handle, className, label = "Drag to reorder" }: { handle: HandleProps; className?: string; label?: string }) {
  return (
    <button type="button" {...handle} aria-label={label} className={cn("grid size-7 shrink-0 cursor-grab touch-none place-items-center rounded-[6px] text-ink-muted hover:bg-sand hover:text-ink active:cursor-grabbing", className)}>
      <DotsSixVerticalIcon weight="bold" className="size-4" />
    </button>
  );
}
