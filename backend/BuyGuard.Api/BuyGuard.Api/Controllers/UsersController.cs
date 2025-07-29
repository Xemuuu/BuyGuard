using AutoMapper;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using BuyGuard.Api.Data;
using BuyGuard.Api.Dtos;
using BuyGuard.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Cryptography;
using System.Text;


[ApiController]
[Route("api/[controller]")]
public class UsersController : ControllerBase
{
    private readonly BuyGuardDbContext _context;
    private readonly IMapper _mapper;

    public UsersController(BuyGuardDbContext context, IMapper mapper)
    {
        _context = context;
        _mapper = mapper;
    }

    [Authorize(Roles = "admin,manager")]
    [HttpGet]
    public async Task<ActionResult<IEnumerable<UserDto>>> GetUsers([FromQuery] int page = 1, [FromQuery] int pageSize = 10)
    {
        var currentUserRole = User.FindFirst(ClaimTypes.Role)?.Value;

        if (currentUserRole == null)
            return Forbid();

        IQueryable<User> query;

        if (currentUserRole == "admin")
        {
            query = _context.Users.Where(u => u.Role == "manager");
        }
        else if (currentUserRole == "manager")
        {
            query = _context.Users.Where(u => u.Role == "employee");
        }
        else
        {
            return Forbid();
        }

        var users = await query
            .OrderBy(u => u.LastName).ThenBy(u => u.FirstName)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        var userDtos = _mapper.Map<IEnumerable<UserDto>>(users);
        return Ok(userDtos);
    }

    [Authorize(Roles = "admin,manager")]
    [HttpPost]
    public async Task<ActionResult<UserDto>> CreateUser(CreateUserDto createUserDto)
    {
        var currentUserRole = User.FindFirst(ClaimTypes.Role)?.Value;

        if (currentUserRole != "admin" && currentUserRole != "manager")
        {
            return Forbid();
        }

        var existingUser = await _context.Users.AnyAsync(u => u.Email == createUserDto.Email);
        if (existingUser)
        {
            return Conflict("Użytkownik o podanym e-mailu już istnieje.");
        }

        var hashedPassword = HashPassword(createUserDto.Password);

        var newUser = new User
        {
            FirstName = createUserDto.FirstName,
            LastName = createUserDto.LastName,
            Email = createUserDto.Email,
            PasswordHash = hashedPassword,
            Role = currentUserRole == "admin" ? "manager" : "employee",
            ManagerLimitPln = currentUserRole == "admin" ? createUserDto.ManagerLimitPln : null
        };

        _context.Users.Add(newUser);
        await _context.SaveChangesAsync();

        var resultDto = _mapper.Map<UserDto>(newUser);

        return CreatedAtAction(nameof(GetUsers), new { id = newUser.Id }, resultDto);
    }


    // PATCH: api/users/profile
    [HttpPatch("profile")]
    public async Task<IActionResult> UpdateProfile(UpdateProfileDto updateProfileDto)
    {
        var currentUserIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(currentUserIdStr) || !int.TryParse(currentUserIdStr, out var currentUserId))
        {
            return Unauthorized();
        }

        var user = await _context.Users.FindAsync(currentUserId);
        if (user == null)
        {
            return NotFound("Nie znaleziono użytkownika.");
        }

        // Aktualizuj pola tylko jeśli zostały podane
        if (!string.IsNullOrEmpty(updateProfileDto.FirstName))
        {
            user.FirstName = updateProfileDto.FirstName;
        }

        if (!string.IsNullOrEmpty(updateProfileDto.LastName))
        {
            user.LastName = updateProfileDto.LastName;
        }

        if (!string.IsNullOrEmpty(updateProfileDto.Email))
        {
            // Sprawdź czy email nie jest już zajęty
            var existingUser = await _context.Users.FirstOrDefaultAsync(u => u.Email == updateProfileDto.Email && u.Id != currentUserId);
            if (existingUser != null)
            {
                return BadRequest("Ten adres email jest już zajęty.");
            }
            user.Email = updateProfileDto.Email;
        }

        try
        {
            await _context.SaveChangesAsync();
        }
        catch (DbUpdateConcurrencyException)
        {
            throw;
        }

