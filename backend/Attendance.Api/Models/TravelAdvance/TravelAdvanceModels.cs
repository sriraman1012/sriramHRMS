namespace Attendance.Api.Models.TravelAdvance;

public class TravelAdvanceDto
{
    public int TravelId { get; set; }
    public int EmployeeId { get; set; }
    public string? EmployeeName { get; set; }
    public string? EmployeeCode { get; set; }
    public int? DepartmentId { get; set; }
    public string? DepartmentName { get; set; }
    public string ClientName { get; set; } = string.Empty;
    public string ClientLocation { get; set; } = string.Empty;
    public DateTime TravelStartDate { get; set; }
    public DateTime TravelEndDate { get; set; }
    public int OnsiteDays { get; set; }
    public decimal AdvanceAmount { get; set; }
    public decimal BusTicket { get; set; }
    public decimal TrainTicket { get; set; }
    public decimal FlightTicket { get; set; }
    public decimal BikeExpense { get; set; }
    public decimal Taxi { get; set; }
    public decimal HotelBill { get; set; }
    public decimal FoodBill { get; set; }
    public decimal OtherExpense { get; set; }
    public decimal TotalExpense { get; set; }
    public decimal BalanceAmount { get; set; }
    public string? Remarks { get; set; }
    public string ApprovalStatus { get; set; } = "Pending";
    public string? ApprovedBy { get; set; }
    public DateTime? ApprovedAt { get; set; }
    public bool HasDocs { get; set; }
    public string? DocumentsJson { get; set; } // only returned by GetById
}

public class TravelAdvanceSaveRequest
{
    public int? TravelId { get; set; }
    public int EmployeeId { get; set; }
    public string ClientName { get; set; } = string.Empty;
    public string ClientLocation { get; set; } = string.Empty;
    public DateTime TravelStartDate { get; set; }
    public DateTime TravelEndDate { get; set; }
    public int OnsiteDays { get; set; }
    public decimal AdvanceAmount { get; set; }
    public decimal BusTicket { get; set; }
    public decimal TrainTicket { get; set; }
    public decimal FlightTicket { get; set; }
    public decimal BikeExpense { get; set; }
    public decimal Taxi { get; set; }
    public decimal HotelBill { get; set; }
    public decimal FoodBill { get; set; }
    public decimal OtherExpense { get; set; }
    public string? Remarks { get; set; }
    public string? DocumentsJson { get; set; }
}

public class TravelStatusRequest
{
    public string Status { get; set; } = "Pending"; // Pending | Approved | Rejected
}
