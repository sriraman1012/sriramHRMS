using System.Data;
using Attendance.Api.Data;
using Attendance.Api.Models.Masters;
using Dapper;

namespace Attendance.Api.Repositories;

public interface IMastersRepository
{
    // Department
    Task<IEnumerable<DepartmentDto>> GetDepartmentsAsync();
    Task<int> SaveDepartmentAsync(DepartmentSaveRequest req);
    Task SetDepartmentActiveAsync(int id, bool isActive);
    Task DeleteDepartmentAsync(int id);

    // Designation
    Task<IEnumerable<DesignationDto>> GetDesignationsAsync();
    Task<int> SaveDesignationAsync(DesignationSaveRequest req);
    Task SetDesignationActiveAsync(int id, bool isActive);
    Task DeleteDesignationAsync(int id);

    // Employee
    Task<IEnumerable<EmployeeListDto>> GetEmployeesAsync();
    Task<EmployeeDetailDto?> GetEmployeeByIdAsync(int id);
    Task<int> SaveEmployeeAsync(EmployeeSaveRequest req);
    Task SetEmployeeActiveAsync(int id, bool isActive);
    Task DeleteEmployeeAsync(int id);

    // Holiday
    Task<IEnumerable<HolidayDto>> GetHolidaysAsync();
    Task<int> SaveHolidayAsync(HolidaySaveRequest req);
    Task DeleteHolidayAsync(int id);

    // Leave Type
    Task<IEnumerable<LeaveTypeDto>> GetLeaveTypesAsync();
    Task<int> SaveLeaveTypeAsync(LeaveTypeSaveRequest req);
    Task SetLeaveTypeActiveAsync(int id, bool isActive);
    Task DeleteLeaveTypeAsync(int id);

    // Implementation Checklist master
    Task<IEnumerable<ImplChecklistItemDto>> GetImplChecklistAsync();
    Task<int> SaveImplChecklistAsync(ImplChecklistItemSaveRequest req);
    Task SetImplChecklistActiveAsync(int id, bool isActive);
    Task DeleteImplChecklistAsync(int id);

    // Add-ons master
    Task<IEnumerable<AddonDto>> GetAddonsAsync();
    Task<int> SaveAddonAsync(AddonSaveRequest req);
    Task SetAddonActiveAsync(int id, bool isActive);
    Task DeleteAddonAsync(int id);

    // Process Testing master
    Task<IEnumerable<ImplTestItemDto>> GetImplTestsAsync();
    Task<int> SaveImplTestAsync(ImplTestItemSaveRequest req);
    Task SetImplTestActiveAsync(int id, bool isActive);
    Task DeleteImplTestAsync(int id);

    // Office
    Task<IEnumerable<OfficeListDto>> GetOfficesAsync();
    Task<OfficeDetailDto?> GetOfficeByIdAsync(int id);
    Task<int> SaveOfficeAsync(OfficeSaveRequest req);
    Task SetOfficeActiveAsync(int id, bool isActive);
    Task DeleteOfficeAsync(int id);

    // Happy Hours
    Task<IEnumerable<HappyHourDto>> GetHappyHoursAsync();
    Task<int> SaveHappyHourAsync(HappyHourSaveRequest req);
    Task SetHappyHourActiveAsync(int id, bool isActive);
    Task DeleteHappyHourAsync(int id);
}

public class MastersRepository : IMastersRepository
{
    private readonly ISqlConnectionFactory _factory;
    public MastersRepository(ISqlConnectionFactory factory) => _factory = factory;

    private const CommandType SP = CommandType.StoredProcedure;

    // ---------------- Department ----------------
    public async Task<IEnumerable<DepartmentDto>> GetDepartmentsAsync()
    {
        using var db = _factory.Create();
        return await db.QueryAsync<DepartmentDto>("SP_Department_GetAll", commandType: SP);
    }

    public async Task<int> SaveDepartmentAsync(DepartmentSaveRequest req)
    {
        using var db = _factory.Create();
        return await db.QuerySingleAsync<int>("SP_Department_Save",
            new { req.DepartmentId, req.DepartmentCode, req.DepartmentName, req.Head, req.IsActive }, commandType: SP);
    }

    public async Task SetDepartmentActiveAsync(int id, bool isActive)
    {
        using var db = _factory.Create();
        await db.ExecuteAsync("SP_Department_SetActive", new { DepartmentId = id, IsActive = isActive }, commandType: SP);
    }

    public async Task DeleteDepartmentAsync(int id)
    {
        using var db = _factory.Create();
        await db.ExecuteAsync("SP_Department_Delete", new { DepartmentId = id }, commandType: SP);
    }

    // ---------------- Designation ----------------
    public async Task<IEnumerable<DesignationDto>> GetDesignationsAsync()
    {
        using var db = _factory.Create();
        return await db.QueryAsync<DesignationDto>("SP_Designation_GetAll", commandType: SP);
    }

    public async Task<int> SaveDesignationAsync(DesignationSaveRequest req)
    {
        using var db = _factory.Create();
        return await db.QuerySingleAsync<int>("SP_Designation_Save",
            new { req.DesignationId, req.DesignationCode, req.DesignationName, req.IsActive }, commandType: SP);
    }

