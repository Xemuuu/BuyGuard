using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using BuyGuard.Api.Data;
using BuyGuard.Api.Models;
using System.Security.Cryptography;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;


[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly BuyGuardDbContext _context;
    private readonly IConfiguration _config;

    public AuthController(BuyGuardDbContext context, IConfiguration config)
    {
        _context = context;
        _config = config;
    }

    [HttpPost("login")]
    public IActionResult Login([FromBody] LoginRequest request)
    {
        var user = _context.Users.FirstOrDefault(u => u.Email == request.Email);

        if (user == null || !VerifyPassword(request.Password, user.PasswordHash))
            return Unauthorized("Invalid credentials.");

        var token = GenerateJwtToken(user);
        var refreshToken = GenerateRefreshToken();
        user.RefreshToken = refreshToken;
        user.RefreshTokenExpiry = DateTime.UtcNow.AddDays(7);
        _context.SaveChanges();
        return Ok(new { token, refreshToken });
    }

    [HttpPost("refresh")]
    public IActionResult Refresh([FromBody] RefreshRequest request)
    {
        var user = _context.Users.FirstOrDefault(u => u.RefreshToken == request.RefreshToken && u.RefreshTokenExpiry > DateTime.UtcNow);
        if (user == null)
            return Unauthorized("Invalid refresh token.");
        var token = GenerateJwtToken(user);
        var newRefreshToken = GenerateRefreshToken();
        user.RefreshToken = newRefreshToken;
        user.RefreshTokenExpiry = DateTime.UtcNow.AddDays(7);
        _context.SaveChanges();
        return Ok(new { token, refreshToken = newRefreshToken });
    }

    [Authorize]
    [HttpGet("whoami")]
    public async Task<IActionResult> WhoAmI()
    {
        var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userIdString) || !int.TryParse(userIdString, out var userId))
            return Unauthorized();

        var user = await _context.Users
            .Include(u => u.Manager) // Include manager dla pracowników
            .FirstOrDefaultAsync(u => u.Id == userId);

        if (user == null)
            return NotFound("Nie znaleziono użytkownika.");

        Console.WriteLine($"WhoAmI - User ID: {userId}, Role: {user.Role}, ManagerId: {user.ManagerId}");
        if (user.Manager != null)
        {
            Console.WriteLine($"WhoAmI - Manager: {user.Manager.FirstName} {user.Manager.LastName} (ID: {user.Manager.Id})");
        }
        else
        {
            Console.WriteLine($"WhoAmI - Manager is null, ManagerId: {user.ManagerId}");
        }

        // Sprawdź czy manager istnieje w bazie
        if (user.ManagerId.HasValue)
        {
            var managerInDb = await _context.Users.FindAsync(user.ManagerId.Value);
            if (managerInDb != null)
            {
                Console.WriteLine($"WhoAmI - Manager found in DB: {managerInDb.FirstName} {managerInDb.LastName} (ID: {managerInDb.Id})");
            }
            else
            {
                Console.WriteLine($"WhoAmI - Manager with ID {user.ManagerId.Value} not found in DB");
            }
        }

        var roles = User.Claims
            .Where(c => c.Type == ClaimTypes.Role)
            .Select(c => c.Value)
            .ToList();

        return Ok(new
        {
            UserId = user.Id.ToString(),
            Email = user.Email,
            FirstName = user.FirstName,
            LastName = user.LastName,
            Roles = roles,
            ManagerId = user.ManagerId,
            Manager = user.Manager != null ? new
            {
                Id = user.Manager.Id,
                FirstName = user.Manager.FirstName,
                LastName = user.Manager.LastName,
                Email = user.Manager.Email
            } : null
        });
    }

    private string GenerateJwtToken(User user)
    {
        var jwtSettings = _config.GetSection("Jwt");

        var keyString = jwtSettings["Key"]
            ?? throw new InvalidOperationException("JWT key is missing in configuration.");
        var issuer = jwtSettings["Issuer"]
            ?? throw new InvalidOperationException("JWT issuer is missing in configuration.");
        var audience = jwtSettings["Audience"]
            ?? throw new InvalidOperationException("JWT audience is missing in configuration.");
        var expireMinutesStr = jwtSettings["ExpireMinutes"]
            ?? throw new InvalidOperationException("JWT expiration time is missing in configuration.");

        if (!int.TryParse(expireMinutesStr, out var expireMinutes))
            throw new InvalidOperationException("JWT expiration time must be an integer.");

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(keyString));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Email, user.Email),
            new Claim(ClaimTypes.Role, user.Role)
        };


        var token = new JwtSecurityToken(
            issuer: issuer,
            audience: audience,
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(expireMinutes),
            signingCredentials: credentials
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    private string GenerateRefreshToken()
    {
        var randomNumber = new byte[32];
        using (var rng = RandomNumberGenerator.Create())
        {
            rng.GetBytes(randomNumber);
            return Convert.ToBase64String(randomNumber);
        }
    }


    private bool VerifyPassword(string password, string storedHash)
    {
        using var sha256 = SHA256.Create();
        var hashBytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(password));
        return Convert.ToBase64String(hashBytes) == storedHash;
    }

    // POST: api/auth/seed-users (tylko dla admina)
    [HttpPost("seed-users")]
    [Authorize(Roles = "admin")]
    public async Task<IActionResult> SeedUsers()
    {
        try
        {
            BuyGuard.Api.Seed.UserSeeder.Seed(_context);
            return Ok(new { message = "Users seeded successfully" });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = $"Error seeding users: {ex.Message}" });
        }
    }

    // GET: api/auth/debug-users (tylko dla admina)
    [HttpGet("debug-users")]
    [Authorize(Roles = "admin")]
    public async Task<IActionResult> DebugUsers()
    {
        try
        {
            var users = await _context.Users
                .Select(u => new
                {
                    Id = u.Id,
                    Email = u.Email,
                    Role = u.Role,
                    ManagerId = u.ManagerId,
                    FirstName = u.FirstName,
                    LastName = u.LastName
                })
                .ToListAsync();

            return Ok(new { users });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = $"Error getting users: {ex.Message}" });
        }
    }

    // GET: api/auth/check-database (tylko dla admina)
    [HttpGet("check-database")]
    [Authorize(Roles = "admin")]
    public async Task<IActionResult> CheckDatabase()
    {
        try
        {
            // Sprawdź czy tabela Users ma kolumnę ManagerId
            var hasManagerIdColumn = await _context.Database
                .SqlQueryRaw<int>($"SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'Users' AND column_name = 'ManagerId'")
                .FirstOrDefaultAsync();

            // Sprawdź użytkowników
            var users = await _context.Users.ToListAsync();
            var employee = users.FirstOrDefault(u => u.Role == "employee");
            var manager = users.FirstOrDefault(u => u.Role == "manager");

            return Ok(new
            {
                HasManagerIdColumn = hasManagerIdColumn > 0,
                Users = users.Select(u => new
                {
                    Id = u.Id,
                    Email = u.Email,
                    Role = u.Role,
                    ManagerId = u.ManagerId,
                    FirstName = u.FirstName,
                    LastName = u.LastName
                }).ToList(),
                Employee = employee != null ? new
                {
                    Id = employee.Id,
                    Email = employee.Email,
                    ManagerId = employee.ManagerId
                } : null,
                Manager = manager != null ? new
                {
                    Id = manager.Id,
                    Email = manager.Email
                } : null
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = $"Error checking database: {ex.Message}" });
        }
    }

    // POST: api/auth/assign-manager (tylko dla admina)
    [HttpPost("assign-manager")]
    [Authorize(Roles = "admin")]
    public async Task<IActionResult> AssignManager([FromBody] AssignManagerRequest request)
    {
        try
        {
            var employee = await _context.Users.FindAsync(request.EmployeeId);
            var manager = await _context.Users.FindAsync(request.ManagerId);

            if (employee == null)
                return NotFound("Employee not found");

            if (manager == null)
                return NotFound("Manager not found");

            if (employee.Role != "employee")
                return BadRequest("User is not an employee");

            if (manager.Role != "manager")
                return BadRequest("User is not a manager");

            employee.ManagerId = manager.Id;
            await _context.SaveChangesAsync();

            return Ok(new { message = $"Manager {manager.FirstName} {manager.LastName} assigned to employee {employee.FirstName} {employee.LastName}" });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = $"Error assigning manager: {ex.Message}" });
        }
    }

    // POST: api/auth/fix-manager (tylko dla admina) - prosty fix
    [HttpPost("fix-manager")]
    [Authorize(Roles = "admin")]
    public async Task<IActionResult> FixManager()
    {
        try
        {
            // Znajdź pracownika i managera
            var employee = await _context.Users.FirstOrDefaultAsync(u => u.Role == "employee");
            var manager = await _context.Users.FirstOrDefaultAsync(u => u.Role == "manager");

            if (employee == null)
                return NotFound("No employee found");

            if (manager == null)
                return NotFound("No manager found");

            // Przypisz managera do pracownika
            employee.ManagerId = manager.Id;
            await _context.SaveChangesAsync();

            return Ok(new { 
                message = $"Manager {manager.FirstName} {manager.LastName} assigned to employee {employee.FirstName} {employee.LastName}",
                employeeId = employee.Id,
                managerId = manager.Id
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = $"Error fixing manager: {ex.Message}" });
        }
    }
}

public class LoginRequest
{
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
}

public class RefreshRequest
{
    public string RefreshToken { get; set; } = string.Empty;
}

public class AssignManagerRequest
{
    public int EmployeeId { get; set; }
    public int ManagerId { get; set; }
}
