import React, {
  useState,
  useMemo,
  useEffect,
  useCallback,
  useRef,
  createContext,
  useContext,
  useReducer,
} from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from "chart.js";
import { Add, Close, MoreVert } from "@mui/icons-material";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import { motion, AnimatePresence } from "framer-motion";
import RemoteModal from "../RemoteService/RemoteModal";
import KPIDetailView from "../KPI/KPIDetailView";
import KPIStatusSummaryView from "../KPI/KPIStatusSummaryView";
import { useKPIDashboard } from "@/hooks/useKPIDashboard";
import CreateKPIForm from "../KPI/CreateKPIForm";
import { useDeleteColumn } from "@/hooks/useCreateColumn";
import RemoteSmallModal from "../RemoteService/RemoteSmallModal";
import { useCategoryList } from "@/hooks/useCategoryList";
import CreateColumnForm from "../Column/CreateColumnForm";
import { Shimmer } from "@/components/Shimmer/Shimmer";
import DerivedKPIForm from "./DerivedKPIForm";

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

// Define interfaces for column and card
interface KPIColumn {
  id: string;
  title?: string;
  value?: string;
  items?: KPICard[];
  onClick?: () => void;
  isLineChart?: boolean;
  chartData?: any;
  chartOptions?: any;
  percentAchieved?: number;
  tasks?: Array<{
    id: string;
    name: string;
    startDate: string;
    endDate: string;
    assignees: string[];
    status: "To do" | "In Progress" | "Done";
    notes: string;
  }>;
  notes?: string;
  startDate?: string;
  yAxisLabel?: string;
  format?: "currency" | "percentage" | "number";
  stepSize?: number;
  description?: string;
  status?: "Active" | "Inactive";
  needsRefresh?: boolean;
  onRefresh?: () => void;
}

interface KPICard {
  id: string;
  title?: string;
  value?: string;
  trend?: number;
  chartType?: "line" | "bar";
  chartData?: any;
  chartOptions?: any;
  color?: string;
  isCreateCard?: boolean;
  type?: "tracking" | "task" | "summary" | "form" | "derived";
  isLineChart?: boolean;
  summaryData?: {
    totalKPIs: number;
    statusCounts: {
      green: number;
      yellow: number;
      red: number;
      notSpecified: number;
    };
    chartData: any;
  };
  tasks?: Array<{
    id: string;
    name: string;
    startDate: string;
    endDate: string;
    assignees: string[];
    status: "To do" | "In Progress" | "Done";
    notes: string;
  }>;
  onClick?: () => void;
  notes?: string;
  startDate?: string;
  accountable?: string;
  percentAchieved?: number;
  yAxisLabel?: string;
  format?: "currency" | "percentage" | "number";
  stepSize?: number;
}

// Define DashboardModals interface
interface DashboardModals {
  isCreateKPIModalOpen: boolean;
  isCreateDerivedKPIModalOpen: boolean;
  isCreateTaskModalOpen: boolean;
  isTrackingKPIModalOpen: boolean;
  isTaskKPIModalOpen: boolean;
  isDetailViewOpen: boolean;
  isDerivedKPIDetailViewOpen: boolean;
  isKPIStatusSummaryViewOpen: boolean;
  isActionPlanViewOpen: boolean;
}

// Define action types for reducer
type DashboardAction =
  | { type: "SET_COLUMNS"; payload: KPIColumn[] }
  | { type: "UPDATE_COLUMN_ITEMS"; columnId: string; items: KPICard[] }
  | {
      type: "MOVE_ITEM";
      source: { droppableId: string; index: number };
      destination: { droppableId: string; index: number };
    }
  | { type: "ADD_COLUMN"; column: KPIColumn }
  | { type: "REMOVE_COLUMN"; columnId: string }
  | { type: "SET_SELECTED_COLUMN"; payload: KPIColumn | null }
  | { type: "SET_SELECTED_KPI"; payload: KPICard | null }
  | { type: "SET_SELECTED_DERIVED_KPI"; payload: KPICard | null }
  | { type: "SET_SELECTED_TASK_KPI"; payload: KPICard | null }
  | {
      type: "SET_TASK_USER_SELECTIONS";
      payload:
        | { [key: string]: string[] }
        | ((prev: { [key: string]: string[] }) => { [key: string]: string[] });
    }
  | { type: "SET_MODALS"; payload: DashboardModals }
  | { type: "SET_REFRESH_QUEUE"; payload: Set<string> }
  | { type: "REFRESH_COLUMN"; columnId: string };

// Define state interface
interface DashboardState {
  columns: KPIColumn[];
  selectedColumn: KPIColumn | null;
  selectedKPI: KPICard | null;
  selectedDerivedKPI: KPICard | null;
  selectedTaskKPI: KPICard | null;
  modals: {
    isCreateKPIModalOpen: boolean;
    isCreateDerivedKPIModalOpen: boolean;
    isCreateTaskModalOpen: boolean;
    isTrackingKPIModalOpen: boolean;
    isTaskKPIModalOpen: boolean;
    isDetailViewOpen: boolean;
    isDerivedKPIDetailViewOpen: boolean;
    isKPIStatusSummaryViewOpen: boolean;
    isActionPlanViewOpen: boolean;
  };
  refreshQueue: Set<string>;
  taskUserSelections: { [key: string]: string[] };
}

// Create context for dashboard state
const DashboardContext = createContext<
  | {
      state: DashboardState;
      dispatch: React.Dispatch<DashboardAction>;
    }
  | undefined
>(undefined);

// Chart configuration
const lineChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  scales: {
    y: {
      min: 0,
      title: {
        display: true,
        text: "Value",
        font: {
          family: "'Plus Jakarta Sans', sans-serif",
          size: 18,
          weight: "bold" as const,
        },
        color: "#2196f3",
        padding: { bottom: 10 },
      },
      ticks: {
        stepSize: 20,
        font: {
          family: "'Plus Jakarta Sans', sans-serif",
          size: 11,
          weight: 500,
        },
        color: "#2196f3",
      },
      grid: {
        color: "#f1f5f9",
        drawBorder: true,
      },
    },
    x: {
      grid: { display: true },
      ticks: {
        font: {
          family: "'Plus Jakarta Sans', sans-serif",
          size: 12,
          weight: 700,
        },
        color: "#2196f3",
      },
    },
  },
  plugins: {
    legend: { display: true },
    tooltip: {
      backgroundColor: "rgba(33, 150, 243, 0.95)",
      padding: { x: 16, y: 10 },
      titleFont: { size: 13, weight: 600 },
      bodyFont: { size: 12 },
      displayColors: false,
      cornerRadius: 8,
    },
  },
};

// Sample data for charts
const lineChartData = {
  labels: Array(12).fill(""),
  datasets: [
    {
      data: [65, 59, 80, 81, 56, 55, 40, 65, 59, 80, 81, 56],
      borderColor: "#2196f3",
      tension: 0.4,
      borderWidth: 2,
      pointRadius: 0,
      fill: false,
    },
  ],
};

