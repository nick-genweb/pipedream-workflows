import { axios } from "@pipedream/platform";

export default defineComponent({
  props: {
    chargebee: {
      type: "app",
      app: "chargebee",
    },
  },
  async run({ steps, $ }) {
    const customerData = {
      first_name: "Test",
      last_name: "Customer",
      email: `test.customer.${Date.now()}@example.com`,
      phone: "+1234567890",
      company: "Test Company",
      billing_address: {
        first_name: "Test",
        last_name: "Customer",
        line1: "123 Test Street",
        city: "Test City",
        state: "CA",
        zip: "12345",
        country: "US"
      },
      auto_collection: "on",
      net_term_days: 0,
      allow_direct_debit: false,
      taxability: "taxable",
      locale: "en-US",
      meta_data: {
        created_via: "pipedream_workflow",
        environment: "sandbox"
      }
    };

    try {
      const response = await axios($, {
        method: "POST",
        url: `https://${this.chargebee.$auth.site}.chargebee.com/api/v2/customers`,
        auth: {
          username: this.chargebee.$auth.api_key,
          password: "",
        },
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        data: Object.entries(customerData).map(([key, value]) => {
          if (typeof value === 'object' && value !== null) {
            return Object.entries(value).map(([subKey, subValue]) => 
              `${key}[${subKey}]=${encodeURIComponent(subValue)}`
            ).join('&');
          }
          return `${key}=${encodeURIComponent(value)}`;
        }).join('&'),
      });

      console.log("Customer created successfully!");
      console.log("Customer ID:", response.customer.id);
      console.log("Customer Email:", response.customer.email);
      
      return {
        success: true,
        customer: response.customer,
        message: `Customer ${response.customer.id} created successfully`
      };
    } catch (error) {
      console.error("Error creating customer:", error.response?.data || error.message);
      
      return {
        success: false,
        error: error.response?.data || error.message,
        statusCode: error.response?.status
      };
    }
  },
});