using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Api.Migrations
{
    /// <inheritdoc />
    public partial class AddAccountsAndLookups : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "AccountSizes",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "text", nullable: false),
                    MinUsers = table.Column<int>(type: "integer", nullable: true),
                    MaxUsers = table.Column<int>(type: "integer", nullable: true),
                    DisplayOrder = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AccountSizes", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "AccountTypes",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "text", nullable: false),
                    DisplayOrder = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AccountTypes", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "CrmProviders",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "text", nullable: false),
                    Website = table.Column<string>(type: "text", nullable: true),
                    DisplayOrder = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CrmProviders", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Accounts",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    CompanyName = table.Column<string>(type: "text", nullable: false),
                    Website = table.Column<string>(type: "text", nullable: true),
                    AccountTypeId = table.Column<Guid>(type: "uuid", nullable: false),
                    AccountSizeId = table.Column<Guid>(type: "uuid", nullable: false),
                    CurrentCrmId = table.Column<Guid>(type: "uuid", nullable: false),
                    NumberOfUsers = table.Column<int>(type: "integer", nullable: true),
                    CrmExpiry = table.Column<string>(type: "text", nullable: false),
                    CreatedByUserId = table.Column<Guid>(type: "uuid", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Accounts", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Accounts_AccountSizes_AccountSizeId",
                        column: x => x.AccountSizeId,
                        principalTable: "AccountSizes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Accounts_AccountTypes_AccountTypeId",
                        column: x => x.AccountTypeId,
                        principalTable: "AccountTypes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Accounts_CrmProviders_CurrentCrmId",
                        column: x => x.CurrentCrmId,
                        principalTable: "CrmProviders",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Accounts_Users_CreatedByUserId",
                        column: x => x.CreatedByUserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Accounts_AccountSizeId",
                table: "Accounts",
                column: "AccountSizeId");

            migrationBuilder.CreateIndex(
                name: "IX_Accounts_AccountTypeId",
                table: "Accounts",
                column: "AccountTypeId");

            migrationBuilder.CreateIndex(
                name: "IX_Accounts_CreatedByUserId",
                table: "Accounts",
                column: "CreatedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_Accounts_CurrentCrmId",
                table: "Accounts",
                column: "CurrentCrmId");

            // Seed lookup data for Spec 8 — Accounts Table
            migrationBuilder.InsertData(
                table: "AccountTypes",
                columns: new[] { "Id", "Name", "DisplayOrder" },
                values: new object[,]
                {
                    { new Guid("11111111-1111-1111-1111-111111111111"), "Prospect", 1 },
                    { new Guid("22222222-2222-2222-2222-222222222222"), "Customer", 2 },
                    { new Guid("33333333-3333-3333-3333-333333333333"), "Partner", 3 }
                });

            migrationBuilder.InsertData(
                table: "AccountSizes",
                columns: new[] { "Id", "Name", "MinUsers", "MaxUsers", "DisplayOrder" },
                values: new object[,]
                {
                    { new Guid("44444444-4444-4444-4444-444444444444"), "Small", null, null, 1 },
                    { new Guid("55555555-5555-5555-5555-555555555555"), "Mid-market", null, null, 2 },
                    { new Guid("66666666-6666-6666-6666-666666666666"), "Enterprise", null, null, 3 }
                });

            migrationBuilder.InsertData(
                table: "CrmProviders",
                columns: new[] { "Id", "Name", "Website", "DisplayOrder" },
                values: new object[,]
                {
                    { new Guid("77777777-7777-7777-7777-777777777777"), "Salesforce", null, 1 },
                    { new Guid("88888888-8888-8888-8888-888888888888"), "HubSpot", null, 2 },
                    { new Guid("99999999-9999-9999-9999-999999999999"), "Zoho", null, 3 },
                    { new Guid("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"), "None", null, 4 }
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Remove seeded lookup data before dropping tables
            migrationBuilder.DeleteData(
                table: "CrmProviders",
                keyColumn: "Id",
                keyValues: new object[]
                {
                    new Guid("77777777-7777-7777-7777-777777777777"),
                    new Guid("88888888-8888-8888-8888-888888888888"),
                    new Guid("99999999-9999-9999-9999-999999999999"),
                    new Guid("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa")
                });

            migrationBuilder.DeleteData(
                table: "AccountSizes",
                keyColumn: "Id",
                keyValues: new object[]
                {
                    new Guid("44444444-4444-4444-4444-444444444444"),
                    new Guid("55555555-5555-5555-5555-555555555555"),
                    new Guid("66666666-6666-6666-6666-666666666666")
                });

            migrationBuilder.DeleteData(
                table: "AccountTypes",
                keyColumn: "Id",
                keyValues: new object[]
                {
                    new Guid("11111111-1111-1111-1111-111111111111"),
                    new Guid("22222222-2222-2222-2222-222222222222"),
                    new Guid("33333333-3333-3333-3333-333333333333")
                });

            migrationBuilder.DropTable(
                name: "Accounts");

            migrationBuilder.DropTable(
                name: "AccountSizes");

            migrationBuilder.DropTable(
                name: "AccountTypes");

            migrationBuilder.DropTable(
                name: "CrmProviders");
        }
    }
}
