# Hachalu_tailor

## Latest updates (2026-03-02)

### Testing coverage expanded

- End-to-end and edge-case tests were added across garment, orders, and payments apps.
- Current targeted suite count: 29 tests.
- Run targeted suites:

```
python manage.py test garment orders payments -v 2
```

### New edge scenarios now covered

- Invalid status transitions in garment flow (e.g., ship before complete, repeated transitions).
- Not-found and invalid payload handling for garment process endpoints.
- Payment duplicate creation prevention and invalid verification flags.
- Order service validation failures (invalid quantity, invalid payment stage, conflicting filters).
- Auth/permission boundaries for order listing, payment verification, and garment processing.

### Performance optimization

- `garment/services.py` list and detail reads were optimized:
  - moved Python-side filtering to SQL filters,
  - added `select_related` to reduce N+1 queries,
  - added safe `date_range` parsing for shipped-order filtering.

### Garment workflow endpoints (current)

All garment endpoints are under `/api/garment/`.

- `GET /api/garment/orders/in-progress/`
  - Optional query params: `customer`, `suit_type`
- `GET /api/garment/orders/in-progress/detail/?code=<ORDER_CODE>`
- `POST /api/garment/orders/<ORDER_CODE>/process/`
  - Body status options: `COMPLETED`, `SHIPPED`
- `GET /api/garment/orders/shipped/`
  - Optional query params: `customer`, `suit_type`, `date_range`
  - `date_range` format: `YYYY-MM-DD,YYYY-MM-DD`
- `GET /api/garment/orders/shipped/detail/?code=<ORDER_CODE>`

# API DOC

### Authentication

#### 1. Login

#### Note Here that both admin and receptionist can login

##### Endpoint: POST api/accounts/auth/login/

Body

```
{
  "email": "admin@example.com",
  "password": "yourpassword123"
}
```

##### Response: 201

```
{
    "refresh": ......,
    "access": ........
}
```

#### 2. Add new receptionist

##### Endpoint: POST /api/accounts/admin/staff/

##### Make Sure Admin is loged in(save JWT)

Body

```
{
  "email": "recep1@gmail.com",
  "full_name": "Recep Recep1",
  "phone_number": "+251911234567",
  "role": "RECEPTIONIST"
}

```
#### Role can also be GARMENT_ADMIN
##### Response: 201

```
{
    "message": "User created successfully",
    "temporary_password": "UxlGT0ov",
    "user_id": "15ac3d04-85d7-4078-9e45-edef9ef24f64"
}
```

#### 3. List All Staff

##### Endpoint: POST /api/accounts/admin/staff/

Body: None

##### Response: 200

```
 [
    {
        "id": "3feb9269-05d9-441b-aa07-0846fadc6f91",
        "email": "admin@gmail.com",
        "full_name": "Mag MC",
        "phone_number": "",
        "role": "ADMIN",
        "is_active": true
    },
    {
        "id": "15ac3d04-85d7-4078-9e45-edef9ef24f64",
        "email": "recep1@gmail.com",
        "full_name": "Recep Recep1",
        "phone_number": "+251911234567",
        "role": "RECEPTIONIST",
        "is_active": true
    }
]
```

#### 4. DELETE RECEPTIONIST

##### Endpoint: POST /api/accounts/admin/staff/{id}/

Body: None

##### Response: 204

```
 [
    {
        "id": "3feb9269-05d9-441b-aa07-0846fadc6f91",
        "email": "admin@gmail.com",
        "full_name": "Mag MC",
        "phone_number": "",
        "role": "ADMIN",
        "is_active": true
    },
    {
        "id": "15ac3d04-85d7-4078-9e45-edef9ef24f64",
        "email": "recep1@gmail.com",
        "full_name": "Recep Recep1",
        "phone_number": "+251911234567",
        "role": "RECEPTIONIST",
        "is_active": true
    }
]
```

#### 5. Change Password

##### Endpoint: POST /api/accounts/user/change-password/

Body:

```
{
  "old_password": "12345678",
  "new_password": "123456789"
}

```

##### Response: 200

```
{
    "message": "Password updated successfully"
}
```

#### 6. Update Profile

