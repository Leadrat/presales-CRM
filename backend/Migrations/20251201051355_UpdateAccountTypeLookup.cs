using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Api.Migrations
{
    /// <inheritdoc />
    public partial class UpdateAccountTypeLookup : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            var unassignedId = new Guid("11111111-aaaa-4444-bbbb-000000000001");
            var channelPartnerId = new Guid("11111111-aaaa-4444-bbbb-000000000002");
            var mandateId = new Guid("11111111-aaaa-4444-bbbb-000000000003");
            var developerId = new Guid("11111111-aaaa-4444-bbbb-000000000004");
            var builderId = new Guid("11111111-aaaa-4444-bbbb-000000000005");
            var landAndPlotsId = new Guid("11111111-aaaa-4444-bbbb-000000000006");

            var prospectId = new Guid("11111111-1111-1111-1111-111111111111");
            var customerId = new Guid("22222222-2222-2222-2222-222222222222");
            var partnerId = new Guid("33333333-3333-3333-3333-333333333333");

            migrationBuilder.InsertData(
                table: "AccountTypes",
                columns: new[] { "Id", "Name", "DisplayOrder" },
                values: new object[,]
                {
                    { unassignedId, "Unassigned", 0 },
                    { channelPartnerId, "Channel Partner", 1 },
                    { mandateId, "Mandate", 2 },
                    { developerId, "Developer", 3 },
                    { builderId, "Builder", 4 },
                    { landAndPlotsId, "Land and Plots", 5 }
                });

            migrationBuilder.Sql($@"
                UPDATE ""Accounts""
                SET ""AccountTypeId"" = '{unassignedId}'
                WHERE ""AccountTypeId"" IN ('{prospectId}', '{customerId}', '{partnerId}')
            ");

            migrationBuilder.DeleteData(
                table: "AccountTypes",
                keyColumn: "Id",
                keyValue: prospectId);

            migrationBuilder.DeleteData(
                table: "AccountTypes",
                keyColumn: "Id",
                keyValue: customerId);

            migrationBuilder.DeleteData(
                table: "AccountTypes",
                keyColumn: "Id",
                keyValue: partnerId);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            var unassignedId = new Guid("11111111-aaaa-4444-bbbb-000000000001");
            var channelPartnerId = new Guid("11111111-aaaa-4444-bbbb-000000000002");
            var mandateId = new Guid("11111111-aaaa-4444-bbbb-000000000003");
            var developerId = new Guid("11111111-aaaa-4444-bbbb-000000000004");
            var builderId = new Guid("11111111-aaaa-4444-bbbb-000000000005");
            var landAndPlotsId = new Guid("11111111-aaaa-4444-bbbb-000000000006");

            var prospectId = new Guid("11111111-1111-1111-1111-111111111111");
            var customerId = new Guid("22222222-2222-2222-2222-222222222222");
            var partnerId = new Guid("33333333-3333-3333-3333-333333333333");

            migrationBuilder.InsertData(
                table: "AccountTypes",
                columns: new[] { "Id", "Name", "DisplayOrder" },
                values: new object[,]
                {
                    { prospectId, "Prospect", 1 },
                    { customerId, "Customer", 2 },
                    { partnerId, "Partner", 3 }
                });

            migrationBuilder.Sql($@"
                UPDATE ""Accounts""
                SET ""AccountTypeId"" = '{prospectId}'
                WHERE ""AccountTypeId"" IN ('{unassignedId}', '{channelPartnerId}', '{mandateId}', '{developerId}', '{builderId}', '{landAndPlotsId}')
            ");

            migrationBuilder.DeleteData(
                table: "AccountTypes",
                keyColumn: "Id",
                keyValues: new object[]
                {
                    unassignedId,
                    channelPartnerId,
                    mandateId,
                    developerId,
                    builderId,
                    landAndPlotsId
                });
        }
    }
}
