using System.ComponentModel.DataAnnotations;

namespace BuyGuard.Api.Dtos;

public class CreateUserDto
{
    [Required(ErrorMessage = "Imię jest wymagane.")]
    public string FirstName { get; set; } = string.Empty;

    [Required(ErrorMessage = "Nazwisko jest wymagane.")]
    public string LastName { get; set; } = string.Empty;

    [Required(ErrorMessage = "Email jest wymagany.")]
    [EmailAddress(ErrorMessage = "Niepoprawny format adresu email.")]
    public string Email { get; set; } = string.Empty;

    [Required(ErrorMessage = "Hasło jest wymagane.")]
    [MinLength(8, ErrorMessage = "Hasło musi mieć co najmniej 8 znaków.")]
    public string Password { get; set; } = string.Empty;

    [Range(0, double.MaxValue, ErrorMessage = "Limit menedżera nie może być ujemny.")]
    public decimal? ManagerLimitPln { get; set; }
}