##### Endpoint: PATCH api/accounts/admin/users/{UUid}/update-profile/

Body:

```
{
  "email": "newemail@example.com",
  "full_name": "John Doe",
}
```

##### Response: 200

```
{
    "message": "User updated successfully"
}
```

#### 7. Reset Password

##### Endpoint: POST api/accounts/admin/users/{id}/reset-password/

Body: None (password generated automatically)

##### Response: 200

```
{
  "temporary_password": "A9xP2kQm",
  "message": "Password reset successful"
}
```

#### 7. Audit Log

##### Endpoint: GET api/accounts/admin/audit-logs/

Body: None
| Parameter | Type | Description |
|---------------|--------|--------------------------------------------------|
| `search` | string | Search by identifier, email, or phone. |
| `actor` | uuid | Filter by the ID of the user who performed the action. |
| `action` | string | Filter by action name (e.g., `USER_CREATED`). |
| `start_date` | string | Filter start date (format: `YYYY-MM-DD`). |
| `end_date` | string | Filter end date (format: `YYYY-MM-DD`). |

##### Response: 200

```
[
    {
        "id": 20,
        "actor": "62759895-0632-4055-b924-5cbe0d4ddaa0",
        "action": "PASSWORD_CHANGED",
        "target_id": "62759895-0632-4055-b924-5cbe0d4ddaa0",
        "identifier_used": "admin1@gmail.com",
        "created_at": "2026-02-15T06:10:55.413080Z",
        "payload": {
            "user_id": "62759895-0632-4055-b924-5cbe0d4ddaa0",
            "full_name": "Admin Admin",
            "phone_number": "",
            "role": "ADMIN"
        }
    },
    {
        "id": 18,
        "actor": "62759895-0632-4055-b924-5cbe0d4ddaa0",
        "action": "USER_CREATED",.......
```

#### 7. Detail Audit Log

##### Endpoint: GET api/accounts/admin/audit-logs/{id}/

###### returns the audit log with that specific ID

Body: None

##### Response: 200

```
{
    "id": 20,
    "actor": "62759895-0632-4055-b924-5cbe0d4ddaa0",
    "action": "PASSWORD_CHANGED",
    "target_id": "62759895-0632-4055-b924-5cbe0d4ddaa0",
    "identifier_used": "admin1@gmail.com",
    "created_at": "2026-02-15T06:10:55.413080Z",
    "payload": {
        "user_id": "62759895-0632-4055-b924-5cbe0d4ddaa0",
        "full_name": "Admin Admin",
        "phone_number": "",
        "role": "ADMIN"
    }
}
```

# ============================================================
### Inventory manangment 
#### 1. Create Material

#### Note Here that both admin and receptionist can login

##### Endpoint: POST /api/invetory/materials/create/

Body

```
{
  "material": {
    "name": "Silk",
    "brand": "Lui V"
    "texture": "Smooth",
    "description": "Premium fabric",
    "category": "Cloth",
    "colors": ["Red", "Blue", "Violet"]
  },
  "quantity_meters": "10.0"
}
```

##### Response: 201

```
{
    "id": 5,
    "name": "Silk",
    "texture": "Smooth",
    "brand": "CR7",
    "image_url": null,
    "description": "Premium fabric",
    "category": "Cloth",
    "colors": [
        {
            "id": 1,
            "name": "Red"
        },
        {
            "id": 2,
            "name": "Blue"
        }
    ],
    "inventory": {
        "id": 5,
        "quantity_meters": "10.00",
        "is_available": true
    }
}
```

#### 2. List objects

#### Note Here that both admin and receptionist can login

##### Endpoint: GET /api/invetory/materials/list/

Body: NONE

##### Response: 200

```
[
    {
        "id": 1,
        "name": "Cotton",
        "color": "Dark Blue",
        "texture": "Soft",
        "image_url": null,
        "description": null,
        "category": null,
        "inventory": {
            "id": 1,
            "quantity_meters": "60.50",
            "is_available": true
        }
    },
    {
        "id": 2,
        "name": "Wool",
        .....
]
```

#### 3. Update Object Data (only on material)

#### Note Here that both admin and receptionist can login

