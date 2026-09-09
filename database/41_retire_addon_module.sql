/* =====================================================================
   Unipro Attendance - Retire the standalone 'addon-master' RBAC module.
   Add-ons are now managed inside the Implementation Checklist master
   (a tab), governed by the 'impl-master' module. This just hides the
   orphaned module from the User Rights matrix. Safe to re-run.
   ===================================================================== */
USE ATTANDANCE_IMP;
GO

UPDATE dbo.tblModules SET IsActive = 0 WHERE ModuleCode = 'addon-master';
GO

PRINT 'addon-master module retired (folded into impl-master).';
GO
