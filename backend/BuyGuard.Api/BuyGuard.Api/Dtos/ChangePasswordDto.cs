// Plik: backend/BuyGuard.Api/BuyGuard.Api/Dtos/ChangePasswordDto.cs
using System.ComponentModel.DataAnnotations;

namespace BuyGuard.Api.Dtos;

public class ChangePasswordDto
{
    [Required(ErrorMessage = "Stare hasło jest wymagane.")]
    public string OldPassword { get; set; } = string.Empty;

    [Required(ErrorMessage = "Nowe hasło jest wymagane.")]
    [MinLength(8, ErrorMessage = "Hasło musi mieć co najmniej 8 znaków.")]
    public string NewPassword { get; set; } = string.Empty;

    [Required(ErrorMessage = "Musisz potwierdzić nowe hasło.")]
    [Compare("NewPassword", ErrorMessage = "Nowe hasła nie są identyczne.")]
    public string ConfirmNewPassword { get; set; } = string.Empty;
}