namespace BuyGuard.Api.Models;

public enum RequestStatus { PENDING, ACCEPTED, REJECTED, PURCHASED }

public class Request
{
    public int Id { get; set; }

    // Kto jest autorem (twórcą) requesta
    public int AuthorId { get; set; }
    public User Author { get; set; } = null!;

    // Kto jest managerem zatwierdzającym request (opcjonalnie)
    public int? ManagerId { get; set; }
    public User? Manager { get; set; }

    public string Title { get; set; } = "";
    public string? Url { get; set; }  // 👈 DODANE TUTAJ

    public string Description { get; set; } = "";
    public decimal AmountPln { get; set; }
    public string Reason { get; set; } = "";
    public RequestStatus Status { get; set; } = RequestStatus.PENDING;
    public int? AiScore { get; set; }
    public bool IsSubmitted { get; set; } = false; // Czy zgłoszenie zostało wysłane do pracownika

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<Attachment> Attachments { get; set; } = new List<Attachment>();
    public ICollection<Note> Notes { get; set; } = new List<Note>();
}
