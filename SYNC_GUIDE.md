# Data Synchronization Guide

## Overview

Your Urea Delivery Tracker application has been migrated from local AsyncStorage to a **centralized PostgreSQL database**. This means:

✅ **Your colleague will NOW see the same clients, deliveries, and invoices as you**
✅ **Changes made by one user appear instantly on all other devices**
✅ **All data is stored securely on the server**

---

## What Changed

### Before (Local Storage)
```
Device A (Your Phone)
├── Clients (local AsyncStorage)
├── Deliveries (local AsyncStorage)
└── Invoices (local AsyncStorage)

Device B (Colleague's Phone)
├── Clients (local AsyncStorage) ❌ Different!
├── Deliveries (local AsyncStorage) ❌ Different!
└── Invoices (local AsyncStorage) ❌ Different!
```

### After (Centralized Database)
```
Device A (Your Phone)
├── tRPC API Calls
└── PostgreSQL Server ✅ Same Data!

Device B (Colleague's Phone)
├── tRPC API Calls
└── PostgreSQL Server ✅ Same Data!
```

---

## Architecture

### Database Schema

#### 1. **Clients Table**
Stores all client information with complete contact details:
- `id` - Unique identifier
- `userId` - Owner of the client record
- `name` - Client name (required)
- `company` - Company name
- `phone` - Phone number
- `address` - Physical address
- `email` - Email address
- `notes` - Additional notes
- `createdAt` - Timestamp
- `updatedAt` - Last modification timestamp

#### 2. **Sites Table**
Stores delivery sites for each client:
- `id` - Unique identifier
- `userId` - Owner
- `clientId` - Reference to client
- `name` - Site name
- `address` - Site address

#### 3. **Deliveries Table**
Tracks all urea deliveries:
- `id` - Unique identifier
- `userId` - Driver/owner
- `clientId` - Which client
- `clientName` - Client name (denormalized for quick access)
- `clientCompany` - Client company
- `siteId` - Which site
- `siteName` - Site name
- `driverName` - Driver name
- `startTime` - Delivery start
- `endTime` - Delivery end
- `litersDelivered` - Amount delivered
- `photos` - Photo URLs
- `status` - Delivery status

#### 4. **Invoices Table**
Tracks billing information:
- `id` - Unique identifier
- `userId` - Owner
- `deliveryId` - Reference to delivery
- `clientId` - Reference to client
- `clientName` - Client name
- `clientEmail` - Client email
- `clientAddress` - Client address
- `invoiceNumber` - Invoice number (unique)
- `invoiceDate` - Invoice date
- `serviceFee` - Service charge
- `pricePerLiter` - Price per liter
- `litersDelivered` - Liters delivered
- `subtotal` - Subtotal
- `gst` - GST tax
- `qst` - QST tax
- `total` - Total amount
- `status` - `draft`, `sent`, or `paid`

#### 5. **Audit Logs Table**
Tracks all changes for compliance:
- `id` - Unique identifier
- `userId` - Who made the change
- `userName` - User name
- `action` - What action (create, update, delete)
- `entityType` - What entity (client, delivery, invoice)
- `entityId` - Which entity
- `details` - Change details
- `createdAt` - When the change occurred

#### 6. **Driver Accounts Table**
Manages driver login accounts:
- `id` - Unique identifier
- `userId` - Admin owner
- `username` - Login username
- `passwordHash` - Hashed password
- `role` - `driver` or `admin`
- `isActive` - Account status
- `createdAt` - Account creation
- `updatedAt` - Last update

---

## API Endpoints

### Clients API
```
GET    /api/trpc/delivery.listClients       - Get all clients
GET    /api/trpc/delivery.getClient         - Get specific client
POST   /api/trpc/delivery.createClient      - Create new client
PATCH  /api/trpc/delivery.updateClient      - Update client
DELETE /api/trpc/delivery.deleteClient      - Delete client
```

### Deliveries API
```
GET    /api/trpc/delivery.listDeliveries    - Get all deliveries
GET    /api/trpc/delivery.getDelivery       - Get specific delivery
POST   /api/trpc/delivery.createDelivery    - Create new delivery
PATCH  /api/trpc/delivery.updateDelivery    - Update delivery
DELETE /api/trpc/delivery.deleteDelivery    - Delete delivery
```

### Invoices API
```
GET    /api/trpc/invoices.listInvoices      - Get all invoices
GET    /api/trpc/invoices.getInvoice        - Get specific invoice
POST   /api/trpc/invoices.createInvoice     - Create new invoice
PATCH  /api/trpc/invoices.updateStatus      - Update invoice status
DELETE /api/trpc/invoices.deleteInvoice     - Delete invoice
```

### Admin API
```
GET    /api/trpc/admin.listAuditLogs        - View audit logs
POST   /api/trpc/admin.createAuditLog       - Create audit log entry
GET    /api/trpc/admin.listDriverAccounts   - Get driver accounts
POST   /api/trpc/admin.createDriverAccount  - Create driver account
PATCH  /api/trpc/admin.updateDriverAccount  - Update driver account
DELETE /api/trpc/admin.deleteDriverAccount  - Delete driver account
```

