/* =====================================================================
   Unipro Attendance - Performance indexes for the Home Dashboard
   (SP_Dashboard_Home + SP_Dashboard_AttendanceTrend).

   Safe to run on any environment: index-only, additive, idempotent
   (each CREATE is guarded, so re-running does nothing). No data change.

   Why these indexes:
   - tblAttendance already has PK(AttendanceId) and UNIQUE(EmployeeId, AttDate).
     The UNIQUE index leads with EmployeeId, so queries that filter by DATE
     alone (a.AttDate = @Ref, a.AttDate BETWEEN @From AND @To, MAX(AttDate))
     cannot seek and end up scanning the whole table. The new index below
     leads with AttDate and covers StatusCode + EmployeeId, turning those
     into fast seeks — the single biggest win for the dashboard.
   - tblEmployee is filtered on IsActive (+ optional DepartmentId) almost
     everywhere; a small covering index removes repeated clustered scans.
   - tblHourlyPermission is filtered by PermDate = @Ref for the dashboard,
     but its only index leads with EmployeeId. A PermDate-leading index
     makes the "permission today" counts seek.

   NOTE (not fixable by an index alone): the month/year buckets in the SPs
   use YEAR(AttDate)/MONTH(AttDate), which are non-SARGable and cannot seek.
   These indexes still help there (a narrow ordered index scan instead of a
   full table scan). The equality/range queries get true seeks.
   ===================================================================== */
USE ATTANDANCE_IMP;
GO

/* 1) MAIN TABLE — date-leading covering index on tblAttendance. */
IF NOT EXISTS (SELECT 1 FROM sys.indexes
               WHERE name = 'IX_tblAttendance_AttDate_Status'
                 AND object_id = OBJECT_ID('dbo.tblAttendance'))
    CREATE NONCLUSTERED INDEX IX_tblAttendance_AttDate_Status
        ON dbo.tblAttendance (AttDate, StatusCode)
        INCLUDE (EmployeeId);
GO

/* 2) tblEmployee — active + department filter, covering Code/Name for output. */
IF NOT EXISTS (SELECT 1 FROM sys.indexes
               WHERE name = 'IX_tblEmployee_Active_Dept'
                 AND object_id = OBJECT_ID('dbo.tblEmployee'))
    CREATE NONCLUSTERED INDEX IX_tblEmployee_Active_Dept
        ON dbo.tblEmployee (IsActive, DepartmentId)
        INCLUDE (EmployeeCode, Name);
GO

/* 3) tblHourlyPermission — date-leading index for the "permission today" counts. */
IF NOT EXISTS (SELECT 1 FROM sys.indexes
               WHERE name = 'IX_Perm_PermDate'
                 AND object_id = OBJECT_ID('dbo.tblHourlyPermission'))
    CREATE NONCLUSTERED INDEX IX_Perm_PermDate
        ON dbo.tblHourlyPermission (PermDate)
        INCLUDE (EmployeeId, FromTime, ToTime, Reason);
GO

/* tblHoliday already has UNIQUE(HolidayDate) and tblDepartment PK(DepartmentId),
   so their dashboard lookups are already covered — no new index needed. */

PRINT 'Dashboard performance indexes ensured.';
GO
