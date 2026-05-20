import React, { ReactNode } from 'react';
import { Layout, Menu, Avatar, Dropdown, Button } from 'antd';
import {
  DashboardOutlined,
  SettingOutlined,
  UnorderedListOutlined,
  FileTextOutlined,
  ToolOutlined,
  LogoutOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation, Link, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Role } from '../types';

const { Header, Sider, Content } = Layout;

interface MenuItem {
  key: string;
  label: string;
  icon: ReactNode;
  path: string;
  roles: Role[];
}

const menuItems: MenuItem[] = [
  {
    key: 'dashboard',
    label: '首页',
    icon: <DashboardOutlined />,
    path: '/',
    roles: [Role.ADMIN, Role.INSPECTOR, Role.MAINTENANCE, Role.USER],
  },
  {
    key: 'devices',
    label: '设备管理',
    icon: <SettingOutlined />,
    path: '/devices',
    roles: [Role.ADMIN],
  },
  {
      key: 'inspection-plans',
      label: '巡检计划',
      icon: <UnorderedListOutlined />,
      path: '/inspection-plans',
      roles: [Role.ADMIN],
    },
  {
    key: 'inspection-tasks',
    label: '巡检任务',
    icon: <FileTextOutlined />,
    path: '/inspection-tasks',
    roles: [Role.ADMIN, Role.INSPECTOR],
  },
  {
    key: 'work-orders',
    label: '维修工单',
    icon: <ToolOutlined />,
    path: '/work-orders',
    roles: [Role.ADMIN, Role.MAINTENANCE],
  },
];

const MainLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const filteredMenuItems = menuItems.filter(
    (item) => user && item.roles.includes(user.role)
  );

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const userMenu = {
    items: [
      {
        key: 'logout',
        icon: <LogoutOutlined />,
        label: '退出登录',
        onClick: handleLogout,
      },
    ],
  };

  const selectedKey = filteredMenuItems.find((item) =>
    location.pathname.startsWith(item.path)
  )?.key || 'dashboard';

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider theme="dark" width={220}>
        <div style={{
          height: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          fontSize: 18,
          fontWeight: 'bold',
          borderBottom: '1px solid #333'
        }}>
          设备巡检管理
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[selectedKey]}
          items={filteredMenuItems.map((item) => ({
            key: item.key,
            icon: item.icon,
            label: <Link to={item.path}>{item.label}</Link>,
          }))}
        />
      </Sider>
      <Layout>
        <Header style={{ background: '#fff', padding: '0 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 20, fontWeight: 500 }}>企业设备巡检管理系统</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <span>欢迎，{user?.name}</span>
            <Dropdown menu={userMenu} placement="bottomRight">
              <Button type="text" icon={<Avatar size="small" icon={<UserOutlined />} />}>
                {user?.name}
              </Button>
            </Dropdown>
          </div>
        </Header>
        <Content style={{ margin: '24px', background: '#fff', padding: 24, minHeight: 280, borderRadius: 8 }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default MainLayout;