    public async Task SetDesignationActiveAsync(int id, bool isActive)
    {
        using var db = _factory.Create();
        await db.ExecuteAsync("SP_Designation_SetActive", new { DesignationId = id, IsActive = isActive }, commandType: SP);
    }

    public async Task DeleteDesignationAsync(int id)
    {
        using var db = _factory.Create();
        await db.ExecuteAsync("SP_Designation_Delete", new { DesignationId = id }, commandType: SP);
    }

    // ---------------- Employee ----------------
    public async Task<IEnumerable<EmployeeListDto>> GetEmployeesAsync()
    {
        using var db = _factory.Create();
        return await db.QueryAsync<EmployeeListDto>("SP_Employee_GetAll", commandType: SP);
    }

    public async Task<EmployeeDetailDto?> GetEmployeeByIdAsync(int id)
    {
        using var db = _factory.Create();
        return await db.QuerySingleOrDefaultAsync<EmployeeDetailDto>("SP_Employee_GetById", new { EmployeeId = id }, commandType: SP);
    }

    public async Task<int> SaveEmployeeAsync(EmployeeSaveRequest req)
    {
        using var db = _factory.Create();
        return await db.QuerySingleAsync<int>("SP_Employee_Save",
            new
            {
                req.EmployeeId, req.EmployeeCode, req.Name, req.Email, req.Mobile,
                req.DepartmentId, req.DesignationId, req.Shift, req.JoiningDate, req.IsActive,
                req.Gender, req.DateOfBirth, req.MaritalStatus, req.BloodGroup, req.Nationality,
                req.Photo, req.PhotoName, req.Address,
                req.EmergencyName, req.EmergencyNumber, req.EmergencyRelation
            }, commandType: SP);
    }

    public async Task SetEmployeeActiveAsync(int id, bool isActive)
    {
        using var db = _factory.Create();
        await db.ExecuteAsync("SP_Employee_SetActive", new { EmployeeId = id, IsActive = isActive }, commandType: SP);
    }

    public async Task DeleteEmployeeAsync(int id)
    {
        using var db = _factory.Create();
        await db.ExecuteAsync("SP_Employee_Delete", new { EmployeeId = id }, commandType: SP);
    }

    // ---------------- Holiday ----------------
    public async Task<IEnumerable<HolidayDto>> GetHolidaysAsync()
    {
        using var db = _factory.Create();
        return await db.QueryAsync<HolidayDto>("SP_Holiday_GetAll", commandType: SP);
    }

    public async Task<int> SaveHolidayAsync(HolidaySaveRequest req)
    {
        using var db = _factory.Create();
        return await db.QuerySingleAsync<int>("SP_Holiday_Save",
            new { req.HolidayId, req.HolidayDate, req.HolidayName, req.HolidayType }, commandType: SP);
    }

    public async Task DeleteHolidayAsync(int id)
    {
        using var db = _factory.Create();
        await db.ExecuteAsync("SP_Holiday_Delete", new { HolidayId = id }, commandType: SP);
    }

    // ---------------- Leave Type ----------------
    public async Task<IEnumerable<LeaveTypeDto>> GetLeaveTypesAsync()
    {
        using var db = _factory.Create();
        return await db.QueryAsync<LeaveTypeDto>("SP_LeaveType_GetAll", commandType: SP);
    }

    public async Task<int> SaveLeaveTypeAsync(LeaveTypeSaveRequest req)
    {
        using var db = _factory.Create();
        return await db.QuerySingleAsync<int>("SP_LeaveType_Save",
            new { req.LeaveTypeId, req.LeaveTypeCode, req.LeaveName, req.MaxDays, req.IsPaid, req.IsActive }, commandType: SP);
    }

    public async Task SetLeaveTypeActiveAsync(int id, bool isActive)
    {
        using var db = _factory.Create();
        await db.ExecuteAsync("SP_LeaveType_SetActive", new { LeaveTypeId = id, IsActive = isActive }, commandType: SP);
    }

    public async Task DeleteLeaveTypeAsync(int id)
    {
        using var db = _factory.Create();
        await db.ExecuteAsync("SP_LeaveType_Delete", new { LeaveTypeId = id }, commandType: SP);
    }

    // ---------------- Implementation Checklist master ----------------
    public async Task<IEnumerable<ImplChecklistItemDto>> GetImplChecklistAsync()
    {
        using var db = _factory.Create();
        return await db.QueryAsync<ImplChecklistItemDto>("SP_ImplChecklist_GetAll", commandType: SP);
    }

    public async Task<int> SaveImplChecklistAsync(ImplChecklistItemSaveRequest req)
    {
        using var db = _factory.Create();
        return await db.QuerySingleAsync<int>("SP_ImplChecklist_Save",
            new { req.ItemId, req.TaskName, req.ForSingle, req.ForMultiple, req.DisplayOrder, req.IsActive }, commandType: SP);
    }

