# API Examples (cURL)

## Authentication

### 1. Login
```bash
curl -X POST https://api.idol-platform.com/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "secure_password"
  }'
```

## Orders

### 2. Get Orders (Paginated)
```bash
curl -X GET "https://api.idol-platform.com/v1/orders?page=1&limit=20&status=pending" \
  -H "Authorization: Bearer <TOKEN>"
```

### 3. Mark Order as Shipped
```bash
curl -X POST https://api.idol-platform.com/v1/orders/1234/ship \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "courier": "DHL",
    "tracking_number": "MYTRACK123"
  }'
```

### 4. Create Refund
```bash
curl -X POST https://api.idol-platform.com/v1/orders/1234/refund \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 50.00,
    "reason": "customer_request"
  }'
```

## Products

### 5. Create Product with Variants
```bash
curl -X POST https://api.idol-platform.com/v1/products \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Idol Light Stick Ver. 3",
    "description": "Latest version...",
    "variants": [
      { "sku": "LS-V3-BLK", "color": "Black", "stock": 100, "price": 45.00 },
      { "sku": "LS-V3-PNK", "color": "Pink", "stock": 50, "price": 45.00 }
    ]
  }'
```

### 6. Update Inventory Stock
```bash
curl -X PATCH https://api.idol-platform.com/v1/inventory/bulk-update \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "updates": [
      { "sku": "LS-V3-BLK", "stock_delta": 50 },
      { "sku": "TSHIRT-S", "stock_delta": -2 }
    ]
  }'
```

## Users & Notifications

### 7. Search Users
```bash
curl -X GET "https://api.idol-platform.com/v1/users?search=alice&role=customer" \
  -H "Authorization: Bearer <TOKEN>"
```

### 8. Send Manual Notification
```bash
curl -X POST https://api.idol-platform.com/v1/notifications/send \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "user_123",
    "channel": "email",
    "template_id": "shipping_delay_apology",
    "variables": { "order_id": "1234" }
  }'
```
