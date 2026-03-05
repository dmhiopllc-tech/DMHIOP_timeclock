# 🕒 DMHIOP Time Clock System

**Enterprise Time & Attendance Management System**  
**Version**: 4.0  
**Status**: 🟢 **PRODUCTION LIVE**  
**Last Updated**: March 5, 2026  
**Live URL**: https://dmhioptimeclock.com/

---

## 📋 TABLE OF CONTENTS

1. [Overview](#overview)
2. [Live URLs](#live-urls)
3. [Features](#features)
4. [User Roles](#user-roles)
5. [Database Schema](#database-schema)
6. [Edge Functions](#edge-functions)
7. [Admin Dashboard](#admin-dashboard)
8. [Employee Portal](#employee-portal)
9. [Authentication](#authentication)
10. [Approval Workflow](#approval-workflow)
11. [Payroll System](#payroll-system)
12. [Technical Stack](#technical-stack)
13. [Setup & Deployment](#setup--deployment)
14. [Troubleshooting](#troubleshooting)

---

## 🎯 OVERVIEW

The DMHIOP Time Clock System is a comprehensive web-based employee time tracking and management platform built for DMHIOP LLC. It provides real-time clock in/out functionality, time-off request management, payroll processing, geofencing, and multi-level approval workflows.

### **Key Highlights**
- ✅ **Real-time clock tracking** with geolocation verification
- ✅ **Multi-level approval system** (Tatiana + Sean/Gary required)
- ✅ **Automatic employee creation** with Supabase Edge Functions
- ✅ **One-click password reset** (default: `#Test12345`)
- ✅ **Payroll preview & export** with time entry editing
- ✅ **PTO/Sick time tracking** with automatic accrual
- ✅ **Geofence validation** for on-site clock in/out
- ✅ **Audit trail system** for all time entry modifications
- ✅ **Mobile-responsive design** (works on any device)

---

## 🌐 LIVE URLS

| Page | URL | Description |
|------|-----|-------------|
| **Login** | https://dmhioptimeclock.com/login-standalone.html | Main login page |
| **Signup** | https://dmhioptimeclock.com/signup-standalone.html | Employee self-registration |
| **Employee Dashboard** | https://dmhioptimeclock.com/employee-dashboard-standalone.html | Employee clock in/out & time-off requests |
| **Admin Dashboard** | https://dmhioptimeclock.com/admin-dashboard-standalone.html | Complete admin control panel |
| **Staff Dashboard** | https://dmhioptimeclock.com/staff-dashboard.html | Manager-level access |

---

## ✨ FEATURES

### **Core Features**
1. ✅ **Time Tracking**
   - Clock in/out with GPS verification
   - Real-time status updates
   - Break tracking
   - Overtime calculation (over 40 hours/week)

2. ✅ **Time-Off Management**
   - PTO/Sick/Vacation requests
   - Multi-level approval workflow
   - Balance tracking with automatic accrual
   - Request history

3. ✅ **Employee Management**
   - Add/Edit/Delete employees
   - Automatic auth account creation
   - Role-based access control
   - Employee profiles with pay rates

4. ✅ **Payroll Processing**
   - Pay period selection
   - Payroll preview with expandable rows
   - CSV export for QuickBooks/ADP
   - Time entry editing with audit trail
   - Overtime calculation

5. ✅ **Geofencing**
   - Location-based clock in/out
   - Work location management
   - GPS coordinate validation

6. ✅ **Messaging System**
   - Admin-to-employee messaging
   - Broadcast messages to all employees
   - Priority flag for urgent messages

7. ✅ **Alerts & Notifications**
   - System alerts (severity levels)
   - Clock in/out alerts
   - Time-off request notifications
   - Missing clock-out alerts

8. ✅ **Audit Trail**
   - All time entry modifications logged
   - Admin action history
   - Who changed what and when

---

## 👥 USER ROLES

### **1. Admin** (Full Access)
**Users**: Sean Roberts, Gary, Tatiana Schnierow

**Permissions**:
- ✅ Access admin dashboard
- ✅ View all employee data
- ✅ Add/Edit/Delete employees
- ✅ Reset passwords
- ✅ Approve/Reject time-off requests
- ✅ Edit time entries
- ✅ Generate payroll reports
- ✅ Manage work locations
- ✅ Send messages to employees
- ✅ View all alerts

### **2. Manager** (Limited Access)
**Permissions**:
- ✅ View team member time entries
- ✅ Submit time-off requests
- ✅ Clock in/out
- ⚠️ Cannot approve time-off
- ⚠️ Cannot edit other employees

### **3. Employee** (Basic Access)
**Permissions**:
- ✅ Clock in/out
- ✅ Submit time-off requests
- ✅ View own time entries
- ✅ View PTO/Sick balances
- ✅ Receive messages
- ⚠️ Cannot view other employees
- ⚠️ Cannot edit time entries

---

## 🗄️ DATABASE SCHEMA

**Platform**: Supabase (PostgreSQL)  
**Project URL**: https://dgfzrkbgrzenukjelnjl.supabase.co

### **Tables**

#### **1. users**
Primary employee records and authentication data.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key (matches Supabase Auth user ID) |
| email | TEXT | Employee email (unique) |
| full_name | TEXT | Employee full name |
| employee_number | TEXT | Employee ID/number |
| role | TEXT | Role: 'admin', 'manager', 'employee' |
| pay_rate | NUMERIC | Hourly pay rate |
| phone | TEXT | Phone number |
| is_active | BOOLEAN | Active status |
| overtime_eligible | BOOLEAN | Eligible for overtime |
| overtime_threshold | NUMERIC | Hours before overtime (default: 40) |
| created_at | TIMESTAMP | Account creation date |
| updated_at | TIMESTAMP | Last update date |

#### **2. time_entries**
Clock in/out records.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | Foreign key → users.id |
| clock_in_time | TIMESTAMP | Clock in timestamp |
| clock_out_time | TIMESTAMP | Clock out timestamp (nullable) |
| total_hours | NUMERIC | Calculated total hours |
| status | TEXT | 'clocked_in', 'clocked_out', 'pending_approval' |
| location_id | UUID | Foreign key → work_locations.id |
| clock_in_lat | NUMERIC | GPS latitude (clock in) |
| clock_in_lng | NUMERIC | GPS longitude (clock in) |
| clock_out_lat | NUMERIC | GPS latitude (clock out) |
| clock_out_lng | NUMERIC | GPS longitude (clock out) |
| notes | TEXT | Admin notes |
| created_at | TIMESTAMP | Record creation date |

#### **3. time_entry_audit**
Audit trail for time entry modifications.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| time_entry_id | UUID | Foreign key → time_entries.id |
| admin_id | UUID | Admin who made the change |
| action | TEXT | 'created', 'updated', 'deleted' |
| old_values | JSONB | Previous values (JSON) |
| new_values | JSONB | New values (JSON) |
| reason | TEXT | Reason for change |
| created_at | TIMESTAMP | Audit timestamp |

#### **4. time_off_requests**
PTO, sick leave, vacation requests.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | Foreign key → users.id |
| request_type | TEXT | 'pto', 'sick', 'vacation', 'personal' |
| start_date | DATE | Start date |
| end_date | DATE | End date |
| hours_requested | NUMERIC | Total hours requested |
| status | TEXT | 'pending', 'approved', 'rejected' |
| approval_status | TEXT | 'pending', 'partially_approved', 'approved' |
| current_approvals | INTEGER | Number of approvals received |
| requires_approvals | INTEGER | Required approvals (default: 2) |
| employee_note | TEXT | Employee's reason |
| rejection_reason | TEXT | Admin's rejection reason |
| created_at | TIMESTAMP | Request date |

#### **5. time_off_approvals**
Multi-level approval records.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| time_off_request_id | UUID | Foreign key → time_off_requests.id |
| approver_id | UUID | Foreign key → users.id |
| approver_role | TEXT | Role of approver |
| approval_action | TEXT | 'approved', 'rejected' |
| approval_date | TIMESTAMP | Approval timestamp |
| notes | TEXT | Approver's notes |

**Unique Constraint**: `(time_off_request_id, approver_id)` - Prevents duplicate approvals

#### **6. pto_balances**
PTO and sick time balances.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | Foreign key → users.id |
| pto_balance | NUMERIC | Current PTO hours |
| sick_balance | NUMERIC | Current sick hours |
| pto_accrual_rate | NUMERIC | Hours accrued per pay period |
| sick_accrual_rate | NUMERIC | Sick hours accrued per pay period |
| pto_annual_cap | NUMERIC | Max PTO hours per year (default: 120) |
| sick_annual_cap | NUMERIC | Max sick hours per year (default: 64) |
| current_year | INTEGER | Year for tracking |
| last_accrual_date | DATE | Last accrual date |

#### **7. work_locations**
Geofence locations for clock in/out.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| location_name | TEXT | Location name |
| address | TEXT | Full address |
| latitude | NUMERIC | GPS latitude |
| longitude | NUMERIC | GPS longitude |
| radius_meters | INTEGER | Geofence radius (meters) |
| is_active | BOOLEAN | Active status |
| created_at | TIMESTAMP | Location creation date |

#### **8. admin_alerts**
System alerts and notifications.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | Foreign key → users.id (related employee) |
| alert_type | TEXT | 'clock_in', 'clock_out', 'time_off', etc. |
| severity | TEXT | 'low', 'medium', 'high' |
| message | TEXT | Alert message |
| is_resolved | BOOLEAN | Resolved status |
| created_at | TIMESTAMP | Alert timestamp |

#### **9. messages**
Admin-to-employee messaging.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| sender_id | UUID | Foreign key → users.id (admin) |
| recipient_id | UUID | Foreign key → users.id (employee, nullable) |
| message_text | TEXT | Message content |
| is_broadcast | BOOLEAN | Send to all employees |
| is_priority | BOOLEAN | Priority/urgent flag |
| is_read | BOOLEAN | Read status |
| created_at | TIMESTAMP | Message timestamp |

#### **10. payroll_exports**
Payroll export history and statistics.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| admin_id | UUID | Admin who exported |
| pay_period_start | DATE | Pay period start |
| pay_period_end | DATE | Pay period end |
| total_employees | INTEGER | Employees included |
| total_hours | NUMERIC | Total hours |
| total_regular_hours | NUMERIC | Regular hours |
| total_overtime_hours | NUMERIC | Overtime hours |
| export_date | TIMESTAMP | Export timestamp |

---

## ⚡ EDGE FUNCTIONS

**Platform**: Supabase Edge Functions (Deno runtime)  
**Base URL**: https://dgfzrkbgrzenukjelnjl.supabase.co/functions/v1/

### **1. quick-task** (Create Employee)
**URL**: `/functions/v1/quick-task`  
**Method**: POST  
**Purpose**: Creates a new employee with automatic Supabase Auth account

**Request Body**:
```json
{
  "email": "employee@dmhiop.com",
  "full_name": "John Smith",
  "employee_number": "EMP001",
  "pay_rate": 25.00,
  "role": "employee"
}
