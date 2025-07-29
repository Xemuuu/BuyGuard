using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BuyGuard.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddIsSubmittedToRequest : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsSubmitted",
                table: "Requests",
                type: "boolean",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IsSubmitted",
                table: "Requests");
        }
    }
}
