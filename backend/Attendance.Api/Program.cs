using System.Text;
using Attendance.Api.Data;
using Attendance.Api.Repositories;
using Attendance.Api.Services;
using Attendance.Api.Services.Jwt;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;

var builder = WebApplication.CreateBuilder(args);

// ---------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------
var jwtSettings = builder.Configuration.GetSection("Jwt").Get<JwtSettings>()
    ?? throw new InvalidOperationException("Missing 'Jwt' configuration section.");
builder.Services.AddSingleton(jwtSettings);

// ---------------------------------------------------------------------
// Dependency injection
// ---------------------------------------------------------------------
builder.Services.AddSingleton<ISqlConnectionFactory, SqlConnectionFactory>();
builder.Services.AddSingleton<IPasswordHasher, PasswordHasher>();
builder.Services.AddSingleton<IJwtTokenService, JwtTokenService>();
builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IRbacRepository, RbacRepository>();
builder.Services.AddScoped<IUserManagementService, UserManagementService>();
builder.Services.AddScoped<IMastersRepository, MastersRepository>();
builder.Services.AddScoped<IImplementationRepository, ImplementationRepository>();
builder.Services.AddScoped<IAttendanceRepository, AttendanceRepository>();
builder.Services.AddScoped<IDashboardRepository, DashboardRepository>();
builder.Services.AddScoped<ISettingsRepository, SettingsRepository>();
builder.Services.AddScoped<ILeaveRepository, LeaveRepository>();
builder.Services.AddScoped<IChatRepository, ChatRepository>();
builder.Services.AddScoped<ITravelAdvanceRepository, TravelAdvanceRepository>();

// ---------------------------------------------------------------------
// CORS - allow the React (Vite) dev server
// ---------------------------------------------------------------------
const string CorsPolicy = "AllowClient";
builder.Services.AddCors(options =>
    options.AddPolicy(CorsPolicy, policy =>
        // Allow any origin (internal LAN use): the frontend may be opened via
        // localhost or the server's IP / machine name. JWT is sent in a header,
        // not cookies, so AllowAnyOrigin-style access is safe here.
        policy.SetIsOriginAllowed(_ => true)
              .AllowAnyHeader()
              .AllowAnyMethod()));

// ---------------------------------------------------------------------
// JWT authentication
// ---------------------------------------------------------------------
builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwtSettings.Issuer,
            ValidAudience = jwtSettings.Audience,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSettings.SecretKey))
        };
    });
builder.Services.AddAuthorization();

// ---------------------------------------------------------------------
// Controllers + Swagger
// ---------------------------------------------------------------------
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "Unipro Attendance API",
        Version = "v1",
        Description = "Backend API for the Unipro Implementation Team attendance system."
    });

    var jwtScheme = new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Paste the JWT returned by POST /api/auth/login.",
        Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" }
    };
    options.AddSecurityDefinition("Bearer", jwtScheme);
    options.AddSecurityRequirement(new OpenApiSecurityRequirement { { jwtScheme, Array.Empty<string>() } });
});

var app = builder.Build();

// ---------------------------------------------------------------------
// HTTP pipeline
// ---------------------------------------------------------------------
// Serve the React build (copied into wwwroot) so the SPA and the /api endpoints
// live on the SAME origin — one IIS site, one port, SSL applies to both, and
// there is no CORS or mixed-content to configure. Static files first so they are
// not gated by auth.
app.UseDefaultFiles();
app.UseStaticFiles();

// Swagger is enabled in every environment (incl. IIS production) so the API can
// be verified from a browser at http://<server>:<port>/swagger. Internal LAN
// tool — safe to expose; remove this if the API is ever published publicly.
app.UseSwagger();
app.UseSwaggerUI(c => c.SwaggerEndpoint("/swagger/v1/swagger.json", "Unipro Attendance API v1"));

app.UseCors(CorsPolicy);
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

// Any request that is not /api/..., /swagger, or a real file in wwwroot falls
// back to the SPA's index.html (so deep links / refreshes still load the app).
app.MapFallbackToFile("index.html");

app.Run();
