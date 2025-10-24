# Multi-Website Management System

A professional full-stack application for IT companies to manage multiple client websites, featuring uptime monitoring, automated billing, payment tracking with manual verification, and automatic suspension for overdue payments.

## 🚀 Features

### Core Features
- **Multi-tenant Architecture**: Super Admin manages all clients, Customer Admins manage their own sites
- **Uptime Monitoring**: Automated checks every 10 minutes with detailed uptime statistics
- **Billing System**: 3-month payment cycles with automated reminders
- **Payment Management**: QR code payment page with proof upload functionality
- **Automatic Suspension**: Sites auto-suspend after grace period for non-payment
- **Manual Verification**: Admin verifies payment proofs before reactivation
- **Email Notifications**: Automated alerts for payments, suspensions, and uptime issues

### Technical Stack
- **Frontend**: React 18 + Vite + TailwindCSS
- **Backend**: Node.js + Express.js
- **Database**: MongoDB + Mongoose ODM
- **Authentication**: JWT tokens
- **Automation**: node-cron for scheduled tasks
- **Email**: Nodemailer (SMTP)
- **Containerization**: Docker + Docker Compose
- **Reverse Proxy**: Nginx

## 📁 Project Structure

```
website-management-system/
├── backend/
│   ├── src/
│   │   ├── controllers/      # Request handlers
│   │   ├── models/           # Mongoose schemas
│   │   ├── routes/           # API routes
│   │   ├── services/         # Business logic
│   │   ├── middleware/       # Auth, validation, error handling
│   │   ├── cron/             # Scheduled tasks
│   │   ├── utils/            # Helper functions
│   │   └── index.js          # Express app entry point
│   ├── uploads/              # Payment proof uploads
│   ├── __tests__/            # Unit tests
│   ├── Dockerfile
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/       # Reusable components
│   │   ├── pages/            # Page components
│   │   ├── context/          # React context (Auth)
│   │   ├── services/         # API integration
│   │   ├── App.jsx           # Main app component
│   │   └── main.jsx          # Entry point
│   ├── Dockerfile
│   └── package.json
├── nginx/
│   └── nginx.conf            # Nginx configuration
├── docker-compose.yml
├── .env.example
└── README.md
```

## 🛠️ Installation & Setup

### Prerequisites
- Node.js 18+ and npm
- MongoDB 6.0+
- Docker & Docker Compose (for containerized deployment)

### Local Development Setup

1. **Clone the repository**
```bash
git clone <repository-url>
cd dream_project
```

2. **Setup Environment Variables**
```bash
cp .env.example .env
```

Edit `.env` with your configuration:
```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/website_management
JWT_SECRET=your-super-secret-key
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
EMAIL_FROM=noreply@yourcompany.com
```

3. **Install Dependencies**
```bash
# Install root dependencies
npm install

# Install all dependencies (backend + frontend)
npm run install-all
```

4. **Seed Database**
```bash
npm run seed
```

This creates:
- 1 Super Admin
- 3 Customers with Customer Admins
- 5 Sample websites
- Sample payment invoices

5. **Run in Development Mode**
```bash
# Run both backend and frontend concurrently
npm run dev
```

- Backend: http://localhost:5000
- Frontend: http://localhost:3000

### Docker Deployment

1. **Build and start containers**
```bash
npm run docker:build
npm run docker:up
```

2. **Seed database in Docker**
```bash
docker exec -it website_mgmt_backend npm run seed
```

3. **Access the application**
- Application: http://localhost:3000
- API: http://localhost:5000

4. **View logs**
```bash
npm run docker:logs
```

5. **Stop containers**
```bash
npm run docker:down
```

## 🔐 Login Credentials (After Seeding)

### Super Admin
- **Email**: admin@company.com
- **Password**: admin123

### Customer Admins
1. **John Tech Solutions**
   - Email: john@tech.com
   - Password: customer123

2. **Sarah Digital Agency**
   - Email: sarah@digital.com
   - Password: customer123

3. **Mike E-Commerce**
   - Email: mike@ecommerce.com
   - Password: customer123

## 💳 Payment QR Code Setup

### How to Replace QR Code Placeholder

The payment page displays a QR code placeholder. To add your actual payment QR code:

1. **Prepare your QR code image** (format: PNG, JPG, or SVG)
   - Recommended size: 300x300px or larger
   - Name it: `payment-qr.png`

2. **Option 1: Update Frontend Component**

Edit `frontend/src/pages/PaymentPage.jsx`:

```jsx
// Replace this section:
<FaQrcode className="text-8xl text-gray-300 mx-auto mb-4" />

// With:
<img 
  src="/path/to/your/payment-qr.png" 
  alt="Payment QR Code"
  className="w-48 h-48 mx-auto mb-4"
/>
```

3. **Option 2: Add QR Code to Database (Future Enhancement)**

You can extend the system to allow admins to upload QR codes per company:
- Add `paymentQRCode` field to Admin/Customer schema
- Store in uploads directory
- Display dynamically on payment page

### Manual Payment Verification Process

1. **Customer uploads payment proof**
   - Customer navigates to Payment page
   - Uploads screenshot/receipt (JPG, PNG, or PDF)
   - System changes status to `proof_uploaded`

2. **Admin receives notification**
   - Email notification sent to Super Admin
   - Payment appears in admin dashboard with "Verify" button

3. **Admin verifies payment**
   - Super Admin reviews the uploaded proof
   - Clicks "Verify" button in Payments page
   - System marks payment as `paid`
   - Updates next payment date
   - Reactivates suspended site automatically
   - Sends reactivation email to customer

## 📊 Database Schema

### Collections

**admins**
- Super Admins (full control)
- Customer Admins (limited to their sites)

