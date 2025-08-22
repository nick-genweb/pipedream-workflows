# Pipedream QuickBooks Workflows

A collection of Pipedream workflow components for managing QuickBooks time entries. These workflows help automate time tracking operations including retrieving, creating, and exporting time entries.

## 🚀 Features

- **Retrieve Time Entries**: Query QuickBooks time entries for specific date ranges and export to CSV
- **Create Single Time Entry**: Add individual time entries to QuickBooks
- **Bulk Create Time Entries**: Create multiple time entries in batch
- **CSV Export**: Automatically format and download time entries as CSV files

## 📁 Workflow Components

### 1. Retrieve Time Entries (`retrieve-time-entries-code-step.js`)
Retrieves QuickBooks time entries within a specified date range and formats them for CSV export.

**Features:**
- Query time entries between custom date ranges
- Format data with employee, customer, and billing information
- Calculate total amounts based on hours and rates

### 2. Return CSV Response (`return-csv-response.js`)
Companion component that takes formatted data and returns it as a downloadable CSV file.

**Features:**
- Automatic CSV formatting with proper escaping
- Browser-friendly download headers
- Custom filename generation

### 3. Create Time Entry (`create-time-entry-quickbooks.js`)
Creates a single time entry in QuickBooks with comprehensive field support.

**Supported Fields:**
- Employee ID (required)
- Date
- Hours and Minutes
- Description
- Customer ID
- Service Item ID
- Billable Status
- Hourly Rate

### 4. Create Multiple Time Entries (`create-multiple-time-entries.js`)
Batch creation of time entries from JSON data.

**Features:**
- Process multiple entries in one workflow
- Error handling for individual entries
- Summary report of successes and failures
- Rate limiting protection

## 🔧 Installation

1. **Create a Pipedream Account**
   - Sign up at [pipedream.com](https://pipedream.com)

2. **Set up QuickBooks Connection**
   - Create a new workflow in Pipedream
   - Add a QuickBooks app connection
   - Authorize access to your QuickBooks account

3. **Add Workflow Components**
   - Create a new workflow with an HTTP trigger
   - Add a "Node.js code" step
   - Copy the relevant code from this repository
   - Connect your QuickBooks account when prompted

## 📝 Usage Examples

### Retrieving Time Entries

```javascript
// The workflow will retrieve entries from 8/1/25 to 8/15/25
// Modify these dates in the code as needed:
const startDate = "2025-08-01";
const endDate = "2025-08-15";
```

### Creating a Single Time Entry

Configure the workflow props with:
```javascript
{
  employeeId: "55",
  date: "2025-08-15",
  hours: 8,
  minutes: 30,
  description: "Development work",
  customerId: "12",
  billableStatus: "Billable",
  hourlyRate: "150"
}
```

### Batch Creating Time Entries

Provide JSON array in this format:
```json
[
  {
    "employeeId": "55",
    "date": "2025-08-15",
    "hours": 8,
    "minutes": 30,
    "description": "Project development",
    "customerId": "12",
    "billableStatus": "Billable",
    "hourlyRate": "150"
  },
  {
    "employeeId": "56",
    "date": "2025-08-15",
    "hours": 4,
    "minutes": 0,
    "description": "Client meeting",
    "customerId": "12",
    "billableStatus": "NotBillable"
  }
]
```

## 🔑 Required Permissions

Your QuickBooks app needs the following scopes:
- `com.intuit.quickbooks.accounting` - For reading and writing time activities

## 📊 CSV Export Format

The CSV export includes the following columns:
- Date
- Employee
- Customer
- Item/Service
- Duration (Hours)
- Duration (Minutes)
- Description
- Billable Status
- Hourly Rate
- Total Amount

## 🛠️ Configuration

### Environment Setup
These workflows use the QuickBooks connection configured in Pipedream. No additional environment variables are needed.

### API Endpoints
The workflows automatically detect sandbox vs production environments based on your QuickBooks connection.

## 📚 Pipedream Resources

- [Pipedream Documentation](https://pipedream.com/docs)
- [QuickBooks App Integration](https://pipedream.com/apps/quickbooks)
- [Building Workflows](https://pipedream.com/docs/workflows/)

## 🤝 Contributing

Feel free to submit issues and enhancement requests!

## 📄 License

MIT

## 👤 Author

Created for QuickBooks time tracking automation via Pipedream.

---

**Note**: Always test workflows in a QuickBooks sandbox environment before using in production.