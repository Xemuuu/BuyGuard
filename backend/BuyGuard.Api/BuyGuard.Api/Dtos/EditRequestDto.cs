namespace BuyGuard.Api.Dtos;

public class EditRequestDto
{
    public string? Title { get; set; }
    public string? Description { get; set; }
    public decimal? AmountPln { get; set; }
    public string? Reason { get; set; }
    public string? Url { get; set; }
} 