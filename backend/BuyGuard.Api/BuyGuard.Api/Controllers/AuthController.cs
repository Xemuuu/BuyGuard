using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using BuyGuard.Api.Data;
using BuyGuard.Api.Models;
using System.Security.Cryptography;


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
        return Ok(new { token });
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


    private bool VerifyPassword(string password, string storedHash)
    {
        using var sha256 = SHA256.Create();
        var hashBytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(password));
        return Convert.ToBase64String(hashBytes) == storedHash;
    }
}

public class LoginRequest
{
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
}