    public async Task SetImplChecklistActiveAsync(int id, bool isActive)
    {
        using var db = _factory.Create();
        await db.ExecuteAsync("SP_ImplChecklist_SetActive", new { ItemId = id, IsActive = isActive }, commandType: SP);
    }

    public async Task DeleteImplChecklistAsync(int id)
    {
        using var db = _factory.Create();
        await db.ExecuteAsync("SP_ImplChecklist_Delete", new { ItemId = id }, commandType: SP);
    }

    // ---------------- Add-ons master ----------------
    public async Task<IEnumerable<AddonDto>> GetAddonsAsync()
    {
        using var db = _factory.Create();
        return await db.QueryAsync<AddonDto>("SP_Addon_GetAll", commandType: SP);
    }

    public async Task<int> SaveAddonAsync(AddonSaveRequest req)
    {
        using var db = _factory.Create();
        return await db.QuerySingleAsync<int>("SP_Addon_Save",
            new { req.AddonId, req.AddonName, req.DisplayOrder, req.IsActive }, commandType: SP);
    }

    public async Task SetAddonActiveAsync(int id, bool isActive)
    {
        using var db = _factory.Create();
        await db.ExecuteAsync("SP_Addon_SetActive", new { AddonId = id, IsActive = isActive }, commandType: SP);
    }

    public async Task DeleteAddonAsync(int id)
    {
        using var db = _factory.Create();
        await db.ExecuteAsync("SP_Addon_Delete", new { AddonId = id }, commandType: SP);
    }

    // ---------------- Process Testing master ----------------
    public async Task<IEnumerable<ImplTestItemDto>> GetImplTestsAsync()
    {
        using var db = _factory.Create();
        return await db.QueryAsync<ImplTestItemDto>("SP_ImplTest_GetAll", commandType: SP);
    }

    public async Task<int> SaveImplTestAsync(ImplTestItemSaveRequest req)
    {
        using var db = _factory.Create();
        return await db.QuerySingleAsync<int>("SP_ImplTest_Save",
            new { req.TestId, req.TestName, req.TestGroup, req.DisplayOrder, req.IsActive }, commandType: SP);
    }

    public async Task SetImplTestActiveAsync(int id, bool isActive)
    {
        using var db = _factory.Create();
        await db.ExecuteAsync("SP_ImplTest_SetActive", new { TestId = id, IsActive = isActive }, commandType: SP);
    }

    public async Task DeleteImplTestAsync(int id)
    {
        using var db = _factory.Create();
        await db.ExecuteAsync("SP_ImplTest_Delete", new { TestId = id }, commandType: SP);
    }

    // ---------------- Happy Hours ----------------
    public async Task<IEnumerable<HappyHourDto>> GetHappyHoursAsync()
    {
        using var db = _factory.Create();
        return await db.QueryAsync<HappyHourDto>("SP_HappyHours_GetAll", commandType: SP);
    }

    public async Task<int> SaveHappyHourAsync(HappyHourSaveRequest req)
    {
        using var db = _factory.Create();
        return await db.QuerySingleAsync<int>("SP_HappyHours_Save",
            new { req.HappyHourId, req.Title, req.DayName, req.EventDate, req.StartTime, req.EndTime, req.LocationAddress, req.IsActive },
            commandType: SP);
    }

    public async Task SetHappyHourActiveAsync(int id, bool isActive)
    {
        using var db = _factory.Create();
        await db.ExecuteAsync("SP_HappyHours_SetActive", new { HappyHourId = id, IsActive = isActive }, commandType: SP);
    }

    public async Task DeleteHappyHourAsync(int id)
    {
        using var db = _factory.Create();
        await db.ExecuteAsync("SP_HappyHours_Delete", new { HappyHourId = id }, commandType: SP);
    }

    // ---------------- Office ----------------
    public async Task<IEnumerable<OfficeListDto>> GetOfficesAsync()
    {
        using var db = _factory.Create();
        return await db.QueryAsync<OfficeListDto>("SP_Office_GetAll", commandType: SP);
    }

    public async Task<OfficeDetailDto?> GetOfficeByIdAsync(int id)
    {
        using var db = _factory.Create();
        return await db.QuerySingleOrDefaultAsync<OfficeDetailDto>("SP_Office_GetById", new { OfficeId = id }, commandType: SP);
    }

    public async Task<int> SaveOfficeAsync(OfficeSaveRequest req)
    {
        using var db = _factory.Create();
        return await db.QuerySingleAsync<int>("SP_Office_Save",
            new { req.OfficeId, req.OfficeCode, req.LocationName, req.Address, req.PhotoBase64, req.PhotoName, req.IsActive }, commandType: SP);
    }

    public async Task SetOfficeActiveAsync(int id, bool isActive)
    {
        using var db = _factory.Create();
        await db.ExecuteAsync("SP_Office_SetActive", new { OfficeId = id, IsActive = isActive }, commandType: SP);
    }

    public async Task DeleteOfficeAsync(int id)
    {
        using var db = _factory.Create();
        await db.ExecuteAsync("SP_Office_Delete", new { OfficeId = id }, commandType: SP);
    }
}
