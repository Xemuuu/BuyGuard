using BuyGuard.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace BuyGuard.Api.Data
{
    public class BuyGuardDbContext : DbContext
    {
        public BuyGuardDbContext(DbContextOptions<BuyGuardDbContext> options) : base(options) { }

        public DbSet<User> Users { get; set; }
        public DbSet<Request> Requests { get; set; }
        public DbSet<Attachment> Attachments { get; set; }
        public DbSet<Note> Notes { get; set; }
        public DbSet<Order> Orders { get; set; }
        public DbSet<Notification> Notifications { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // User -> RequestsAuthored (1 do wielu)
            modelBuilder.Entity<Request>()
                .HasOne(r => r.Author)
                .WithMany(u => u.RequestsAuthored)
                .HasForeignKey(r => r.AuthorId)
                .OnDelete(DeleteBehavior.Restrict);

            // User -> RequestsManaged (1 do wielu), Manager może być null
            modelBuilder.Entity<Request>()
                .HasOne(r => r.Manager)
                .WithMany(u => u.RequestsManaged)
                .HasForeignKey(r => r.ManagerId)
                .OnDelete(DeleteBehavior.SetNull);

            // User -> Manager (1 do wielu), Manager może być null
            modelBuilder.Entity<User>()
                .HasOne(u => u.Manager)
                .WithMany(m => m.Employees)
                .HasForeignKey(u => u.ManagerId)
                .OnDelete(DeleteBehavior.SetNull);

            // Request -> Attachments (1 do wielu)
            modelBuilder.Entity<Attachment>()
                .HasOne(a => a.Request)
                .WithMany(r => r.Attachments)
                .HasForeignKey(a => a.RequestId)
                .OnDelete(DeleteBehavior.Cascade);

            // Request -> Notes (1 do wielu)
            modelBuilder.Entity<Note>()
                .HasOne(n => n.Request)
                .WithMany(r => r.Notes)
                .HasForeignKey(n => n.RequestId)
                .OnDelete(DeleteBehavior.Cascade);

            // Note -> Author (User) (1 do wielu)
            modelBuilder.Entity<Note>()
                .HasOne(n => n.Author)
                .WithMany()
                .HasForeignKey(n => n.AuthorId)
                .OnDelete(DeleteBehavior.Restrict);

            // Notification -> Recipient (User) (1 do wielu)
            modelBuilder.Entity<Notification>()
                .HasOne(n => n.Recipient)
                .WithMany()
                .HasForeignKey(n => n.RecipientId)
                .OnDelete(DeleteBehavior.Restrict);

            // Notification -> Sender (User) (1 do wielu)
            modelBuilder.Entity<Notification>()
                .HasOne(n => n.Sender)
                .WithMany()
                .HasForeignKey(n => n.SenderId)
                .OnDelete(DeleteBehavior.Restrict);

            // Notification -> Request (1 do wielu)
            modelBuilder.Entity<Notification>()
                .HasOne(n => n.Request)
                .WithMany()
                .HasForeignKey(n => n.RequestId)
                .OnDelete(DeleteBehavior.Cascade);

            // (opcjonalnie) indexy, constraints, maxLength, np:
            modelBuilder.Entity<User>()
                .HasIndex(u => u.Email)
                .IsUnique();

            // Role jako enum można dodać konwersję, jeśli chcesz
        }
    }
}
