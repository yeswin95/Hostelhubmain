# Postman API Examples

Base URL: `http://localhost:5000/api`

Use `Authorization: Bearer <JWT_TOKEN>` for protected routes.

## 1) Auth

### Signup Student
`POST /auth/signup`
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "StrongPass123",
  "role": "student",
  "phone": "9999999999",
  "course": "B.Tech"
}
```

### Signup Admin
`POST /auth/signup`
```json
{
  "name": "Warden One",
  "email": "warden@example.com",
  "password": "StrongPass123",
  "role": "admin",
  "adminSignupKey": "YOUR_ADMIN_SIGNUP_KEY"
}
```

### Login
`POST /auth/login`
```json
{
  "email": "john@example.com",
  "password": "StrongPass123",
  "role": "student"
}
```

## 2) Students (Admin)

### Get All Students
`GET /users/students`

### Get Unallocated Students
`GET /users/students/unallocated`

## 3) Hostels (Admin)

### Create Hostel
`POST /hostels`
```json
{
  "name": "North Hostel",
  "code": "NH1",
  "address": "Campus Block A",
  "wardenName": "Mr. Rao"
}
```

## 4) Rooms (Admin)

### Create Room
`POST /rooms`
```json
{
  "roomNo": "A-101",
  "hostel": "HOSTEL_OBJECT_ID",
  "capacity": 3,
  "roomType": "AC"
}
```

### Allocate Room
`POST /rooms/allocate`
```json
{
  "studentId": "STUDENT_OBJECT_ID",
  "roomId": "ROOM_OBJECT_ID"
}
```

### Deallocate Room
`POST /rooms/deallocate`
```json
{
  "studentId": "STUDENT_OBJECT_ID"
}
```

## 5) Complaints

### Student Raise Complaint
`POST /complaints`
```json
{
  "category": "Electrical",
  "message": "Tube light is not working in my room."
}
```

### Admin Update Complaint Status
`PATCH /complaints/:id/status`
```json
{
  "status": "Resolved",
  "adminRemark": "Electrician fixed the issue."
}
```

## 6) Notices

### Admin Create Notice
`POST /notices`
```json
{
  "title": "Water Shutdown",
  "message": "Water supply will be unavailable from 10AM to 12PM.",
  "priority": "urgent"
}
```

### Student/Admin View Notices
`GET /notices`

## 7) Attendance

### Admin Mark Attendance
`POST /attendance`
```json
{
  "studentId": "STUDENT_OBJECT_ID",
  "date": "2026-03-31",
  "status": "Present"
}
```

### Student View Own Attendance
`GET /attendance/me`

## 8) Menu

### Get Weekly Menu
`GET /menu`

### Admin Upsert Day Menu
`PUT /menu/Monday`
```json
{
  "breakfast": "Idli",
  "lunch": "Rice and Dal",
  "snacks": "Tea and Biscuits",
  "dinner": "Chapati and Curry"
}
```

## 9) Fees (Admin)

### Update Student Fees Status
`PATCH /users/students/:id/fees`
```json
{
  "feesStatus": "Paid"
}
```
