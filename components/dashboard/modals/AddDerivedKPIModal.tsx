import { AddDerivedKPIModalProps } from "../types/dashboard";

export class AddDerivedKPIModal {
  private props: AddDerivedKPIModalProps;
  private currentStep: "select" | "form" = "select";

  constructor(props: AddDerivedKPIModalProps) {
    this.props = props;
  }

  private handleRefresh = () => {
    // In actual implementation, this would use the dashboard context
    const { column } = this.props;
    
    if (column?.id) {
      // Add to refresh queue
      // newRefreshQueue.add(column.id);
      // newRefreshQueue.add("kpis");
      // dispatch({ type: "SET_REFRESH_QUEUE", payload: newRefreshQueue });
      // refetchKPIDashboard();
    }
  };

  private setCurrentStep = (step: "select" | "form") => {
    this.currentStep = step;
  };

  public render() {
    const { isOpen, onClose, onAdd, column } = this.props;
    
    return {
      type: "modal",
      isOpen,
      title: this.currentStep === "select" ? "Select KPIs" : "Create New Derived KPI",
      content: {
        form: {
          group: column?.id || "",
          type: "DerivedKPIForm",
          step: this.currentStep
        }
      },
      actions: {
        cancel: onClose,
        submit: () => {
          this.handleRefresh();
          onAdd();
        }
      }
    };
  }
}