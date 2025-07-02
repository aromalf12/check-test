// KPI Form component interface
export interface KpiFormProps {
  onCreateClick: () => void;
}

export class KpiForm {
  private props: KpiFormProps;

  constructor(props: KpiFormProps) {
    this.props = props;
  }

  public render() {
    return {
      type: "card",
      className: "bg-white/80 backdrop-blur-sm rounded-xl shadow-sm p-6 space-y-5 border border-gray-100",
      content: {
        button: {
          text: "CREATE NEW KPI",
          className: "w-full bg-gradient-to-r from-[#4285f4] to-[#4285f4]/90 hover:from-[#4285f4]/90 hover:to-[#4285f4] text-white py-3.5 px-4 rounded-lg text-sm font-semibold transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 flex items-center justify-center gap-2",
          onClick: this.props.onCreateClick
        },
        description: {
          title: "Task KPIs",
          text: [
            "For tracking KPIs that are binary like",
            "launching products or hiring a person."
          ],
          className: "w-full text-xs text-gray-500 p-3 bg-gray-50/80 rounded-lg border border-gray-100 flex flex-col justify-center leading-relaxed"
        }
      }
    };
  }
}