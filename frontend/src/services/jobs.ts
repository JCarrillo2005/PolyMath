import axios from "axios";

const API_URL = "http://localhost:5000/api";

// CREAR JOB
export const createJob = async (
  metodo: string,
  parametros: any
) => {
  const response = await axios.post(
    `${API_URL}/Jobs`,
    {
      metodo,
      parametros,
    }
  );

  return response.data;
};

// OBTENER JOB
export const getJob = async (jobId: string) => {
  const response = await axios.get(
    `${API_URL}/Jobs/${jobId}`
  );

  return response.data;
};

// OBTENER ITERACIONES
export const getIterations = async (
  jobId: string
) => {
  const response = await axios.get(
    `${API_URL}/Jobs/${jobId}/iterations`
  );

  return response.data;
};

// OBTENER TODOS LOS JOBS
export const getAllJobs = async () => {
  const response = await axios.get(
    `${API_URL}/Jobs`
  );

  return response.data;
};