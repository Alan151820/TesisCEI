import axios from 'axios'
import { cerrarSesion } from './auth'

const api = axios.create({
  baseURL: 'http://localhost:3000',
})

api.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      cerrarSesion()
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export default api
