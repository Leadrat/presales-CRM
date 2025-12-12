using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Api.Migrations
{
    /// <inheritdoc />
    public partial class UpdateAccountTypesToSixOptions : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Re-align AccountTypes lookup to the new fixed catalog:
            // Builder, Channel Partner, Contractor, Developer, Retailer, Others

            var builderId = new Guid("11111111-aaaa-4444-bbbb-000000000005");
            var channelPartnerId = new Guid("11111111-aaaa-4444-bbbb-000000000002");
            var developerId = new Guid("11111111-aaaa-4444-bbbb-000000000004");

            // New types
            var contractorId = new Guid("22222222-bbbb-5555-cccc-000000000001");
            var retailerId = new Guid("22222222-bbbb-5555-cccc-000000000002");
            var othersId = new Guid("22222222-bbbb-5555-cccc-000000000003");

            // First, update any accounts that reference account types we want to delete
            // to use the Channel Partner type instead (we'll pick one that already exists)
            migrationBuilder.Sql($@"
                UPDATE ""Accounts""
                SET ""AccountTypeId"" = '{channelPartnerId}'
                WHERE ""AccountTypeId"" IN (
                    SELECT ""Id"" FROM ""AccountTypes""
                    WHERE ""Name"" NOT IN ('Builder', 'Channel Partner', 'Contractor', 'Developer', 'Retailer', 'Others')
                );
            ");

            // Now we can safely remove account types that aren't in our new catalog
            migrationBuilder.Sql(@"
                DELETE FROM ""AccountTypes""
                WHERE ""Name"" NOT IN ('Builder', 'Channel Partner', 'Contractor', 'Developer', 'Retailer', 'Others');
            ");

            // Ensure required rows exist with stable IDs
            migrationBuilder.Sql($@"
                INSERT INTO ""AccountTypes"" (""Id"", ""Name"", ""DisplayOrder"")
                SELECT '{builderId}', 'Builder', 1
                WHERE NOT EXISTS (SELECT 1 FROM ""AccountTypes"" WHERE ""Id"" = '{builderId}');

                INSERT INTO ""AccountTypes"" (""Id"", ""Name"", ""DisplayOrder"")
                SELECT '{channelPartnerId}', 'Channel Partner', 2
                WHERE NOT EXISTS (SELECT 1 FROM ""AccountTypes"" WHERE ""Id"" = '{channelPartnerId}');

                INSERT INTO ""AccountTypes"" (""Id"", ""Name"", ""DisplayOrder"")
                SELECT '{contractorId}', 'Contractor', 3
                WHERE NOT EXISTS (SELECT 1 FROM ""AccountTypes"" WHERE ""Name"" = 'Contractor');

                INSERT INTO ""AccountTypes"" (""Id"", ""Name"", ""DisplayOrder"")
                SELECT '{developerId}', 'Developer', 4
                WHERE NOT EXISTS (SELECT 1 FROM ""AccountTypes"" WHERE ""Id"" = '{developerId}');

                INSERT INTO ""AccountTypes"" (""Id"", ""Name"", ""DisplayOrder"")
                SELECT '{retailerId}', 'Retailer', 5
                WHERE NOT EXISTS (SELECT 1 FROM ""AccountTypes"" WHERE ""Name"" = 'Retailer');

                INSERT INTO ""AccountTypes"" (""Id"", ""Name"", ""DisplayOrder"")
                SELECT '{othersId}', 'Others', 6
                WHERE NOT EXISTS (SELECT 1 FROM ""AccountTypes"" WHERE ""Name"" = 'Others');
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {

        }
    }
}
