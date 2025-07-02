// Chart configuration
export const lineChartOptions = {
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
export const lineChartData = {
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