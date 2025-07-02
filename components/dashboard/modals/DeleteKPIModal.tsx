import { DeleteKPIModalProps } from "../types/dashboard";

export class DeleteKPIModal {
  private props: DeleteKPIModalProps;

  constructor(props: DeleteKPIModalProps) {
    this.props = props;
  }

  public render() {
    const { isOpen, onClose, onDelete, kpi } = this.props;
    
    return {
      type: "small-modal",
      isOpen,
      title: "Delete KPI",
      content: {
        message: "Are you sure you want to delete this KPI?",
        kpi: kpi
      },
      actions: {
        cancel: {
          text: "Cancel",
          handler: onClose
        },
        confirm: {
          text: "Delete",
          handler: onDelete,
          variant: "danger"
        }
      }
    };
  }
}