// Define the reducer function
const dashboardReducer = (
  state: DashboardState,
  action: DashboardAction
): DashboardState => {
  switch (action.type) {
    case "SET_COLUMNS":
      // Only update if columns actually changed
      if (JSON.stringify(state.columns) === JSON.stringify(action.payload)) {
        return state;
      }
      return {
        ...state,
        columns: action.payload,
      };

    case "UPDATE_COLUMN_ITEMS": {
      // Only update if items actually changed
      const column = state.columns.find((col) => col.id === action.columnId);
      if (!column) return state;

      if (JSON.stringify(column.items) === JSON.stringify(action.items)) {
        return state;
      }

      return {
        ...state,
        columns: state.columns.map((col) =>
          col.id === action.columnId ? { ...col, items: action.items } : col
        ),
      };
    }

    case "MOVE_ITEM": {
      const { source, destination } = action;

      // Short-circuit if source and destination are the same
      if (
        source.droppableId === destination.droppableId &&
        source.index === destination.index
      ) {
        return state;
      }

      // Create a deep copy of the columns array
      const newColumns = [...state.columns];

      // Find source and destination columns
      const sourceColumnIndex = newColumns.findIndex(
        (col) => col.id === source.droppableId
      );
      const destColumnIndex = newColumns.findIndex(
        (col) => col.id === destination.droppableId
      );

      if (sourceColumnIndex === -1 || destColumnIndex === -1) return state;

      // Create copies of the items arrays
      const sourceItems = [...(newColumns[sourceColumnIndex].items || [])];
      const destItems =
        source.droppableId === destination.droppableId
          ? sourceItems
          : [...(newColumns[destColumnIndex].items || [])];

      // Remove from source
      const [removed] = sourceItems.splice(source.index, 1);

      // Add to destination
      destItems.splice(destination.index, 0, removed);

      // Update the columns with new items
      newColumns[sourceColumnIndex] = {
        ...newColumns[sourceColumnIndex],
        items: sourceItems,
      };

      if (source.droppableId !== destination.droppableId) {
        newColumns[destColumnIndex] = {
          ...newColumns[destColumnIndex],
          items: destItems,
        };
      }

      // Create a new refresh queue
      const newRefreshQueue = new Set(state.refreshQueue);
      if (source.droppableId !== destination.droppableId) {
        newRefreshQueue.add(source.droppableId);
        newRefreshQueue.add(destination.droppableId);
      }

      return {
        ...state,
        columns: newColumns,
        refreshQueue: newRefreshQueue,
      };
    }

    case "ADD_COLUMN":
      // Check if column already exists
      if (state.columns.some((col) => col.id === action.column.id)) {
        return state;
      }
      return {
        ...state,
        columns: [...state.columns, action.column],
      };

    case "REMOVE_COLUMN":
      // Check if column exists before removing
      if (!state.columns.some((col) => col.id === action.columnId)) {
        return state;
      }
      return {
        ...state,
        columns: state.columns.filter((col) => col.id !== action.columnId),
      };

    case "SET_SELECTED_COLUMN":
      // Only update if selection actually changed
      if (state.selectedColumn?.id === action.payload?.id) {
        return state;
      }
      return {
        ...state,
        selectedColumn: action.payload,
      };

    case "SET_SELECTED_KPI":
      // Always update to ensure we can reopen the same KPI
      return {
        ...state,
        selectedKPI: action.payload,
        modals: {
          ...state.modals,
          isDetailViewOpen: action.payload !== null,
        },
      };

    case "SET_SELECTED_DERIVED_KPI":
      // Always update to ensure we can reopen the same derived KPI
      return {
        ...state,
        selectedDerivedKPI: action.payload,
        modals: {
          ...state.modals,
          isDerivedKPIDetailViewOpen: action.payload !== null,
        },
      };

    case "SET_SELECTED_TASK_KPI":
      // Always update to ensure we can reopen the same task KPI
      return {
        ...state,
        selectedTaskKPI: action.payload,
        modals: {
          ...state.modals,
          isActionPlanViewOpen: action.payload !== null,
        },
      };

    case "SET_TASK_USER_SELECTIONS": {
      const newSelections =
        typeof action.payload === "function"
          ? action.payload(state.taskUserSelections)
          : action.payload;

      // Only update if selections actually changed
      if (
        JSON.stringify(state.taskUserSelections) ===
        JSON.stringify(newSelections)
      ) {
        return state;
      }

      return {
        ...state,
        taskUserSelections: newSelections,
      };
    }

    case "SET_MODALS":
      // Only update if modals actually changed
      if (JSON.stringify(state.modals) === JSON.stringify(action.payload)) {
        return state;
      }
      return {
        ...state,
        modals: action.payload,
      };

    case "SET_REFRESH_QUEUE": {
      // Convert both sets to arrays for comparison
      const currentArray = Array.from(state.refreshQueue);
      const newArray = Array.from(action.payload);

      // Only update if queue actually changed
      if (
        JSON.stringify(currentArray.sort()) === JSON.stringify(newArray.sort())
      ) {
        return state;
      }

      return {
        ...state,
        refreshQueue: action.payload,
      };
    }

    case "REFRESH_COLUMN": {
      // Check if column exists and needs refresh
      const column = state.columns.find((col) => col.id === action.columnId);
      if (!column || column.needsRefresh === true) {
        return state;
      }

      return {
        ...state,
        columns: state.columns.map((col) =>
          col.id === action.columnId ? { ...col, needsRefresh: true } : col
        ),
      };
    }

    default:
      return state;
  }
};

// Initial state
const initialState: DashboardState = {
  columns: [],
  selectedColumn: null,
  selectedKPI: null,
  selectedDerivedKPI: null,
  selectedTaskKPI: null,
  modals: {
    isCreateKPIModalOpen: false,
    isCreateDerivedKPIModalOpen: false,
    isCreateTaskModalOpen: false,
    isTrackingKPIModalOpen: false,
    isTaskKPIModalOpen: false,
    isDetailViewOpen: false,
    isDerivedKPIDetailViewOpen: false,
    isKPIStatusSummaryViewOpen: false,
    isActionPlanViewOpen: false,
  },
  refreshQueue: new Set<string>(),
  taskUserSelections: {},
};

// Create initial columns
const createInitialColumns = () => [
  {
    id: "kpis",
    title: "NEW KPIs",
    items: [
      {
        id: "kpi-summary",
        title: "KPI STATUS SUMMARY",
        value: "41%",
        percentAchieved: 41,
        trend: 8,
        chartType: "line" as const,
        chartData: lineChartData,
        chartOptions: lineChartOptions,
        color: "#2196f3",
        type: "summary" as const,
      },
      {
        id: "kpi-form",
        title: "KPI FORM",
        type: "form" as const,
      },
      {
        id: "kpi-derived",
        title: "DERIVED KPI",
        type: "derived" as const,
      },
    ],
  },
];

// Custom hook for using the dashboard context
const useDashboard = () => {
  const context = useContext(DashboardContext);
  if (context === undefined) {
    throw new Error("useDashboard must be used within a DashboardProvider");
  }
  return context;
};

// Form modals component
interface FormModalsProps {
  isAddModalOpen: boolean;
  isAddDerivedKPIModalOpen: boolean;
  isEditModalOpen: boolean;
  isDeleteModalOpen: boolean;
  selectedColumn: KPIColumn | null;
  selectedKPI: KPICard | null;
  onClose: () => void;
  onAdd: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onTaskUserSelectionsChange: (
    selections:
      | { [key: string]: string[] }
      | ((prev: { [key: string]: string[] }) => { [key: string]: string[] })
  ) => void;
  taskUserSelections: { [key: string]: string[] };
  dispatch: React.Dispatch<DashboardAction>;
}

