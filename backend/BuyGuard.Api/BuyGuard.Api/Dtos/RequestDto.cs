namespace BuyGuard.Api.Dtos;

using BuyGuard.Api.Models;

public record class RequestDto(
    int Id,
    UserDto Author,
    UserDto? Manager,
    string Title,
    string Description,
    decimal AmountPln,
    string Reason,
    RequestStatus Status,
    int? AiScore,
    DateTime CreatedAt,
    DateTime UpdatedAt,
    ICollection<AttachmentDto> Attachments,
    ICollection<NoteDto> Notes
);
