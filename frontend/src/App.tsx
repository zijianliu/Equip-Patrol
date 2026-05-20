import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { ConfigProvider, Spin } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import { AuthProvider, useAuth } from './context/AuthContext';
import MainLayout from './layouts/MainLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import DeviceList from './pages/devices/DeviceList';
import DeviceForm from './pages/devices/DeviceForm';
import DeviceDetail from './pages/devices/DeviceDetail';
import InspectionPlanList from './pages/inspectionPlans/InspectionPlanList';
import PlanForm from './pages/inspectionPlans/PlanForm';
import InspectionTaskList from './pages/inspectionTasks/InspectionTaskList';
import InspectionTaskDetail from './pages/inspectionTasks/InspectionTaskDetail';
import SubmitTask from './pages/inspectionTasks/SubmitTask';
import WorkOrderList from './pages/workOrders/WorkOrderList';
import WorkOrderDetail from './pages/workOrders/WorkOrderDetail';
import { Role } from './types';

interface ProtectedRouteProps {
  roles?: Role[];
  children?: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ roles = [], children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (roles.length > 0 && !roles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <>{children || <Outlet />}</>;
};

const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      
      <Route path="/" element={
        <ProtectedRoute>
          <MainLayout />
        </ProtectedRoute>
      }>
        <Route index element={<Dashboard />} />
        
        <Route path="devices" element={
          <ProtectedRoute roles={[Role.ADMIN]}>
            <DeviceList />
          </ProtectedRoute>
        } />
        <Route path="devices/new" element={
          <ProtectedRoute roles={[Role.ADMIN]}>
            <DeviceForm mode="create" />
          </ProtectedRoute>
        } />
        <Route path="devices/:id" element={
          <ProtectedRoute roles={[Role.ADMIN]}>
            <DeviceDetail />
          </ProtectedRoute>
        } />
        <Route path="devices/:id/edit" element={
          <ProtectedRoute roles={[Role.ADMIN]}>
            <DeviceForm mode="edit" />
          </ProtectedRoute>
        } />
        
        <Route path="inspection-plans" element={
          <ProtectedRoute roles={[Role.ADMIN]}>
            <InspectionPlanList />
          </ProtectedRoute>
        } />
        <Route path="inspection-plans/new" element={
          <ProtectedRoute roles={[Role.ADMIN]}>
            <PlanForm mode="create" />
          </ProtectedRoute>
        } />
        <Route path="inspection-plans/:id" element={
          <ProtectedRoute roles={[Role.ADMIN]}>
            <PlanForm mode="edit" />
          </ProtectedRoute>
        } />
        
        <Route path="inspection-tasks" element={
          <ProtectedRoute roles={[Role.ADMIN, Role.INSPECTOR]}>
            <InspectionTaskList />
          </ProtectedRoute>
        } />
        <Route path="inspection-tasks/:id" element={
          <ProtectedRoute roles={[Role.ADMIN, Role.INSPECTOR]}>
            <InspectionTaskDetail />
          </ProtectedRoute>
        } />
        <Route path="inspection-tasks/:id/submit" element={
          <ProtectedRoute roles={[Role.ADMIN, Role.INSPECTOR]}>
            <SubmitTask />
          </ProtectedRoute>
        } />
        
        <Route path="work-orders" element={
          <ProtectedRoute roles={[Role.ADMIN, Role.MAINTENANCE]}>
            <WorkOrderList />
          </ProtectedRoute>
        } />
        <Route path="work-orders/:id" element={
          <ProtectedRoute roles={[Role.ADMIN, Role.MAINTENANCE]}>
            <WorkOrderDetail />
          </ProtectedRoute>
        } />
      </Route>
      
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

const App: React.FC = () => {
  return (
    <ConfigProvider locale={zhCN}>
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </ConfigProvider>
  );
};

export default App;
