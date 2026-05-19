using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace api_dotnet.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Jobs",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    JobId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    Metodo = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Estado = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ParametrosJson = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Resultado = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Converged = table.Column<bool>(type: "bit", nullable: true),
                    TiempoEjecucionMs = table.Column<int>(type: "int", nullable: true),
                    ErrorMensaje = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    CreadoEn = table.Column<DateTime>(type: "datetime2", nullable: false),
                    ActualizadoEn = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Jobs", x => x.Id);
                    table.UniqueConstraint("AK_Jobs_JobId", x => x.JobId);
                });

            migrationBuilder.CreateTable(
                name: "JobIterations",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    JobId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    Iteracion = table.Column<int>(type: "int", nullable: false),
                    Xi = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    VectorX = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Error = table.Column<decimal>(type: "decimal(18,15)", precision: 18, scale: 15, nullable: true),
                    ErroresIndividuales = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    DatosAdicionales = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_JobIterations", x => x.Id);
                    table.ForeignKey(
                        name: "FK_JobIterations_Jobs_JobId",
                        column: x => x.JobId,
                        principalTable: "Jobs",
                        principalColumn: "JobId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_JobIterations_JobId",
                table: "JobIterations",
                column: "JobId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "JobIterations");

            migrationBuilder.DropTable(
                name: "Jobs");
        }
    }
}
