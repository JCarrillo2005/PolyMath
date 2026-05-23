using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace api_dotnet.Migrations
{
    /// <inheritdoc />
    public partial class AddComparisonConfiguration : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ComparisonId",
                table: "Jobs",
                type: "nvarchar(50)",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "Comparisons",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ComparisonId = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    Funcion = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    X0 = table.Column<double>(type: "float", nullable: true),
                    X1 = table.Column<double>(type: "float", nullable: true),
                    X2 = table.Column<double>(type: "float", nullable: true),
                    Tolerancia = table.Column<double>(type: "float(18)", precision: 18, scale: 15, nullable: false),
                    MaxIteraciones = table.Column<int>(type: "int", nullable: false),
                    MetodosUsados = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    CreadoEn = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Comparisons", x => x.Id);
                    table.UniqueConstraint("AK_Comparisons_ComparisonId", x => x.ComparisonId);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Jobs_ComparisonId",
                table: "Jobs",
                column: "ComparisonId");

            migrationBuilder.CreateIndex(
                name: "IX_Comparisons_ComparisonId",
                table: "Comparisons",
                column: "ComparisonId",
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_Jobs_Comparisons_ComparisonId",
                table: "Jobs",
                column: "ComparisonId",
                principalTable: "Comparisons",
                principalColumn: "ComparisonId",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Jobs_Comparisons_ComparisonId",
                table: "Jobs");

            migrationBuilder.DropTable(
                name: "Comparisons");

            migrationBuilder.DropIndex(
                name: "IX_Jobs_ComparisonId",
                table: "Jobs");

            migrationBuilder.DropColumn(
                name: "ComparisonId",
                table: "Jobs");
        }
    }
}
