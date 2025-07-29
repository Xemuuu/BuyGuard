using BuyGuard.Api.Data;
using BuyGuard.Api.Models;

public static class RequestSeeder
{
    public static void Seed(BuyGuardDbContext context)
    {
        var requests = new[]
        {
            new Request
            {
                Id = 1,
                AuthorId = 3,
                ManagerId = 2,
                Title = "Laptop zakup",
                Url = "https://dell.pl/xps13", // 👈 dodane
                Description = "Proszę o zakup laptopa Dell XPS",
                AmountPln = 5000,
                Reason = "Nowy sprzęt dla pracownika",
                Status = RequestStatus.PENDING,
                AiScore = 80,
                CreatedAt = DateTime.UtcNow.AddDays(-3),
                UpdatedAt = DateTime.UtcNow.AddDays(-2)
            },
            new Request
            {
                Id = 2,
                AuthorId = 3,
                ManagerId = 2,
                Title = "Monitor zakup",
                Url = "https://example.com/monitor-27", // 👈 dodane
                Description = "Proszę o zakup monitora 27 cali",
                AmountPln = 1200,
                Reason = "Ulepszenie stanowiska pracy",
                Status = RequestStatus.ACCEPTED,
                AiScore = 90,
                CreatedAt = DateTime.UtcNow.AddDays(-10),
                UpdatedAt = DateTime.UtcNow.AddDays(-9)
            }
        };

        foreach (var req in requests)
        {
            if (!context.Requests.Any(r => r.Id == req.Id))
            {
                context.Requests.Add(req);
            }
        }

        context.SaveChanges();
    }
}
