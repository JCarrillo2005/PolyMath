using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace api_dotnet.Migrations
{
    /// <inheritdoc />
    public partial class FixDecimalPrecisionAndRelations : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<decimal>(
                name: "Error",
                table: "JobIterations",
                type: "decimal(18,15)",
                precision: 18,
                scale: 15,
                nullable: true,
                oldClrType: typeof(decimal),
                oldType: "decimal(18,2)",
                oldNullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<decimal>(
                name: "Error",
                table: "JobIterations",
                type: "decimal(18,2)",
                nullable: true,
                oldClrType: typeof(decimal),
                oldType: "decimal(18,15)",
                oldPrecision: 18,
                oldScale: 15,
                oldNullable: true);
        }
    }
}
