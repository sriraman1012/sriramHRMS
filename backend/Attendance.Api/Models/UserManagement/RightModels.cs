namespace Attendance.Api.Models.UserManagement;

// One row of the rights grid returned to the UI.
public class ModuleRightDto
{
    public int ModuleId { get; set; }
    public string ModuleCode { get; set; } = string.Empty;
    public string ModuleName { get; set; } = string.Empty;
    public int DisplayOrder { get; set; }
    public bool CanView { get; set; }
    public bool CanAdd { get; set; }
    public bool CanEdit { get; set; }
    public bool CanDelete { get; set; }
    public bool CanExport { get; set; }
}

// One row the UI sends back when saving.
public class RightItemDto
{
    public int ModuleId { get; set; }
    public bool CanView { get; set; }
    public bool CanAdd { get; set; }
    public bool CanEdit { get; set; }
    public bool CanDelete { get; set; }
    public bool CanExport { get; set; }
}

public class RightsSaveRequest
{
    public int GroupId { get; set; }
    public List<RightItemDto> Rights { get; set; } = new();
}

// One module's flags (used by the server-side rights check).
public class RightFlags
{
    public bool CanView { get; set; }
    public bool CanAdd { get; set; }
    public bool CanEdit { get; set; }
    public bool CanDelete { get; set; }
    public bool CanExport { get; set; }
}

// Effective rights for the logged-in user (module code -> flags).
public class UserRightDto
{
    public string ModuleCode { get; set; } = string.Empty;
    public bool CanView { get; set; }
    public bool CanAdd { get; set; }
    public bool CanEdit { get; set; }
    public bool CanDelete { get; set; }
    public bool CanExport { get; set; }
}