##### Endpoint: PATCH /api/invetory/materials/{id}/

Body:

```
{
  
}

or something like

{
    "name": "Silk",
    "brand": "CR", 
    "texture": "Smooth",
    "description": "Premium fabric",
    "category": "Cloth",
    "colors": ["Blue", "White"]
}
```

##### Response: 200

```
{
    "id": 1,
    "name": "Cotton",
    "color": "Dark Blue",
    "texture": "Soft",
    "image_url": null,
    "inventory": {
        "id": 1,
        "quantity_meters": "10.50",
        "is_available": true
    }
}
```

#### 2. Update Object Data (only on Stock)

#### Note Here that both admin and receptionist can login

##### Endpoint: POST /api/invetory/materials/{id}/stock/

###### Actions are add and set

Body:

```
{
  "action_type": "add",
  "quantity_meters": 50
}

```

##### Response: 200

```
{
    "message": "Stock updated successfully",
    "current_quantity": 60.5
}
```

#### Incase You perform a wrong action

```
{
  "action_type": "remove",
  "quantity_meters": 5
}
```

#### Response: 400

```
{
  "error": "Invalid action_type. Use 'add' or 'set'."
}
```

#### On this one the options are add, Set are the only ones

# =============================================================

### Orders

#### 1. Create Suit(For Recieptionist/Admin)

#### Note Here that both admin and receptionist can login

##### Endpoint: POST /api/suit-types/create/

Body:

```
{
  "name": "Single Lapel Suit",
  "lapel_count": 1
}
```

##### Response: 201

```
{
    "id": 1,
    "name": "Single Lapel Suit",
    "lapel_count": 1
}
```

#### 2. List Suit

#### (For Recieptionist/Admin/User Needs to see this too)

#### Note Here that both admin and receptionist Shall see
##### Endpoint: GET /api/suit-types/

Body:None

##### Response: 200

```
[
    {
        "id": 1,
        "name": "Single Lapel Suit",
        "lapel_count": 1
    }
]
```

#### 3. Create Order

##### Endpoint: POST /api/orders/

Body:

```
{
  "customer_name": "Jane Doe",
  "customer_phone": "9991112222",
  "suit_type": 1,
  "material": 1,
  "selected_color": "Blue",
  "quantity": 2,
  "measurements": {
    "chest": 40,
    "shoulder": 18,
    "waist": 32,
    "hips": 38,
    "arm_length": 25,
    "height": 170
  }
}

```
### makue sure the material has the selected color other wise it is a validation error

##### Response: 201

```
{
    "order_id": "25f1e832-6aba-4306-a29c-238168e6697f",
    "order_code": "HP-28182092",
    "status": "INITIATED"
}
```

# MAKE SURE THE ORDER CODE IS DISPLAYED TO THE CUSTOMER ON THE FRONT END

#### 3. List Orders

#### Note Here that both admin and receptionist can view this

##### Endpoint: GET /api/orders/list/

Body:None

## Here It need query params

-active_only:Bool
-processed_only:Bool
-customer:String # here u can search with customer phone number

##### Response: 200

```
[
    {
        "id": "ac2a7eeb-9cea-4200-b09c-c55e2cadaacf",
        "status": "INITIATED",
        "quantity": 1,
        "total_price": "0.00",
        "due_date": "2000-01-01",
        "payment_reference": "",
        "payment_amount": null,
        "payment_received_at": null,
        "payment_notes": "",
        "payment_allowed": false,
        "created_at": "2026-02-12T20:41:43.944985Z",
        "updated_at": "2026-02-12T20:41:43.944985Z",
        "customer_name": "John Doe",
        "customer_phone": "+251900000000",
        "suit_type": 1,
        "suit_type_name": "Single Lapel Suit",
        "material": 1,
        "material_name": "Cotton",
        "measurements": {
            "chest": 100.0,
            "shoulder": 45.0,
            "waist": 80.0,
            "hips": 95.0,
            "arm_length": 60.0,
            "height": 178.0
        }
    }
]
```

#### 3. Process Order

##### Endpoint: POST /api/orders/{uuid}/process

##### For admin and receptionist

Here there may be different options
a. Recieve Order
Body

