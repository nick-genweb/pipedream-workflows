import { axios } from "@pipedream/platform";

export default defineComponent({
  props: {
    chargebee: {
      type: "app",
      app: "chargebee",
    },
  },
  async run({ steps, $ }) {
    const minimalCustomerData = {
      first_name: "John",
      last_name: "Doe",
      email: `john.doe.${Date.now()}@example.com`
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
        data: Object.entries(minimalCustomerData)
          .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
          .join('&'),
      });

      console.log("Customer created successfully with minimal data!");
      console.log("Customer ID:", response.customer.id);
      
      return {
        success: true,
        customer: response.customer
      };
    } catch (error) {
      console.error("Error:", error.response?.data || error.message);
      
      return {
        success: false,
        error: error.response?.data || error.message
      };
    }
  },
});