const FormModals = React.memo(
  ({
    isAddModalOpen,
    isAddDerivedKPIModalOpen,
    isEditModalOpen,
    isDeleteModalOpen,
    selectedColumn,
    selectedKPI,
    onClose,
    onAdd,
    onEdit,
    onDelete,
    onTaskUserSelectionsChange,
    taskUserSelections,
    dispatch,
  }: FormModalsProps) => {
    // Use the dashboard context to get access to the state
    const { state } = useDashboard();

    // Memoize handlers to prevent recreating on every render
    const handleTaskUserSelectionsChange = useCallback(
      (
        selections:
          | { [key: string]: string[] }
          | ((prev: { [key: string]: string[] }) => { [key: string]: string[] })
      ) => {
        dispatch({ type: "SET_TASK_USER_SELECTIONS", payload: selections });
      },
      [dispatch]
    );

    // Ensure modal closes properly
    const handleDerivedModalClose = useCallback(() => {
      // First close the modal in the parent component state
      dispatch({
        type: "SET_MODALS",
        payload: { ...state.modals, isCreateDerivedKPIModalOpen: false },
      });

      // Then call the general onClose handler
      onClose();
    }, [dispatch, state.modals, onClose]);

    return (
      <>
        <AddKPIModal
          isOpen={isAddModalOpen}
          onClose={onClose}
          onAdd={onAdd}
          column={selectedColumn}
          onTaskUserSelectionsChange={handleTaskUserSelectionsChange}
          taskUserSelections={taskUserSelections}
        />
        <AddDerivedKPIModal
          isOpen={isAddDerivedKPIModalOpen}
          onClose={handleDerivedModalClose}
          onAdd={onAdd}
          column={selectedColumn}
          onTaskUserSelectionsChange={handleTaskUserSelectionsChange}
          taskUserSelections={taskUserSelections}
        />

        <EditKPIModal
          isOpen={isEditModalOpen}
          onClose={onClose}
          onEdit={onEdit}
          kpi={selectedKPI}
          onTaskUserSelectionsChange={handleTaskUserSelectionsChange}
          taskUserSelections={taskUserSelections}
        />
        <DeleteKPIModal
          isOpen={isDeleteModalOpen}
          onClose={onClose}
          onDelete={onDelete}
          kpi={selectedKPI}
        />
      </>
    );
  },
  (prevProps, nextProps) => {
    // Only re-render when modal open states change
    return (
      prevProps.isAddModalOpen === nextProps.isAddModalOpen &&
      prevProps.isAddDerivedKPIModalOpen ===
        nextProps.isAddDerivedKPIModalOpen &&
      prevProps.isEditModalOpen === nextProps.isEditModalOpen &&
      prevProps.isDeleteModalOpen === nextProps.isDeleteModalOpen &&
      prevProps.selectedColumn?.id === nextProps.selectedColumn?.id &&
      prevProps.selectedKPI?.id === nextProps.selectedKPI?.id
    );
  }
);

// Create column modal component
interface CreateColumnModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const CreateColumnModal: React.FC<CreateColumnModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const handleSuccess = () => {
    onSuccess();
    onClose();
  };

  return (
    <RemoteModal
      open={isOpen}
      handleClose={onClose}
      modalTitle="Create New Column"
      width="md"
      position="center"
      modalBody={
        <div className="p-4">
          <CreateColumnForm onSuccess={handleSuccess} onCancel={onClose} />
        </div>
      }
    />
  );
};

