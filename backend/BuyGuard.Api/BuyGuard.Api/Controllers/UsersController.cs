using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using BuyGuard.Api.Data;
using BuyGuard.Api.Dtos;
using BuyGuard.Api.Models;
using System.Threading.Tasks;
using System.Collections.Generic;

[ApiController]
[Route("api/[controller]")]
public class UsersController : ControllerBase
{
    private readonly BuyGuardDbContext _context;

    public UsersController(BuyGuardDbContext context)
    {
        _context = context;
    }

    // GET: Metoda do pobierania listy wszystkich użytkowników.
    [HttpGet]
    public async Task<ActionResult<IEnumerable<UserDto>>> GetUsers()
    {
        // TODO: zwracanie listy użytkowników 
        await Task.CompletedTask;
        throw new NotImplementedException("Ta metoda zostanie zaimplementowana w przyszłości.");
    }

    // POST: Metoda do tworzenia nowego użytkownika.
    [HttpPost]
    public async Task<ActionResult<UserDto>> CreateUser(CreateUserDto createUserDto)
    {
        // TODO: tworzenie nowego użytkownika
        await Task.CompletedTask;
        throw new NotImplementedException("Ta metoda zostanie zaimplementowana w przyszłości.");
    }

    // PATCH: Metoda do częściowej aktualizacji istniejącego użytkownika
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
            // TODO: logika do hashowania hasła
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
            // Logika na wypadek konfliktu współbieżności
            throw;
        }

        return NoContent(); 
    }

    // DELETE: Metoda do usuwania użytkownika
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
}
