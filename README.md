# ⏰ Time Clock App - v3

Employee time tracking system with GPS location verification and geofencing.

## 🚀 **LIVE SITE - USE THESE URLs:**

### **Main Entry Points:**
- **Signup:** https://dmhiopllc-tech.github.io/DMHIOP_timeclock/index-v3.html
- **Login:** https://dmhiopllc-tech.github.io/DMHIOP_timeclock/login-v3.html
- **Dashboard:** https://dmhiopllc-tech.github.io/DMHIOP_timeclock/dashboard-v3.html

### **Auto-Redirect:**
- https://dmhiopllc-tech.github.io/DMHIOP_timeclock/ (redirects to index-v3.html)

---

## 📋 Features

- **Employee Dashboard** - Clock in/out with GPS tracking
- **Geofencing** - Verify employees are at work locations
- **Today's Summary** - View daily hours and clock times
- **Manager Dashboard** - Approve timesheets (coming soon)
- **Admin Portal** - Manage users and locations (coming soon)
- **Payroll Export** - Export approved hours to CSV (coming soon)

## 🔧 Tech Stack

- **Frontend:** HTML5, CSS3, JavaScript (Vanilla)
- **Styling:** Tailwind CSS via CDN
- **Icons:** Font Awesome 6.4.0
- **Database:** Supabase (PostgreSQL)
- **Authentication:** Supabase Auth
- **GPS:** Browser Geolocation API
- **Hosting:** GitHub Pages

## 📖 Active Files (v3)

### **HTML Pages:**
- `index-v3.html` - Signup page (main entry)
- `login-v3.html` - Login page
- `dashboard-v3.html` - Employee dashboard
- `index.html` - Redirect to index-v3.html

### **JavaScript:**
- `timeclock-config-v2.js` - Supabase configuration
- `timeclock-auth-v2.js` - Authentication utilities
- `timeclock-geofencing-v2.js` - GPS and geofencing logic

### **Assets:**
- `logo.svg` - DMH branded logo

### **Deprecated Files (ignore):**
- `config.js` - Empty (use timeclock-config-v2.js)
- `auth.js` - Empty (use timeclock-auth-v2.js)
- `geofencing.js` - Empty (use timeclock-geofencing-v2.js)

---

## 🎯 Setup Instructions

### **For Admins: Create Admin Accounts**

1. **Sign up at:** https://dmhiopllc-tech.github.io/DMHIOP_timeclock/index-v3.html
2. **Create accounts for:**
   - Sean Roberts: sean_roberts@dmhiop.com
   - Tatiana Schnierow: tatiana.schnierow@dmhiop.com

3. **Upgrade to admin via Supabase SQL:**
   ```sql
   UPDATE public.users 
   SET role = 'admin'
   WHERE email IN ('sean_roberts@dmhiop.com', 'tatiana.schnierow@dmhiop.com'); 
