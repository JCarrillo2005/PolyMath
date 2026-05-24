import { getMatrixComparisonHistory } from "./matrixComparison";

export interface MatrixHistoryItem {
  comparisonId: string;
  matrizOriginal: string;
  creadoEn: string;
  jobs: {
    jobId: string;
    metodo: string;
    estado: string;
    converged: boolean;
    resultado: string | null;
    tiempoEjecucionMs: number | null;
  }[];
}

export async function getMatrixHistory(): Promise<MatrixHistoryItem[]> {
  return getMatrixComparisonHistory();
}
