using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Api.Migrations
{
    /// <inheritdoc />
    public partial class AddDemoStatusField : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Status",
                table: "Demos",
                type: "text",
                nullable: false,
                defaultValue: "Scheduled");

            // Update existing demos: set status based on DoneAt
            migrationBuilder.Sql(@"
                UPDATE ""Demos"" 
                SET ""Status"" = CASE 
                    WHEN ""DoneAt"" IS NOT NULL THEN 'Completed'
                    ELSE 'Scheduled'
                END
                WHERE ""Status"" = '' OR ""Status"" IS NULL;
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Status",
                table: "Demos");
        }
    }
}
