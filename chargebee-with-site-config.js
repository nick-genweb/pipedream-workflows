import { axios } from "@pipedream/platform";

export default defineComponent({
  props: {
    chargebee: {
      type: "app",
      app: "chargebee",
    },
    chargebee_site: {
      type: "string",
      label: "Chargebee Site Name",
      description: "Your Chargebee site subdomain (e.g., 'acme-test' for acme-test.chargebee.com)"
    }
  },
  async run({ steps, $ }) {
    // Get customer data directly from HTTP trigger
    const inputData = steps.trigger.event.body;
    
    console.log("Received customer data:", inputData);
    console.log("Using Chargebee site:", this.chargebee_site);
    
    // Validate required fields
    if (!inputData.email) {
      return {
        status: 400,
        body: { 
          success: false, 
          error: "Email is required" 
        }
      };
    }
    
    if (!inputData.first_name && !inputData.last_name && !inputData.company) {
      return {
        status: 400,
        body: { 
          success: false, 
          error: "At least one of first_name, last_name, or company is required" 
        }
      };
    }
    
    // Transform and prepare data for Chargebee
    const customerData = {
      first_name: inputData.first_name || "",
      last_name: inputData.last_name || "",
      email: inputData.email,
      phone: inputData.phone || "",
      company: inputData.company || "",
    };
    
    // Add optional fields if provided
    if (inputData.billing_address) {
      customerData.billing_address = {
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
      customerData.auto_collection = inputData.auto_collection ? "on" : "off";
    }
    
    if (inputData.net_term_days !== undefined) {
      customerData.net_term_days = parseInt(inputData.net_term_days);
    }
    
    if (inputData.taxability) {
      customerData.taxability = inputData.taxability;
    }
    
    if (inputData.locale) {
      customerData.locale = inputData.locale;
    }
    
    if (inputData.notes) {
      customerData.notes = inputData.notes;
    }
    
    // Format data for Chargebee API
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
        url: `https://${this.chargebee_site}.chargebee.com/api/v2/customers`,
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
      
      return {
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
            phone: response.customer.phone,
            created_at: new Date(response.customer.created_at * 1000).toISOString()
          },
          message: `Customer ${response.customer.id} created successfully in Chargebee`
        }
      };
      
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message;
      const errorCode = error.response?.data?.error_code || "UNKNOWN";
      
      console.error("❌ Error creating customer:", errorMessage);
      console.error("Error details:", error.response?.data);
      
      return {
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
      };
    }
  },
});