using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Api.Migrations
{
    /// <inheritdoc />
    public partial class RefreshAccountTypes : Migration
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

            var legacyProspectId = new Guid("11111111-1111-1111-1111-111111111111");
            var legacyCustomerId = new Guid("22222222-2222-2222-2222-222222222222");
            var legacyPartnerId = new Guid("33333333-3333-3333-3333-333333333333");
            var legacyFormerCustomerId = new Guid("44444444-4444-4444-4444-444444444445");

            // Ensure we don't duplicate rows if any of the new IDs already exist
            migrationBuilder.Sql($@"
                DELETE FROM ""AccountTypes""
                WHERE ""Id"" IN ('{unassignedId}', '{channelPartnerId}', '{mandateId}', '{developerId}', '{builderId}', '{landAndPlotsId}')
            ");

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

            // Point any legacy account types to Unassigned so UI shows blank until reclassified
            migrationBuilder.Sql($@"
                UPDATE ""Accounts""
                SET ""AccountTypeId"" = '{unassignedId}'
                WHERE ""AccountTypeId"" NOT IN ('{unassignedId}', '{channelPartnerId}', '{mandateId}', '{developerId}', '{builderId}', '{landAndPlotsId}')
            ");

            // Remove legacy account types so lookups only return the new catalog
            migrationBuilder.Sql($@"
                DELETE FROM ""AccountTypes""
                WHERE ""Id"" IN ('{legacyProspectId}', '{legacyCustomerId}', '{legacyPartnerId}', '{legacyFormerCustomerId}')
                   OR ""Name"" NOT IN ('Unassigned', 'Channel Partner', 'Mandate', 'Developer', 'Builder', 'Land and Plots')
            ");
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

            var legacyProspectId = new Guid("11111111-1111-1111-1111-111111111111");
            var legacyCustomerId = new Guid("22222222-2222-2222-2222-222222222222");
            var legacyPartnerId = new Guid("33333333-3333-3333-3333-333333333333");
            var legacyFormerCustomerId = new Guid("44444444-4444-4444-4444-444444444445");

            migrationBuilder.InsertData(
                table: "AccountTypes",
                columns: new[] { "Id", "Name", "DisplayOrder" },
                values: new object[,]
                {
                    { legacyProspectId, "Prospect", 1 },
                    { legacyCustomerId, "Customer", 2 },
                    { legacyPartnerId, "Partner", 3 },
                    { legacyFormerCustomerId, "FormerCustomer", 4 }
                });

            migrationBuilder.Sql($@"
                UPDATE ""Accounts""
                SET ""AccountTypeId"" = '{legacyProspectId}'
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
