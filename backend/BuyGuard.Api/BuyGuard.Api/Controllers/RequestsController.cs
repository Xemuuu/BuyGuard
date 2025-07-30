// Plik: backend/BuyGuard.Api/BuyGuard.Api/Controllers/RequestsController.cs
using AutoMapper;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using BuyGuard.Api.Data;
using BuyGuard.Api.Dtos;
using BuyGuard.Api.Models;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using System.Text;
using System.Text.Json;


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
            if (request.AuthorId.ToString() == currentUserId && request.Status == RequestStatus.PENDING)
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


    // POST: api/requests
    [HttpPost]
    public async Task<ActionResult<RequestDto>> CreateRequest(CreateRequestDto dto)
    {
        var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var userRole = User.FindFirst(ClaimTypes.Role)?.Value;

        if (!int.TryParse(userIdString, out var authorId))
            return Forbid("Nie można odczytać ID użytkownika.");

        if (dto.AmountPln > 100_000)
            return BadRequest("Kwota nie może przekraczać 100 000 PLN.");

        // Znajdź menedżera z odpowiednim limitem
        var manager = await _context.Users
            .Where(u => u.Role == "manager" && u.ManagerLimitPln >= dto.AmountPln)
            .OrderBy(u => u.ManagerLimitPln)
            .FirstOrDefaultAsync();

        // Jeśli brak menedżera – przypisz administratora
        if (manager == null)
        {
            manager = await _context.Users
                .Where(u => u.Role == "admin")
                .FirstOrDefaultAsync();
        }

        if (manager == null)
            return StatusCode(500, "Nie znaleziono odpowiedniego menedżera ani administratora.");

        var request = new Request
        {
            Title = dto.Title,
            Url = dto.Url,
            Description = dto.Description,
            AmountPln = dto.AmountPln,
            Reason = dto.Reason,
            Status = RequestStatus.PENDING,
            AuthorId = authorId,
            ManagerId = manager.Id,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.Requests.Add(request);
        await _context.SaveChangesAsync();

        // Wczytaj request z relacjami
        var created = await _context.Requests
            .Include(r => r.Author)
            .Include(r => r.Manager)
            .Include(r => r.Attachments)
            .Include(r => r.Notes)
            .FirstOrDefaultAsync(r => r.Id == request.Id);

        if (created == null)
            return StatusCode(500, "Wystąpił błąd przy tworzeniu zgłoszenia.");

        var result = _mapper.Map<RequestDto>(created);
        return CreatedAtAction(nameof(GetRequest), new { id = result.Id }, result);
    }

    // GET: api/requests
    [HttpGet]
    public async Task<ActionResult<IEnumerable<RequestListItemDto>>> GetRequests(
        [FromQuery] string? status,
        [FromQuery] string? search,
        [FromQuery] decimal? minAmount,
        [FromQuery] decimal? maxAmount,
        [FromQuery] DateTime? startDate,
        [FromQuery] DateTime? endDate,
        [FromQuery] string? sortBy,
        [FromQuery] string? sortOrder,
        [FromQuery] int pageNumber = 1, 
        [FromQuery] int pageSize = 10)
    {
        var currentUserId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
        var currentUserRole = User.FindFirst(ClaimTypes.Role)!.Value;

        var query = _context.Requests
            .Include(r => r.Author)
            .AsQueryable();

        // Filtrowanie według roli (zachowujemy istniejącą logikę)
        if (currentUserRole == "employee")
        {
            query = query.Where(r => r.AuthorId == currentUserId);
        }
        else if (currentUserRole == "manager")
        {
            query = query.Where(r => r.ManagerId == currentUserId && !r.IsSubmitted);
        }
        // admin widzi wszystko – brak filtru

        // Filtrowanie
        if (!string.IsNullOrEmpty(status) && Enum.TryParse<RequestStatus>(status, true, out var parsedStatus))
        {
            query = query.Where(r => r.Status == parsedStatus);
        }

        if (!string.IsNullOrEmpty(search))
        {
            query = query.Where(r => r.Title.ToLower().Contains(search.ToLower()));
        }

        if (minAmount.HasValue)
        {
            query = query.Where(r => r.AmountPln >= minAmount.Value);
        }

        if (maxAmount.HasValue)
        {
            query = query.Where(r => r.AmountPln <= maxAmount.Value);
        }

        if (startDate.HasValue)
        {
            query = query.Where(r => r.CreatedAt.Date >= startDate.Value.Date);
        }

        if (endDate.HasValue)
        {
            query = query.Where(r => r.CreatedAt.Date <= endDate.Value.Date);
        }

        // Sortowanie
        if (!string.IsNullOrEmpty(sortBy))
        {
            bool isDescending = sortOrder?.ToLower() == "desc";

            switch (sortBy.ToLower())
            {
                case "date":
                    query = isDescending ? query.OrderByDescending(r => r.CreatedAt) : query.OrderBy(r => r.CreatedAt);
                    break;
                case "amount":
                    query = isDescending ? query.OrderByDescending(r => r.AmountPln) : query.OrderBy(r => r.AmountPln);
                    break;
                case "title":
                    query = isDescending ? query.OrderByDescending(r => r.Title) : query.OrderBy(r => r.Title);
                    break;
                default:
                    query = query.OrderByDescending(r => r.CreatedAt);
                    break;
            }
        }
        else
        {
            query = query.OrderByDescending(r => r.CreatedAt);
        }

        // Paginacja
        var skip = (pageNumber - 1) * pageSize;
        var pagedRequests = await query
            .Skip(skip)
            .Take(pageSize)
            .Select(r => new RequestListItemDto
            {
                Id = r.Id,
                Title = r.Title,
                Status = r.Status,
                AmountPln = r.AmountPln,
                CreatedAt = r.CreatedAt,
                AuthorFirstName = r.Author.FirstName,
                AuthorLastName = r.Author.LastName,
                Reason = r.Reason
            })
            .ToListAsync();

        return Ok(pagedRequests);
    }

    // PATCH: api/requests/{id}/status
    [HttpPatch("{id}/status")]
    public async Task<IActionResult> UpdateRequestStatus(int id, [FromBody] UpdateStatusDto dto)
    {
        var request = await _context.Requests.FindAsync(id);
        if (request == null)
            return NotFound("Nie znaleziono zgłoszenia.");

        var currentUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var currentUserRole = User.FindFirst(ClaimTypes.Role)?.Value;

        if (currentUserId == null || currentUserRole == null)
            return Unauthorized();

        // Sprawdzenie uprawnień
        bool isAssignedManager = request.ManagerId.ToString() == currentUserId;
        bool isAdmin = currentUserRole == "admin";

        if (!isAdmin && !(currentUserRole == "manager" && isAssignedManager))
            return Forbid("Brak uprawnienia do zmiany statusu.");

        // Zmiana statusu
        if (!Enum.TryParse<RequestStatus>(dto.NewStatus, true, out var newStatus))
            return BadRequest("Nieprawidłowy status.");
        request.Status = newStatus;
        request.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        
        // Wczytaj zaktualizowany request z relacjami
        var updatedRequest = await _context.Requests
            .Include(r => r.Author)
            .Include(r => r.Manager)
            .Include(r => r.Attachments)
            .Include(r => r.Notes)
            .FirstOrDefaultAsync(r => r.Id == id);

        if (updatedRequest == null)
            return StatusCode(500, "Wystąpił błąd przy aktualizacji statusu.");

        var result = _mapper.Map<RequestDto>(updatedRequest);
        return Ok(result);
    }

    // PATCH: api/requests/{id}/edit
    [HttpPatch("{id}/edit")]
    public async Task<IActionResult> EditRequest(int id, [FromBody] EditRequestDto editRequestDto)
    {
        var request = await _context.Requests.FindAsync(id);
        if (request == null)
            return NotFound("Nie znaleziono zgłoszenia.");

        var currentUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var currentUserRole = User.FindFirst(ClaimTypes.Role)?.Value;

        if (currentUserId == null || currentUserRole == null)
            return Unauthorized();

        Console.WriteLine($"EditRequest - Request ID: {id}, User ID: {currentUserId}, Role: {currentUserRole}");
        Console.WriteLine($"Current request - ManagerId: {request.ManagerId}, Amount: {request.AmountPln}, Status: {request.Status}");

        // Sprawdzenie uprawnień - tylko autor może edytować swoje zgłoszenie
        if (request.AuthorId.ToString() != currentUserId)
            return Forbid("Możesz edytować tylko swoje zgłoszenia.");

        // Sprawdzenie statusu - tylko PENDING można edytować
        if (request.Status != RequestStatus.PENDING)
            return BadRequest("Można edytować tylko zgłoszenia ze statusem PENDING.");

        // Aktualizuj pola tylko jeśli zostały podane i nie są puste
        if (!string.IsNullOrWhiteSpace(editRequestDto.Title))
            request.Title = editRequestDto.Title;
        
        if (!string.IsNullOrWhiteSpace(editRequestDto.Description))
            request.Description = editRequestDto.Description;
        
        if (editRequestDto.AmountPln.HasValue && editRequestDto.AmountPln.Value > 0)
        {
            var oldAmount = request.AmountPln;
            request.AmountPln = editRequestDto.AmountPln.Value;
            
            // Jeśli kwota się zmieniła, sprawdź czy manager nadal pasuje
            if (oldAmount != request.AmountPln)
            {
                var currentManager = await _context.Users.FindAsync(request.ManagerId);
                if (currentManager == null || currentManager.Role != "manager" || 
                    (currentManager.ManagerLimitPln.HasValue && currentManager.ManagerLimitPln.Value < request.AmountPln))
                {
                    // Znajdź nowego menedżera z odpowiednim limitem
                    var newManager = await _context.Users
                        .Where(u => u.Role == "manager" && u.ManagerLimitPln >= request.AmountPln)
                        .OrderBy(u => u.ManagerLimitPln)
                        .FirstOrDefaultAsync();

                    // Jeśli brak menedżera – przypisz administratora
                    if (newManager == null)
                    {
                        newManager = await _context.Users
                            .Where(u => u.Role == "admin")
                            .FirstOrDefaultAsync();
                    }

                    if (newManager != null)
                    {
                        Console.WriteLine($"Changing manager from {request.ManagerId} to {newManager.Id} for request {id}");
                        request.ManagerId = newManager.Id;
                    }
                }
            }
        }
        
        if (!string.IsNullOrWhiteSpace(editRequestDto.Reason))
            request.Reason = editRequestDto.Reason;

        if (!string.IsNullOrWhiteSpace(editRequestDto.Url))
            request.Url = editRequestDto.Url;

        request.UpdatedAt = DateTime.UtcNow;
        
        // Po edycji request powinien być ponownie widoczny dla managera
        request.IsSubmitted = false;

        await _context.SaveChangesAsync();

        Console.WriteLine($"Request {id} updated - Final ManagerId: {request.ManagerId}, Amount: {request.AmountPln}");

        // Wczytaj zaktualizowany request z relacjami
        var updatedRequest = await _context.Requests
            .Include(r => r.Author)
            .Include(r => r.Manager)
            .Include(r => r.Attachments)
            .Include(r => r.Notes)
            .FirstOrDefaultAsync(r => r.Id == id);

        if (updatedRequest == null)
            return StatusCode(500, "Wystąpił błąd przy aktualizacji zgłoszenia.");

        var result = _mapper.Map<RequestDto>(updatedRequest);
        return Ok(result);
    }

    // GET: api/requests/export
    // Export plików CSV
    [HttpGet("export")]
    [Authorize(Roles = "admin")]
    public async Task<IActionResult> ExportReport([FromQuery] int? month, [FromQuery] int? year, [FromQuery] string format = "csv")
    {
        var query = _context.Requests
            .Include(r => r.Author)
            .AsQueryable();

        if (month.HasValue && year.HasValue)
        {
            query = query.Where(r => r.CreatedAt.Month == month && r.CreatedAt.Year == year);
        }

        var data = await query.OrderByDescending(r => r.CreatedAt).ToListAsync();

        if (format.ToLower() == "csv")
        {
            var csvBuilder = new StringBuilder();
            csvBuilder.AppendLine("Id,Tytuł,Status,Data utworzenia,Kwota,Autor");

            foreach (var r in data)
            {
                csvBuilder.AppendLine($"{r.Id},\"{r.Title}\",{r.Status},{r.CreatedAt:yyyy-MM-dd},{r.AmountPln},\"{r.Author.FirstName} {r.Author.LastName}\"");
            }

            var bytes = Encoding.UTF8.GetBytes(csvBuilder.ToString());
            return File(bytes, "text/csv", "raport_zgloszen.csv");
        }
        else if (format.ToLower() == "pdf")
        {
            // Możesz tu dodać generowanie PDF
            return StatusCode(501, "Eksport do PDF nie został jeszcze zaimplementowany.");
        }
        else
        {
            return BadRequest("Nieobsługiwany format eksportu. Użyj 'csv' lub 'pdf'.");
        }
    }

    // POST: api/requests/{id}/notify
    [HttpPost("{id}/notify")]
    public async Task<IActionResult> NotifyEmployee(int id)
    {
        var request = await _context.Requests
            .Include(r => r.Author)
            .Include(r => r.Manager)
            .FirstOrDefaultAsync(r => r.Id == id);
            
        if (request == null)
            return NotFound("Nie znaleziono zgłoszenia.");

        var currentUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var currentUserRole = User.FindFirst(ClaimTypes.Role)?.Value;

        if (currentUserId == null || currentUserRole == null)
            return Unauthorized();

        // Sprawdzenie uprawnień - tylko manager i admin mogą wysyłać powiadomienia
        bool isAssignedManager = request.ManagerId.ToString() == currentUserId;
        bool isAdmin = currentUserRole == "admin";

        if (!isAdmin && !(currentUserRole == "manager" && isAssignedManager))
            return Forbid("Brak uprawnienia do wysyłania powiadomień.");

        // Pobierz dane wysyłającego
        var sender = await _context.Users.FindAsync(int.Parse(currentUserId));
        if (sender == null)
            return NotFound("Nie znaleziono użytkownika wysyłającego.");

        // Utwórz powiadomienie dla pracownika
        var notification = new Notification
        {
            RecipientId = request.AuthorId,
            RequestId = request.Id,
            SenderId = sender.Id,
            Title = "Zmiana statusu zgłoszenia",
            Message = $"Twoje zgłoszenie '{request.Title}' zostało zaktualizowane na status: {request.Status} przez {sender.FirstName} {sender.LastName}.",
            IsRead = false,
            CreatedAt = DateTime.UtcNow
        };

        _context.Notifications.Add(notification);
        
        // Oznacz zgłoszenie jako wysłane
        request.IsSubmitted = true;
        
        await _context.SaveChangesAsync();

        return Ok(new { message = "Powiadomienie wysłane do pracownika." });
    }

}


