import React from 'react';
import { Card, Row, Col, Statistic, Tag } from 'antd';
import {
  SettingOutlined,
  ClipboardListOutlined,
  FileTextOutlined,
  ToolOutlined,
} from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';
import { Role } from '../types';

const Dashboard: React.FC = () => {
  const { user } = useAuth();

  return (
    <div>
      <h2 style={{ marginBottom: 24 }}>
        欢迎，{user?.name}！
      </h2>

      <Row gutter={16}>
        <Col span={6}>
          <Card>
            <Statistic
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
            />
          </Card>
        </Col>
      </Row>

      <Card title="系统说明" style={{ marginTop: 24 }}>
        <div style={{ lineHeight: 2 }}>
          <p><strong>设备巡检管理系统</strong>是一个用于企业设备管理、巡检计划管理和维修工单管理的综合系统。</p>
          <div style={{ display: 'flex', gap: 24, marginTop: 16 }}>
            <div>
              <Tag color="blue">巡检员可执行任务</Tag>
              <div style={{ marginTop: 8 }}>
                <div>1. 查看分配给自己的巡检任务</div>
                <div>2. 提交巡检结果</div>
              </div>
            </div>
            <div>
              <Tag color="orange">维修员可处理工单</Tag>
              <div style={{ marginTop: 8 }}>
                <div>1. 查看分配给自己的维修工单</div>
                <div>2. 更新工单状态</div>
              </div>
            </div>
            <div>
              <Tag color="green">管理员拥有全部权限</Tag>
              <div style={{ marginTop: 8 }}>
                <div>1. 设备管理（增删改查</div>
                <div>2. 巡检计划管理</div>
                <div>3. 巡检任务管理</div>
                <div>4. 维修工单管理</div>
              </div>
            </div>
          </div>
        </div>
        <div style={{ marginTop: 16, padding: 16, background: '#f5f5f5', borderRadius: 8 }}>
          <strong>快速开始：</strong>
          <div>测试账号：
          <div>
            <div>• 管理员：admin / 123456</div>
            <div>• 巡检员：inspector / 123456</div>
            <div>• 维修员：maintenance / 123456</div>
          </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default Dashboard;
