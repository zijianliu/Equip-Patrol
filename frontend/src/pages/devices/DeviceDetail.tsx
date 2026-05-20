import React, { useState, useEffect } from 'react';
import { Card, Descriptions, Tag, Table, Button, Empty, Divider } from 'antd';
import { ArrowLeftOutlined, EditOutlined } from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import { deviceApi } from '../../services/device';
import { Device, DeviceStatus, TaskStatus, WorkOrderStatus } from '../../types';
import { STATUS_COLORS, STATUS_LABELS } from '../../utils/constants';
import dayjs from 'dayjs';

const DeviceDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [device, setDevice] = useState<Device | null>(null);

  useEffect(() => {
    fetchDevice();
  }, [id]);

  const fetchDevice = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await deviceApi.getDetail(parseInt(id));
      if (res.success && res.data) {
        setDevice(res.data);
      }
    } finally {
      setLoading(false);
    }
  };

  if (!device && !loading) {
    return <Empty description="设备不存在" />;
  }

  const taskColumns = [
    {
      title: '任务编号',
      dataIndex: 'code',
      key: 'code',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: TaskStatus) => (
        <Tag color={STATUS_COLORS[status]}>{STATUS_LABELS[status]}</Tag>
      ),
    },
    {
      title: '巡检员',
      dataIndex: ['assignee', 'name'],
      key: 'assignee',
    },
    {
      title: '计划时间',
      dataIndex: 'scheduledAt',
      key: 'scheduledAt',
      render: (date: string) => dayjs(date).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '完成时间',
      dataIndex: 'completedAt',
      key: 'completedAt',
      render: (date: string) => date ? dayjs(date).format('YYYY-MM-DD HH:mm') : '-',
    },
  ];

  const orderColumns = [
    {
      title: '工单编号',
      dataIndex: 'code',
      key: 'code',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: WorkOrderStatus) => (
        <Tag color={STATUS_COLORS[status]}>{STATUS_LABELS[status]}</Tag>
      ),
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: '负责人',
      dataIndex: ['assignee', 'name'],
      key: 'assignee',
      render: (name: string) => name || '-',
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => dayjs(date).format('YYYY-MM-DD HH:mm'),
    },
  ];

  return (
    <div>
      <Button
        icon={<ArrowLeftOutlined />}
        onClick={() => navigate('/devices')}
        style={{ marginBottom: 16 }}
      >
        返回列表
      </Button>
      <Button
        type="primary"
        icon={<EditOutlined />}
        onClick={() => navigate(`/devices/${id}/edit`)}
        style={{ marginLeft: 8, marginBottom: 16 }}
      >
        编辑设备
      </Button>

      <Card title="设备基础信息" loading={loading} style={{ marginBottom: 16 }}>
        {device && (
          <Descriptions column={2} bordered>
            <Descriptions.Item label="设备编号">{device.code}</Descriptions.Item>
            <Descriptions.Item label="设备名称">{device.name}</Descriptions.Item>
            <Descriptions.Item label="所属园区">{device.park}</Descriptions.Item>
            <Descriptions.Item label="楼栋">{device.building}</Descriptions.Item>
            <Descriptions.Item label="楼层">{device.floor}</Descriptions.Item>
            <Descriptions.Item label="设备类型">{device.type}</Descriptions.Item>
            <Descriptions.Item label="运行状态">
              <Tag color={STATUS_COLORS[device.status as DeviceStatus]}>
                {STATUS_LABELS[device.status as DeviceStatus]}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="最近巡检时间">
              {device.lastInspectedAt ? dayjs(device.lastInspectedAt).format('YYYY-MM-DD HH:mm') : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="创建时间">
              {dayjs(device.createdAt).format('YYYY-MM-DD HH:mm')}
            </Descriptions.Item>
            <Descriptions.Item label="更新时间">
              {dayjs(device.updatedAt).format('YYYY-MM-DD HH:mm')}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Card>

      <Card
        title="最近巡检记录"
        loading={loading}
        style={{ marginBottom: 16 }}
        extra={<span style={{ color: '#999' }}>最近 5 条</span>}
      >
        {device?.inspectionTasks && device.inspectionTasks.length > 0 ? (
          <Table
            columns={taskColumns}
            dataSource={device.inspectionTasks}
            rowKey="id"
            pagination={false}
          />
        ) : (
          <Empty description="暂无巡检记录" />
        )}
      </Card>

      <Card title="关联维修工单" loading={loading}>
        {device?.workOrders && device.workOrders.length > 0 ? (
          <Table
            columns={orderColumns}
            dataSource={device.workOrders}
            rowKey="id"
            pagination={false}
          />
        ) : (
          <Empty description="暂无维修工单" />
        )}
      </Card>
    </div>
  );
};

export default DeviceDetail;
