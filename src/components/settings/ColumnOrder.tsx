import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "@hello-pangea/dnd";
import { MenuOutlined } from "@ant-design/icons";
import {
  ALL_COLUMNS,
  type ExportColumnKey,
  resolveColumnOrder,
} from "../../utils/exportColumns";
import "./ColumnOrder.css";

interface Props {
  order: string[] | undefined;
  enabled: Record<string, boolean>;
  onChange: (next: ExportColumnKey[]) => void;
}

export const ColumnOrder = ({ order, enabled, onChange }: Props) => {
  const resolved = resolveColumnOrder(order);

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const src = result.source.index;
    const dst = result.destination.index;
    if (src === dst) return;
    const next = [...resolved];
    const [moved] = next.splice(src, 1);
    next.splice(dst, 0, moved);
    onChange(next);
  };

  const isEnabled = (key: ExportColumnKey) => {
    const col = ALL_COLUMNS.find((c) => c.key === key);
    if (!col) return false;
    if (col.toggleKey == null) return true;
    return enabled[col.toggleKey] === true;
  };

  return (
    <div className="column-order">
      <div className="column-order-hint">
        Drag to reorder. Disabled columns are skipped in the export.
      </div>
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="exportColumns">
          {(provided) => (
            <div
              className="column-order-list"
              {...provided.droppableProps}
              ref={provided.innerRef}
            >
              {resolved.map((key, index) => {
                const col = ALL_COLUMNS.find((c) => c.key === key)!;
                const on = isEnabled(key);
                return (
                  <Draggable key={key} draggableId={key} index={index}>
                    {(prov, snap) => (
                      <div
                        ref={prov.innerRef}
                        {...prov.draggableProps}
                        className={`column-order-item ${on ? "" : "is-off"} ${
                          snap.isDragging ? "is-dragging" : ""
                        }`}
                      >
                        <span {...prov.dragHandleProps} className="column-order-grip">
                          <MenuOutlined />
                        </span>
                        <span className="column-order-index">{index + 1}</span>
                        <span className="column-order-label">{col.label}</span>
                        <span className="column-order-state">{on ? "on" : "off"}</span>
                      </div>
                    )}
                  </Draggable>
                );
              })}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  );
};

export default ColumnOrder;
