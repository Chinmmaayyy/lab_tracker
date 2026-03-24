import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { DeviceData } from './firebase';

/* ======================================
    SINGLE DEVICE REPORT
====================================== */
export const exportDeviceToExcel = (device: DeviceData) => {
  const summaryData: any[] = [];
  const detailedAppData: any[] = [];
  const detailedWebData: any[] = [];

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
    summaryData.push({ Date: "Current/Today", "Total Time (Min)": (device.total_screen_time / 60).toFixed(2), "Device ID": device.device_id });
    Object.entries(device.app_usage).forEach(([app, time]) => {
      detailedAppData.push({ Date: "Current", Application: app, "Minutes": (time / 60).toFixed(2) });
    });
  }

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(summaryData), "Daily Summary");
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(detailedAppData), "App Logs");
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(detailedWebData), "Web Logs");

  const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  saveAs(new Blob([excelBuffer]), `${device.device_id}_Report.xlsx`);
};

/* ======================================
    LAB-WIDE AGGREGATED REPORT
====================================== */
export const exportLabToExcel = (devices: Record<string, DeviceData>, labId: string) => {
  const labSummary: any[] = [];
  const allAppLogs: any[] = [];
  const allWebLogs: any[] = [];

  Object.values(devices).forEach((device) => {
    // 1. Device Overview for the full lab
    labSummary.push({
      "Lab": labId,
      "Device ID": device.device_id,
      "Status": device.is_online ? "ONLINE" : "OFFLINE",
      "Current App": device.current_app,
      "Latest Session Min": (device.total_screen_time / 60).toFixed(2),
      "Last Sync": device.last_updated
    });

    // 2. Aggregate History if available
    if (device.history) {
      Object.entries(device.history).forEach(([date, dayData]: [string, any]) => {
        if (dayData.app_usage) {
          Object.entries(dayData.app_usage).forEach(([app, time]) => {
            allAppLogs.push({
              "Device ID": device.device_id,
              "Date": date,
              "Application": app,
              "Minutes": (Number(time) / 60).toFixed(2)
            });
          });
        }

        if (dayData.web_usage) {
          Object.entries(dayData.web_usage).forEach(([browser, sites]: [string, any]) => {
            Object.entries(sites).forEach(([site, time]) => {
              allWebLogs.push({
                "Device ID": device.device_id,
                "Date": date,
                "Browser": browser,
                "Website": site,
                "Minutes": (Number(time) / 60).toFixed(2)
              });
            });
          });
        }
      });
    }
  });

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(labSummary), "Lab Overview");
  
  if (allAppLogs.length > 0) {
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(allAppLogs), "Combined App Logs");
  }
  
  if (allWebLogs.length > 0) {
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(allWebLogs), "Combined Web Logs");
  }

  const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  saveAs(new Blob([excelBuffer]), `Lab_${labId}_Full_Report.xlsx`);
};