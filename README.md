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



