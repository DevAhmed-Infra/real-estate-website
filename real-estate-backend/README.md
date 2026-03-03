# Real Estate Backend API

Production REST API for real estate marketplace platform. Node.js/Express/Mongostack with JWT authentication, role-based access, file uploads, and comprehensive analytics.

## Project Overview

RESTful API for property listings, user management, bookings, offers, reviews, and analytics. Uses Node.js, Express, MongoDB with Mongoose ODM. JWT access tokens with refresh token rotation. Role-based access control (buyer, seller, agent, admin). Multer for file uploads with Sharp image processing. Environment-based configuration with centralized app config.

## Architecture Summary

- **src/routes/** - Express route definitions with validation middleware
- **src/controllers/** - Request handling and response formatting
- **src/services/** - Business logic and data processing
- **src/models/** - Mongoose schemas with validation and hooks
- **src/middlewares/** - Authentication, validation, rate limiting, error handling
- **src/utils/** - Helper utilities (email, upload, validation schemas)
- **config/** - Centralized application configuration
- **Error Handling**: Centralized error middleware with structured responses
- **Validation**: Joi schemas for request validation
- **Security**: Helmet, CORS, rate limiting, input sanitization, MongoDB injection protection

## Setup & Environment

### Environment Variables
```bash
PORT=3000
MONGO_URL=mongodb+srv://<username>:<password>@real-estate.e0ask4l.mongodb.net/
JWT_SECRET=change-me-in-production
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_SECRET=change-refresh-secret
REFRESH_TOKEN_EXPIRES_IN=7d
JWT_COOKIE_DAYS=90
EMAIL_USER=your-email@example.com
EMAIL_PASSWORD=your-email-password
API_BASE_PATH=/api/v1
BACKEND_URL=http://localhost:3000
FRONTEND_URL=http://localhost:3000
NODE_ENV=development
```

### Commands
```bash
npm install
npm run dev           # Development with hot reload
npm start             # Production server
npm test              # Run test suite
npm run test:coverage # Coverage report
```

## API Documentation

### Authentication Routes

#### POST /api/v1/auth/register
Access: Public
Request Body:
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "buyer",
  "phone": "1234567890"
}
```
Response (Success):
```json
{
  "success": true,
  "status": "success",
  "data": {
    "user": {
      "id": "userId",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "buyer",
      "isVerified": false
    }
  }
}
```

#### POST /api/v1/auth/login
Access: Public
Request Body:
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```
Response (Success):
```json
{
  "success": true,
  "status": "success",
  "data": {
    "user": {
      "id": "userId",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "buyer",
      "isVerified": true
    },
    "accessToken": "jwt_token",
    "refreshToken": "refresh_token"
  }
}
```

#### POST /api/v1/auth/refresh
Access: Public
Request Body:
```json
{
  "refreshToken": "refresh_token"
}
```

#### GET /api/v1/auth/verify-email/:token
Access: Public
Response (Success):
```json
{
  "success": true,
  "status": "success",
  "data": {
    "message": "Email verified successfully. You can now log in."
  }
}
```

#### POST /api/v1/auth/forgot-password
Access: Public
Request Body:
```json
{
  "email": "john@example.com"
}
```

#### POST /api/v1/auth/reset-password
Access: Public
Request Body:
```json
{
  "token": "reset_token",
  "password": "new_password123"
}
```

#### POST /api/v1/auth/logout
Access: Protected
Response (Success):
```json
{
  "success": true,
  "status": "success",
  "data": {
    "message": "Logged out successfully"
  }
}
```

### User Routes

#### GET /api/v1/users/me
Access: Protected
Response (Success):
```json
{
  "success": true,
  "status": "success",
  "data": {
    "user": {
      "id": "userId",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "buyer",
      "isVerified": true,
      "profilePhoto": {
        "url": "photo_url",
        "publicId": "cloudinary_id"
      }
    }
  }
}
```

#### PATCH /api/v1/users/me
Access: Protected
Request Body:
```json
{
  "name": "John Updated",
  "phone": "9876543210"
}
```

#### PATCH /api/v1/users/me/password
Access: Protected
Request Body:
```json
{
  "currentPassword": "old_password",
  "newPassword": "new_password123"
}
```

#### GET /api/v1/users
Access: Admin
Query Params: ?page=1&limit=10&role=buyer&search=john

#### GET /api/v1/users/:id
Access: Admin/User Owner

#### PATCH /api/v1/users/:id
Access: Admin

#### DELETE /api/v1/users/:id
Access: Admin

### Property Routes

#### GET /api/v1/properties
Access: Public
Query Params: ?page=1&limit=10&status=active&type=apartment&minPrice=100000&maxPrice=500000&bedrooms=2&sort=price_asc

#### GET /api/v1/properties/:id
Access: Public

#### POST /api/v1/properties
Access: Protected (Seller/Agent)
Request Body:
```json
{
  "title": "Modern Apartment",
  "description": "Beautiful apartment with city views",
  "type": "apartment",
  "status": "active",
  "price": 250000,
  "bedrooms": 2,
  "bathrooms": 2,
  "area": 1200,
  "location": {
    "address": "123 Main St",
    "city": "New York",
    "state": "NY",
    "zipCode": "10001",
    "coordinates": {
      "type": "Point",
      "coordinates": [-74.0060, 40.7128]
    }
  },
  "amenities": ["parking", "gym", "pool"],
  "images": [
    {
      "url": "image_url",
      "publicId": "cloudinary_id",
      "format": "jpg",
      "size": 1024000,
      "width": 1920,
      "height": 1080
    }
  ]
}
```

#### PATCH /api/v1/properties/:id
Access: Owner/Admin

#### DELETE /api/v1/properties/:id
Access: Owner/Admin

#### POST /api/v1/properties/:id/images
Access: Owner/Admin
Request Body: multipart/form-data with images field

#### GET /api/v1/properties/:id/views
Access: Owner/Admin

### Offer Routes

#### GET /api/v1/offers
Access: Protected
Query Params: ?page=1&limit=10&status=pending&propertyId=property_id

#### GET /api/v1/offers/:id
Access: Owner/Admin/Buyer

#### POST /api/v1/offers
Access: Protected (Buyer)
Request Body:
```json
{
  "property": "property_id",
  "amount": 240000,
  "message": "I would like to make an offer on this property"
}
```

#### PATCH /api/v1/offers/:id
Access: Owner/Admin
Request Body:
```json
{
  "status": "accepted"
}
```

#### DELETE /api/v1/offers/:id
Access: Buyer

### Booking Routes

#### GET /api/v1/bookings
Access: Protected
Query Params: ?page=1&limit=10&status=pending&propertyId=property_id

#### GET /api/v1/bookings/:id
Access: Owner/Admin/Buyer

#### POST /api/v1/bookings
Access: Protected (Buyer)
Request Body:
```json
{
  "property": "property_id",
  "scheduledDate": "2024-12-15T10:00:00.000Z",
  "message": "I would like to schedule a viewing"
}
```

#### PATCH /api/v1/bookings/:id
Access: Owner/Admin
Request Body:
```json
{
  "status": "approved"
}
```

#### DELETE /api/v1/bookings/:id
Access: Buyer

### Review Routes

#### GET /api/v1/reviews
Access: Protected
Query Params: ?page=1&limit=10&propertyId=property_id&rating=5

#### GET /api/v1/reviews/:id
Access: Owner/Admin/Reviewer

#### POST /api/v1/reviews
Access: Protected (Buyer)
Request Body:
```json
{
  "property": "property_id",
  "rating": 5,
  "comment": "Excellent property, great location!"
}
```

#### PATCH /api/v1/reviews/:id
Access: Reviewer
Request Body:
```json
{
  "rating": 4,
  "comment": "Updated review"
}
```

#### DELETE /api/v1/reviews/:id
Access: Reviewer/Admin

#### GET /api/v1/reviews/property/:propertyId
Access: Public

### Favorite Routes

#### GET /api/v1/favorites
Access: Protected
Query Params: ?page=1&limit=10

#### GET /api/v1/favorites/:id
Access: Owner

#### POST /api/v1/favorites
Access: Protected (Buyer)
Request Body:
```json
{
  "property": "property_id"
}
```

#### DELETE /api/v1/favorites/:id
Access: Owner

#### GET /api/v1/favorites/user/:userId
Access: Admin/User Owner

#### GET /api/v1/favorites/property/:propertyId
Access: Protected

### Notification Routes

#### GET /api/v1/notifications
Access: Protected
Query Params: ?page=1&limit=10&isRead=false

#### GET /api/v1/notifications/:id
Access: Recipient

#### PATCH /api/v1/notifications/:id
Access: Recipient
Request Body:
```json
{
  "isRead": true
}
```

#### DELETE /api/v1/notifications/:id
Access: Recipient

#### POST /api/v1/notifications/mark-all-read
Access: Protected

#### GET /api/v1/notifications/unread-count
Access: Protected

### Analytics Routes

#### POST /api/v1/analytics/track
Access: Public
Request Body:
```json
{
  "entityType": "property",
  "entityId": "property_id",
  "eventType": "view",
  "metadata": {
    "userAgent": "Mozilla/5.0...",
    "ipAddress": "192.168.1.1",
    "location": {
      "type": "Point",
      "coordinates": [-74.0060, 40.7128]
    }
  }
}
```

#### GET /api/v1/analytics/property/:propertyId
Access: Owner/Admin

#### GET /api/v1/analytics/user/:userId
Access: Admin/User Owner

#### GET /api/v1/analytics/events
Access: Admin
Query Params: ?startDate=2024-01-01&endDate=2024-12-31&eventType=view

#### GET /api/v1/analytics/dashboard
Access: Admin

#### GET /api/v1/analytics/:id
Access: Admin

#### DELETE /api/v1/analytics/:id
Access: Admin

## Postman Test Cases

### Authentication Tests

#### POST /api/v1/auth/register
[ ] Valid user data → 201
[ ] Duplicate email → 400
[ ] Invalid email format → 400
[ ] Missing required fields → 400
[ ] Weak password → 400

#### POST /api/v1/auth/login
[ ] Valid credentials → 200
[ ] Invalid email format → 400
[ ] Wrong password → 401
[ ] Missing email → 400
[ ] Missing password → 400
[ ] Unverified email (if REQUIRE_EMAIL_VERIFICATION=true) → 403

#### POST /api/v1/auth/refresh
[ ] Valid refresh token → 200
[ ] Invalid refresh token → 401
[ ] Expired refresh token → 401
[ ] Missing refresh token → 400

#### GET /api/v1/auth/verify-email/:token
[ ] Valid token → 200
[ ] Invalid token → 400
[ ] Expired token → 400
[ ] Already verified email → 400
[ ] Missing token → 400

#### POST /api/v1/auth/forgot-password
[ ] Valid email → 200
[ ] Non-existent email → 200 (security)
[ ] Invalid email format → 400
[ ] Missing email → 400

#### POST /api/v1/auth/reset-password
[ ] Valid token and strong password → 200
[ ] Invalid token → 400
[ ] Expired token → 400
[ ] Weak password → 400
[ ] Missing token → 400
[ ] Missing password → 400

#### POST /api/v1/auth/logout
[ ] Valid token → 200
[ ] No token → 401
[ ] Invalid token → 401

### User Tests

#### GET /api/v1/users/me
[ ] Authenticated user → 200
[ ] No token → 401
[ ] Invalid token → 401

#### PATCH /api/v1/users/me
[ ] Valid updates → 200
[ ] Invalid email format → 400
[ ] No token → 401
[ ] Invalid role update → 400

#### PATCH /api/v1/users/me/password
[ ] Valid current and new password → 200
[ ] Wrong current password → 401
[ ] Weak new password → 400
[ ] Missing current password → 400
[ ] Missing new password → 400

#### GET /api/v1/users
[ ] Admin user → 200
[ ] Non-admin user → 403
[ ] No token → 401
[ ] Pagination params → 200

#### GET /api/v1/users/:id
[ ] Admin user → 200
[ ] User requesting own profile → 200
[ ] User requesting other profile → 403
[ ] Invalid ObjectId → 400
[ ] Non-existent user → 404

### Property Tests

#### GET /api/v1/properties
[ ] Public access → 200
[ ] Pagination params → 200
[ ] Filter params → 200
[ ] Sort params → 200
[ ] Invalid filter values → 400

#### GET /api/v1/properties/:id
[ ] Valid property ID → 200
[ ] Invalid ObjectId → 400
[ ] Non-existent property → 404
[ ] Deleted property → 404

#### POST /api/v1/properties
[ ] Authenticated seller/agent → 201
[ ] Unauthenticated user → 401
[ ] Buyer role → 403
[ ] Missing required fields → 400
[ ] Invalid coordinates → 400
[ ] Invalid price → 400

#### PATCH /api/v1/properties/:id
[ ] Property owner → 200
[ ] Admin user → 200
[ ] Non-owner user → 403
[ ] Invalid ObjectId → 400
[ ] Non-existent property → 404

#### DELETE /api/v1/properties/:id
[ ] Property owner → 200
[ ] Admin user → 200
[ ] Non-owner user → 403
[ ] Invalid ObjectId → 400

#### POST /api/v1/properties/:id/images
[ ] Property owner with images → 200
[ ] Non-owner → 403
[ ] No images → 400
[ ] Invalid file format → 400

### Offer Tests

#### GET /api/v1/offers
[ ] Authenticated user → 200
[ ] No token → 401
[ ] Filter by status → 200
[ ] Filter by property → 200

#### POST /api/v1/offers
[ ] Authenticated buyer → 201
[ ] Property owner → 400
[ ] Unauthenticated → 401
[ ] Invalid amount → 400
[ ] Non-existent property → 404
[ ] Duplicate offer → 400

#### PATCH /api/v1/offers/:id
[ ] Property owner → 200
[ ] Admin user → 200
[ ] Offer creator → 403
[ ] Invalid status → 400

#### DELETE /api/v1/offers/:id
[ ] Offer creator → 200
[ ] Property owner → 403
[ ] Non-creator → 403

### Booking Tests

#### GET /api/v1/bookings
[ ] Authenticated user → 200
[ ] No token → 401
[ ] Filter by status → 200

#### POST /api/v1/bookings
[ ] Authenticated buyer → 201
[ ] Property owner → 400
[ ] Past date → 400
[ ] Invalid date format → 400
[ ] Non-existent property → 404

#### PATCH /api/v1/bookings/:id
[ ] Property owner → 200
[ ] Admin user → 200
[ ] Booking creator → 403
[ ] Invalid status → 400

### Review Tests

#### GET /api/v1/reviews
[ ] Authenticated user → 200
[ ] Filter by property → 200
[ ] Filter by rating → 200

#### POST /api/v1/reviews
[ ] Authenticated buyer → 201
[ ] Property owner → 400
[ ] Invalid rating → 400
[ ] Duplicate review → 400
[ ] Non-existent property → 404

#### PATCH /api/v1/reviews/:id
[ ] Review author → 200
[ ] Non-author → 403
[ ] Invalid rating → 400

#### DELETE /api/v1/reviews/:id
[ ] Review author → 200
[ ] Admin user → 200
[ ] Non-author → 403

### Favorite Tests

#### GET /api/v1/favorites
[ ] Authenticated user → 200
[ ] No token → 401
[ ] Pagination → 200

#### POST /api/v1/favorites
[ ] Authenticated buyer → 201
[ ] Property owner → 400
[ ] Duplicate favorite → 400
[ ] Non-existent property → 404

#### DELETE /api/v1/favorites/:id
[ ] Favorite owner → 200
[ ] Non-owner → 403

### Notification Tests

#### GET /api/v1/notifications
[ ] Authenticated user → 200
[ ] Filter by read status → 200
[ ] Pagination → 200

#### PATCH /api/v1/notifications/:id
[ ] Notification recipient → 200
[ ] Non-recipient → 403
[ ] Invalid read status → 400

#### POST /api/v1/notifications/mark-all-read
[ ] Authenticated user → 200
[ ] No token → 401

### Analytics Tests

#### POST /api/v1/analytics/track
[ ] Public access → 200
[ ] Missing required fields → 400
[ ] Invalid event type → 400
[ ] Invalid coordinates → 400

#### GET /api/v1/analytics/property/:propertyId
[ ] Property owner → 200
[ ] Admin user → 200
[ ] Non-owner → 403

#### GET /api/v1/analytics/dashboard
[ ] Admin user → 200
[ ] Non-admin user → 403

## Production Readiness

### Security
- Rate limiting on all API endpoints (100 requests per 15 minutes)
- CORS configured for frontend domain
- Helmet.js for security headers
- Input sanitization with mongo-sanitize and XSS protection
- JWT with refresh token rotation
- Password hashing with bcrypt (12 salt rounds)
- File upload validation and image processing

### Error Handling
- Centralized error middleware with structured responses
- Production error logging without stack traces
- Development error logging with full details
- Consistent error response format across all endpoints

### Performance
- Database indexing on frequently queried fields
- Pagination on all list endpoints
- Image compression and optimization
- Response compression middleware
- Soft deletes to preserve data integrity

### Monitoring
- Structured logging with timestamps
- Health check endpoint at /health
- Request/response logging in development
- Error tracking and reporting

### Environment Isolation
- Environment-specific configuration
- Development vs production CORS settings
- Database connection isolation
- Email service configuration per environment
