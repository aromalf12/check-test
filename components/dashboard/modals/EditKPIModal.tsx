import { EditKPIModalProps } from "../types/dashboard";

export class EditKPIModal {
  private props: EditKPIModalProps;

  constructor(props: EditKPIModalProps) {
    this.props = props;
  }

  private handleRefresh = () => {
    // In actual implementation, this would use the dashboard context
    const { kpi } = this.props;
    
    if (kpi?.id) {
      // Add to refresh queue instead of directly dispatching
      // const newRefreshQueue = new Set(state.refreshQueue);
      // newRefreshQueue.add(kpi.id);
      // dispatch({ type: "SET_REFRESH_QUEUE", payload: newRefreshQueue });
    }
  };

  public render() {
    const { isOpen, onClose, onEdit, kpi } = this.props;
    
    return {
      type: "modal",
      isOpen,
      title: "Edit KPI",
      content: {
        form: {
          group: kpi?.id || "",
          type: "CreateKPIForm",
          mode: "edit",
          data: kpi
        }
      },
      actions: {
        cancel: onClose,
        submit: () => {
          this.handleRefresh();
          onEdit();
        }
      }
    };
  }
}