# Back in Stock Notification System - Setup Guide

## Overview

This system allows customers to subscribe for email notifications when out-of-stock products become available again.

## How It Works

1. When a product is out of stock, a "Notify Me When Available" button appears
2. Customers click the button and enter their email in a popup
3. The submission creates a contact form entry with a unique tag: `notify-{product-handle}-{variant-id}`
4. Shopify Flow processes these submissions to create/tag customers
5. When inventory is restocked, Flow sends notification emails

---

## Step 1: Install Required Apps

### Option A: Using Shopify Inbox (Recommended - Free)

1. Go to **Shopify Admin > Apps > Shopify Inbox**
2. Install if not already installed
3. Contact form submissions will appear in Inbox

### Option B: Using Shopify Forms App

1. Go to **Shopify Admin > Apps > Shopify App Store**
2. Search for "Shopify Forms" (free by Shopify)
3. Install the app
4. This provides better Flow integration

---

## Step 2: Create Shopify Flow for Processing Subscriptions

### Flow 1: Process New Notification Requests

**Trigger:** Form submitted (if using Shopify Forms) OR Check Inbox daily

**Steps:**

1. Go to **Shopify Admin > Apps > Flow**
2. Click **Create workflow**
3. Set up the following:

```
TRIGGER: Customer created
   ↓
CONDITION: Customer tags contains "notify-"
   ↓
ACTION: Add customer metafield
   - Namespace: notifications
   - Key: subscribed_products
   - Value: {{ customer.tags | where: "notify-" | join: "," }}
```

### Flow 2: Send Back-in-Stock Emails

```
TRIGGER: Inventory quantity changed
   ↓
CONDITION:
   - Previous quantity was 0
   - New quantity is greater than 0
   ↓
ACTION: Get customers with tag "notify-{product.handle}-{variant.id}"
   ↓
ACTION: Send email to each customer
   - Subject: "Good news! {product.title} is back in stock"
   - Include product link
   ↓
ACTION: Remove the notification tag from customer
```

---

## Step 3: Manual Flow Setup (Detailed)

### A. Create "Process Notification Request" Flow

1. **Trigger:** Customer created
2. **Condition:** Customer email is not blank
3. **Action:**
   - Check if customer has tags starting with "notify-"
   - Store product info in customer metafields

### B. Create "Back in Stock Alert" Flow

1. Go to **Flow > Create workflow**
2. **Trigger:** Inventory quantity changed

3. Add **Condition:**
   ```
   inventoryQuantityChange.previousQuantity = 0
   AND
   inventoryQuantityChange.newQuantity > 0
   ```

4. Add **Action:** Get data
   - Resource: Customers
   - Query: tags contains "notify-{{ product.handle }}"

5. Add **Action:** For each customer
   - Send email notification
   - Remove the notify tag

---

## Step 4: Email Template

Create an email template for back-in-stock notifications:

**Subject:** Great news! {{ product.title }} is back in stock

**Body:**
```
Hi {{ customer.first_name | default: "there" }},

The item you've been waiting for is now available!

{{ product.title }}
{% if variant.title != "Default Title" %}
Variant: {{ variant.title }}
{% endif %}

[Shop Now Button → {{ product.url }}]

Hurry - popular items sell out quickly!

Best,
{{ shop.name }}
```

---

## Alternative: Using Third-Party Apps

For a more automated solution, consider these apps:

1. **Back in Stock: Restock Alerts** by Swym
2. **Klaviyo** (includes back-in-stock flows)
3. **Back in Stock** by Appikon

These apps handle all the automation automatically.

---

## Tag Format Reference

The system uses this tag format:
```
notify-{product-handle}-{variant-id}
```

Example:
- Product: "Blue T-Shirt"
- Handle: "blue-t-shirt"
- Variant ID: 12345678
- Tag: `notify-blue-t-shirt-12345678`

---

## Testing the System

1. Set a product's inventory to 0
2. Visit the product page
3. Click "Notify Me When Available"
4. Enter a test email
5. Check your Shopify Inbox/Forms for the submission
6. Verify the customer was created with the correct tag
7. Add inventory back to the product
8. Verify the Flow triggers and sends email

---

## Troubleshooting

### Button not appearing
- Ensure product inventory is 0
- Check that inventory tracking is enabled
- Verify the product's inventory policy is not "continue selling"

### Emails not sending
- Check Shopify Flow is active
- Verify email templates are set up
- Check customer has valid email

### Tags not being added
- Review Flow conditions
- Check for typos in tag format
- Ensure Flow has proper permissions

---

## Files Modified

- `snippets/buy-buttons.liquid` - Added Notify Me button
- `snippets/notify-me-popup.liquid` - New popup modal component

---

## Support

For issues with the theme code, check:
- Browser console for JavaScript errors
- Network tab for failed requests
- Shopify admin for form submissions
