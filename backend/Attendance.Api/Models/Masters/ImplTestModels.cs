using System.ComponentModel.DataAnnotations;

namespace Attendance.Api.Models.Masters;

public class ImplTestItemDto
{
    public int TestId { get; set; }
    public string TestName { get; set; } = string.Empty;
    public string TestGroup { get; set; } = "Backoffice"; // 'Backoffice' | 'POS'
    public int DisplayOrder { get; set; }
    public bool IsActive { get; set; }
}

public class ImplTestItemSaveRequest
{
    public int? TestId { get; set; }
    [Required] public string TestName { get; set; } = string.Empty;
    public string TestGroup { get; set; } = "Backoffice";
    public int DisplayOrder { get; set; }
    public bool IsActive { get; set; } = true;
}