        var updatedUserDto = _mapper.Map<UserDto>(user);
        return Ok(new
        {
            UserId = user.Id.ToString(),
            Email = user.Email,
            Roles = new[] { user.Role },
            FirstName = user.FirstName,
            LastName = user.LastName
        });
    }

    // PATCH: api/users/{id}
    [Authorize(Roles = "admin,manager")]
    [HttpPatch("{id}")]
    public async Task<IActionResult> UpdateUser(int id, UpdateUserDto updateUserDto)
    {
        // 1. Pobierz użytkownika, którego chcemy edytować (cel)
        var user = await _context.Users.FindAsync(id);
        if (user == null)
        {
            return NotFound("Nie znaleziono użytkownika o podanym ID.");
        }

        // 2. Pobierz dane zalogowanego użytkownika (aktor)
        var actorRole = User.FindFirst(ClaimTypes.Role)?.Value;
        var actorIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

        if (string.IsNullOrEmpty(actorRole) || !int.TryParse(actorIdStr, out var actorId))
        {
            return Unauthorized();
        }

        if (actorId == id)
        {
            return BadRequest("Nie można edytować własnego konta za pomocą tego endpointu.");
        }

        switch (actorRole)
        {
            case "admin":
                if (user.Role != "manager")
                {
                    return Forbid("Administratorzy mogą edytować tylko konta menedżerów.");
                }
                break; 

            case "manager":
                if (user.Role != "employee")
                {
                    return Forbid("Menedżerowie mogą edytować tylko konta pracowników.");
                }
                break; 
            
            default:
                return Forbid();
        }

        if (!string.IsNullOrEmpty(updateUserDto.FirstName))
        {
            user.FirstName = updateUserDto.FirstName;
        }

        if (!string.IsNullOrEmpty(updateUserDto.LastName))
        {
            user.LastName = updateUserDto.LastName;
        }

        if (updateUserDto.Email != null)
        {
            user.Email = updateUserDto.Email;
        }

        if (updateUserDto.Password != null)
        {
            user.PasswordHash = HashPassword(updateUserDto.Password);
        }

        if (actorRole == "admin" && updateUserDto.ManagerLimitPln.HasValue)
        {
            user.ManagerLimitPln = updateUserDto.ManagerLimitPln;
        }

        try
        {
            await _context.SaveChangesAsync();
        }
        catch (DbUpdateConcurrencyException)
        {
            throw;
        }

        var updatedUserDto = _mapper.Map<UserDto>(user);
        return Ok(updatedUserDto);
    }

    // DELETE: api/users/{id}
    [Authorize(Roles = "admin,manager")]
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteUser(int id)
    {
        // 1. Pobierz użytkownika, którego chcemy usunąć (cel)
        var user = await _context.Users.FindAsync(id);
        if (user == null)
        {
            return NotFound("Nie znaleziono użytkownika o podanym ID.");
        }

        // 2. Pobierz dane zalogowanego użytkownika (aktor)
        var actorRole = User.FindFirst(ClaimTypes.Role)?.Value;
        var actorIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

        if (string.IsNullOrEmpty(actorRole) || !int.TryParse(actorIdStr, out var actorId))
        {
            return Unauthorized();
        }

        if (actorId == id)
        {
            return BadRequest("Nie można usunąć własnego konta.");
        }

        switch (actorRole)
        {
            case "admin":
                if (user.Role != "manager")
                {
                    return Forbid("Administratorzy mogą usuwać tylko konta menedżerów.");
                }
                break;

            case "manager":
                if (user.Role != "employee")
                {
                    return Forbid("Menedżerowie mogą usuwać tylko konta pracowników.");
                }
                break;
            
            default:
                return Forbid();
        }

        _context.Users.Remove(user);
        await _context.SaveChangesAsync();

        return NoContent();
    }

    [Authorize]
    [HttpGet("whoami")]
    public IActionResult WhoAmI()
    {
        var roles = User.Claims
            .Where(c => c.Type == ClaimTypes.Role)
            .Select(c => c.Value)
            .ToList();

        return Ok(new
        {
            UserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value,
            Email = User.FindFirst(ClaimTypes.Email)?.Value,
            Roles = roles
        });
    }

    private string HashPassword(string password)
    {
        using var sha256 = SHA256.Create();
        var hashBytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(password));
        return Convert.ToBase64String(hashBytes);
    }

    private bool VerifyPassword(string password, string storedHash)
    {
        using var sha256 = SHA256.Create();
        var hashBytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(password));
        return Convert.ToBase64String(hashBytes) == storedHash;
    }
}