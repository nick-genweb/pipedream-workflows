import { axios } from "@pipedream/platform";

export default defineComponent({
  props: {
    quickbooks: {
      type: "app",
      app: "quickbooks",
    },
    timeEntries: {
      type: "string[]",
      label: "Time Entries JSON",
      description: "Array of time entries in JSON format. Each entry should have: employeeId, date (YYYY-MM-DD), hours, minutes, description, customerId (optional), billableStatus (optional)",
    }
  },
  async run({ steps, $ }) {
    // Parse time entries if they come as a string
    let entries = this.timeEntries;
    if (typeof entries === 'string') {
      try {
        entries = JSON.parse(entries);
      } catch (e) {
        throw new Error("Invalid JSON format for time entries");
      }
    }
    
    // Get QuickBooks auth details
    const companyId = this.quickbooks.$auth.company_id;
    const isSandbox = this.quickbooks.$auth.is_sandbox;
    const baseUrl = isSandbox 
      ? "https://sandbox-quickbooks.api.intuit.com" 
      : "https://quickbooks.api.intuit.com";
    
    const url = `${baseUrl}/v3/company/${companyId}/timeactivity`;
    
    const results = {
      successful: [],
      failed: [],
      summary: {
        total: entries.length,
        succeeded: 0,
        failed: 0
      }
    };
    
    // Process each time entry
    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];
      
      // Build the time entry object
      const timeEntry = {
        TxnDate: entry.date || new Date().toISOString().split('T')[0],
        NameOf: "Employee",
        EmployeeRef: {
          value: entry.employeeId
        },
        Hours: parseInt(entry.hours) || 0,
        Minutes: parseInt(entry.minutes) || 0,
        BillableStatus: entry.billableStatus || "Billable",
      };
      
      // Add optional fields
      if (entry.customerId) {
        timeEntry.CustomerRef = {
          value: entry.customerId
        };
      }
      
      if (entry.itemId) {
        timeEntry.ItemRef = {
          value: entry.itemId
        };
      }
      
      if (entry.description) {
        timeEntry.Description = entry.description;
      }
      
      if (entry.hourlyRate) {
        timeEntry.HourlyRate = parseFloat(entry.hourlyRate);
      }
      
      try {
        console.log(`Creating time entry ${i + 1} of ${entries.length}...`);
        
        const response = await axios($, {
          method: "POST",
          url: url,
          headers: {
            "Authorization": `Bearer ${this.quickbooks.$auth.oauth_access_token}`,
            "Accept": "application/json",
            "Content-Type": "application/json"
          },
          data: timeEntry
        });
        
        const createdEntry = response.TimeActivity;
        
        results.successful.push({
          index: i,
          id: createdEntry.Id,
          employee: entry.employeeId,
          date: createdEntry.TxnDate,
          hours: createdEntry.Hours,
          minutes: createdEntry.Minutes,
          description: createdEntry.Description
        });
        
        results.summary.succeeded++;
        
      } catch (error) {
        console.error(`Failed to create entry ${i + 1}:`, error.response?.data || error.message);
        
        results.failed.push({
          index: i,
          employee: entry.employeeId,
          date: entry.date,
          error: error.response?.data?.Fault?.Error?.[0]?.Message || error.message
        });
        
        results.summary.failed++;
      }
      
      // Add a small delay between requests to avoid rate limiting
      if (i < entries.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    
    console.log(`\nBatch creation complete:`);
    console.log(`✓ Succeeded: ${results.summary.succeeded}`);
    console.log(`✗ Failed: ${results.summary.failed}`);
    
    return results;
  }
});