// Column Shimmer component for when categories are loading
const ColumnShimmer = React.memo(() => {
  return (
    <>
      {[...Array(6)].map((_, index) => (
        <div
          key={`column-shimmer-${index}`}
          className="w-[320px] flex-shrink-0 mr-4 h-full"
        >
          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-gray-100 h-full flex flex-col">
            <div className="p-4 border-b flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <Shimmer width="w-24" height="h-5" rounded={true} />
                <Shimmer width="w-16" height="h-4" rounded={true} />
              </div>
              <Shimmer width="w-8" height="h-8" rounded={true} />
            </div>
            <div className="p-4 flex-1 overflow-y-auto">
              <div className="space-y-4">
                {[...Array(3)].map((_, cardIndex) => (
                  <div
                    key={`card-shimmer-${cardIndex}`}
                    className="bg-white/50 rounded-xl p-4 border border-gray-100"
                  >
                    <div className="space-y-3">
                      <div className="flex justify-between items-start">
                        <Shimmer width="w-3/4" height="h-5" rounded={true} />
                        <Shimmer width="w-16" height="h-4" rounded={true} />
                      </div>
                      <Shimmer width="w-1/2" height="h-4" rounded={true} />
                      <div className="h-[120px] bg-gray-50/50 rounded-lg">
                        <Shimmer
                          width="w-full"
                          height="h-full"
                          rounded={true}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4">
                <div className="w-full h-10 bg-gradient-to-b from-gray-50/50 to-gray-100/50 rounded-lg border border-dashed border-gray-200 flex items-center justify-center">
                  <Shimmer width="w-32" height="h-5" rounded={true} />
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </>
  );
});

// Separate component for dashboard content to prevent unnecessary re-renders
const DashboardContent = React.memo(
  ({ session }: { session: any }) => {
    const { state, dispatch } = useDashboard();
    const {
      deleteColumn,
      deleteModalState,
      setDeleteModalState,
      handleDelete,
    } = useDeleteColumn();
    const [isCreateColumnModalOpen, setIsCreateColumnModalOpen] =
      useState(false);
    const { refetch: refetchCategories } = useCategoryList();

    // Handle drag end
    const handleDragEnd = useCallback(
      (result: any) => {
        if (!result.destination) return;

        const { source, destination } = result;

        // Don't do anything if dropped in same position
        if (
          source.droppableId === destination.droppableId &&
          source.index === destination.index
        ) {
          return;
        }

        // Update state via reducer
        dispatch({
          type: "MOVE_ITEM",
          source,
          destination,
        });

        // Get the current state of columns
        const sourceColumn = state.columns.find(
          (col) => col.id === source.droppableId
        );
        const destColumn = state.columns.find(
          (col) => col.id === destination.droppableId
        );

        if (!sourceColumn || !destColumn) return;

        // Make a copy of the items
        const sourceItems = [...(sourceColumn.items || [])];
        const destItems =
          source.droppableId === destination.droppableId
            ? sourceItems
            : [...(destColumn.items || [])];

        // Remove the item from source
        const [removed] = sourceItems.splice(source.index, 1);

        // Insert into destination
        destItems.splice(destination.index, 0, removed);

        // Update the items in each column
        if (source.droppableId !== "kpis") {
          dispatch({
            type: "UPDATE_COLUMN_ITEMS",
            columnId: source.droppableId,
            items: sourceItems,
          });
        }

        if (
          destination.droppableId !== "kpis" &&
          source.droppableId !== destination.droppableId
        ) {
          dispatch({
            type: "UPDATE_COLUMN_ITEMS",
            columnId: destination.droppableId,
            items: destItems,
          });
        }

        // Trigger column refresh if needed
        if (source.droppableId !== destination.droppableId) {
          if (source.droppableId !== "kpis") {
            dispatch({ type: "REFRESH_COLUMN", columnId: source.droppableId });
          }
          if (destination.droppableId !== "kpis") {
            dispatch({
              type: "REFRESH_COLUMN",
              columnId: destination.droppableId,
            });
          }
        }
      },
      [dispatch, state.columns]
    );

    // Modal handlers
    const handleModalToggle = useCallback(
      (modal: string, isOpen: boolean) => {
        dispatch({
          type: "SET_MODALS",
          payload: { ...state.modals, [modal]: isOpen },
        });
      },
      [dispatch, state.modals]
    );

    // Select column handler
    const handleSelectColumn = useCallback(
      (column: KPIColumn | null) => {
        dispatch({ type: "SET_SELECTED_COLUMN", payload: column });
      },
      [dispatch]
    );

    // Create column handler
    const handleCreateColumn = useCallback(() => {
      setIsCreateColumnModalOpen(true);
    }, []);

    // Create column success handler
    const handleCreateColumnSuccess = useCallback(() => {
      setIsCreateColumnModalOpen(false);
      refetchCategories();
    }, [refetchCategories]);

    // Delete column handler
    const handleDeleteColumn = useCallback(
      (column: KPIColumn) => {
        // Check if column has items
        if (column.items && column.items.length > 0) {
          setDeleteModalState({
            isOpenDelete: true,
            titleDelete: "Cannot Delete Column",
            body: "Cannot delete column with items. Please remove all items first.",
            btnTxt: "OK",
            cancelTxt: "",
            id: column.id,
          });
          return;
        }

        // Delete column
        deleteColumn(column.id, column.items);
        dispatch({ type: "REMOVE_COLUMN", columnId: column.id });
      },
      [deleteColumn, setDeleteModalState, dispatch]
    );

    // Form state handlers
    const formHandlers = {
      openCreateKPI: () => handleModalToggle("isCreateKPIModalOpen", true),
      closeCreateKPI: () => handleModalToggle("isCreateKPIModalOpen", false),
      openCreateDerivedKPI: () =>
        handleModalToggle("isCreateDerivedKPIModalOpen", true),
      closeCreateDerivedKPI: () => {
        handleModalToggle("isCreateDerivedKPIModalOpen", false);

        // AGGRESSIVE APPROACH: Force close ALL modals
        try {
          // Find all modal close buttons and click them
          const closeButtons = document.querySelectorAll(
            '.MuiButtonBase-root[aria-label="close"]'
          );
          closeButtons.forEach((button) => {
            (button as HTMLElement).click();
          });

          // Find any backdrop overlays and click them to dismiss modals
          const backdrops = document.querySelectorAll(".MuiBackdrop-root");
          backdrops.forEach((backdrop) => {
            (backdrop as HTMLElement).click();
          });
        } catch (e) {
          console.error("Error closing modals:", e);
        }

        // 3. Dispatch multiple escape key events with increasing delays
        for (let i = 0; i < 5; i++) {
          setTimeout(() => {
            document.dispatchEvent(
              new KeyboardEvent("keydown", {
                key: "Escape",
                code: "Escape",
                keyCode: 27,
                which: 27,
                bubbles: true,
                cancelable: true,
              })
            );
          }, i * 100);
        }
      },
      openCreateColumn: () => handleModalToggle("isCreateTaskModalOpen", true),
      closeCreateColumn: () =>
        handleModalToggle("isCreateTaskModalOpen", false),
      openTrackingKPI: () => handleModalToggle("isTrackingKPIModalOpen", true),
      closeTrackingKPI: () =>
        handleModalToggle("isTrackingKPIModalOpen", false),
      openTaskKPI: () => handleModalToggle("isTaskKPIModalOpen", true),
      closeTaskKPI: () => handleModalToggle("isTaskKPIModalOpen", false),
      closeDetailView: () => handleModalToggle("isDetailViewOpen", false),
      closeDerivedKPIDetailView: () =>
        handleModalToggle("isDerivedKPIDetailViewOpen", false),
      closeActionPlanView: () =>
        handleModalToggle("isActionPlanViewOpen", false),
      closeKPIStatusSummary: () =>
        handleModalToggle("isKPIStatusSummaryViewOpen", false),
    };

    // Form submit handlers
    const formSubmitHandlers = {
      handleCreateKPISuccess: () => {
        formHandlers.closeCreateKPI();
        if (state.selectedColumn?.id) {
          // Add to refresh queue instead of directly dispatching
          const newRefreshQueue = new Set(state.refreshQueue);
          newRefreshQueue.add(state.selectedColumn.id);
          dispatch({ type: "SET_REFRESH_QUEUE", payload: newRefreshQueue });
        }
      },
      handleCreateColumnSuccess: () => {
        formHandlers.closeCreateColumn();
      },
      handleTrackingKPISubmit: async (data: any) => {
        console.log("Tracking KPI data:", data);
      },
    };

    return (
      <div className="bg-gray-50 min-h-screen flex flex-col">
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="flex-1 relative">
            <div
              className="absolute inset-0 flex items-start p-4 overflow-x-auto 
              scrollbar-thin scrollbar-thumb-gray-300/60 scrollbar-track-transparent 
              hover:scrollbar-thumb-gray-400/80 custom-scrollbar"
              style={{
                overflowY: "hidden",
                scrollbarWidth: "thin",
                scrollbarGutter: "stable",
                minHeight: "calc(100vh - 4rem)",
              }}
            >
              {state.columns.map((column, index) => (
                <ColumnRenderer
                  key={column.id}
                  column={column}
                  index={index}
                  onDeleteColumn={handleDeleteColumn}
                  onSelectColumn={handleSelectColumn}
                  onOpenCreateKPI={formHandlers.openCreateKPI}
                  onOpenCreateDerivedKPI={formHandlers.openCreateDerivedKPI}
                />
              ))}

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleCreateColumn}
                className="h-[160px] bg-gradient-to-br from-white via-white/80 to-gray-50 
                hover:from-blue-50 hover:via-blue-50/80 hover:to-white
                rounded-lg flex flex-col items-center justify-center 
                text-gray-500 hover:text-blue-600 transition-all duration-300 
                border-2 border-dashed border-gray-200 hover:border-blue-200
                shadow-sm hover:shadow-md !min-w-[320px]"
              >
                <div className="bg-white p-2 rounded-full shadow-md mb-2 group-hover:shadow-lg transition-all duration-300 hover:scale-110">
                  <Add className="w-6 h-6" />
                </div>
                <span className="font-medium text-base">Add New Column</span>
                <span className="text-xs text-gray-400 mt-1">
                  Click to add a column
                </span>
              </motion.button>
            </div>
          </div>
        </DragDropContext>

        <FormModals
          isAddModalOpen={state.modals.isCreateKPIModalOpen}
          isAddDerivedKPIModalOpen={state.modals.isCreateDerivedKPIModalOpen}
          isEditModalOpen={state.modals.isCreateTaskModalOpen}
          isDeleteModalOpen={state.modals.isTrackingKPIModalOpen}
          selectedColumn={state.selectedColumn}
          selectedKPI={state.selectedKPI}
          onClose={formHandlers.closeCreateKPI}
          onAdd={formSubmitHandlers.handleCreateKPISuccess}
          onEdit={formSubmitHandlers.handleCreateKPISuccess}
          onDelete={formSubmitHandlers.handleCreateKPISuccess}
          onTaskUserSelectionsChange={
            formSubmitHandlers.handleTrackingKPISubmit
          }
          taskUserSelections={state.taskUserSelections}
          dispatch={dispatch}
        />

        {/* Create Column Modal */}
        <CreateColumnModal
          isOpen={isCreateColumnModalOpen}
          onClose={() => setIsCreateColumnModalOpen(false)}
          onSuccess={handleCreateColumnSuccess}
        />

        {/* KPI Detail View Modal */}
        <RemoteModal
          open={state.modals.isDetailViewOpen}
          handleClose={formHandlers.closeDetailView}
          modalTitle="KPI Details"
          width="lg"
          position="center"
          modalBody={
            <KPIDetailView
              isWidget={false}
              taskUserSelections={state.taskUserSelections}
              kpiThumbainData={state.selectedKPI || {}}
              onTaskUserSelectionsChange={(selections) => {
                dispatch({
                  type: "SET_TASK_USER_SELECTIONS",
                  payload: selections,
                });
              }}
              kpiId={state.selectedKPI?.id || ""}
              isDerived={false}
            />
          }
        />

        <RemoteModal
          open={state.modals.isDerivedKPIDetailViewOpen}
          handleClose={formHandlers.closeDerivedKPIDetailView}
          modalTitle="Derived KPI Details"
          width="lg"
          position="center"
          modalBody={
            <KPIDetailView
              isWidget={false}
              taskUserSelections={state.taskUserSelections}
              kpiThumbainData={state.selectedDerivedKPI || {}}
              onTaskUserSelectionsChange={(selections) => {
                dispatch({
                  type: "SET_TASK_USER_SELECTIONS",
                  payload: selections,
                });
              }}
              kpiId={state.selectedDerivedKPI?.id || ""}
              isDerived={true}
            />
          }
        />

        {/* KPI `Status` Summary View Modal */}
        <RemoteModal
          open={state.modals.isKPIStatusSummaryViewOpen}
          handleClose={formHandlers.closeKPIStatusSummary}
          modalTitle="KPI Status Summary"
          width="lg"
          position="center"
          modalBody={<KPIStatusSummaryView isWidget={false} />}
        />
      </div>
    );
  },
  // Add a custom comparison function to prevent unnecessary rerenders
  (prevProps, nextProps) => true
); // Always use the same instance to prevent rerendering

// Optimized column renderer component
const ColumnRenderer = React.memo(
  ({
    column,
    index,
    onDeleteColumn,
    onSelectColumn,
    onOpenCreateKPI,
    onOpenCreateDerivedKPI,
  }: {
    column: KPIColumn;
    index: number;
    onDeleteColumn: (column: KPIColumn) => void;
    onSelectColumn: (column: KPIColumn | null) => void;
    onOpenCreateKPI: () => void;
    onOpenCreateDerivedKPI: () => void;
  }) => {
    const { state, dispatch } = useDashboard();
    const [localShowAddMenu, setLocalShowAddMenu] = useState<string | null>(
      null
    );

    // Event handlers
    const handleMenuClick = useCallback(
      (e: React.MouseEvent) => {
        e.stopPropagation();
        setLocalShowAddMenu((prev) => (prev === column.id ? null : column.id));
      },
      [column.id]
    );

    const handleAddKPI = useCallback(
      (e: React.MouseEvent) => {
        e.stopPropagation();
        onSelectColumn(column);
        onOpenCreateKPI();
        setLocalShowAddMenu(null);
      },
      [column, onSelectColumn, onOpenCreateKPI]
    );

    const handleAddDerivedKPI = useCallback(
      (e: React.MouseEvent) => {
        e.stopPropagation();
        onSelectColumn(column);
        onOpenCreateDerivedKPI();
        setLocalShowAddMenu(null);
      },
      [column, onSelectColumn, onOpenCreateDerivedKPI]
    );

    const handleDeleteColumn = useCallback(
      (e: React.MouseEvent) => {
        e.stopPropagation();
        onDeleteColumn(column);
        setLocalShowAddMenu(null);
      },
      [column, onDeleteColumn]
    );

    const handleAddCard = useCallback(
      (e: React.MouseEvent) => {
        e.stopPropagation();
        onSelectColumn(column);
        onOpenCreateKPI();
      },
      [column, onSelectColumn, onOpenCreateKPI]
    );

    // Handle column refresh
    const handleColumnRefresh = useCallback(() => {
      dispatch({ type: "REFRESH_COLUMN", columnId: column.id });
    }, [column.id, dispatch]);

    return (
      <div className="w-[320px] flex-shrink-0 mr-4 h-full">
        <div className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300 h-full flex flex-col">
          <div className="p-3 border-b flex justify-between items-center">
            <h3 className="text-sm font-medium text-gray-700">
              {column.title}
            </h3>
            <div className="relative">
              <button
                onClick={handleMenuClick}
                className="p-1 hover:bg-gray-100 rounded-full"
                title="Open menu"
              >
                <MoreVert className="w-5 h-5 text-gray-600" />
              </button>
              <AnimatePresence>
                {localShowAddMenu === column.id && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border border-gray-200">
                    <Close
                      onClick={() => setLocalShowAddMenu(null)}
                      className="w-5 h-5 text-gray-600 absolute top-2 right-2 cursor-pointer"
                    />
                    <div className="py-1">
                      <button
                        onClick={handleAddKPI}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        Add New KPI
                      </button>
                      <button
                        onClick={handleAddDerivedKPI}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        Add New Derived KPI
                      </button>
                    </div>
                  </div>
                )}
              </AnimatePresence>
            </div>
          </div>
          <Droppable droppableId={column.id}>
            {(provided, snapshot) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className={`p-3 flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300/60 scrollbar-track-transparent hover:scrollbar-thumb-gray-400/80 ${
                  snapshot.isDraggingOver ? "bg-gray-50" : ""
                }`}
              >
                {column.id === "kpis" ? (
                  <>
                    {/* First render the special cards from the initial column */}
                    {column.items
                      ?.filter((item) => {
                        // Type-safe filtering for special cards
                        if (
                          item &&
                          typeof item === "object" &&
                          "type" in item
                        ) {
                          const type = String(item.type || "");
                          return ["summary", "form", "derived"].includes(type);
                        }
                        return false;
                      })
                      .map((item, index) => (
                        <DraggableItem
                          key={item.id}
                          item={item}
                          index={index}
                        />
                      ))}

                    {/* Then show all KPIs */}
                    <div className="mt-4">
                      <KPIsList />
                    </div>
                  </>
                ) : (
                  <ColumnItems
                    columnId={column.id}
                    colId={column.id}
                    shouldRefresh={state.refreshQueue.has(column.id)}
                    onRefresh={handleColumnRefresh}
                  />
                )}
                {provided.placeholder}
                <button
                  onClick={handleAddCard}
                  className="w-full mt-2 p-2.5 text-gray-500 hover:text-gray-700 
                      bg-gradient-to-b from-gray-50/50 to-gray-100/50 hover:from-gray-100 hover:to-gray-200
                      rounded-lg text-xs flex items-center justify-center transition-all duration-300 
                      border border-dashed border-gray-200 hover:border-gray-300 group
                      hover:shadow-inner transform hover:-translate-y-0.5"
                >
                  <div className="bg-white p-1 rounded-full shadow-sm mr-1.5 group-hover:shadow group-hover:scale-110 transition-all duration-300">
                    <Add className="w-3 h-3 text-[#37517e]" />
                  </div>
                  <span className="font-medium">Add new card</span>
                </button>
              </div>
            )}
          </Droppable>
        </div>
      </div>
    );
  }
);

// Optimized draggable item component
const DraggableItem = React.memo(
  ({ item, index }: { item: KPICard; index: number }) => {
    const { dispatch, state } = useDashboard();

    // Handle item click - define with useCallback to prevent recreating on each render
    const handleItemClick = useCallback(() => {
      if (item.type === "derived") {
        dispatch({
          type: "SET_MODALS",
          payload: { ...state.modals, isCreateDerivedKPIModalOpen: true },
        });
      } else if (item.type === "summary") {
        dispatch({
          type: "SET_MODALS",
          payload: { ...state.modals, isKPIStatusSummaryViewOpen: true },
        });
      } else if (item.type === "form") {
        dispatch({
          type: "SET_MODALS",
          payload: { ...state.modals, isCreateKPIModalOpen: true },
        });
      } else {
        dispatch({ type: "SET_SELECTED_KPI", payload: item });
      }
    }, [dispatch, item, state.modals]);

    // Define component references - do this outside any conditional logic
    const FormComponent = useMemo(() => <KpiForm />, []);
    const SummaryComponent = useMemo(() => <KPISummary item={item} />, [item]);
    const DerivedComponent = useMemo(() => <KpiDerivedForm />, []);
    const DashboardComponent = useMemo(
      () => <KPIDashboard item={item} />,
      [item]
    );

    // Select the right component based on type - non-conditionally
    const contentComponent = useMemo(() => {
      if (item.type === "form") return FormComponent;
      if (item.type === "summary") return SummaryComponent;
      if (item.type === "derived") return DerivedComponent;
      return DashboardComponent;
    }, [
      item.type,
      FormComponent,
      SummaryComponent,
      DerivedComponent,
      DashboardComponent,
    ]);

    return (
      <Draggable draggableId={item.id} index={index}>
        {(provided, snapshot) => {
          const className = `mb-2 cursor-pointer transition-shadow duration-200 ${
            snapshot.isDragging ? "shadow-lg" : ""
          }`;

          return (
            <div
              ref={provided.innerRef}
              {...provided.draggableProps}
              {...provided.dragHandleProps}
              className={className}
              onClick={handleItemClick}
            >
              {contentComponent}
            </div>
          );
        }}
      </Draggable>
    );
  },
  // Custom comparison function for memo to prevent unnecessary renders
  (prevProps, nextProps) => {
    // Only re-render if item id or index changes
    return (
      prevProps.item.id === nextProps.item.id &&
      prevProps.index === nextProps.index
    );
  }
);

// Optimized column items component
const ColumnItems = React.memo(
  ({
    columnId,
    colId,
    shouldRefresh,
    onRefresh,
  }: {
    columnId: string;
    colId: string;
    shouldRefresh: boolean;
    onRefresh: () => void;
  }) => {
    const { dispatch, state } = useDashboard();
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
    const refreshCountRef = useRef(0);

    // Query options - for "kpis" column, don't pass group parameter
    const queryOptions = useMemo(
      () =>
        columnId === "kpis"
          ? { pageNumber: 0, limit: 10 }
          : { group: colId, pageNumber: 0, limit: 10 },
      [columnId, colId]
    );

    // Use query with enabled option
    const {
      data: kpis,
      isLoading,
      isFetching,
      refetch,
    } = useKPIDashboard(queryOptions);

    // Get existing items from the column in state
    const existingColumnItems = useMemo(() => {
      const column = state.columns.find((col) => col.id === columnId);
      return column?.items || [];
    }, [state.columns, columnId]);

    // Process KPIs with proper memoization
    const processedKpis = useMemo(() => {
      // Get the fetched KPIs array
      const fetchedKpis = kpis ? (Array.isArray(kpis) ? kpis : [kpis]) : [];

      // For the "kpis" column, we need to filter out the special cards
      if (columnId === "kpis") {
        return fetchedKpis;
      }

      // For other columns, use existing items if available and not refreshing
      if (existingColumnItems.length > 0 && !shouldRefresh && !isRefreshing) {
        return existingColumnItems;
      }

      // Otherwise use the fetched data
      return fetchedKpis;
    }, [kpis, existingColumnItems, shouldRefresh, isRefreshing, columnId]);

    // Handle successful data load
    useEffect(() => {
      if (processedKpis.length > 0 || (!isLoading && !isFetching)) {
        setHasLoadedOnce(true);
        setIsRefreshing(false);

        // Update column items in global state
        const column = state.columns.find((col) => col.id === columnId);
        if (column) {
          // Keep special cards for kpis column
          const specialCards =
            columnId === "kpis"
              ? column.items?.filter(
                  (item) =>
                    item &&
                    "type" in item &&
                    ["summary", "form", "derived"].includes(item.type as string)
                ) || []
              : [];

          const updatedItems =
            columnId === "kpis"
              ? [...specialCards, ...processedKpis]
              : processedKpis;

          dispatch({
            type: "UPDATE_COLUMN_ITEMS",
            columnId: columnId,
            items: updatedItems,
          });
        }
      }
    }, [
      processedKpis,
      columnId,
      dispatch,
      state.columns,
      isLoading,
      isFetching,
    ]);

    // Handle refresh
    useEffect(() => {
      if (shouldRefresh) {
        setIsRefreshing(true);
        refreshCountRef.current += 1;

        refetch().then(() => {
          setIsRefreshing(false);

          // Remove from refresh queue
          const newRefreshQueue = new Set(state.refreshQueue);
          newRefreshQueue.delete(columnId);
          dispatch({ type: "SET_REFRESH_QUEUE", payload: newRefreshQueue });

          // Notify completion
          onRefresh();
        });
      }
    }, [
      shouldRefresh,
      refetch,
      columnId,
      onRefresh,
      dispatch,
      state.refreshQueue,
    ]);

    // Determine loading state
    const showLoading =
      isLoading ||
      (isRefreshing && !hasLoadedOnce) ||
      (!hasLoadedOnce && isFetching);

    // Render items
    const itemsToRender = useMemo(() => {
      if (columnId === "kpis") {
        return processedKpis.filter(
          (item: any) =>
            !(
              "type" in item &&
              ["summary", "form", "derived"].includes(item.type || "")
            )
        );
      }
      return processedKpis;
    }, [columnId, processedKpis]);

    return (
      <>
        {showLoading ? (
          <LoadingSkeleton columnId={columnId} />
        ) : (
          <>
            {itemsToRender.map((item: any, index: number) => (
              <DraggableItem key={item.id} item={item} index={index} />
            ))}
            {itemsToRender.length === 0 && !isLoading && (
              <div className="text-center py-8 text-gray-400 text-sm">
                No items in this column
              </div>
            )}
          </>
        )}
      </>
    );
  },
  (prevProps, nextProps) => {
    return (
      prevProps.columnId === nextProps.columnId &&
      prevProps.colId === nextProps.colId &&
      prevProps.shouldRefresh === nextProps.shouldRefresh
    );
  }
);

// Loading skeleton component
const LoadingSkeleton = React.memo(({ columnId }: { columnId: string }) => (
  <div className="space-y-4">
    {[...Array(3)].map((_, index) => (
      <div
        key={`${columnId}-card-shimmer-${index}`}
        className="bg-white/50 rounded-xl p-4 border border-gray-100 mb-2 overflow-hidden"
      >
        <div className="space-y-3">
          <div className="flex justify-between items-start">
            <Shimmer width="w-3/4" height="h-5" rounded={true} />
            <Shimmer width="w-16" height="h-4" rounded={true} />
          </div>
          <Shimmer width="w-1/2" height="h-4" rounded={true} />
          <div className="h-[120px] bg-gray-50/50 rounded-lg">
            <Shimmer width="w-full" height="h-full" rounded={true} />
          </div>
        </div>
      </div>
    ))}
  </div>
));

// KPI Dashboard component
const KPIDashboard = React.memo(
  ({ item }: { item: KPICard }) => {
    // Create a stable reference for the taskUserSelections and dispatch action
    const taskUserSelectionsRef = useRef({});
    const { dispatch } = useDashboard();

    // Create a memoized callback that won't change on rerenders
    const handleTaskUserSelectionsChange = useCallback(
      (selections: any) => {
        dispatch({ type: "SET_TASK_USER_SELECTIONS", payload: selections });
      },
      [dispatch]
    );

    // Memoized item props to reduce object creation on every render
    const itemProps = useMemo(
      () => ({
        isWidget: true,
        taskUserSelections: taskUserSelectionsRef.current,
        kpiThumbainData: item,
        onTaskUserSelectionsChange: handleTaskUserSelectionsChange,
        kpiId: item.id || "default-kpi-id",
      }),
      [item, handleTaskUserSelectionsChange]
    );

    return (
      <div className="h-[185px] overflow-hidden bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-gray-100 mb-2 cursor-pointer hover:shadow-md transition-shadow">
        <div
          style={{
            transform: "scale(0.275)",
            transformOrigin: "top left",
            width: "360%",
          }}
        >
          <KPIDetailView {...itemProps} />
        </div>
      </div>
    );
  },
  (prevProps, nextProps) => {
    // Strict equality check for props
    return prevProps.item.id === nextProps.item.id;
  }
);

// KPI Summary component
const KPISummary = React.memo(
  ({ item }: { item: KPICard }) => {
    return (
      <div className="h-[150px] overflow-hidden bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-gray-100">
        <div
          style={{
            transform: "scale(0.275)",
            transformOrigin: "top left",
            width: "360%",
          }}
        >
          <div>
            <KPIStatusSummaryView />
          </div>
        </div>
      </div>
    );
  },
  (prevProps, nextProps) => true
); // Always reuse instance

// KPI Form component
const KpiForm = React.memo(
  () => {
    const { dispatch, state } = useDashboard();

    const handleClick = useCallback(
      (e: React.MouseEvent) => {
        e.stopPropagation();
        dispatch({
          type: "SET_MODALS",
          payload: { ...state.modals, isCreateKPIModalOpen: true },
        });
      },
      [dispatch, state.modals]
    );

    return (
      <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm p-6 space-y-5 border border-gray-100">
        <button
          onClick={handleClick}
          className="w-full bg-gradient-to-r from-[#4285f4] to-[#4285f4]/90 hover:from-[#4285f4]/90 hover:to-[#4285f4] 
            text-white py-3.5 px-4 rounded-lg text-sm font-semibold transition-all duration-300
            shadow-md hover:shadow-lg transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
        >
          <span className="tracking-wide">CREATE NEW KPI</span>
        </button>
        <div className="flex items-stretch gap-4">
          <div
            className="w-full text-xs text-gray-500 p-3 bg-gray-50/80 rounded-lg border border-gray-100
            flex flex-col justify-center leading-relaxed"
          >
            <p className="font-medium text-gray-600 mb-0.5">Task KPIs</p>
            <p>For tracking KPIs that are binary like</p>
            <p>launching products or hiring a person.</p>
          </div>
        </div>
      </div>
    );
  },
  () => true
); // Always reuse the same component instance

// KPI Derived Form component
const KpiDerivedForm = React.memo(
  () => {
    const { dispatch, state } = useDashboard();

    const handleClick = useCallback(
      (e: React.MouseEvent) => {
        e.stopPropagation();
        dispatch({
          type: "SET_MODALS",
          payload: { ...state.modals, isCreateDerivedKPIModalOpen: true },
        });
      },
      [dispatch, state.modals]
    );

    return (
      <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm p-6 space-y-5 border border-gray-100">
        <button
          onClick={handleClick}
          className="w-full bg-gradient-to-r from-[#4285f4] to-[#4285f4]/90 hover:from-[#4285f4]/90 hover:to-[#4285f4] 
            text-white py-3.5 px-4 rounded-lg text-sm font-semibold transition-all duration-300
            shadow-md hover:shadow-lg transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
        >
          <span className="tracking-wide">CREATE DERIVED KPI</span>
        </button>
        <div className="flex items-stretch gap-4">
          <div
            className="w-full text-xs text-gray-500 p-3 bg-gray-50/80 rounded-lg border border-gray-100
            flex flex-col justify-center leading-relaxed"
          >
            <p className="font-medium text-gray-600 mb-0.5">Derived KPIs</p>
            <p>For tracking KPIs that are derived from</p>
            <p>other DERIVED KPIs or metrics.</p>
          </div>
        </div>
      </div>
    );
  },
  () => true
); // Always reuse the same component instance

// Add KPIModal component
interface AddKPIModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: () => void;
  column: KPIColumn | null;
  onTaskUserSelectionsChange: (
    selections:
      | { [key: string]: string[] }
      | ((prev: { [key: string]: string[] }) => { [key: string]: string[] })
  ) => void;
  taskUserSelections: { [key: string]: string[] };
}

const AddKPIModal: React.FC<AddKPIModalProps> = ({
  isOpen,
  onClose,
  onAdd,
  column,
  onTaskUserSelectionsChange,
  taskUserSelections,
}) => {
  const { dispatch, state } = useDashboard();
  const { refetch: refetchKPIDashboard } = useKPIDashboard();

  const handleRefresh = () => {
    const newRefreshQueue = new Set(state.refreshQueue);

    // Add column to refresh queue
    if (column?.id) {
      newRefreshQueue.add(column.id);
    }

    // Always refresh the main KPIs column
    newRefreshQueue.add("kpis");
    dispatch({ type: "SET_REFRESH_QUEUE", payload: newRefreshQueue });

    // Trigger immediate refetch
    refetchKPIDashboard();
  };

  return (
    <RemoteModal
      open={isOpen}
      handleClose={onClose}
      modalTitle="Add New KPI"
      width="md"
      position="center"
      modalBody={
        <CreateKPIForm
          onSuccess={onAdd}
          onCancel={onClose}
          group={column?.id || ""}
          onRefresh={handleRefresh}
        />
      }
    />
  );
};

// Add Derived KPIModal component
interface AddDerivedKPIModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: () => void;
  column: KPIColumn | null;
  onTaskUserSelectionsChange: (
    selections:
      | { [key: string]: string[] }
      | ((prev: { [key: string]: string[] }) => { [key: string]: string[] })
  ) => void;
  taskUserSelections: { [key: string]: string[] };
}

const AddDerivedKPIModal: React.FC<AddDerivedKPIModalProps> = ({
  isOpen,
  onClose,
  onAdd,
  column,
  onTaskUserSelectionsChange,
  taskUserSelections,
}) => {
  const { dispatch, state } = useDashboard();
  const { refetch: refetchKPIDashboard } = useKPIDashboard();
  const [currentStep, setCurrentStep] = useState<"select" | "form">("select");

  const handleRefresh = () => {
    if (column?.id) {
      const newRefreshQueue = new Set(state.refreshQueue);
      newRefreshQueue.add(column.id);
      newRefreshQueue.add("kpis");
      dispatch({ type: "SET_REFRESH_QUEUE", payload: newRefreshQueue });
      refetchKPIDashboard();
    }
  };

  return (
    <RemoteModal
      open={isOpen}
      handleClose={onClose}
      modalTitle={
        currentStep === "select" ? "Select KPIs" : "Create New Derived KPI"
      }
      width="md"
      position="center"
      modalBody={
        <DerivedKPIForm
          onSuccess={onAdd}
          onCancel={onClose}
          group={column?.id || ""}
          onStepChange={setCurrentStep}
          onRefresh={handleRefresh}
        />
      }
    />
  );
};

// Edit KPIModal component
interface EditKPIModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEdit: () => void;
  kpi: KPICard | null;
  onTaskUserSelectionsChange: (
    selections:
      | { [key: string]: string[] }
      | ((prev: { [key: string]: string[] }) => { [key: string]: string[] })
  ) => void;
  taskUserSelections: { [key: string]: string[] };
}

