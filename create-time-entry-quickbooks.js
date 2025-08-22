import { axios } from "@pipedream/platform";

export default defineComponent({
  props: {
    quickbooks: {
      type: "app",
      app: "quickbooks",
    },
    // Input parameters for the time entry
    employeeId: {
      type: "string",
      label: "Employee ID",
      description: "QuickBooks Employee ID (e.g., '55')",
    },
    customerId: {
      type: "string",
      label: "Customer ID",
      description: "QuickBooks Customer ID (optional)",
      optional: true,
    },
    itemId: {
      type: "string",
      label: "Service Item ID",
      description: "QuickBooks Service Item ID (optional)",
      optional: true,
    },
    date: {
      type: "string",
      label: "Date",
      description: "Date of time entry (YYYY-MM-DD)",
      default: new Date().toISOString().split('T')[0],
    },
    hours: {
      type: "integer",
      label: "Hours",
      description: "Number of hours worked",
      default: 0,
    },
    minutes: {
      type: "integer",
      label: "Minutes",
      description: "Number of minutes worked",
      default: 0,
    },
    description: {
      type: "string",
      label: "Description",
      description: "Description of work performed",
      optional: true,
    },
    billableStatus: {
      type: "string",
      label: "Billable Status",
      description: "Billable, NotBillable, or HasBeenBilled",
      options: ["Billable", "NotBillable", "HasBeenBilled"],
      default: "Billable",
    },
    hourlyRate: {
      type: "string",
      label: "Hourly Rate",
      description: "Hourly rate for billable time (optional)",
      optional: true,
    }
  },
  async run({ steps, $ }) {
    // Get QuickBooks auth details
    const companyId = this.quickbooks.$auth.company_id;
    const isSandbox = this.quickbooks.$auth.is_sandbox;
    const baseUrl = isSandbox 
      ? "https://sandbox-quickbooks.api.intuit.com" 
      : "https://quickbooks.api.intuit.com";
    
    const url = `${baseUrl}/v3/company/${companyId}/timeactivity`;
    
    // Build the time entry object
    const timeEntry = {
      TxnDate: this.date,
      NameOf: "Employee",
      EmployeeRef: {
        value: this.employeeId
      },
      Hours: parseInt(this.hours) || 0,
      Minutes: parseInt(this.minutes) || 0,
      BillableStatus: this.billableStatus,
    };
    
    // Add optional fields if provided
    if (this.customerId) {
      timeEntry.CustomerRef = {
        value: this.customerId
      };
    }
    
    if (this.itemId) {
      timeEntry.ItemRef = {
        value: this.itemId
      };
    }
    
    if (this.description) {
      timeEntry.Description = this.description;
    }
    
    if (this.hourlyRate && this.billableStatus === "Billable") {
      timeEntry.HourlyRate = parseFloat(this.hourlyRate);
    }
    
    console.log("Creating time entry:", JSON.stringify(timeEntry, null, 2));
    
    try {
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
      
      console.log(`Time entry created successfully with ID: ${createdEntry.Id}`);
      
      // Return the created time entry details
      return {
        success: true,
        message: `Time entry created successfully`,
        timeEntryId: createdEntry.Id,
        details: {
          id: createdEntry.Id,
          date: createdEntry.TxnDate,
          employee: createdEntry.EmployeeRef?.name || this.employeeId,
          customer: createdEntry.CustomerRef?.name || this.customerId,
          hours: createdEntry.Hours,
          minutes: createdEntry.Minutes,
          description: createdEntry.Description,
          billableStatus: createdEntry.BillableStatus,
          hourlyRate: createdEntry.HourlyRate,
          totalHours: createdEntry.Hours + (createdEntry.Minutes / 60),
          syncToken: createdEntry.SyncToken,
          createdTime: createdEntry.MetaData?.CreateTime,
        },
        fullResponse: createdEntry
      };
      
    } catch (error) {
      console.error("Error creating time entry:", error.response?.data || error.message);
      throw new Error(`Failed to create time entry: ${error.response?.data?.Fault?.Error?.[0]?.Message || error.message}`);
    }
  }
});