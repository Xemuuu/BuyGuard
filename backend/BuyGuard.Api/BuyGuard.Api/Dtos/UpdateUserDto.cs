using System.ComponentModel.DataAnnotations;

namespace BuyGuard.Api.Dtos;

public class UpdateUserDto
{
    [EmailAddress(ErrorMessage = "Niepoprawny format adresu email.")]
    public string? Email { get; set; }

    [MinLength(8, ErrorMessage = "Hasło musi mieć co najmniej 8 znaków.")]
    public string? Password { get; set; }

    [Range(0, double.MaxValue, ErrorMessage = "Limit menedżera nie może być ujemny.")]
    public decimal? ManagerLimitPln { get; set; }
}
