import { 
  DashboardState, 
  DashboardAction, 
  KPIColumn, 
  KPICard 
} from "../types/dashboard";
import { lineChartData, lineChartOptions } from "../config/charts";

// Initial state
export const initialState: DashboardState = {
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

// Dashboard reducer function
export const dashboardReducer = (
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

// Create initial columns helper function
export const createInitialColumns = (): KPIColumn[] => [
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