const EditKPIModal: React.FC<EditKPIModalProps> = ({
  isOpen,
  onClose,
  onEdit,
  kpi,
  onTaskUserSelectionsChange,
  taskUserSelections,
}) => {
  const { dispatch, state } = useDashboard();

  return (
    <RemoteModal
      open={isOpen}
      handleClose={onClose}
      modalTitle="Edit KPI"
      width="md"
      position="center"
      modalBody={
        <CreateKPIForm
          onSuccess={onEdit}
          onCancel={onClose}
          group={kpi?.id || ""}
          onRefresh={() => {
            if (kpi?.id) {
              // Add to refresh queue instead of directly dispatching
              const newRefreshQueue = new Set(state.refreshQueue);
              newRefreshQueue.add(kpi.id);
              dispatch({ type: "SET_REFRESH_QUEUE", payload: newRefreshQueue });
            }
          }}
        />
      }
    />
  );
};

// Delete KPIModal component
interface DeleteKPIModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDelete: () => void;
  kpi: KPICard | null;
}

const DeleteKPIModal: React.FC<DeleteKPIModalProps> = ({
  isOpen,
  onClose,
  onDelete,
  kpi,
}) => {
  return (
    <RemoteSmallModal
      open={isOpen}
      modalTitle="Delete KPI"
      modalBody="Are you sure you want to delete this KPI?"
      width="xs"
      okText="Delete"
      closeText="Cancel"
      handleClose={onClose}
      handleOK={onDelete}
    />
  );
};

