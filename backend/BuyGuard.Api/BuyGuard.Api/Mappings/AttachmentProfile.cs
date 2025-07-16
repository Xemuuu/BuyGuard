// Plik: backend/BuyGuard.Api/BuyGuard.Api/Mappings/AttachmentProfile.cs
using AutoMapper;
using BuyGuard.Api.Models;
using BuyGuard.Api.Dtos;

public class AttachmentProfile : Profile
{
    public AttachmentProfile()
    {
        CreateMap<Attachment, AttachmentDto>();
    }
}