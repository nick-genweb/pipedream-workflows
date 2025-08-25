# Step-by-Step Guide: Create Chargebee Customer Workflow in Pipedream

## Overview
This workflow accepts customer data via HTTP POST request and creates a customer in your Chargebee sandbox account.

## Step 1: Create New Workflow
1. Log into Pipedream (pipedream.com)
2. Click **"New +"** → **"New Workflow"**
3. Name it: "Create Chargebee Customer"

## Step 2: Add HTTP Trigger (Customer Input)
1. For the trigger, select **"HTTP / Webhook"**
2. Choose **"HTTP Requests"**
3. Configure:
   - Method: **POST**
   - Response: **Return HTTP Response** (we'll configure this later)
4. Click **"Save and continue"**
5. Copy the unique URL - you'll send customer data to this endpoint

## Step 3: Add Validation Step
1. Click **"+"** to add a new step
2. Select **"Run Node.js code"**
3. Name the step: `validate_input`
4. Paste the code from `chargebee-workflow-http-trigger.js`
5. This step validates required fields and returns clean data

## Step 4: Add Data Transformation Step
1. Click **"+"** to add another step
2. Select **"Run Node.js code"**
3. Name the step: `transform_data`
4. Paste the code from `chargebee-transform-customer-data.js`
5. This step formats the data for Chargebee's API requirements

## Step 5: Add Chargebee Customer Creation Step
1. Click **"+"** to add another step
2. Select **"Run Node.js code"**
3. Name the step: `create_customer`
4. Paste the code from `chargebee-create-customer-final.js`
5. Click **"Connect Account"** when prompted
6. Select your Chargebee Sandbox account
7. Click **"Save"**

## Step 6: Deploy Workflow
1. Click **"Deploy"** in the top right
2. Your workflow is now live!

## Testing the Workflow

### Test with cURL:
```bash
curl -X POST https://YOUR-WEBHOOK-URL.m.pipedream.net \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "John",
    "last_name": "Doe",
    "email": "john.doe@example.com",
    "phone": "+1234567890",
    "company": "Acme Corp"
  }'
```

### Test with Minimal Data:
```bash
curl -X POST https://YOUR-WEBHOOK-URL.m.pipedream.net \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "first_name": "Test"
  }'
```

### Test with Full Data Including Address:
```bash
curl -X POST https://YOUR-WEBHOOK-URL.m.pipedream.net \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "Jane",
    "last_name": "Smith",
    "email": "jane.smith@example.com",
    "phone": "+1234567890",
    "company": "Tech Corp",
    "billing_address": {
      "line1": "123 Main St",
      "city": "San Francisco",
      "state": "CA",
      "zip": "94105",
      "country": "US"
    },
    "auto_collection": true,
    "net_term_days": 30,
    "notes": "VIP Customer"
  }'
```

## Input Fields Reference

### Required Fields:
- `email` - Customer's email address
- At least one of: `first_name`, `last_name`, or `company`

### Optional Fields:
- `phone` - Phone number
- `auto_collection` - Boolean (true/false) for auto-charging
- `net_term_days` - Payment terms (0-365 days)
- `taxability` - Tax status ("taxable" or "exempt")
- `locale` - Language preference (e.g., "en-US")
- `notes` - Internal notes about customer

### Billing Address (optional object):
```json
{
  "billing_address": {
    "line1": "Street address",
    "line2": "Apt/Suite",
    "city": "City",
    "state": "State/Province",
    "zip": "Postal code",
    "country": "Country code (e.g., US)"
  }
}
```

## Monitoring & Debugging

1. **View Logs**: Click on any step to see console logs
2. **Test Mode**: Use the "Test" button on each step to run with sample data
3. **Event History**: Click "Event History" to see all webhook calls
4. **Error Details**: Failed requests show detailed error messages

## Response Format

### Success Response:
```json
{
  "success": true,
  "customer_id": "16CHl5Tffv9fNxL",
  "customer": {
    "id": "16CHl5Tffv9fNxL",
    "email": "john.doe@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "company": "Acme Corp",
    "created_at": "2024-01-15T10:30:00.000Z"
  },
  "message": "Customer 16CHl5Tffv9fNxL created successfully"
}
```

### Error Response:
```json
{
  "success": false,
  "error": {
    "code": "INVALID_REQUEST",
    "message": "Email already exists",
    "details": {}
  }
}
```

## Tips

1. **Unique Emails**: Chargebee requires unique email addresses. For testing, add timestamps: `test+${Date.now()}@example.com`

2. **Sandbox Testing**: Always test in sandbox first before using production credentials

3. **Rate Limits**: Chargebee has API rate limits. The workflow handles errors gracefully

4. **Webhook Security**: For production, add authentication to your HTTP trigger

5. **Custom Fields**: Add any Chargebee custom fields directly to the input JSON

## Troubleshooting

- **401 Error**: Check your Chargebee API key and site configuration
- **400 Error**: Validate input data format and required fields
- **409 Error**: Email already exists in Chargebee
- **Network Issues**: Check Chargebee service status

## Next Steps

- Add subscription creation after customer creation
- Implement customer update/delete operations
- Add webhook notifications for customer events
- Create batch customer import workflow