// Set display names for all memo components
ColumnItems.displayName = "ColumnItems";
LoadingSkeleton.displayName = "LoadingSkeleton";
ColumnShimmer.displayName = "ColumnShimmer";
KPIDashboard.displayName = "KPIDashboard";
KPISummary.displayName = "KPISummary";
KpiForm.displayName = "KpiForm";
KpiDerivedForm.displayName = "KpiDerivedForm";
FormModals.displayName = "FormModals";
DraggableItem.displayName = "DraggableItem";
ColumnRenderer.displayName = "ColumnRenderer";
DashboardContent.displayName = "DashboardContent";

// Simple component to list all KPIs in the first column
const KPIsList = React.memo(
  () => {
    const { dispatch } = useDashboard();
    const { data: kpisData, isLoading } = useKPIDashboard({
      pageNumber: 0,
      limit: 20,
      group: "",
    });

    // Handle KPI click
    const handleKPIClick = useCallback(
      (kpi: any) => {
        dispatch({ type: "SET_SELECTED_DERIVED_KPI", payload: kpi });
      },
      [dispatch]
    );

    // Create stable references outside of the render function
    const taskUserSelectionsRef = useRef({});

    // Create a stable change handler
    const handleSelectionChange = useCallback(
      (selections: any) => {
        dispatch({ type: "SET_TASK_USER_SELECTIONS", payload: selections });
      },
      [dispatch]
    );

    // Create a memoized render function for each KPI
    const renderKPI = useCallback(
      (kpi: any) => {
        return (
          <div
            key={kpi.id}
            onClick={() => handleKPIClick(kpi)}
            className="h-[185px] overflow-hidden bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-gray-100 mb-2 cursor-pointer hover:shadow-md transition-shadow"
          >
            <div
              style={{
                transform: "scale(0.275)",
                transformOrigin: "top left",
                width: "360%",
              }}
            >
              <KPIDetailView
                isWidget={true}
                taskUserSelections={taskUserSelectionsRef.current}
                kpiThumbainData={kpi}
                onTaskUserSelectionsChange={handleSelectionChange}
                kpiId={kpi.id || "default-kpi-id"}
              />
            </div>
          </div>
        );
      },
      [handleKPIClick, handleSelectionChange]
    );

    // Render loading state
    const loadingContent = (
      <div className="flex justify-center py-4">
        <div className="animate-pulse flex space-x-4">
          <div className="flex-1 space-y-4 py-1">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            </div>
          </div>
        </div>
      </div>
    );

    // Memoize the content - always return a value, never conditionally
    const renderedContent = useMemo(() => {
      if (isLoading) {
        return loadingContent;
      }

      if (!kpisData || kpisData.length === 0) {
        return (
          <div className="text-center py-3 text-gray-400 text-sm">
            No KPIs found
          </div>
        );
      }

      return <div className="space-y-4">{kpisData.map(renderKPI)}</div>;
    }, [kpisData, isLoading, renderKPI]);

    // Always return one thing, never conditionally return
    return renderedContent;
  },
  () => true
); // Always keep the same instance to prevent rerenders

