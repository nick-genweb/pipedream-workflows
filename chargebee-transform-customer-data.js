export default defineComponent({
  async run({ steps, $ }) {
    // Get data from previous step - adjust step name as needed
    // If your validation step is named differently, change 'validate_input' to match
    const inputData = steps.validate_input?.$return_value || steps.trigger.event.body;
    
    const transformedData = {
      first_name: inputData.first_name || "",
      last_name: inputData.last_name || "",
      email: inputData.email,
      phone: inputData.phone || "",
      company: inputData.company || "",
    };
    
    if (inputData.billing_address) {
      transformedData.billing_address = {
        first_name: inputData.billing_address.first_name || inputData.first_name || "",
        last_name: inputData.billing_address.last_name || inputData.last_name || "",
        line1: inputData.billing_address.line1 || "",
        line2: inputData.billing_address.line2 || "",
        city: inputData.billing_address.city || "",
        state: inputData.billing_address.state || "",
        zip: inputData.billing_address.zip || "",
        country: inputData.billing_address.country || "US"
      };
    }
    
    if (inputData.auto_collection !== undefined) {
      transformedData.auto_collection = inputData.auto_collection ? "on" : "off";
    }
    
    if (inputData.net_term_days !== undefined) {
      transformedData.net_term_days = parseInt(inputData.net_term_days);
    }
    
    if (inputData.taxability) {
      transformedData.taxability = inputData.taxability;
    }
    
    if (inputData.locale) {
      transformedData.locale = inputData.locale;
    }
    
    if (inputData.notes) {
      transformedData.notes = inputData.notes;
    }
    
    if (inputData.meta_data) {
      transformedData.meta_data = {
        ...inputData.meta_data,
        created_via: "pipedream_workflow",
        created_at: new Date().toISOString()
      };
    }
    
    console.log("Transformed customer data:", transformedData);
    
    return transformedData;
  },
});