// Plik: backend/BuyGuard.Api/BuyGuard.Api/Controllers/RequestsController.cs
using AutoMapper;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using BuyGuard.Api.Data;
using BuyGuard.Api.Dtos;
using BuyGuard.Api.Models;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class RequestsController : ControllerBase
{
    private readonly BuyGuardDbContext _context;
    private readonly IMapper _mapper;

    public RequestsController(BuyGuardDbContext context, IMapper mapper)
    {
        _context = context;
        _mapper = mapper;
    }

    // GET: api/requests/{id}
    [HttpGet("{id}")]
    public async Task<ActionResult<RequestDto>> GetRequest(int id)
    {
        var request = await _context.Requests
            .Include(r => r.Author) // Dołącz autora
            .Include(r => r.Manager) // Dołącz menedżera
            .Include(r => r.Attachments) // Dołącz załączniki
            .Include(r => r.Notes) // Dołącz notatki
            .FirstOrDefaultAsync(r => r.Id == id);

        if (request == null)
        {
            return NotFound("Nie znaleziono requestu o podanym ID.");
        }

        // Logika autoryzacji
        var currentUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var currentUserRole = User.FindFirst(ClaimTypes.Role)?.Value;

        if (currentUserId == null || currentUserRole == null)
        {
            return Unauthorized();
        }

        if (request.AuthorId.ToString() != currentUserId &&
            request.ManagerId.ToString() != currentUserId &&
            currentUserRole != "admin")
        {
            return Forbid("Brak uprawnień do przeglądania tego requestu.");
        }

        var requestDto = _mapper.Map<RequestDto>(request);
        return Ok(requestDto);
    }

    // PUT: api/requests/{id}
    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateRequest(int id, UpdateRequestDto updateRequestDto)
    {
        var request = await _context.Requests.FindAsync(id);

        if (request == null)
        {
            return NotFound("Nie znaleziono requestu o podanym ID.");
        }

        var currentUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var currentUserRole = User.FindFirst(ClaimTypes.Role)?.Value;

        if (currentUserId == null || currentUserRole == null)
        {
            return Unauthorized();
        }

        // Logika autoryzacji 
        if (request.AuthorId.ToString() != currentUserId &&
            request.ManagerId.ToString() != currentUserId &&
            currentUserRole != "admin")
        {
            return Forbid("Brak uprawnień do edycji tego requestu.");
        }

        if (currentUserRole != "admin" && currentUserRole != "manager")
        {
            if (request.AuthorId.ToString() == currentUserId && request.Status == RequestStatus.Czeka)
            {
                // Autor może edytować tylko niektóre pola, gdy status to "Czeka"
                request.Title = updateRequestDto.Title;
                request.Description = updateRequestDto.Description;
                request.AmountPln = updateRequestDto.AmountPln;
                request.Reason = updateRequestDto.Reason;
            }
            else
            {
                return Forbid("Brak uprawnień do edycji tego requestu w obecnym statusie.");
            }
        }
        // dodalem mozliwosc edytowania przez menagera i admina chociaz nie ma tego w specyfikacji - pozniej mozna to latow usunac
        else if (currentUserRole == "manager")
        {
            // Menedżer może edytować wszystkie pola ale tylko requesty, którymi zarządza
            if (request.ManagerId.ToString() != currentUserId && currentUserRole != "admin")
            {
                return Forbid("Brak uprawnień do edycji tego requestu.");
            }
            _mapper.Map(updateRequestDto, request);
        }
        else if (currentUserRole == "admin")
        {
            // Admin może edytować wszystko
            _mapper.Map(updateRequestDto, request);
        }

        request.UpdatedAt = DateTime.UtcNow; // aktualizacja daty modyfikacji

        try
        {
            await _context.SaveChangesAsync();
        }
        catch (DbUpdateConcurrencyException)
        {
            throw;
        }

        var updatedRequestDto = _mapper.Map<RequestDto>(request);
        return Ok(updatedRequestDto);
    }
}
