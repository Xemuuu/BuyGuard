using System.Linq;
using BuyGuard.Api.Models;
using BuyGuard.Api.Data;

namespace BuyGuard.Api.Seed
{
    public static class AttachmentSeeder
    {
        public static void Seed(BuyGuardDbContext context)
        {
            var attachments = new[]
            {
                new Attachment
                {
                    Id = 1,
                    RequestId = 1,
                    FileUrl = "https://example.com/invoice1.pdf",
                    MimeType = "application/pdf"
                }
            };

            foreach (var att in attachments)
            {
                if (!context.Attachments.Any(a => a.Id == att.Id))
                {
                    context.Attachments.Add(att);
                }
            }
            context.SaveChanges();
        }
    }
}
