namespace BuyGuard.Api.Dtos;

using BuyGuard.Api.Models;

public record class UserDto(
    int Id,
    string Email,
    string Role,
    decimal? ManagerLimitPln
);