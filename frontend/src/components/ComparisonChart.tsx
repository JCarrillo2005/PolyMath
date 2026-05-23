import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

export interface IterationData {
  iteracion: number;
  newton: number | null;
  secante: number | null;
  muller: number | null;
}

interface ComparisonChartProps {
  data: IterationData[];
}

const COLORS = {
  newton: "#3b82f6",
  secante: "#10b981",
  muller: "#f59e0b",
};

export function ComparisonChart({ data }: ComparisonChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="h-96 flex items-center justify-center bg-gray-50 rounded-xl border border-gray-200">
        <p className="text-gray-500">Esperando datos de convergencia...</p>
      </div>
    );
  }

  // Verificar si hay al menos un dato válido para graficar
  const hasValidData = data.some(
    (point) =>
      (point.newton !== null && isFinite(point.newton)) ||
      (point.secante !== null && isFinite(point.secante)) ||
      (point.muller !== null && isFinite(point.muller)),
  );

  if (!hasValidData) {
    return (
      <div className="h-96 flex items-center justify-center bg-gray-50 rounded-xl border border-gray-200">
        <p className="text-gray-500">
          No hay datos de convergencia para mostrar
        </p>
      </div>
    );
  }

  // Preparar datos para la gráfica (solo valores positivos para escala logarítmica)
  const chartData = data.map((point) => ({
    iteracion: point.iteracion,
    newton:
      point.newton !== null && point.newton > 0 && isFinite(point.newton)
        ? point.newton
        : null,
    secante:
      point.secante !== null && point.secante > 0 && isFinite(point.secante)
        ? point.secante
        : null,
    muller:
      point.muller !== null && point.muller > 0 && isFinite(point.muller)
        ? point.muller
        : null,
  }));

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <h3 className="font-semibold text-gray-700 mb-4">
        Comparación de convergencia (Error vs Iteraciones)
      </h3>
      <ResponsiveContainer width="100%" height={400}>
        <LineChart
          data={chartData}
          margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="iteracion"
            label={{ value: "Iteración", position: "bottom", offset: 0 }}
            tick={{ fontSize: 12 }}
            type="number"
            domain={["dataMin", "dataMax"]}
          />
          <YAxis
            label={{ value: "Error", angle: -90, position: "insideLeft" }}
            tick={{ fontSize: 12 }}
            scale="log"
            domain={["auto", "auto"]}
            tickFormatter={(value) => {
              if (
                value === null ||
                value === undefined ||
                !isFinite(value) ||
                value <= 0
              )
                return "N/A";
              return Number(value).toExponential(2);
            }}
          />
          <Tooltip
            formatter={(value: number, name: string) => {
              if (value === null || value === undefined || !isFinite(value))
                return ["N/A", name];
              return [value.toExponential(6), name];
            }}
            labelFormatter={(label) => `Iteración ${label}`}
          />
          <Legend verticalAlign="top" height={36} />
          <Line
            type="monotone"
            dataKey="newton"
            stroke={COLORS.newton}
            name="Newton-Raphson"
            strokeWidth={2}
            dot={{ r: 4 }}
            connectNulls={false}
          />
          <Line
            type="monotone"
            dataKey="secante"
            stroke={COLORS.secante}
            name="Secante"
            strokeWidth={2}
            dot={{ r: 4 }}
            connectNulls={false}
          />
          <Line
            type="monotone"
            dataKey="muller"
            stroke={COLORS.muller}
            name="Müller"
            strokeWidth={2}
            dot={{ r: 4 }}
            connectNulls={false}
          />
        </LineChart>
      </ResponsiveContainer>
      <p className="text-xs text-gray-400 text-center mt-4">
        Escala logarítmica en eje Y para mejor visualización
      </p>
    </div>
  );
}

export default ComparisonChart;
