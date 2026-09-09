using System.ComponentModel.DataAnnotations;

namespace Attendance.Api.Models.Implementation;

public class ImplementationTaskDto
{
    public string TaskName { get; set; } = string.Empty;
    public string Status { get; set; } = "Pending";
    public string? Remarks { get; set; }
    public int SortOrder { get; set; }
}

public class ImplementationDocDto
{
    public string FileName { get; set; } = string.Empty;
    public string? FileType { get; set; }
    public string FileData { get; set; } = string.Empty; // base64 data URI
}

public class ImplementationTestDto
{
    public string TestName { get; set; } = string.Empty;
    public string Group { get; set; } = "Backoffice"; // 'Backoffice' | 'POS'
    public string Status { get; set; } = "Pending";
    public string? Remarks { get; set; }
    public int SortOrder { get; set; }
}

// Row for the summary list.
public class ImplementationSummaryDto
{
    public int ImplId { get; set; }
    public string ClientName { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public string? ResponsiblePerson { get; set; }
    public string LocationType { get; set; } = "single";
    public string? Addons { get; set; }
    public int CompletionPercent { get; set; }
    public bool HasDocs { get; set; }
    public DateTime SavedAt { get; set; }
}

// Full record for the click-to-open form.
public class ImplementationDetailDto
{
    public int ImplId { get; set; }
    public string ClientName { get; set; } = string.Empty;
    public string? Address { get; set; }
    public string? Phone { get; set; }
    public string? ResponsiblePerson { get; set; }
    public string LocationType { get; set; } = "single";
    public List<string> Addons { get; set; } = new();
    public List<ImplementationTaskDto> Tasks { get; set; } = new();
    public List<ImplementationDocDto> Docs { get; set; } = new();
    public List<ImplementationTestDto> Testing { get; set; } = new();
    public int CompletionPercent { get; set; }
}

public class ImplementationSaveRequest
{
    public int? ImplId { get; set; }
    [Required] public string ClientName { get; set; } = string.Empty;
    public string? Address { get; set; }
    public string? Phone { get; set; }
    public string? ResponsiblePerson { get; set; }
    public string LocationType { get; set; } = "single";
    public List<string> Addons { get; set; } = new();
    public List<ImplementationTaskDto> Tasks { get; set; } = new();
    public List<ImplementationDocDto> Docs { get; set; } = new();
    public List<ImplementationTestDto> Testing { get; set; } = new();
    public int CompletionPercent { get; set; }
}
