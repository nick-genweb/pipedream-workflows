export default defineComponent({
  async run({ steps, $ }) {
    // Get the CSV content from the previous step
    const csvContent = steps.code.$return_value.csvContent;
    const dateRange = steps.code.$return_value.dateRange;
    const totalEntries = steps.code.$return_value.totalEntries;
    
    if (!csvContent) {
      await $.respond({
        status: 404,
        headers: {
          "Content-Type": "text/plain"
        },
        body: "No time entries found for the specified date range."
      });
      return;
    }
    
    // Return CSV file as HTTP response
    await $.respond({
      status: 200,
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="quickbooks_time_entries_${dateRange.startDate}_to_${dateRange.endDate}.csv"`
      },
      body: csvContent
    });
    
    // Also return summary for workflow logs
    return {
      message: `CSV file generated with ${totalEntries} time entries`,
      filename: `quickbooks_time_entries_${dateRange.startDate}_to_${dateRange.endDate}.csv`,
      size: csvContent.length
    };
  }
});