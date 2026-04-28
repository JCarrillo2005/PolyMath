import axios from 'axios'

const API_URL = 'http://localhost:5000' // 👈 esto depende de tu backend

export const createJob = async (data: any) => {
  const response = await axios.post(`${API_URL}/jobs`, data)
  return response.data
}