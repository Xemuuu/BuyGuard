namespace BuyGuard.Api.Dtos;

public class NotificationDto
{
    public int Id { get; set; }
    public int RequestId { get; set; }
    public string RequestTitle { get; set; } = "";
    public string SenderName { get; set; } = "";
    public string Title { get; set; } = "";
    public string Message { get; set; } = "";
    public bool IsRead { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? ReadAt { get; set; }
} 