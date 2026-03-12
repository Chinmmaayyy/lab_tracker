import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { DeviceData } from './firebase';

export const exportDeviceToExcel = (device: DeviceData) => {
  const summaryData: any[] = [];
  const detailedAppData: any[] = [];
  const detailedWebData: any[] = [];

  // Check if history exists (from your screenshot)
  if (device.history) {
    Object.entries(device.history).forEach(([date, dayData]: [string, any]) => {
      summaryData.push({
        Date: date,
        "Total Time (Min)": ((dayData.total_screen_time || 0) / 60).toFixed(2),
        "Device ID": device.device_id
      });

      if (dayData.app_usage) {
        Object.entries(dayData.app_usage).forEach(([app, time]) => {
          detailedAppData.push({ Date: date, Application: app, "Minutes": (Number(time) / 60).toFixed(2) });
        });
      }

      if (dayData.web_usage) {
        Object.entries(dayData.web_usage).forEach(([browser, sites]: [string, any]) => {
          Object.entries(sites).forEach(([site, time]) => {
            detailedWebData.push({ Date: date, Browser: browser, Website: site, "Minutes": (Number(time) / 60).toFixed(2) });
          });
        });
      }
    });
  } else {
    // FALLBACK: If history is not available, export current dashboard data
    summaryData.push({ Date: "Current/Today", "Total Time (Min)": (device.total_screen_time / 60).toFixed(2) });
    Object.entries(device.app_usage).forEach(([app, time]) => {
      detailedAppData.push({ Date: "Current", Application: app, "Minutes": (time / 60).toFixed(2) });
    });
  }

  // Create Sheets
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(summaryData), "Daily Summary");
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(detailedAppData), "App Logs");
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(detailedWebData), "Web Logs");

  // Save
  const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  saveAs(new Blob([excelBuffer]), `${device.device_id}_Report.xlsx`);
};