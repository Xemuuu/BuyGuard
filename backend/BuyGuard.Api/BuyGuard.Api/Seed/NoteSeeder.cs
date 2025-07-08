using System;
using System.Linq;
using BuyGuard.Api.Models;
using BuyGuard.Api.Data;

namespace BuyGuard.Api.Seed
{
    public static class NoteSeeder
    {
        public static void Seed(BuyGuardDbContext context)
        {
            var notes = new[]
            {
                new Note
                {
                    Id = 1,
                    RequestId = 1,
                    AuthorId = 2,
                    Body = "Proszę o pilne zatwierdzenie.",
                    CreatedAt = DateTime.UtcNow.AddDays(-1)
                }
            };

            foreach (var note in notes)
            {
                if (!context.Notes.Any(n => n.Id == note.Id))
                {
                    context.Notes.Add(note);
                }
            }
            context.SaveChanges();
        }
    }
}
