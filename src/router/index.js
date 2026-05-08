import { createRouter, createWebHashHistory } from 'vue-router'

import DashboardView from '../components/DashboardView.vue'
import BudgetDashboard from '../components/BudgetDashboard.vue'
import JarDashboard from '../components/JarDashboard.vue'
import TransactionList from '../components/TransactionList.vue'
import UserProfile from '../components/UserProfile.vue'

const routes = [
  {
    path: '/',
    redirect: '/dashboard',
  },
  {
    path: '/dashboard',
    name: 'dashboard',
    component: DashboardView,
    meta: {
      title: 'Dashboard',
      subtitle: 'Tổng quan tài chính của bạn',
      icon: 'DataBoard',
      label: 'Dashboard',
    },
  },
  {
    path: '/budget',
    name: 'budget',
    component: BudgetDashboard,
    meta: {
      title: 'Ngân Sách',
      subtitle: 'Gợi ý phân bổ theo quy tắc',
      icon: 'PieChart',
      label: 'Ngân Sách',
    },
  },
  {
    path: '/jars',
    name: 'jars',
    component: JarDashboard,
    meta: {
      title: 'Hũ Chi Tiêu',
      subtitle: 'Quản lý ngân sách thông minh',
      icon: 'Wallet',
      label: 'Hũ Chi Tiêu',
    },
  },
  {
    path: '/transactions',
    name: 'transactions',
    component: TransactionList,
    meta: {
      title: 'Giao Dịch',
      subtitle: 'Quản lý thu chi chi tiết',
      icon: 'List',
      label: 'Giao Dịch',
    },
  },
  {
    path: '/profile',
    name: 'profile',
    component: UserProfile,
    meta: {
      title: 'Profile',
      subtitle: 'Quản lý tài khoản của bạn',
      icon: 'User',
      label: 'Cá Nhân',
    },
  },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
})

export default router
