namespace BuyGuard.Api.Models;

public class Notification
{
    public int Id { get; set; }
    
    // Do kogo jest powiadomienie
    public int RecipientId { get; set; }
    public User Recipient { get; set; } = null!;
    
    // O jakim zgłoszeniu jest powiadomienie
    public int RequestId { get; set; }
    public Request Request { get; set; } = null!;
    
    // Kto wysłał powiadomienie
    public int SenderId { get; set; }
    public User Sender { get; set; } = null!;
    
    public string Title { get; set; } = "";
    public string Message { get; set; } = "";
    public bool IsRead { get; set; } = false;
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? ReadAt { get; set; }
} 