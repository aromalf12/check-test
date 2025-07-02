export interface KPIColumn {
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

export interface KPICard {
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

export interface DashboardModals {
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

export type DashboardAction =
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

export interface DashboardState {
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

export interface FormModalsProps {
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
  dispatch: (action: DashboardAction) => void;
}

export interface CreateColumnModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export interface AddKPIModalProps {
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

export interface AddDerivedKPIModalProps {
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

export interface EditKPIModalProps {
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

export interface DeleteKPIModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDelete: () => void;
  kpi: KPICard | null;
}