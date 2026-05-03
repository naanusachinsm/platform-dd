import { useState, useCallback, useEffect } from "react";
import {
  DragDropContext,
  Droppable,
  Draggable,
  type DropResult,
} from "@hello-pangea/dnd";
import {
  DealStage,
  DealStageLabels,
  DealPriorityLabels,
  STAGE_ORDER,
  formatCrmCurrency,
  type CrmDeal,
} from "@/api/crmTypes";
import { cn } from "@/lib/utils";
import { GripVertical, ArrowUp, ArrowDown, Minus, Building2, User, Calendar } from "lucide-react";
import { toast } from "sonner";

const PRIORITY_ICONS: Record<string, { icon: React.ComponentType<{ className?: string }>; color: string }> = {
  HIGH: { icon: ArrowUp, color: "text-red-600" },
  MEDIUM: { icon: Minus, color: "text-yellow-500" },
  LOW: { icon: ArrowDown, color: "text-blue-500" },
};

interface DealKanbanBoardProps {
  deals: Record<DealStage, CrmDeal[]>;
  onStageChange: (dealId: string, stage: DealStage, position: number) => Promise<void>;
  onDealClick: (deal: CrmDeal) => void;
  currency?: string;
}

export default function DealKanbanBoard({
  deals,
  onStageChange,
  onDealClick,
  currency = "USD",
}: DealKanbanBoardProps) {
  const [localDeals, setLocalDeals] = useState(deals);

  useEffect(() => {
    setLocalDeals(deals);
  }, [deals]);

  const fmt = useCallback(
    (value: number) => formatCrmCurrency(value, currency),
    [currency]
  );

  const handleDragEnd = useCallback(
    async (result: DropResult) => {
      if (!result.destination) return;

      const { draggableId, source, destination } = result;
      const srcStage = source.droppableId as DealStage;
      const dstStage = destination.droppableId as DealStage;

      if (srcStage === dstStage && source.index === destination.index) return;

      const prevDeals: Record<DealStage, CrmDeal[]> = {} as any;
      STAGE_ORDER.forEach((s) => { prevDeals[s] = [...(localDeals[s] ?? [])]; });

      const updated: Record<DealStage, CrmDeal[]> = {} as any;
      STAGE_ORDER.forEach((s) => { updated[s] = [...(localDeals[s] ?? [])]; });

      const [moved] = updated[srcStage].splice(source.index, 1);
      if (!moved) return;

      moved.stage = dstStage;
      updated[dstStage].splice(destination.index, 0, moved);
      setLocalDeals(updated);

      try {
        await onStageChange(draggableId, dstStage, destination.index);
      } catch {
        setLocalDeals(prevDeals);
        toast.error("Failed to move deal");
      }
    },
    [localDeals, onStageChange]
  );

  return (
    <div className="h-full overflow-hidden">
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="flex gap-3 h-full px-6 py-4 overflow-x-auto">
          {STAGE_ORDER.map((stage) => {
            const stageDeals = localDeals[stage] ?? [];
            const totalValue = stageDeals.reduce((sum, d) => sum + (parseFloat(String(d.value)) || 0), 0);

            return (
              <div key={stage} className="flex flex-col min-w-[250px] w-[250px] rounded-md bg-muted/40">
                <div className="flex items-center justify-between px-3 py-2.5 shrink-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      {DealStageLabels[stage]}
                    </span>
                    <span className="text-xs text-muted-foreground">{stageDeals.length}</span>
                  </div>
                  <span className="text-[10px] font-medium text-muted-foreground">
                    {fmt(totalValue)}
                  </span>
                </div>

                <Droppable droppableId={stage}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={cn(
                        "flex-1 overflow-y-auto px-1.5 pb-2 space-y-1.5 min-h-[60px]",
                        snapshot.isDraggingOver && "bg-primary/5 rounded-b-md"
                      )}
                    >
                      {stageDeals.map((deal, index) => {
                        const priorityInfo = PRIORITY_ICONS[deal.priority];
                        const PriorityIcon = priorityInfo?.icon ?? Minus;
                        return (
                          <Draggable key={deal.id} draggableId={deal.id} index={index}>
                            {(dragProvided, dragSnapshot) => (
                              <div
                                ref={dragProvided.innerRef}
                                {...dragProvided.draggableProps}
                                className={cn(
                                  "flex rounded-md border bg-card shadow-sm hover:shadow-md hover:border-border/80 transition-all",
                                  dragSnapshot.isDragging && "shadow-lg ring-2 ring-primary/20"
                                )}
                              >
                                <div
                                  {...dragProvided.dragHandleProps}
                                  className="flex items-center px-1 cursor-grab transition-colors [&>svg]:text-gray-400 [&>svg]:hover:text-gray-600 dark:[&>svg]:text-gray-500 dark:[&>svg]:hover:text-gray-300"
                                >
                                  <GripVertical className="size-3.5" />
                                </div>
                                <div
                                  className="flex-1 min-w-0 px-2 py-2 cursor-pointer"
                                  onClick={() => onDealClick(deal)}
                                >
                                  <div className="flex items-start justify-between gap-2">
                                    <p className="text-sm font-medium leading-snug capitalize truncate">{deal.title}</p>
                                    <span className="text-xs font-semibold text-primary shrink-0">
                                      {fmt(parseFloat(String(deal.value)) || 0)}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1.5 mt-1.5">
                                    {deal.company?.name && (
                                      <>
                                        <Building2 className="size-3 text-muted-foreground shrink-0" />
                                        <span className="text-[11px] text-muted-foreground truncate">{deal.company.name}</span>
                                      </>
                                    )}
                                    {deal.contact && (
                                      <>
                                        <User className="size-3 text-muted-foreground shrink-0" />
                                        <span className="text-[11px] text-muted-foreground truncate">
                                          {deal.contact.firstName} {deal.contact.lastName}
                                        </span>
                                      </>
                                    )}
                                  </div>
                                  <div className="flex items-center justify-between mt-1.5">
                                    <div className="flex items-center gap-1.5">
                                      {deal.expectedCloseDate && (
                                        <>
                                          <Calendar className="size-3 text-muted-foreground shrink-0" />
                                          <span className="text-[10px] text-muted-foreground">
                                            {new Date(deal.expectedCloseDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                                          </span>
                                        </>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <div className="flex items-center gap-1">
                                        <PriorityIcon className={cn("size-3.5", priorityInfo?.color ?? "text-gray-400")} />
                                        <span className="text-[10px] text-muted-foreground">{DealPriorityLabels[deal.priority]}</span>
                                      </div>
                                      {deal.owner && (
                                        <div
                                          className="size-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[9px] font-semibold uppercase shrink-0"
                                          title={`${deal.owner.firstName} ${deal.owner.lastName}`}
                                        >
                                          {deal.owner.firstName?.[0]}{deal.owner.lastName?.[0]}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}
                          </Draggable>
                        );
                      })}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            );
          })}
        </div>
      </DragDropContext>
    </div>
  );
}
