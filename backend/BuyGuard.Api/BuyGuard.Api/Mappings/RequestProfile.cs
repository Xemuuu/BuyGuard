// Plik: backend/BuyGuard.Api/BuyGuard.Api/Mappings/RequestProfile.cs
using AutoMapper;
using BuyGuard.Api.Models;
using BuyGuard.Api.Dtos;

public class RequestProfile : Profile
{
    public RequestProfile()
    {
        CreateMap<Request, RequestDto>();
    }
}