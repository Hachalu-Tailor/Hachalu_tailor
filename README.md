# Hachalu_tailor


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
#### 6. Update Profile (Only for admin)
##### Endpoint: PATCH /admin/users/{UUid}/update-profile/
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
##### Endpoint: POST /admin/users/{id}/reset-password/
Body: None (password generated automatically)

##### Response: 200
```
{
  "temporary_password": "A9xP2kQm",
  "message": "Password reset successful"
}
```
# ============================================================
### Inventory manangment 
#### 1. Create object
#### Note Here that both admin and receptionist can login
##### Endpoint: POST /api/invetory/materials/
Body
```
{
  "material": {
    "name": "Silk",
    "color": "Blue",
    "texture": "Soft",
  },
  "quantity_meters": 12.5
}
```

##### Response: 201
```
{
    "id": 1,
    "name": "Cotton",
    "color": "White",
    "texture": "Soft",
    "image_url": null,
    "inventory": {
        "id": 1,
        "quantity_meters": "10.50",
        "is_available": true
    }
}
```
#### 2. List objects
#### Note Here that both admin and receptionist can login
##### Endpoint: GET /api/invetory/materials/
Body: NONE

##### Response: 200
```
[
    {
        "id": 1,
        "name": "Cotton",
        "color": "White",
        "texture": "Soft",
        "image_url": null,
        "inventory": {
            "id": 1,
            "quantity_meters": "10.50",
            "is_available": true
        }
    },
    {
        "id": 2,
        "name": "Wool",
        "color": "Black",
        "texture": "Soft",
        "image_url": null,
        "inventory": {
            "id": 2,
            "quantity_meters": "10.50",
            "is_available": true
        }
    }
]
```
#### 3. Update Object Data (only on material)
#### Note Here that both admin and receptionist can login
##### Endpoint: PATCH /api/invetory/materials/{id}/
Body: 
```
{
  "color": "Dark Blue"
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
Body: 
```
{
  "action_type": "add",
  "quantity_meters": 50,
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

# ============================================================
### Payment Management 
#### 1. Create object
##### Endpoint: POST /api/payments/
Body
```
{
  "order_code": "HP-2026-XYZ",
  "amount": "2500.00",
  "bank_ref_number": "TXN_998877",
  "receipt_pdf_url": "https://storage.provider.com/receipts/txn_01.pdf"
}
```
##### Response: 201
```
{
    "id": 1,
    "name": "Cotton",
    "color": "White",
    "texture": "Soft",
    "image_url": null,
    "inventory": {
        "id": 1,
        "quantity_meters": "10.50",
        "is_available": true
    }
}
```