**customers**
- Client company information
- Billing details

**sites**
- Website domain and configuration
- Payment settings
- Uptime statistics
- Status (active/suspended/inactive)

**payments**
- Invoice details
- Payment proof uploads
- Verification status
- Payment history

**uptime_logs**
- Timestamp of each check
- Response status and time
- Error messages
- Auto-deletes after 90 days (TTL index)

## ⚙️ Automated Workflows

### Uptime Monitoring (Every 10 minutes)
1. Check all active and suspended sites via HTTP request
2. Log results to `uptime_logs` collection
3. Update site's `currentUptime` percentage (last 24 hours)
4. Mark sites as down if unreachable
5. Send email alerts for downtime

### Billing Check (Daily at 9:00 AM)
1. Check all pending payments
2. Send reminders:
   - **10 days before**: Friendly reminder
   - **On due date**: Warning notice
   - **After due date**: Overdue warnings
3. Auto-suspend sites after grace period (default: 10 days)
4. Send suspension emails

### Payment Processing
1. Customer uploads payment proof
2. Payment status → `proof_uploaded`
3. Admin notification sent
4. Admin verifies payment
5. Payment status → `paid`
6. Update next payment date (+3 months)
7. Reactivate suspended site
8. Send reactivation email

## 🧪 Testing

### Run Unit Tests
```bash
cd backend
npm test
```

### Run Tests with Coverage
```bash
cd backend
npm test -- --coverage
```

Tests cover:
- Billing service (suspension, reactivation, payment marking)
- Site model methods (overdue checks, grace period)
- Payment model methods (reminder tracking)

## 📡 API Documentation

### Authentication
```
POST /api/auth/login
POST /api/auth/register (Super Admin only)
GET  /api/auth/me
PUT  /api/auth/profile
PUT  /api/auth/change-password
```

### Dashboard
```
GET /api/dashboard/stats
GET /api/dashboard/activities
GET /api/dashboard/upcoming-payments
GET /api/dashboard/low-uptime-sites (Super Admin only)
```

### Customers (Super Admin only)
```
GET    /api/customers
GET    /api/customers/:id
POST   /api/customers
PUT    /api/customers/:id
DELETE /api/customers/:id
```

### Sites
```
GET    /api/sites
GET    /api/sites/:id
POST   /api/sites (Super Admin only)
PUT    /api/sites/:id (Super Admin only)
DELETE /api/sites/:id (Super Admin only)
POST   /api/sites/:id/suspend (Super Admin only)
POST   /api/sites/:id/reactivate (Super Admin only)
GET    /api/sites/:id/uptime
GET    /api/sites/:siteId/payments
GET    /api/sites/:siteId/pending-payment
```

### Payments
```
GET  /api/payments
GET  /api/payments/:id
POST /api/payments/:id/upload-proof
POST /api/payments/:id/verify (Super Admin only)
POST /api/payments/:id/mark-paid (Super Admin only)
```

## 🔒 Security Features

- **JWT Authentication**: Secure token-based auth
- **Password Hashing**: bcrypt with salt rounds
- **Role-based Access Control**: Super Admin vs Customer Admin
- **Rate Limiting**: 100 requests per 15 minutes per IP
- **Helmet.js**: Security headers
- **Input Validation**: express-validator
- **File Upload Limits**: Max 5MB for payment proofs
- **CORS Protection**: Configured origins

## 🚀 Production Deployment

### Environment Variables for Production
```env
NODE_ENV=production
MONGODB_URI=mongodb://your-production-db:27017/website_management
JWT_SECRET=use-a-very-strong-random-secret-key
SMTP_HOST=your-smtp-server.com
SMTP_USER=your-production-email
SMTP_PASS=your-production-password
```

### SSL Configuration

1. Obtain SSL certificates (Let's Encrypt recommended)
2. Place certificates in `nginx/ssl/`
3. Uncomment SSL block in `nginx/nginx.conf`
4. Update server_name with your domain
5. Restart nginx container

### Monitoring & Maintenance

- Monitor MongoDB performance and disk space
- Set up log rotation for application logs
- Regular database backups
- Monitor email delivery rates
- Track uptime check accuracy

## 🔄 Future Enhancements (Gateway Integration)

The system is designed to easily integrate payment gateways. Hooks are provided in:

**Backend**: `backend/src/models/Payment.js`
```javascript
// FUTURE: Add fields like gateway_transaction_id, gateway_response
gatewayTransactionId: String
gatewayResponse: Mixed
```

**Frontend**: `frontend/src/pages/PaymentPage.jsx`
```javascript
// Add gateway integration code here
// Example: Razorpay, Stripe, PayPal
```

To integrate a gateway:
1. Add gateway SDK to dependencies
2. Create payment intent/order on backend
3. Handle gateway callback
4. Auto-verify payment on successful transaction
5. Remove manual verification step

## 🐛 Troubleshooting

### MongoDB Connection Issues
```bash
# Check MongoDB is running
docker ps | grep mongodb

# Check logs
docker logs website_mgmt_mongodb
```

### Email Not Sending
- Verify SMTP credentials in `.env`
- For Gmail: Enable "Less secure app access" or use App Password
- Check email service logs in backend console

### Uptime Checks Failing
- Ensure sites have valid URLs with http:// or https://
- Check firewall rules
- Verify timeout settings in `.env`

### File Upload Issues
- Check `backend/uploads/` directory permissions
- Verify MAX_FILE_SIZE in `.env`
- Check disk space

## 📝 License

MIT License - feel free to use this project for your business!

## 🤝 Support

For issues or questions:
- Check the troubleshooting section
- Review the API documentation
- Contact: support@yourcompany.com

---

**Built with ❤️ for IT companies managing multiple client websites**
