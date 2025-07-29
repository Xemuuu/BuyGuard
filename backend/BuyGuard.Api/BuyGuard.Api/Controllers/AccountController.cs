using System.Security.Claims;
using System.Threading.Tasks;
using BuyGuard.Api.Data;
using BuyGuard.Api.Dtos;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Cryptography;
using System.Text;

[Authorize]
[ApiController]
[Route("api/account")]
public class AccountController : ControllerBase
{
    private readonly BuyGuardDbContext _context;

    public AccountController(BuyGuardDbContext context)
    {
        _context = context;
    }

    [HttpPost("change-password")]
    public async Task<IActionResult> ChangePassword(ChangePasswordDto changePasswordDto)
    {
        var userIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (!int.TryParse(userIdStr, out var userId))
        {
            return Unauthorized();
        }

        var user = await _context.Users.FindAsync(userId);
        if (user == null)
        {
            return NotFound("Nie znaleziono użytkownika.");
        }

        var isOldPasswordValid = VerifyPassword(changePasswordDto.OldPassword, user.PasswordHash);
        if (!isOldPasswordValid)
        {
            return BadRequest(new { message = "Podane stare hasło jest nieprawidłowe." });
        }

        user.PasswordHash = HashPassword(changePasswordDto.NewPassword);

        await _context.SaveChangesAsync();

        return Ok(new { message = "Hasło zostało pomyślnie zmienione." });
    }

    private bool VerifyPassword(string password, string storedHash)
    {
        using var sha256 = SHA256.Create();
        var hashBytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(password));
        return Convert.ToBase64String(hashBytes) == storedHash;
    }

    private string HashPassword(string password)
    {
        using var sha256 = SHA256.Create();
        var hashBytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(password));
        return Convert.ToBase64String(hashBytes);
    }
}