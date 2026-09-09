/* =====================================================================
   Unipro Attendance - Travel Allowance updates
   - Renames the module display to "Travel Allowance".
   - Adds a Bike expense column to the breakdown.
   - Adds a "Travel Allowance Report" RBAC module (rpt-travel-allowance).
   Run against ATTANDANCE_IMP after 33_travel_advance.sql. Safe to re-run.
   (The internal module code stays 'travel-advance' so existing rights keep working.)
   ===================================================================== */
USE ATTANDANCE_IMP;
GO

IF COL_LENGTH('dbo.tblTravelAdvance', 'BikeExpense') IS NULL
    ALTER TABLE dbo.tblTravelAdvance ADD BikeExpense DECIMAL(12,2) NOT NULL DEFAULT 0;
GO

/* Recompute-aware Save (now includes Bike in the total). */
CREATE OR ALTER PROCEDURE dbo.SP_TravelAdvance_Save
    @TravelId INT = NULL,
    @EmployeeId INT,
    @ClientName NVARCHAR(150),
    @ClientLocation NVARCHAR(150),
    @TravelStartDate DATE,
    @TravelEndDate DATE,
    @OnsiteDays INT,
    @AdvanceAmount DECIMAL(12,2),
    @BusTicket DECIMAL(12,2) = 0, @TrainTicket DECIMAL(12,2) = 0, @FlightTicket DECIMAL(12,2) = 0,
    @BikeExpense DECIMAL(12,2) = 0, @Taxi DECIMAL(12,2) = 0, @HotelBill DECIMAL(12,2) = 0,
    @FoodBill DECIMAL(12,2) = 0, @OtherExpense DECIMAL(12,2) = 0,
    @Remarks NVARCHAR(500) = NULL,
    @DocumentsJson NVARCHAR(MAX) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @Total DECIMAL(12,2) =
        ISNULL(@BusTicket,0)+ISNULL(@TrainTicket,0)+ISNULL(@FlightTicket,0)+ISNULL(@BikeExpense,0)+ISNULL(@Taxi,0)
        +ISNULL(@HotelBill,0)+ISNULL(@FoodBill,0)+ISNULL(@OtherExpense,0);
    DECLARE @Balance DECIMAL(12,2) = ISNULL(@AdvanceAmount,0) - @Total;

    IF @TravelId IS NULL OR @TravelId = 0
    BEGIN
        INSERT dbo.tblTravelAdvance
            (EmployeeId, ClientName, ClientLocation, TravelStartDate, TravelEndDate, OnsiteDays, AdvanceAmount,
             BusTicket, TrainTicket, FlightTicket, BikeExpense, Taxi, HotelBill, FoodBill, OtherExpense,
             TotalExpense, BalanceAmount, Remarks, DocumentsJson, ApprovalStatus)
        VALUES
            (@EmployeeId, @ClientName, @ClientLocation, @TravelStartDate, @TravelEndDate, @OnsiteDays, @AdvanceAmount,
             @BusTicket, @TrainTicket, @FlightTicket, @BikeExpense, @Taxi, @HotelBill, @FoodBill, @OtherExpense,
             @Total, @Balance, @Remarks, @DocumentsJson, 'Pending');
        SELECT CAST(SCOPE_IDENTITY() AS INT) AS TravelId;
    END
    ELSE
    BEGIN
        UPDATE dbo.tblTravelAdvance SET
            EmployeeId=@EmployeeId, ClientName=@ClientName, ClientLocation=@ClientLocation,
            TravelStartDate=@TravelStartDate, TravelEndDate=@TravelEndDate, OnsiteDays=@OnsiteDays,
            AdvanceAmount=@AdvanceAmount, BusTicket=@BusTicket, TrainTicket=@TrainTicket, FlightTicket=@FlightTicket,
            BikeExpense=@BikeExpense, Taxi=@Taxi, HotelBill=@HotelBill, FoodBill=@FoodBill, OtherExpense=@OtherExpense,
            TotalExpense=@Total, BalanceAmount=@Balance, Remarks=@Remarks, DocumentsJson=@DocumentsJson,
            UpdatedAt=SYSUTCDATETIME()
        WHERE TravelId=@TravelId;
        SELECT @TravelId AS TravelId;
    END
END
GO

/* List now returns the Bike column too. */
CREATE OR ALTER PROCEDURE dbo.SP_TravelAdvance_GetAll
    @From DATE = NULL, @To DATE = NULL, @DepartmentId INT = NULL, @Status NVARCHAR(20) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SELECT
        t.TravelId, t.EmployeeId, e.Name AS EmployeeName, e.EmployeeCode,
        e.DepartmentId, d.DepartmentName,
        t.ClientName, t.ClientLocation, t.TravelStartDate, t.TravelEndDate, t.OnsiteDays,
        t.AdvanceAmount, t.BusTicket, t.TrainTicket, t.FlightTicket, t.BikeExpense, t.Taxi, t.HotelBill, t.FoodBill, t.OtherExpense,
        t.TotalExpense, t.BalanceAmount, t.Remarks, t.ApprovalStatus, t.ApprovedBy, t.ApprovedAt,
        HasDocs = CASE WHEN t.DocumentsJson IS NOT NULL AND LEN(t.DocumentsJson) > 2 THEN 1 ELSE 0 END
    FROM dbo.tblTravelAdvance t
    JOIN dbo.tblEmployee e ON e.EmployeeId = t.EmployeeId
    LEFT JOIN dbo.tblDepartment d ON d.DepartmentId = e.DepartmentId
    WHERE (@From IS NULL OR t.TravelStartDate >= @From)
      AND (@To   IS NULL OR t.TravelStartDate <= @To)
      AND (@DepartmentId IS NULL OR e.DepartmentId = @DepartmentId)
      AND (@Status IS NULL OR t.ApprovalStatus = @Status)
    ORDER BY t.TravelStartDate DESC, t.TravelId DESC;
END
GO

/* Rename the display + register the report module. */
UPDATE dbo.tblModules SET ModuleName = N'Travel Allowance' WHERE ModuleCode = 'travel-advance';
GO
INSERT dbo.tblModules (ModuleCode, ModuleName, DisplayOrder)
SELECT 'rpt-travel-allowance', 'Travel Allowance Report', 27
WHERE NOT EXISTS (SELECT 1 FROM dbo.tblModules m WHERE m.ModuleCode = 'rpt-travel-allowance');
GO
UPDATE dbo.tblModules SET IsActive = 1 WHERE ModuleCode = 'rpt-travel-allowance';
GO
DECLARE @adminId INT = (SELECT GroupId FROM dbo.tblUserGroups WHERE GroupName = N'Admin');
IF @adminId IS NOT NULL
    MERGE dbo.tblUserGroupRights AS t
    USING (SELECT @adminId AS GroupId, ModuleId FROM dbo.tblModules WHERE ModuleCode = 'rpt-travel-allowance') AS s
    ON t.GroupId = s.GroupId AND t.ModuleId = s.ModuleId
    WHEN MATCHED THEN UPDATE SET CanView = 1, CanAdd = 1, CanEdit = 1, CanDelete = 1, CanExport = 1
    WHEN NOT MATCHED THEN INSERT (GroupId, ModuleId, CanView, CanAdd, CanEdit, CanDelete, CanExport)
        VALUES (s.GroupId, s.ModuleId, 1, 1, 1, 1, 1);
GO
