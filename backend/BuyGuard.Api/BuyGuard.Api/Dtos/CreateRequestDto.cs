namespace BuyGuard.Api.Dtos
{
    using System.ComponentModel.DataAnnotations;

    public class CreateRequestDto
    {
        [Required]
        public string Title { get; set; } = "";

        public string? Url { get; set; }

        [Required]
        public string Description { get; set; } = "";

        [Required]
        [Range(0.01, 100000, ErrorMessage = "Kwota musi być większa niż 0 i nie przekraczać 100 000 zł.")]
        public decimal AmountPln { get; set; }

        [Required]
        public string Reason { get; set; } = "";
    }

}
