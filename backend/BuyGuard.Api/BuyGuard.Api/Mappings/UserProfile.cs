// Plik: backend/BuyGuard.Api/BuyGuard.Api/Mappings/UserProfile.cs
using AutoMapper;
using BuyGuard.Api.Models;
using BuyGuard.Api.Dtos;

public class UserProfile : Profile
{
    public UserProfile()
    {
        // Definiuje, jak mapować z encji User na obiekt UserDto.
        // AutoMapper automatycznie dopasuje właściwości o tych samych nazwach.
        CreateMap<User, UserDto>();
    }
}