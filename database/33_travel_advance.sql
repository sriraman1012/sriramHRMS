/* =====================================================================
   Unipro Attendance - Travel Advance module
   Tracks a travel advance issued to an employee, the trip, the expense
   breakdown, supporting documents, the auto-computed balance, and the
   Pending / Approved / Rejected settlement status.
   Run against ATTANDANCE_IMP after 32_attendance_trend.sql. Safe to re-run.
   ===================================================================== */
USE ATTANDANCE_IMP;
GO

IF OBJECT_ID(N'dbo.tblTravelAdvance', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.tblTravelAdvance (
        TravelId        INT IDENTITY(1,1) PRIMARY KEY,
        EmployeeId      INT           NOT NULL,
        ClientName      NVARCHAR(150) NOT NULL,
        ClientLocation  NVARCHAR(150) NOT NULL,
        TravelStartDate DATE          NOT NULL,
        TravelEndDate   DATE          NOT NULL,
        OnsiteDays      INT           NOT NULL DEFAULT 0,
        AdvanceAmount   DECIMAL(12,2) NOT NULL DEFAULT 0,
        BusTicket       DECIMAL(12,2) NOT NULL DEFAULT 0,
        TrainTicket     DECIMAL(12,2) NOT NULL DEFAULT 0,
        FlightTicket    DECIMAL(12,2) NOT NULL DEFAULT 0,
        Taxi            DECIMAL(12,2) NOT NULL DEFAULT 0,
        HotelBill       DECIMAL(12,2) NOT NULL DEFAULT 0,
        FoodBill        DECIMAL(12,2) NOT NULL DEFAULT 0,
        OtherExpense    DECIMAL(12,2) NOT NULL DEFAULT 0,
        TotalExpense    DECIMAL(12,2) NOT NULL DEFAULT 0,
        BalanceAmount   DECIMAL(12,2) NOT NULL DEFAULT 0,   -- Advance - Total (+ = return, - = reimburse)
        Remarks         NVARCHAR(500) NULL,
        DocumentsJson   NVARCHAR(MAX) NULL,                 -- JSON array: [{fileName,fileType,fileData}]
        ApprovalStatus  NVARCHAR(20)  NOT NULL DEFAULT 'Pending',  -- Pending | Approved | Rejected
        ApprovedBy      NVARCHAR(50)  NULL,
        ApprovedAt      DATETIME2(0)  NULL,
        CreatedAt       DATETIME2(0)  NOT NULL DEFAULT SYSUTCDATETIME(),
        UpdatedAt       DATETIME2(0)  NULL,
        CONSTRAINT FK_tblTravelAdvance_Emp FOREIGN KEY (EmployeeId) REFERENCES dbo.tblEmployee(EmployeeId)
    );
END
GO

/* ---------- List (filterable) ---------- */
CREATE OR ALTER PROCEDURE dbo.SP_TravelAdvance_GetAll
    @From DATE = NULL, @To DATE = NULL, @DepartmentId INT = NULL, @Status NVARCHAR(20) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SELECT
        t.TravelId, t.EmployeeId, e.Name AS EmployeeName, e.EmployeeCode,
        e.DepartmentId, d.DepartmentName,
        t.ClientName, t.ClientLocation, t.TravelStartDate, t.TravelEndDate, t.OnsiteDays,
        t.AdvanceAmount, t.BusTicket, t.TrainTicket, t.FlightTicket, t.Taxi, t.HotelBill, t.FoodBill, t.OtherExpense,
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

/* ---------- Single record (with the documents JSON) ---------- */
CREATE OR ALTER PROCEDURE dbo.SP_TravelAdvance_GetById
    @TravelId INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT
        t.*, e.Name AS EmployeeName, e.EmployeeCode, e.DepartmentId, d.DepartmentName
    FROM dbo.tblTravelAdvance t
    JOIN dbo.tblEmployee e ON e.EmployeeId = t.EmployeeId
    LEFT JOIN dbo.tblDepartment d ON d.DepartmentId = e.DepartmentId
    WHERE t.TravelId = @TravelId;
END
GO

/* ---------- Save (insert / update). Total & Balance are auto-computed. ---------- */
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
    @Taxi DECIMAL(12,2) = 0, @HotelBill DECIMAL(12,2) = 0, @FoodBill DECIMAL(12,2) = 0, @OtherExpense DECIMAL(12,2) = 0,
    @Remarks NVARCHAR(500) = NULL,
    @DocumentsJson NVARCHAR(MAX) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @Total DECIMAL(12,2) =
        ISNULL(@BusTicket,0)+ISNULL(@TrainTicket,0)+ISNULL(@FlightTicket,0)+ISNULL(@Taxi,0)
        +ISNULL(@HotelBill,0)+ISNULL(@FoodBill,0)+ISNULL(@OtherExpense,0);
    DECLARE @Balance DECIMAL(12,2) = ISNULL(@AdvanceAmount,0) - @Total;

    IF @TravelId IS NULL OR @TravelId = 0
    BEGIN
        INSERT dbo.tblTravelAdvance
            (EmployeeId, ClientName, ClientLocation, TravelStartDate, TravelEndDate, OnsiteDays, AdvanceAmount,
             BusTicket, TrainTicket, FlightTicket, Taxi, HotelBill, FoodBill, OtherExpense,
             TotalExpense, BalanceAmount, Remarks, DocumentsJson, ApprovalStatus)
        VALUES
            (@EmployeeId, @ClientName, @ClientLocation, @TravelStartDate, @TravelEndDate, @OnsiteDays, @AdvanceAmount,
             @BusTicket, @TrainTicket, @FlightTicket, @Taxi, @HotelBill, @FoodBill, @OtherExpense,
             @Total, @Balance, @Remarks, @DocumentsJson, 'Pending');
        SELECT CAST(SCOPE_IDENTITY() AS INT) AS TravelId;
    END
    ELSE
    BEGIN
        UPDATE dbo.tblTravelAdvance SET
            EmployeeId=@EmployeeId, ClientName=@ClientName, ClientLocation=@ClientLocation,
            TravelStartDate=@TravelStartDate, TravelEndDate=@TravelEndDate, OnsiteDays=@OnsiteDays,
            AdvanceAmount=@AdvanceAmount, BusTicket=@BusTicket, TrainTicket=@TrainTicket, FlightTicket=@FlightTicket,
            Taxi=@Taxi, HotelBill=@HotelBill, FoodBill=@FoodBill, OtherExpense=@OtherExpense,
            TotalExpense=@Total, BalanceAmount=@Balance, Remarks=@Remarks, DocumentsJson=@DocumentsJson,
            UpdatedAt=SYSUTCDATETIME()
        WHERE TravelId=@TravelId;
        SELECT @TravelId AS TravelId;
    END
END
GO

/* ---------- Approve / Reject ---------- */
CREATE OR ALTER PROCEDURE dbo.SP_TravelAdvance_SetStatus
    @TravelId INT, @Status NVARCHAR(20), @ApprovedBy NVARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;
    IF @Status NOT IN ('Pending','Approved','Rejected') SET @Status = 'Pending';
    UPDATE dbo.tblTravelAdvance
    SET ApprovalStatus = @Status,
        ApprovedBy = CASE WHEN @Status = 'Pending' THEN NULL ELSE @ApprovedBy END,
        ApprovedAt = CASE WHEN @Status = 'Pending' THEN NULL ELSE SYSUTCDATETIME() END,
        UpdatedAt  = SYSUTCDATETIME()
    WHERE TravelId = @TravelId;
END
GO

/* ---------- Delete ---------- */
CREATE OR ALTER PROCEDURE dbo.SP_TravelAdvance_Delete
    @TravelId INT
AS
BEGIN
    SET NOCOUNT ON;
    DELETE FROM dbo.tblTravelAdvance WHERE TravelId = @TravelId;
END
GO

/* ---------- RBAC: register the module + grant Admin ---------- */
INSERT dbo.tblModules (ModuleCode, ModuleName, DisplayOrder)
SELECT 'travel-advance', 'Travel Advance', 26
WHERE NOT EXISTS (SELECT 1 FROM dbo.tblModules m WHERE m.ModuleCode = 'travel-advance');
GO
UPDATE dbo.tblModules SET IsActive = 1 WHERE ModuleCode = 'travel-advance';
GO
DECLARE @adminId INT = (SELECT GroupId FROM dbo.tblUserGroups WHERE GroupName = N'Admin');
IF @adminId IS NOT NULL
    MERGE dbo.tblUserGroupRights AS t
    USING (SELECT @adminId AS GroupId, ModuleId FROM dbo.tblModules WHERE ModuleCode = 'travel-advance') AS s
    ON t.GroupId = s.GroupId AND t.ModuleId = s.ModuleId
    WHEN MATCHED THEN UPDATE SET CanView = 1, CanAdd = 1, CanEdit = 1, CanDelete = 1, CanExport = 1
    WHEN NOT MATCHED THEN INSERT (GroupId, ModuleId, CanView, CanAdd, CanEdit, CanDelete, CanExport)
        VALUES (s.GroupId, s.ModuleId, 1, 1, 1, 1, 1);
GO
