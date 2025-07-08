namespace BuyGuard.Api.Dtos;

public record class AttachmentDto(
    int Id,
    int RequestId,
    string FileUrl,
    string MimeType
);
