import { axios } from "@pipedream/platform";

export default {
  name: "Retrieve Time Entries",
  description: "Retrieves QuickBooks time entries from 8/1/25 to 8/15/25 and creates a CSV file",
  version: "0.0.1",
  type: "workflow",
  props: {
    quickbooks: {
      type: "app",
      app: "quickbooks",
    },
    manual: {
      type: "$.interface.http",
      customResponse: true,
    }
  },
  async run({ steps, $ }) {
    // Step 1: Set date range
    const startDate = "2025-08-01";
    const endDate = "2025-08-15";
    
    console.log(`Retrieving time entries from ${startDate} to ${endDate}`);
    
    // Step 2: Retrieve time entries from QuickBooks
    // QuickBooks API endpoint for time activities
    const companyId = this.quickbooks.$auth.company_id;
    const url = `https://sandbox-quickbooks.api.intuit.com/v3/company/${companyId}/query`;
    
    // Query for TimeActivity entities within date range
    const query = `SELECT * FROM TimeActivity WHERE TxnDate >= '${startDate}' AND TxnDate <= '${endDate}'`;
    
    try {
      const response = await axios($, {
        method: "GET",
        url: url,
        headers: {
          "Authorization": `Bearer ${this.quickbooks.$auth.oauth_access_token}`,
          "Accept": "application/json",
          "Content-Type": "application/text"
        },
        params: {
          query: query
        }
      });
      
      const timeEntries = response.QueryResponse?.TimeActivity || [];
      console.log(`Found ${timeEntries.length} time entries`);
      
      // Step 3: Format data for CSV
      if (timeEntries.length === 0) {
        $.respond({
          status: 200,
          headers: {
            "Content-Type": "text/plain"
          },
          body: "No time entries found for the specified date range."
        });
        return;
      }
      
      // Create CSV headers
      const csvHeaders = [
        "Date",
        "Employee",
        "Customer",
        "Item/Service",
        "Duration (Hours)",
        "Duration (Minutes)",
        "Description",
        "Billable",
        "Hourly Rate",
        "Total Amount"
      ];
      
      // Format time entries as CSV rows
      const csvRows = timeEntries.map(entry => {
        return [
          entry.TxnDate || "",
          entry.NameOf === "Employee" ? (entry.EmployeeRef?.name || "") : "",
          entry.CustomerRef?.name || "",
          entry.ItemRef?.name || "",
          entry.Hours || "0",
          entry.Minutes || "0",
          entry.Description || "",
          entry.BillableStatus || "NotBillable",
          entry.HourlyRate || "0",
          ((entry.Hours || 0) + (entry.Minutes || 0) / 60) * (entry.HourlyRate || 0)
        ];
      });
      
      // Step 4: Create CSV content
      const csvContent = [
        csvHeaders.join(","),
        ...csvRows.map(row => 
          row.map(cell => {
            // Escape quotes and wrap in quotes if contains comma
            const cellStr = String(cell);
            if (cellStr.includes(",") || cellStr.includes('"') || cellStr.includes("\n")) {
              return `"${cellStr.replace(/"/g, '""')}"`;
            }
            return cellStr;
          }).join(",")
        )
      ].join("\n");
      
      // Step 5: Return CSV file as response
      $.respond({
        status: 200,
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="quickbooks_time_entries_${startDate}_to_${endDate}.csv"`
        },
        body: csvContent
      });
      
      // Also return data for further processing if needed
      return {
        summary: `Successfully retrieved ${timeEntries.length} time entries`,
        dateRange: { startDate, endDate },
        csvContent: csvContent,
        entries: timeEntries
      };
      
    } catch (error) {
      console.error("Error retrieving time entries:", error);
      $.respond({
        status: 500,
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          error: "Failed to retrieve time entries",
          message: error.message,
          details: error.response?.data
        })
      });
      throw error;
    }
  }
};