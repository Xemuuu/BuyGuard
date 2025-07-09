using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using BCrypt.Net;
using BuyGuard.Api.Data;
using BuyGuard.Api.Dtos;
using BuyGuard.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;


[Authorize(Roles = "admin,manager")]
[ApiController]
[Route("api/[controller]")]
public class UsersController : ControllerBase
{
    private readonly BuyGuardDbContext _context;

    public UsersController(BuyGuardDbContext context)
    {
        _context = context;
    }

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
            .Select(u => new UserDto
            {
                Id = u.Id,
                Email = u.Email,
                FirstName = u.FirstName,
                LastName = u.LastName,
                Role = u.Role,
                ManagerLimitPln = u.Role == "manager" ? u.ManagerLimitPln : null
            })
            .ToListAsync();

        return Ok(users);
    }

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

        var hashedPassword = BCrypt.Net.BCrypt.HashPassword(createUserDto.Password);

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

        var resultDto = new UserDto
        {
            Id = newUser.Id,
            Email = newUser.Email,
            FirstName = newUser.FirstName,
            LastName = newUser.LastName,
            Role = newUser.Role,
            ManagerLimitPln = newUser.ManagerLimitPln
        };

        return CreatedAtAction(nameof(GetUsers), new { id = newUser.Id }, resultDto);
    }


    // PATCH: api/users/{id}
    [HttpPatch("{id}")]
    public async Task<IActionResult> UpdateUser(int id, UpdateUserDto updateUserDto)
    {
        var user = await _context.Users.FindAsync(id);

        if (user == null)
        {
            return NotFound("Nie znaleziono użytkownika o podanym ID.");
        }

        if (updateUserDto.Email != null)
        {
            user.Email = updateUserDto.Email;
        }

        if (updateUserDto.Password != null)
        {
            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(updateUserDto.Password);
        }

        if (updateUserDto.ManagerLimitPln.HasValue)
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

        return NoContent();
    }

    // DELETE: api/users/{id}
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteUser(int id)
    {
        var user = await _context.Users.FindAsync(id);
        if (user == null)
        {
            return NotFound("Nie znaleziono użytkownika o podanym ID.");
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

}
