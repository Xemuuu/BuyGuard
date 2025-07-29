using BuyGuard.Api.Models;

namespace BuyGuard.Api.Dtos
{
    public class RequestListItemDto
    {
        public int Id { get; set; }
        public string Title { get; set; } = default!;
        public decimal AmountPln { get; set; }
        public RequestStatus Status { get; set; }
        public DateTime CreatedAt { get; set; }
        public string AuthorFirstName { get; set; } = default!;
        public string AuthorLastName { get; set; } = default!;
        public string Reason { get; set; } = string.Empty;
    }

}
