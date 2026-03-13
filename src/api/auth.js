import { request } from '@/utils/request';

/**
 * 用户注册
 * @param {Object} data { username, password, nickname }
 */
export function register(data) {
  return request({
    url: '/api/auth/register',
    method: 'POST',
    data: data
  });
}

/**
 * 用户登录
 * @param {Object} data { username, password }
 */
export function login(data) {
  return request({
    url: '/api/auth/login',
    method: 'POST',
    data: data
  });
}

/**
 * 获取当前登录用户信息
 */
export function getUserInfo() {
  return request({
    url: '/api/user/info',
    method: 'GET'
  });
}
