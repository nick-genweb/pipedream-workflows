import { axios } from "@pipedream/platform";

export default defineComponent({
  props: {
    quickbooks: {
      type: "app",
      app: "quickbooks",
    }
  },
  async run({ steps, $ }) {
    
    // Step 1: Set date range
    const startDate = "2025-08-01";
    const endDate = "2025-08-15";
    
    console.log(`Retrieving time entries from ${startDate} to ${endDate}`);
    
    // Step 2: Retrieve time entries from QuickBooks
    const companyId = this.quickbooks.$auth.company_id;
    const isSandbox = this.quickbooks.$auth.is_sandbox;
    const baseUrl = isSandbox 
      ? "https://sandbox-quickbooks.api.intuit.com" 
      : "https://quickbooks.api.intuit.com";
    
    const url = `${baseUrl}/v3/company/${companyId}/query`;
    
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
      
      const timeEntries = response?.QueryResponse?.TimeActivity || [];
      console.log(`Found ${timeEntries.length} time entries`);
      
      // Step 3: Format data for CSV
      if (timeEntries.length === 0) {
        return {
          message: "No time entries found for the specified date range.",
          dateRange: { startDate, endDate }
        };
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
      
      // Return the data for next steps
      return {
        summary: `Successfully retrieved ${timeEntries.length} time entries`,
        dateRange: { startDate, endDate },
        csvContent: csvContent,
        entries: timeEntries,
        totalEntries: timeEntries.length
      };
      
    } catch (error) {
      console.error("Error retrieving time entries:", error.message);
      throw new Error(`Failed to retrieve time entries: ${error.message}`);
    }
  }
});