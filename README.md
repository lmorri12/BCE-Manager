# BCE Manager

Venue booking and operations app for **Biggar Corn Exchange**.

Built with **Next.js 15**, **React 19**, **Prisma**, **PostgreSQL**, and **NextAuth**.

## What it does

- Manage bookings from enquiry through confirmation, delivery, and closure
- Show bookings on a calendar, including multi-day events and separate setup days
- Track recurring bookings
- Assign staff and volunteers across tech, bar, front of house, duty manager, stair climber, and setup roles
- Record room layouts, setup notes, ticket prices, and hire information
- Store booking attachments
- Show notifications, reports, and audit history
- Support role-based access for Super Users, Bookings Admins, Tech Admins, Bar Admins, and Trustees

## Main features

- **Bookings workflow**: enquiry, confirmed, in progress, ready, day-of, post-event, closed, cancelled
- **Calendar**: confirmed bookings, internal bookings, pencil dates, and setup-day visibility
- **Multi-day bookings**: one booking can contain multiple event days with separate times
- **Conflict handling**: detects clashes across event days and setup days
- **Attachments**: limited to Word documents, PDFs, and image files
- **Audit log**: tracks key actions including uploads, deletions, booking updates, and user logins

## Tech stack

- Next.js
- React
- TypeScript
- Prisma
- PostgreSQL
- NextAuth

## Local development

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create your environment file:

   ```bash
   copy .env.example .env
   ```

3. Set the required variables, including:

- `DATABASE_URL`
- `AUTH_SECRET` or `NEXTAUTH_SECRET`
- `NEXTAUTH_URL`

4. Generate Prisma client:

   ```bash
   npm run db:generate
   ```

5. Push the schema to your database:

   ```bash
   npm run db:push
   ```

6. Seed the initial admin user:

   ```bash
   npm run db:seed
   ```

7. Start the app:

   ```bash
   npm run dev
   ```

## Default seeded login

If the database has no users yet, the seed creates:

- **Username / email**: `admin`
- **Password**: `admin123`

Change this password immediately after first login.

## Useful scripts

```bash
npm run dev
npm run build
npm run start
npm run db:generate
npm run db:push
npm run db:seed
```

## Render notes

- Recent Prisma changes in this project are built around **Prisma 6**.
- If Render pulls Prisma 7 when running ad-hoc commands, use:

  ```bash
  npx prisma@6.19.2 db push --schema=prisma/schema.prisma
  ```

- Uploaded attachments are stored on the app filesystem under:

  ```text
  /app/uploads/bookings/<bookingId>
  ```

  On Render, use a **persistent disk** if you want attachments to survive redeploys and restarts.

## Roles

- **Super User**: full access including users, audit log, import/export
- **Bookings Admin**: manage bookings, recurring bookings, nudges, and attachments
- **Tech Admin**: view bookings and assign technical roles
- **Bar Admin**: view bookings and assign bar roles
- **Trustee**: read-only oversight access

## Repository

GitHub: <https://github.com/lmorri12/BCE-Manager>
