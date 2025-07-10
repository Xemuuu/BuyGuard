// Plik: backend/BuyGuard.Api/BuyGuard.Api/Mappings/NoteProfile.cs
using AutoMapper;
using BuyGuard.Api.Models;
using BuyGuard.Api.Dtos;

public class NoteProfile : Profile
{
    public NoteProfile()
    {
        CreateMap<Note, NoteDto>();
    }
}