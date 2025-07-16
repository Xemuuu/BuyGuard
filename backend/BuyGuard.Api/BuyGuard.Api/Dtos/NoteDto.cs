namespace BuyGuard.Api.Dtos;

public record class NoteDto(
    int Id,
    int RequestId,
    string Body,
    DateTime CreatedAt,
    UserDto Author
);