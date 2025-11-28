using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Api.Migrations
{
    /// <inheritdoc />
    public partial class AddAssignedToUserToAccount : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "AssignedToUserId",
                table: "Accounts",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Accounts_AssignedToUserId",
                table: "Accounts",
                column: "AssignedToUserId");

            migrationBuilder.AddForeignKey(
                name: "FK_Accounts_Users_AssignedToUserId",
                table: "Accounts",
                column: "AssignedToUserId",
                principalTable: "Users",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Accounts_Users_AssignedToUserId",
                table: "Accounts");

            migrationBuilder.DropIndex(
                name: "IX_Accounts_AssignedToUserId",
                table: "Accounts");

            migrationBuilder.DropColumn(
                name: "AssignedToUserId",
                table: "Accounts");
        }
    }
}
