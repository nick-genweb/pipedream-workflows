export default defineComponent({
  async run({ steps, $ }) {
    const customerInput = steps.trigger.event.body;
    
    console.log("Received customer data:", customerInput);
    
    const requiredFields = ['email'];
    const missingFields = requiredFields.filter(field => !customerInput[field]);
    
    if (missingFields.length > 0) {
      $.flow.exit(`Missing required fields: ${missingFields.join(', ')}`);
    }
    
    if (!customerInput.first_name && !customerInput.last_name && !customerInput.company) {
      $.flow.exit("At least one of first_name, last_name, or company is required");
    }
    
    return customerInput;
  },
});