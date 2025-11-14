using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Microsoft.AspNetCore.Identity;
using Api.Models;

#nullable disable

namespace Api.Migrations
{
    /// <inheritdoc />
    public partial class A2_UsersAndRoles : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Ensure uuid-ossp extension is available for uuid_generate_v4()
            migrationBuilder.Sql("CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";");
            migrationBuilder.CreateTable(
                name: "ActivityLogs",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ActorUserId = table.Column<Guid>(type: "uuid", nullable: true),
                    EntityType = table.Column<string>(type: "text", nullable: false),
                    EntityId = table.Column<Guid>(type: "uuid", nullable: true),
                    ActivityTypeId = table.Column<Guid>(type: "uuid", nullable: false),
                    Message = table.Column<string>(type: "text", nullable: false),
                    CorrelationId = table.Column<Guid>(type: "uuid", nullable: true),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ActivityLogs", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "ActivityTypes",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "text", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ActivityTypes", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Roles",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "uuid_generate_v4()"),
                    Name = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Description = table.Column<string>(type: "text", nullable: true),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Roles", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Users",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "uuid_generate_v4()"),
                    Email = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    PasswordHash = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    FullName = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    Phone = table.Column<string>(type: "character varying(15)", maxLength: 15, nullable: true),
                    RoleId = table.Column<Guid>(type: "uuid", nullable: true),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false),
                    DeletedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Users", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Users_Roles_RoleId",
                        column: x => x.RoleId,
                        principalTable: "Roles",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "RefreshTokens",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    TokenHash = table.Column<string>(type: "text", nullable: false),
                    ExpiresAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    RevokedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RefreshTokens", x => x.Id);
                    table.ForeignKey(
                        name: "FK_RefreshTokens_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ActivityLogs_ActivityTypeId",
                table: "ActivityLogs",
                column: "ActivityTypeId");

            migrationBuilder.CreateIndex(
                name: "IX_ActivityLogs_CreatedAt",
                table: "ActivityLogs",
                column: "CreatedAt");

            migrationBuilder.CreateIndex(
                name: "IX_ActivityTypes_Name",
                table: "ActivityTypes",
                column: "Name",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_RefreshTokens_ExpiresAt",
                table: "RefreshTokens",
                column: "ExpiresAt");

            migrationBuilder.CreateIndex(
                name: "IX_RefreshTokens_UserId",
                table: "RefreshTokens",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_Roles_Name",
                table: "Roles",
                column: "Name",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Users_RoleId",
                table: "Users",
                column: "RoleId");

            // Partial unique index for case-insensitive email uniqueness among non-deleted users
            migrationBuilder.Sql(
                "CREATE UNIQUE INDEX IF NOT EXISTS \"IX_Users_Email_Lower_Active\" ON \"Users\" ((lower(\"Email\"))) WHERE \"IsDeleted\" = FALSE;");

            // Seed Roles with fixed GUIDs
            migrationBuilder.Sql("INSERT INTO \"Roles\" (\"Id\", \"Name\", \"Description\", \"CreatedAt\", \"UpdatedAt\") VALUES ('7d61b152-87f3-4a7e-9c35-7a83c43bfb21','Admin','System administrator', now(), now()) ON CONFLICT (\"Id\") DO NOTHING;");
            migrationBuilder.Sql("INSERT INTO \"Roles\" (\"Id\", \"Name\", \"Description\", \"CreatedAt\", \"UpdatedAt\") VALUES ('e452a2c7-2388-4a6e-bd38-5e7b03f34d9d','Basic','Default basic role', now(), now()) ON CONFLICT (\"Id\") DO NOTHING;");

            // Seed Users with Identity PasswordHasher-generated bcrypt hashes
            var hasher = new PasswordHasher<User>();
            var admin = new User { Id = Guid.Parse("11111111-1111-1111-1111-111111111111"), Email = "admin@leadrat.com" };
            var adminHash = hasher.HashPassword(admin, "Admin@123");
            var basic = new User { Id = Guid.Parse("22222222-2222-2222-2222-222222222222"), Email = "user@leadrat.com" };
            var basicHash = hasher.HashPassword(basic, "User@123");

            migrationBuilder.Sql($"INSERT INTO \"Users\" (\"Id\", \"FullName\", \"Email\", \"PasswordHash\", \"Phone\", \"RoleId\", \"IsActive\", \"CreatedAt\", \"UpdatedAt\", \"IsDeleted\") VALUES ('11111111-1111-1111-1111-111111111111','System Admin','admin@leadrat.com','{adminHash.Replace("'","''")}','+1-555-0101','7d61b152-87f3-4a7e-9c35-7a83c43bfb21', TRUE, now(), now(), FALSE) ON CONFLICT (\"Id\") DO NOTHING;");
            migrationBuilder.Sql($"INSERT INTO \"Users\" (\"Id\", \"FullName\", \"Email\", \"PasswordHash\", \"Phone\", \"RoleId\", \"IsActive\", \"CreatedAt\", \"UpdatedAt\", \"IsDeleted\") VALUES ('22222222-2222-2222-2222-222222222222','Basic User','user@leadrat.com','{basicHash.Replace("'","''")}','+1-555-0102','e452a2c7-2388-4a6e-bd38-5e7b03f34d9d', TRUE, now(), now(), FALSE) ON CONFLICT (\"Id\") DO NOTHING;");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ActivityLogs");

            migrationBuilder.DropTable(
                name: "ActivityTypes");

            migrationBuilder.DropTable(
                name: "RefreshTokens");

            migrationBuilder.DropTable(
                name: "Users");

            migrationBuilder.DropTable(
                name: "Roles");
        }
    }
}
