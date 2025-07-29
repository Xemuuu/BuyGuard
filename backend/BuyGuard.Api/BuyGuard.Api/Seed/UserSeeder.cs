using System.Security.Cryptography;
using System.Text;
using BuyGuard.Api.Data;
using BuyGuard.Api.Models;

namespace BuyGuard.Api.Seed;

public static class UserSeeder
{
    public static void Seed(BuyGuardDbContext context)
    {
        Console.WriteLine("UserSeeder.Seed called");
        
        if (!context.Users.Any())
        {
            Console.WriteLine("No users found, creating new users");
            var users = new List<User>
            {
                new User
                {
                    Email = "admin@buyguard.pl",
                    FirstName = "Admin",
                    LastName = "Admin",
                    PasswordHash = HashPassword("Admin123!"),
                    Role = "admin"
                },
                new User
                {
                    Email = "manager@buyguard.pl",
                    FirstName = "Marcin",
                    LastName = "Marciński",
                    PasswordHash = HashPassword("Manager123!"),
                    Role = "manager",
                    ManagerLimitPln = 150000
                },
                new User
                {
                    Email = "employee@buyguard.pl",
                    FirstName = "Marek",
                    LastName = "Markowski",
                    PasswordHash = HashPassword("User123!"),
                    Role = "employee",
                    ManagerId = 2 // Przypisz do managera (ID = 2)
                },
                
            };

            context.Users.AddRange(users);
            context.SaveChanges();
            Console.WriteLine("New users created");
        }
        else
        {
            Console.WriteLine("Users exist, updating existing users");
            // Aktualizuj istniejących użytkowników
            UpdateExistingUsers(context);
        }
    }

    private static void UpdateExistingUsers(BuyGuardDbContext context)
    {
        Console.WriteLine("UpdateExistingUsers called");
        
        // Znajdź managera
        var manager = context.Users.FirstOrDefault(u => u.Role == "manager");
        if (manager == null)
        {
            Console.WriteLine("No manager found in database");
            return;
        }
        
        Console.WriteLine($"Found manager: {manager.FirstName} {manager.LastName} (ID: {manager.Id})");

        // Aktualizuj pracowników żeby mieli przypisanego managera
        var employees = context.Users.Where(u => u.Role == "employee" && u.ManagerId == null).ToList();
        Console.WriteLine($"Found {employees.Count} employees without manager");
        
        foreach (var employee in employees)
        {
            employee.ManagerId = manager.Id;
            Console.WriteLine($"Updated employee {employee.Email} with manager {manager.Email}");
        }

        context.SaveChanges();
        Console.WriteLine("UpdateExistingUsers completed");
    }

    private static string HashPassword(string password)
    {
        using var sha256 = SHA256.Create();
        var bytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(password));
        return Convert.ToBase64String(bytes);
    }
}