```
{
"action": "receive",
"total_price": 2500,
"due_date": "2026-03-01",
"expected_price":1250
}
```

##### Response: 200

```
{
    "id": "ac2a7eeb-9cea-4200-b09c-c55e2cadaacf",
    "status": "AWAITING_PAYMENT",
    "quantity": 1,
    "total_price": "2500.00",
    "due_date": "2026-03-01",
    .....
```

b. Record Payment
Body

```
{
"action": "record_payment",
"payment_reference": "TX123",
"payment_amount": 2500,
"payment_received_at": "2026-02-12T10:00:00Z",
"payment_notes": "Paid via bank"
}
```

##### Response: 200

```
{
    "id": "ac2a7eeb-9cea-4200-b09c-c55e2cadaacf",
    "status": "PENDING_APRROVAL",
    "quantity": 1,
    "total_price": "2500.00",
    "due_date": "2026-03-01",
    .....
```

c. Approve Order
Body

```
{
"action": "approve"
}
```

##### Response: 200

```
{
    "id": "ac2a7eeb-9cea-4200-b09c-c55e2cadaacf",
    "status": "IN_PROGRESS",
    "quantity": 1,
    "total_price": "2500.00",
    "due_date": "2026-03-01",
    .....
```

### NOTE that the above stages are for a perfect flow of order al that way to payment
#### recieve(status will be awaiting payment) ++> recorded payment ++> approve then it becomes in 

d. Reject Order
Body

```
{
"action": "reject"
}
```


### NOTE that this process of can only be done after the AWAITING_PAYMENT stage

Body

```
{
"action": "reject",
"reason": "Invalid payment"
}
```

##### Response: 200

```
{
    "id": "ac2a7eeb-9cea-4200-b09c-c55e2cadaacf",
    "status": "REJECTED",
    "quantity": 1,
    "total_price": "2500.00",
    "due_date": "2026-03-01",
    .....
```

## ????

#### 3. Update Order

##### Endpoint: PATCH /api/orders/{uuid}/

##### For admin and receptionist

Body

```
{
"quantity": 2,
"due_date": "2026-03-05"
}
```

##### Response: 200

```
{
    "id": "ac2a7eeb-9cea-4200-b09c-c55e2cadaacf",
    "status": "AWAITING_PAYMENT",
    "quantity": 1,
    "total_price": "2500.00",
    "due_date": "2026-03-01",
    .....
```

#### 4. Expired Orders

##### Endpoint: POST /api/orders/expire/

##### For admin and receptionist
Body

```
{
"quantity": 2,
"due_date": "2026-03-05"
}
```

##### Response: 200

```
{
    "expired_count": 1,
    "expired_ids": [
        "c2c1d327-be0d-4e1e-839b-996f976a7bb2"
    ]
}
```

#### But here we need more things

# ============================================================

### Payment Management

#### 1. Create Payment
##### Endpoint: POST /api/payments/

Body

```
{
  "order_code": "HP-28182092",
  "amount": "2500.00",
  "bank_ref_number": "TXN_998877",
  "receipt_pdf_url": "https://storage.provider.com/receipts/txn_01.pdf"
}
```

##### Response: 201

```
{
    "id": "ea0cb258-750d-43cd-a36b-87312cbb8f08",
    "order_id": "25f1e832-6aba-4306-a29c-238168e6697f",
    "order_code": "HP-28182092",
    "payment_amount": "2500.00",
    "bank_ref_number": "TXN_998877",
    "receipt_pdf_url": "https://storage.provider.com/receipts/txn_01.pdf",
    "is_verified": false,
    "created_at": "2026-02-16T09:26:51.286556Z"
}
```

#### 2. Verify Payment

##### Endpoint: POST api/payments/<uuid:id>/verify/

###### The id is the id of the payment(not the order)

Body

```
{
  "is_verified": true
}
```

##### Response: 200

```
{
    "id": "ea0cb258-750d-43cd-a36b-87312cbb8f08",
    "order_id": "25f1e832-6aba-4306-a29c-238168e6697f",
    "order_code": "HP-28182092",
    "payment_amount": "2500.00",
    "bank_ref_number": "TXN_998877",
    "receipt_pdf_url": "https://storage.provider.com/receipts/txn_01.pdf",
    "is_verified": true,
    "created_at": "2026-02-16T09:26:51.286556Z"
}
```

