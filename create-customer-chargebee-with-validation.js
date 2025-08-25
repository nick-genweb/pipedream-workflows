import { axios } from "@pipedream/platform";

export default defineComponent({
  props: {
    chargebee: {
      type: "app",
      app: "chargebee",
    },
    customerData: {
      type: "object",
      label: "Customer Data",
      description: "Customer information to create in Chargebee",
      default: {
        first_name: "Test",
        last_name: "Customer",
        email: "test@example.com"
      }
    }
  },
  async run({ steps, $ }) {
    const validateEmail = (email) => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(email);
    };

    const validateCustomerData = (data) => {
      const errors = [];
      
      if (!data.email) {
        errors.push("Email is required");
      } else if (!validateEmail(data.email)) {
        errors.push("Invalid email format");
      }
      
      if (!data.first_name && !data.last_name && !data.company) {
        errors.push("At least one of first_name, last_name, or company is required");
      }
      
      if (data.phone && !/^\+?[\d\s-()]+$/.test(data.phone)) {
        errors.push("Invalid phone number format");
      }
      
      if (data.net_term_days && (data.net_term_days < 0 || data.net_term_days > 365)) {
        errors.push("net_term_days must be between 0 and 365");
      }
      
      return errors;
    };

    const customerData = {
      ...this.customerData,
      email: this.customerData.email?.includes('@') 
        ? this.customerData.email 
        : `${this.customerData.email || 'test'}.${Date.now()}@example.com`
    };

    const validationErrors = validateCustomerData(customerData);
    if (validationErrors.length > 0) {
      console.error("Validation errors:", validationErrors);
      return {
        success: false,
        errors: validationErrors,
        message: "Customer data validation failed"
      };
    }

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
        } else if (Array.isArray(value)) {
          value.forEach((item, index) => {
            if (typeof item === 'object') {
              for (const [itemKey, itemValue] of Object.entries(item)) {
                formatted.push(`${key}[${index}][${itemKey}]=${encodeURIComponent(itemValue)}`);
              }
            } else {
              formatted.push(`${key}[${index}]=${encodeURIComponent(item)}`);
            }
          });
        } else {
          formatted.push(`${key}=${encodeURIComponent(value)}`);
        }
      }
      
      return formatted.join('&');
    };

    try {
      console.log("Creating customer with data:", customerData);
      
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

      if (!response.customer || !response.customer.id) {
        throw new Error("Invalid response from Chargebee - missing customer data");
      }

      console.log("✅ Customer created successfully!");
      console.log("Customer ID:", response.customer.id);
      console.log("Customer Email:", response.customer.email);
      console.log("Created At:", new Date(response.customer.created_at * 1000).toISOString());
      
      return {
        success: true,
        customer: {
          id: response.customer.id,
          email: response.customer.email,
          first_name: response.customer.first_name,
          last_name: response.customer.last_name,
          company: response.customer.company,
          phone: response.customer.phone,
          created_at: new Date(response.customer.created_at * 1000).toISOString(),
          auto_collection: response.customer.auto_collection,
          net_term_days: response.customer.net_term_days,
          resource_version: response.customer.resource_version,
          deleted: response.customer.deleted || false,
          object: response.customer.object
        },
        message: `Customer ${response.customer.id} created successfully in Chargebee`
      };
    } catch (error) {
      const errorDetails = error.response?.data || {};
      const errorMessage = errorDetails.message || error.message || "Unknown error";
      const errorCode = errorDetails.error_code || error.response?.status || "UNKNOWN";
      
      console.error("❌ Error creating customer in Chargebee:");
      console.error("Error Code:", errorCode);
      console.error("Error Message:", errorMessage);
      
      if (errorDetails.error_param) {
        console.error("Error Parameter:", errorDetails.error_param);
      }
      
      if (error.response?.status === 401) {
        console.error("Authentication failed. Please check your Chargebee API key and site.");
      } else if (error.response?.status === 400) {
        console.error("Bad request. Please check the customer data format.");
      } else if (error.response?.status === 404) {
        console.error("Endpoint not found. Please check your Chargebee site configuration.");
      }
      
      return {
        success: false,
        error: {
          code: errorCode,
          message: errorMessage,
          param: errorDetails.error_param,
          statusCode: error.response?.status,
          details: errorDetails
        },
        message: `Failed to create customer: ${errorMessage}`
      };
    }
  },
});