import axios from "axios";

// Usar variable de entorno o fallback a localhost
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
const API_URL = `${API_BASE_URL}/api`;

// CREAR JOB
export const createJob = async (metodo: string, parametros: any) => {
  const response = await axios.post(`${API_URL}/Jobs`, {
    metodo,
    parametros,
  });
  return response.data;
};

// OBTENER JOB
export const getJob = async (jobId: string) => {
  const response = await axios.get(`${API_URL}/Jobs/${jobId}`);
  return response.data;
};

// OBTENER ITERACIONES
export const getIterations = async (jobId: string) => {
  const response = await axios.get(`${API_URL}/Jobs/${jobId}/iterations`);
  return response.data;
};

// OBTENER TODOS LOS JOBS
export const getAllJobs = async () => {
  const response = await axios.get(`${API_URL}/Jobs`);
  return response.data;
};
