import { DashboardState, DashboardAction } from "../types/dashboard";

// Dashboard context type
export interface DashboardContextType {
  state: DashboardState;
  dispatch: (action: DashboardAction) => void;
}

// This would be used with React.createContext in the actual implementation
export const DashboardContextConfig = {
  initialValue: undefined as DashboardContextType | undefined,
  displayName: "DashboardContext"
};

// Custom hook for using the dashboard context
export const useDashboard = () => {
  // This would use useContext(DashboardContext) in the actual implementation
  // For now, this serves as the interface definition
  throw new Error("useDashboard must be used within a DashboardProvider");
};