---

## Frontend Integration

### Updated Screens

#### 1. **Clients Screen** (`app/(tabs)/index.tsx`)
- ✅ Now uses `trpc.delivery.listClients.useQuery()`
- ✅ Real-time updates when clients are added/modified
- ✅ Pull-to-refresh loads latest data from server

#### 2. **History Screen** (`app/(tabs)/history.tsx`)
- ✅ Now uses `trpc.delivery.listDeliveries.useQuery()`
- ✅ Now uses `trpc.invoices.listInvoices.useQuery()`
- ✅ Tab switching between deliveries and invoices

### How tRPC Hooks Work

```typescript
// Query (GET data)
const { data: clients, refetch, isLoading } = trpc.delivery.listClients.useQuery();

// Mutation (POST/PATCH/DELETE data)
const createMutation = trpc.delivery.createClient.useMutation({
  onSuccess: () => refetch(), // Refresh after success
});

// Usage
await createMutation.mutateAsync({ name: "New Client" });
```

---

## Testing Synchronization

### Manual Testing Steps

1. **Open two browser windows/devices**
   ```
   Device A: https://your-app.com
   Device B: https://your-app.com
   ```

2. **Login with the same user account on both**

3. **Test Create**
   - On Device A: Create a new client "Acme Corp"
   - On Device B: Pull down to refresh
   - ✅ Verify: "Acme Corp" appears on Device B

4. **Test Update**
   - On Device B: Edit the client name to "Acme Corporation"
   - On Device A: Pull down to refresh
   - ✅ Verify: Name is updated to "Acme Corporation"

5. **Test Delete**
   - On Device A: Delete the client
   - On Device B: Pull down to refresh
   - ✅ Verify: Client is removed from Device B

### Automated Testing

Run the test suite:
```bash
npm test
```

This runs all API synchronization tests to verify:
- Database schema is correct
- All required fields exist
- API endpoints are accessible

---

## Deployment Checklist

- [ ] Run database migrations: `npm run db:push`
- [ ] Verify database connection in `.env`
- [ ] Test on development server: `npm run dev`
- [ ] Test cross-device synchronization manually
- [ ] Deploy to production
- [ ] Verify production database has all tables
- [ ] Monitor audit logs for any issues

---

## Database Migrations

### Running Migrations

```bash
# Generate and apply migrations
npm run db:push

# Or use the automated script
bash scripts/migrate-db.sh
```

### What Migrations Do

1. **Generate** - Compares your schema with the database
2. **Create** - Adds new tables and columns
3. **Migrate** - Applies changes safely

### Migration Safety

- ✅ Existing data is preserved
- ✅ Only adds new columns (no data loss)
- ✅ Can be run multiple times safely
- ✅ Generates SQL files for review

---

## Troubleshooting

### Issue: "Database connection failed"
**Solution:** Verify `DATABASE_URL` environment variable is set correctly

### Issue: "Data not syncing between devices"
**Solution:** 
1. Check both devices are using the same user account
2. Verify internet connection
3. Check browser console for errors
4. Try refreshing the page

### Issue: "Migration stuck"
**Solution:**
```bash
# Kill any stuck processes
pkill -f drizzle

# Try again
npm run db:push
```

### Issue: "Audit logs not showing"
**Solution:** Verify user has admin role to view audit logs

---

## Performance Optimization

### Caching Strategy
- tRPC queries are cached automatically
- Pull-to-refresh forces fresh data from server
- Mutations automatically invalidate related queries

### Database Indexes
- `clients.userId` - Fast user lookup
- `deliveries.clientId` - Fast delivery lookup
- `invoices.invoiceNumber` - Unique invoice lookup
- `auditLogs.userId` - Fast audit lookup

### Query Optimization
- Queries only fetch required fields
- Pagination can be added for large datasets
- Audit logs have limit of 100 by default

---

## Security

### Authentication
- All API calls require valid user session
- User can only see their own data
- Admin can view audit logs

### Data Protection
- Passwords hashed with bcrypt
- Sensitive data not logged
- Audit trail of all changes

### Database Security
- SSL/TLS encryption for connections
- Regular backups
- Access control per user

---

## Next Steps

1. **Deploy Migrations**
   ```bash
   npm run db:push
   ```

2. **Test Synchronization**
   - Open app on two devices
   - Create/edit/delete data
   - Verify changes appear on both devices

3. **Monitor Audit Logs**
   - Check admin panel for any errors
   - Review user activity

4. **Backup Database**
   - Set up automated backups
   - Test restore procedures

---

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review server logs: `npm run dev`
3. Check browser console for errors
4. Review audit logs for failed operations

---

**Your app is now ready for multi-user, real-time data synchronization!** 🎉
