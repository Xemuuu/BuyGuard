using System.Net.Mail;
using BuyGuard.Api.Models;
using Microsoft.EntityFrameworkCore;

using AttachmentModel = BuyGuard.Api.Models.Attachment;
using MailAttachment = System.Net.Mail.Attachment;

namespace BuyGuard.Api.Data
{
    public class BuyGuardDbContext : DbContext
    {
        public BuyGuardDbContext(DbContextOptions<BuyGuardDbContext> options) : base(options) { }

        public DbSet<User> Users { get; set; }
        public DbSet<Request> Requests { get; set; }
        public DbSet<AttachmentModel> Attachments { get; set; } 
        public DbSet<Note> Notes { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<Request>()
                .HasOne(r => r.Author)
                .WithMany(u => u.RequestsAuthored)
                .HasForeignKey(r => r.AuthorId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Request>()
                .HasOne(r => r.Manager)
                .WithMany(u => u.RequestsManaged)
                .HasForeignKey(r => r.ManagerId)
                .OnDelete(DeleteBehavior.SetNull);


            modelBuilder.ApplyConfigurationsFromAssembly(typeof(BuyGuardDbContext).Assembly);
        }

    }
}
