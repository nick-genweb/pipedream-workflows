import { axios } from "@pipedream/platform";

export default defineComponent({
  props: {
    chargebee: {
      type: "app",
      app: "chargebee",
    },
  },
  async run({ steps, $ }) {
    // Get data from previous step - adjust step name as needed
    const customerData = steps.transform_data?.$return_value || steps.trigger.event.body;
    
    const formatDataForChargebee = (data) => {
      const formatted = [];
      
      for (const [key, value] of Object.entries(data)) {
        if (value === null || value === undefined || value === '') {
          continue;
        }
        
        if (typeof value === 'object' && !Array.isArray(value)) {
          for (const [subKey, subValue] of Object.entries(value)) {
            if (subValue !== null && subValue !== undefined && subValue !== '') {
              formatted.push(`${key}[${subKey}]=${encodeURIComponent(subValue)}`);
            }
          }
        } else {
          formatted.push(`${key}=${encodeURIComponent(value)}`);
        }
      }
      
      return formatted.join('&');
    };

    try {
      console.log("Creating customer in Chargebee...");
      
      const response = await axios($, {
        method: "POST",
        url: `https://${this.chargebee.$auth.site}.chargebee.com/api/v2/customers`,
        auth: {
          username: this.chargebee.$auth.api_key,
          password: "",
        },
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "Accept": "application/json"
        },
        data: formatDataForChargebee(customerData),
      });

      console.log("✅ Customer created successfully!");
      console.log("Customer ID:", response.customer.id);
      console.log("Customer Email:", response.customer.email);
      
      await $.respond({
        status: 200,
        headers: {
          "Content-Type": "application/json"
        },
        body: {
          success: true,
          customer_id: response.customer.id,
          customer: {
            id: response.customer.id,
            email: response.customer.email,
            first_name: response.customer.first_name,
            last_name: response.customer.last_name,
            company: response.customer.company,
            created_at: new Date(response.customer.created_at * 1000).toISOString()
          },
          message: `Customer ${response.customer.id} created successfully`
        }
      });
      
      return response.customer;
      
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message;
      const errorCode = error.response?.data?.error_code || "UNKNOWN";
      
      console.error("❌ Error creating customer:", errorMessage);
      
      await $.respond({
        status: error.response?.status || 500,
        headers: {
          "Content-Type": "application/json"
        },
        body: {
          success: false,
          error: {
            code: errorCode,
            message: errorMessage,
            details: error.response?.data
          }
        }
      });
      
      $.flow.exit(`Failed to create customer: ${errorMessage}`);
    }
  },
});