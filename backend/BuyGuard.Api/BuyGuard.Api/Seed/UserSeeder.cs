using System.Security.Cryptography;
using System.Text;
using BuyGuard.Api.Data;
using BuyGuard.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace BuyGuard.Api.Seed;

public static class UserSeeder
{
    public static void Seed(BuyGuardDbContext context)
    {
        if (!context.Users.Any())
        {
            var users = new List<User>
        {
            new User
            {
                Email = "admin@buyguard.pl",
                PasswordHash = HashPassword("Admin123!"),
                Role = "admin"
            },
            new User
            {
                Email = "manager@buyguard.pl",
                PasswordHash = HashPassword("Manager123!"),
                Role = "manager",
                ManagerLimitPLN = 50000
            },
            new User
            {
                Email = "user@buyguard.pl",
                PasswordHash = HashPassword("User123!"),
                Role = "employee"
            }
        };

            context.Users.AddRange(users);
            context.SaveChanges();
        }
    }


    private static string HashPassword(string password)
    {
        using var sha256 = SHA256.Create();
        var bytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(password));
        return Convert.ToBase64String(bytes);
    }
}
