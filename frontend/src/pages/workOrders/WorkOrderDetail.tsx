import React, { useState, useEffect } from 'react';
import { Card, Descriptions, Tag, Button, Form, Select, Input, message, Empty } from 'antd';
import { ArrowLeftOutlined, SaveOutlined } from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import { workOrderApi } from '../../services/workOrder';
import { userApi } from '../../services/user';
import { WorkOrder, WorkOrderStatus, Role, User } from '../../types';
import { STATUS_COLORS, STATUS_LABELS } from '../../utils/constants';
import { useAuth } from '../../context/AuthContext';
import dayjs from 'dayjs';

const { TextArea } = Input;
const { Option } = Select;

const WorkOrderDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [order, setOrder] = useState<WorkOrder | null>(null);
  const [maintenanceUsers, setMaintenanceUsers] = useState<User[]>([]);

  useEffect(() => {
    fetchOrder();
    fetchMaintenanceUsers();
  }, [id]);

  const fetchOrder = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await workOrderApi.getDetail(parseInt(id));
      if (res.success && res.data) {
        setOrder(res.data);
        form.setFieldsValue({
          status: res.data.status,
          handleRemark: res.data.handleRemark,
          assigneeId: res.data.assigneeId,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchMaintenanceUsers = async () => {
    try {
      const res = await userApi.getByRole(Role.MAINTENANCE);
      if (res.success && res.data) {
        setMaintenanceUsers(res.data);
      }
    } catch (error) {
      console.error('Fetch maintenance users error:', error);
    }
  };

  const canEdit = user?.role === Role.ADMIN ||
    (user?.role === Role.MAINTENANCE && order?.assigneeId === user.userId);

  const onFinish = async (values: any) => {
    if (!canEdit || !order) return;
    setSaving(true);
    try {
      const res = await workOrderApi.update(order.id, values);
      if (res.success) {
        message.success('更新成功');
        fetchOrder();
      }
    } finally {
      setSaving(false);
    }
  };

  if (!order && !loading) {
    return <Empty description="工单不存在" />;
  }

  return (
    <div>
      <Button
        icon={<ArrowLeftOutlined />}
        onClick={() => navigate('/work-orders')}
        style={{ marginBottom: 16 }}
      >
        返回列表
      </Button>

      <Card title="工单详情" loading={loading} style={{ marginBottom: 16 }}>
        {order && (
          <Descriptions column={2} bordered>
            <Descriptions.Item label="工单编号">{order.code}</Descriptions.Item>
            <Descriptions.Item label="状态">
              <Tag color={STATUS_COLORS[order.status]}>{STATUS_LABELS[order.status]}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="设备名称">{order.device?.name}</Descriptions.Item>
            <Descriptions.Item label="设备编号">{order.device?.code}</Descriptions.Item>
            <Descriptions.Item label="位置">
              {order.device?.park} {order.device?.building} {order.device?.floor}
            </Descriptions.Item>
            <Descriptions.Item label="负责人">
              {order.assignee?.name || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="异常描述" span={2}>
              {order.description}
            </Descriptions.Item>
            {order.task && (
              <Descriptions.Item label="关联任务" span={2}>
                任务编号：{order.task.code}
              </Descriptions.Item>
            )}
            {order.handleRemark && (
              <Descriptions.Item label="处理备注" span={2}>
                {order.handleRemark}
              </Descriptions.Item>
            )}
            <Descriptions.Item label="创建时间">
              {dayjs(order.createdAt).format('YYYY-MM-DD HH:mm')}
            </Descriptions.Item>
            <Descriptions.Item label="关闭时间">
              {order.closedAt ? dayjs(order.closedAt).format('YYYY-MM-DD HH:mm') : '-'}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Card>

      {canEdit && order && order.status !== WorkOrderStatus.CLOSED && (
        <Card title="更新工单">
          <Form
            form={form}
            layout="vertical"
            onFinish={onFinish}
            style={{ maxWidth: 600 }}
          >
            {user?.role === Role.ADMIN && (
              <Form.Item
                name="assigneeId"
                label="分配给"
                rules={[{ required: true, message: '请选择负责人' }]}
              >
                <Select placeholder="请选择维修人员">
                  {maintenanceUsers.map((u) => (
                    <Option key={u.id} value={u.id}>{u.name}</Option>
                  ))}
                </Select>
              </Form.Item>
            )}

            <Form.Item
              name="status"
              label="工单状态"
              rules={[{ required: true, message: '请选择状态' }]}
            >
              <Select placeholder="请选择状态">
                <Option value="PENDING">待处理</Option>
                <Option value="PROCESSING">处理中</Option>
                <Option value="CLOSED">已关闭</Option>
              </Select>
            </Form.Item>

            <Form.Item
              name="handleRemark"
              label="处理备注"
              rules={[{ required: true, message: '请输入处理备注' }]}
            >
              <TextArea rows={4} placeholder="请输入处理备注" />
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={saving}>
                保存
              </Button>
            </Form.Item>
          </Form>
        </Card>
      )}
    </div>
  );
};

export default WorkOrderDetail;
