using System.ComponentModel.DataAnnotations;

namespace Attendance.Api.Models.Masters;

public class ImplChecklistItemDto
{
    public int ItemId { get; set; }
    public string TaskName { get; set; } = string.Empty;
    public bool ForSingle { get; set; }
    public bool ForMultiple { get; set; }
    public int DisplayOrder { get; set; }
    public bool IsActive { get; set; }
}

public class ImplChecklistItemSaveRequest
{
    public int? ItemId { get; set; }
    [Required] public string TaskName { get; set; } = string.Empty;
    public bool ForSingle { get; set; } = true;
    public bool ForMultiple { get; set; } = true;
    public int DisplayOrder { get; set; }
    public bool IsActive { get; set; } = true;
}
