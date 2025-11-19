using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Api.Migrations
{
    /// <inheritdoc />
    public partial class AddContactsOpportunitiesActivities : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Website",
                table: "CrmProviders");

            migrationBuilder.DropColumn(
                name: "MaxUsers",
                table: "AccountSizes");

            migrationBuilder.DropColumn(
                name: "MinUsers",
                table: "AccountSizes");

            migrationBuilder.DropColumn(
                name: "NumberOfUsers",
                table: "Accounts");

            migrationBuilder.DropColumn(
                name: "Website",
                table: "Accounts");

            // Explicitly cast CrmExpiry from text to timestamp with time zone to satisfy PostgreSQL
            migrationBuilder.Sql(
                "ALTER TABLE \"Accounts\" ALTER COLUMN \"CrmExpiry\" TYPE timestamp with time zone USING \"CrmExpiry\"::timestamp with time zone;");

            migrationBuilder.CreateTable(
                name: "ActivityStatuses",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "text", nullable: false),
                    DisplayOrder = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ActivityStatuses", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Contacts",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    AccountId = table.Column<Guid>(type: "uuid", nullable: false),
                    CreatedByUserId = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "text", nullable: false),
                    Email = table.Column<string>(type: "text", nullable: true),
                    Phone = table.Column<string>(type: "text", nullable: true),
                    Position = table.Column<string>(type: "text", nullable: true),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Contacts", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Contacts_Accounts_AccountId",
                        column: x => x.AccountId,
                        principalTable: "Accounts",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Contacts_Users_CreatedByUserId",
                        column: x => x.CreatedByUserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "OpportunityStages",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "text", nullable: false),
                    DisplayOrder = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_OpportunityStages", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Activities",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    AccountId = table.Column<Guid>(type: "uuid", nullable: false),
                    CreatedByUserId = table.Column<Guid>(type: "uuid", nullable: false),
                    Description = table.Column<string>(type: "text", nullable: false),
                    ActivityTypeId = table.Column<Guid>(type: "uuid", nullable: false),
                    DueDate = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    StatusId = table.Column<Guid>(type: "uuid", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Activities", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Activities_Accounts_AccountId",
                        column: x => x.AccountId,
                        principalTable: "Accounts",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Activities_ActivityStatuses_StatusId",
                        column: x => x.StatusId,
                        principalTable: "ActivityStatuses",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Activities_ActivityTypes_ActivityTypeId",
                        column: x => x.ActivityTypeId,
                        principalTable: "ActivityTypes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Activities_Users_CreatedByUserId",
                        column: x => x.CreatedByUserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "Opportunities",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    AccountId = table.Column<Guid>(type: "uuid", nullable: false),
                    CreatedByUserId = table.Column<Guid>(type: "uuid", nullable: false),
                    Title = table.Column<string>(type: "text", nullable: false),
                    Amount = table.Column<decimal>(type: "numeric", nullable: false),
                    StageId = table.Column<Guid>(type: "uuid", nullable: false),
                    CloseDate = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Opportunities", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Opportunities_Accounts_AccountId",
                        column: x => x.AccountId,
                        principalTable: "Accounts",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Opportunities_OpportunityStages_StageId",
                        column: x => x.StageId,
                        principalTable: "OpportunityStages",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Opportunities_Users_CreatedByUserId",
                        column: x => x.CreatedByUserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Activities_AccountId",
                table: "Activities",
                column: "AccountId");

            migrationBuilder.CreateIndex(
                name: "IX_Activities_ActivityTypeId",
                table: "Activities",
                column: "ActivityTypeId");

            migrationBuilder.CreateIndex(
                name: "IX_Activities_CreatedByUserId",
                table: "Activities",
                column: "CreatedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_Activities_StatusId",
                table: "Activities",
                column: "StatusId");

            migrationBuilder.CreateIndex(
                name: "IX_ActivityStatuses_Name",
                table: "ActivityStatuses",
                column: "Name",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Contacts_AccountId",
                table: "Contacts",
                column: "AccountId");

            migrationBuilder.CreateIndex(
                name: "IX_Contacts_CreatedByUserId",
                table: "Contacts",
                column: "CreatedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_Opportunities_AccountId",
                table: "Opportunities",
                column: "AccountId");

            migrationBuilder.CreateIndex(
                name: "IX_Opportunities_CreatedByUserId",
                table: "Opportunities",
                column: "CreatedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_Opportunities_StageId",
                table: "Opportunities",
                column: "StageId");

            // Seed deterministic lookup data for opportunity stages
            migrationBuilder.InsertData(
                table: "OpportunityStages",
                columns: new[] { "Id", "Name", "DisplayOrder" },
                values: new object[,]
                {
                    { new Guid("11111111-aaaa-4bbb-cccc-111111111111"), "Prospecting", 1 },
                    { new Guid("22222222-aaaa-4bbb-cccc-222222222222"), "Qualification", 2 },
                    { new Guid("33333333-aaaa-4bbb-cccc-333333333333"), "Proposal", 3 },
                    { new Guid("44444444-aaaa-4bbb-cccc-444444444444"), "Negotiation", 4 },
                    { new Guid("55555555-aaaa-4bbb-cccc-555555555555"), "Won", 5 }
                });

            // Seed deterministic lookup data for activity statuses
            migrationBuilder.InsertData(
                table: "ActivityStatuses",
                columns: new[] { "Id", "Name", "DisplayOrder" },
                values: new object[,]
                {
                    { new Guid("11111111-bbbb-4ccc-dddd-111111111111"), "Planned", 1 },
                    { new Guid("22222222-bbbb-4ccc-dddd-222222222222"), "In Progress", 2 },
                    { new Guid("33333333-bbbb-4ccc-dddd-333333333333"), "Completed", 3 },
                    { new Guid("44444444-bbbb-4ccc-dddd-444444444444"), "Cancelled", 4 }
                });

            // Seed deterministic lookup data for activity types (aligned with existing ActivityTypes table)
            migrationBuilder.InsertData(
                table: "ActivityTypes",
                columns: new[] { "Id", "Name", "CreatedAt", "UpdatedAt" },
                values: new object[,]
                {
                    { new Guid("11111111-cccc-4ddd-eeee-111111111111"), "Call", DateTimeOffset.UtcNow, DateTimeOffset.UtcNow },
                    { new Guid("22222222-cccc-4ddd-eeee-222222222222"), "Email", DateTimeOffset.UtcNow, DateTimeOffset.UtcNow },
                    { new Guid("33333333-cccc-4ddd-eeee-333333333333"), "Meeting", DateTimeOffset.UtcNow, DateTimeOffset.UtcNow },
                    { new Guid("44444444-cccc-4ddd-eeee-444444444444"), "Demo", DateTimeOffset.UtcNow, DateTimeOffset.UtcNow }
                });

            migrationBuilder.CreateIndex(
                name: "IX_OpportunityStages_Name",
                table: "OpportunityStages",
                column: "Name",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Remove seeded lookup data first to avoid FK issues
            migrationBuilder.DeleteData(
                table: "ActivityTypes",
                keyColumn: "Id",
                keyValues: new object[]
                {
                    new Guid("11111111-cccc-4ddd-eeee-111111111111"),
                    new Guid("22222222-cccc-4ddd-eeee-222222222222"),
                    new Guid("33333333-cccc-4ddd-eeee-333333333333"),
                    new Guid("44444444-cccc-4ddd-eeee-444444444444")
                });

            migrationBuilder.DeleteData(
                table: "ActivityStatuses",
                keyColumn: "Id",
                keyValues: new object[]
                {
                    new Guid("11111111-bbbb-4ccc-dddd-111111111111"),
                    new Guid("22222222-bbbb-4ccc-dddd-222222222222"),
                    new Guid("33333333-bbbb-4ccc-dddd-333333333333"),
                    new Guid("44444444-bbbb-4ccc-dddd-444444444444")
                });

            migrationBuilder.DeleteData(
                table: "OpportunityStages",
                keyColumn: "Id",
                keyValues: new object[]
                {
                    new Guid("11111111-aaaa-4bbb-cccc-111111111111"),
                    new Guid("22222222-aaaa-4bbb-cccc-222222222222"),
                    new Guid("33333333-aaaa-4bbb-cccc-333333333333"),
                    new Guid("44444444-aaaa-4bbb-cccc-444444444444"),
                    new Guid("55555555-aaaa-4bbb-cccc-555555555555")
                });

            migrationBuilder.DropTable(
                name: "Activities");

            migrationBuilder.DropTable(
                name: "Contacts");

            migrationBuilder.DropTable(
                name: "Opportunities");

            migrationBuilder.DropTable(
                name: "ActivityStatuses");

            migrationBuilder.DropTable(
                name: "OpportunityStages");

            migrationBuilder.AddColumn<string>(
                name: "Website",
                table: "CrmProviders",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "MaxUsers",
                table: "AccountSizes",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "MinUsers",
                table: "AccountSizes",
                type: "integer",
                nullable: true);

            // Revert CrmExpiry back to text explicitly when rolling back
            migrationBuilder.Sql(
                "ALTER TABLE \"Accounts\" ALTER COLUMN \"CrmExpiry\" TYPE text USING \"CrmExpiry\"::text;");

            migrationBuilder.AddColumn<int>(
                name: "NumberOfUsers",
                table: "Accounts",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Website",
                table: "Accounts",
                type: "text",
                nullable: true);
        }
    }
}
