import axios from 'axios';
import { message } from 'antd';

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    if (response.data && !response.data.success) {
      message.error(response.data.message || '请求失败');
    }
    return response.data;
  },
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
      return;
    }
    if (error.response?.status === 403) {
      message.error('权限不足，请联系管理员');
      return Promise.reject(error);
    }
    if (error.response?.data?.message) {
      message.error(error.response.data.message);
    } else if (error.response?.data?.errors && error.response.data.errors.length > 0) {
      const firstError = error.response.data.errors[0];
      message.error(firstError.msg || firstError.message || '请求参数错误');
    } else if (error.code === 'ECONNABORTED') {
      message.error('请求超时，请稍后重试');
    } else {
      message.error(error.message || '网络错误，请稍后重试');
    }
    return Promise.reject(error);
  }
);

export default api;
