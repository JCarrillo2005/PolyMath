using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace api_dotnet.Migrations
{
    /// <inheritdoc />
    public partial class LocalDB : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "ResultadoJson",
                table: "Jobs",
                newName: "Resultado");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "Resultado",
                table: "Jobs",
                newName: "ResultadoJson");
        }
    }
}