KPIsList.displayName = "KPIsList";

// Dashboard component
const Dashboard = ({ session }: { session: any }) => {
  // Create a more stable state initialization with useRef to avoid recreating state
  const initialStateRef = useRef(initialState);
  const [state, dispatch] = useReducer(
    dashboardReducer,
    initialStateRef.current
  );
  const [isInitializing, setIsInitializing] = useState(true);

  // Always call hooks in the same order regardless of conditions
  const categoriesData = useCategoryList();
  const {
    categories,
    isLoading: categoriesLoading,
    refetch: refetchCategories,
  } = categoriesData;

  // Pre-create initialColumns to avoid recreating them in effects
  const initialColumnsRef = useRef(createInitialColumns());

  // Helper function to create columns from categories - must not use any hooks inside
  const loadCategoryColumns = useCallback(() => {
    if (!categories || categories.length === 0) return;

    // Create columns from categories
    const categoryColumns = categories.map((category) => ({
      id: category.id,
      title: category.name,
      description: category.descriptin || "",
      status: category.status,
      items: [],
    }));

    // Combine the initial "NEW KPIs" column with category columns
    dispatch({
      type: "SET_COLUMNS",
      payload: [...initialColumnsRef.current, ...categoryColumns],
    });
  }, [categories, dispatch]);

  // First effect to handle initialization
  useEffect(() => {
    // Always set initial columns first
    dispatch({ type: "SET_COLUMNS", payload: initialColumnsRef.current });

    // This will run only once after initial columns are set
    if (!categoriesLoading && categories && isInitializing) {
      loadCategoryColumns();
      setIsInitializing(false);
    }
  }, [categoriesLoading, categories, isInitializing, loadCategoryColumns]);

  // Second effect to update columns when categories change after initialization
  useEffect(() => {
    if (!isInitializing && !categoriesLoading && categories) {
      loadCategoryColumns();
    }
  }, [categories, categoriesLoading, loadCategoryColumns, isInitializing]);

  // Create memoized context value to prevent all consumers from re-rendering
  const contextValue = useMemo(() => ({ state, dispatch }), [state]);

  // Memoize the loading component to avoid recreating it
  const loadingComponent = useMemo(
    () => (
      <div className="bg-gray-50 min-h-screen flex flex-col">
        <div className="flex-1 relative">
          <div
            className="absolute inset-0 flex items-start p-4 overflow-x-auto"
            style={{
              overflowY: "hidden",
              minHeight: "calc(100vh - 4rem)",
            }}
          >
            <ColumnShimmer />
          </div>
        </div>
      </div>
    ),
    []
  );

  // Use a memoized content component to avoid unnecessary renders
  const dashboardContent = useMemo(() => {
    if (isInitializing || categoriesLoading) {
      return loadingComponent;
    }

    return (
      <DashboardContext.Provider value={contextValue}>
        <DashboardContent session={session} />
      </DashboardContext.Provider>
    );
  }, [
    isInitializing,
    categoriesLoading,
    loadingComponent,
    contextValue,
    session,
  ]);

  return dashboardContent;
};

export default Dashboard;
