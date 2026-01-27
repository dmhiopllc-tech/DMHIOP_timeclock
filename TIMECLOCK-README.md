# ⏰ Time Clock App

A comprehensive employee time tracking system with GPS location verification, geofencing, manager approvals, and payroll export.

---

## 🎯 Features

### For Employees:
- ✅ Clock In/Out with single button
- 📍 GPS location tracking on every clock action
- 🗺️ Geofencing validation (must be at approved work location)
- 📊 View personal timesheet
- 📅 See weekly/monthly hours summary

### For Managers:
- 👥 View all employee timesheets
- ✅ Approve or reject time entries
- 📝 Edit time entries (with notes)
- 📊 Team reports and analytics
- 📤 Export approved hours to CSV/Excel

### For Admins:
- ⚙️ Full system control
- 👤 User management (add/edit/delete employees)
- 📍 Manage work locations with geofencing
- 🔧 System settings and configurations
- 💾 Database management

---

## 🏗️ Tech Stack

- **Frontend**: HTML5, CSS3, JavaScript (Vanilla)
- **Styling**: Tailwind CSS via CDN
- **Icons**: Font Awesome 6.4.0
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **GPS**: Browser Geolocation API
- **PWA**: Service Worker + Manifest
- **Mobile**: Responsive design, mobile-first

---

## 📊 Database Schema

### Tables:

#### `users`
- `id` (UUID, primary key)
- `email` (text, unique)
- `full_name` (text)
- `role` (text: 'employee', 'manager', 'admin')
- `employee_id` (text, optional)
- `hourly_rate` (decimal, optional)
- `created_at` (timestamp)

#### `work_locations`
- `id` (UUID, primary key)
- `name` (text)
- `address` (text)
- `latitude` (decimal)
- `longitude` (decimal)
- `radius_meters` (integer, default: 100)
- `is_active` (boolean, default: true)
- `created_at` (timestamp)

#### `time_entries`
- `id` (UUID, primary key)
- `user_id` (UUID, foreign key → users)
- `clock_in_time` (timestamp)
- `clock_in_latitude` (decimal)
- `clock_in_longitude` (decimal)
- `clock_in_location_id` (UUID, foreign key → work_locations)
- `clock_out_time` (timestamp, nullable)
- `clock_out_latitude` (decimal, nullable)
- `clock_out_longitude` (decimal, nullable)
- `clock_out_location_id` (UUID, nullable)
- `total_hours` (decimal, calculated)
- `status` (text: 'clocked_in', 'clocked_out', 'pending_approval', 'approved', 'rejected')
- `notes` (text, nullable)
- `created_at` (timestamp)
- `updated_at` (timestamp)

#### `approvals`
- `id` (UUID, primary key)
- `time_entry_id` (UUID, foreign key → time_entries)
- `approved_by` (UUID, foreign key → users)
- `status` (text: 'approved', 'rejected')
- `notes` (text, nullable)
- `approved_at` (timestamp)

---

## 🚀 Pages Structure

### Public Pages:
- `index.html` - Landing page
- `login.html` - Login page
- `signup.html` - Employee registration

### Employee Pages:
- `employee-dashboard.html` - Clock In/Out interface
- `my-timesheet.html` - View personal hours
- `profile.html` - Edit profile

### Manager Pages:
- `manager-dashboard.html` - Overview of all employees
- `approve-timesheets.html` - Approve/reject entries
- `reports.html` - Generate reports
- `export-payroll.html` - Export to CSV/Excel

### Admin Pages:
- `admin-dashboard.html` - System overview
- `manage-users.html` - User management
- `manage-locations.html` - Work location setup
- `system-settings.html` - Configuration

---

## 🗺️ Geofencing Logic

1. **On Clock In/Out**: Get current GPS coordinates
2. **Check Distance**: Calculate distance to all active work locations
3. **Validate**: Must be within location radius (default: 100 meters)
4. **Allow/Deny**: Permit clock action only if within geofence
5. **Log Location**: Store coordinates and location_id with time entry

---

## 📱 PWA Features

- ✅ Installable on mobile devices
- ✅ Offline capability (view cached timesheets)
- ✅ Push notifications (optional: reminders to clock out)
- ✅ Mobile-optimized UI
- ✅ Fast loading with service worker caching

---

## 🔐 Security Features

- Role-based access control (RBAC)
- GPS spoofing detection (compare with previous entries)
- Manager approval required before payroll export
- Audit trail for all edits
- Supabase Row-Level Security (RLS)

---

## 📤 Payroll Export Format

CSV file with columns:
- Employee ID
- Employee Name
- Date
- Clock In Time
- Clock Out Time
- Total Hours
- Location
- Status
- Approved By
- Notes

---

## 🎨 Design

- **Color Scheme**: Professional blue/gray palette
- **Mobile-First**: Optimized for phones and tablets
- **Large Touch Targets**: Easy clock in/out buttons
- **Clear Status**: Visual indicators for clock status
- **Responsive**: Works on all screen sizes

---

## 📋 Current Status

✅ Project initialized
⏳ Database schema designed
⏳ Building authentication system
⏳ Creating employee dashboard
⏳ Implementing geofencing
⏳ Building manager features
⏳ Creating admin portal

---

## 🛠️ Setup Instructions

### 1. Create Supabase Project
1. Go to https://supabase.com
2. Create new project
3. Note your project URL and anon key

### 2. Run Database Setup
Execute the SQL file: `database-setup.sql`

### 3. Configure Environment
Update Supabase credentials in `js/config.js`

### 4. Deploy
Upload all files to your hosting (GitHub Pages, Netlify, Vercel, etc.)

---

## 📞 Support

Need help? Create an issue or contact support. 

---

**Built with ❤️ for efficient time tracking** 
