using BuyGuard.Api.Data;

namespace BuyGuard.Api.Seed
{
    public static class DatabaseSeeder
    {
        public static void SeedAll(BuyGuardDbContext context)
        {
            UserSeeder.Seed(context);
            RequestSeeder.Seed(context);
            AttachmentSeeder.Seed(context);
            NoteSeeder.Seed(context);
        }
    }
}