#### 3. List payments

##### Endpoint: GET api/payments/list/

Body: None

##### query param will be is_verified. It can be true or false based on what you want to filter

##### Response: 200

```
[
    {
        "id": "ea0cb258-750d-43cd-a36b-87312cbb8f08",
        "order_id": "25f1e832-6aba-4306-a29c-238168e6697f",
        "order_code": "HP-28182092",
        "payment_amount": "2500.00",
        "bank_ref_number": "TXN_998877",
        "receipt_pdf_url": "https://storage.provider.com/receipts/txn_01.pdf",
        "is_verified": true,
        "created_at": "2026-02-16T09:26:51.286556Z"
    }
]
```
# ===============================================================
### Garment Management

#### 1. List Orders in Progress
##### Endpoint: GET /api/garment/orders/in-progress/

##### Make sure to login with a garment admin

Body: NONE

##### Response: 201

```
[
    {
        "id": "42c10b47-37af-494e-b924-cdb9bbb8b084",
        "order_code": "HP-44385832",
        "status": "IN_PROGRESS",
        "quantity": 2,
        "total_price": "2500.00",
        "due_date": "2026-03-01",
        "payment_reference": "TXN_998877",
        ....
        "material_name": "Silk",
        "measurements": {
            "chest": 40.0,
            ".......
            "height": 170.0
        }
    }
]
```

#### 2. Get Orders in Progress
##### Endpoint: GET /api/garment/orders/in-progress/detail

##### Make sure to login with a garment admin
##### QUERY PARAM: code: order_code 

Body: NONE

##### Response: 201

```
    {
        "id": "42c10b47-37af-494e-b924-cdb9bbb8b084",
        "order_code": "HP-44385832",
        "status": "IN_PROGRESS",
        "quantity": 2,
        "total_price": "2500.00"
        .....
        }
```

#### 2. Update Orders status
##### Endpoint: GET /api/garment/orders/<str:code>/process/

##### Make sure to login with a garment admin

Body: 
```
{
  "status": "COMPLETED" // or "SHIPPED"
}
```
##### Response: 201

```
{
    "id": "c6316733-a3a2-4a69-a843-5c9f3e9c7698",
    "order_code": "HP-42281708",
    "status": "COMPLETED",
    ...
    "suit_type": 1,
    "suit_type_name": "Single Lapel Suit",
    "material": 5,
    "material_name": "Silk",
    "measurements": {
        "chest": 40.0,
        "shoulder": 18.0,
        "waist": 32.0,
        "hips": 38.0,
        "arm_length": 25.0,
        "height": 170.0
    }
```

#### 4. List Shipped Orders
##### Endpoint: GET /api/garment/orders/shipped/

##### Make sure to login with a garment admin

Body: NONE

##### Response: 201

```
[
    {
        "id": "c6316733-a3a2-4a69-a843-5c9f3e9c7698",
        "order_code": "HP-42281708",
        "payment_amount": "2500.00",
        "payment_received_at": "2026-02-12T10:00:00Z",
      ...
        "material_name": "Silk",
        "measurements": {
            "chest": 40.0,
        ....
            "arm_length": 25.0,
            "height": 170.0
        }
    }
]
```
#### 5. Shipped Order Detail
##### Endpoint: GET /api/garment/orders/detail/

##### Make sure to login with a garment admin
#### Query Param :: code: <ordercode>
Body: NONE

##### Response: 201

```
{
    "id": "c6316733-a3a2-4a69-a843-5c9f3e9c7698",
    "order_code": "HP-42281708",
    "status": "SHIPPED",
    "quantity": 5,
    ....
    "suit_type": 1,
    "suit_type_name": "Single Lapel Suit",
    "material": 5,
    "material_name": "Silk",
    "measurements": {
        "chest": 40.0,
        "shoulder": 18.0,
        "waist": 32.0,
        "hips": 38.0,
        "arm_length": 25.0,
        "height": 170.0
    }
}
```
