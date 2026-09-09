using Attendance.Api.Repositories;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;

namespace Attendance.Api.Authorization;

/// <summary>
/// Rejects the request with 403 unless the logged-in user's group has the given
/// right on the module. action: "view" | "add" | "edit" | "delete" | "export" |
/// "write" (add-or-edit). Admin group always passes.
/// </summary>
public class RequireRightAttribute : TypeFilterAttribute
{
    public RequireRightAttribute(string moduleCode, string action = "write")
        : base(typeof(RequireRightFilter))
    {
        Arguments = new object[] { moduleCode, action };
    }
}

public class RequireRightFilter : IAsyncActionFilter
{
    private readonly IRbacRepository _rbac;
    private readonly string _module;
    private readonly string _action;

    public RequireRightFilter(IRbacRepository rbac, string module, string action)
    {
        _rbac = rbac;
        _module = module;
        _action = action;
    }

    public async Task OnActionExecutionAsync(ActionExecutingContext context, ActionExecutionDelegate next)
    {
        var username = context.HttpContext.User.Identity?.Name;
        if (string.IsNullOrEmpty(username))
        {
            context.Result = new UnauthorizedResult();
            return;
        }

        if (!await _rbac.HasRightAsync(username, _module, _action))
        {
            context.Result = new ObjectResult(new { message = "You don't have permission for this action." })
            {
                StatusCode = StatusCodes.Status403Forbidden,
            };
            return;
        }

        await next();
    }
}
