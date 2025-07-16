// Plik: backend/BuyGuard.Api/BuyGuard.Api/Dtos/UpdateRequestDto.cs
using System.ComponentModel.DataAnnotations;
using BuyGuard.Api.Models; // Aby użyć RequestStatus

namespace BuyGuard.Api.Dtos;

public class UpdateRequestDto
{
    [Required(ErrorMessage = "Tytuł jest wymagany.")]
    [MaxLength(255, ErrorMessage = "Tytuł nie może być dłuższy niż 255 znaków.")]
    public string Title { get; set; } = string.Empty;

    [Required(ErrorMessage = "Opis jest wymagany.")]
    public string Description { get; set; } = string.Empty;

    [Required(ErrorMessage = "Kwota jest wymagana.")]
    [Range(0.01, double.MaxValue, ErrorMessage = "Kwota musi być większa od zera.")]
    public decimal AmountPln { get; set; }

    [Required(ErrorMessage = "Powód jest wymagany.")]
    public string Reason { get; set; } = string.Empty;

    // Status może być zmieniany przez menedżera
    [Required(ErrorMessage = "Status jest wymagany.")]
    public RequestStatus Status { get; set; }

    // AiScore może być aktualizowany
    public int? AiScore { get; set; }

    // ManagerId może być przypisany lub zmieniony
    public int? ManagerId { get; set; }
}
