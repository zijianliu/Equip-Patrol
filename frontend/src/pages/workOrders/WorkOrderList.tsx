import React, { useState, useEffect } from 'react';
import { Table, Button, Select, Space, Tag, Empty } from 'antd';
import { EyeOutlined, ToolOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { workOrderApi } from '../../services/workOrder';
import { WorkOrder, WorkOrderStatus, Role } from '../../types';
import { STATUS_COLORS, STATUS_LABELS } from '../../utils/constants';
import { useAuth } from '../../context/AuthContext';
import dayjs from 'dayjs';

const { Option } = Select;

const WorkOrderList: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<WorkOrder[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [status, setStatus] = useState<string | undefined>();

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await workOrderApi.getList({
        page,
        pageSize,
        status,
      });
      if (res.success && res.data) {
        setData(res.data.list);
        setTotal(res.data.total);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [page, pageSize, status]);

  const columns = [
    {
      title: '工单编号',
      dataIndex: 'code',
      key: 'code',
      width: 160,
    },
    {
      title: '设备信息',
      key: 'device',
      render: (_: any, record: WorkOrder) => (
        <div>
          <div>{record.device?.name}</div>
          <div style={{ color: '#999', fontSize: 12 }}>{record.device?.code}</div>
        </div>
      ),
    },
    {
      title: '异常描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: '负责人',
      dataIndex: ['assignee', 'name'],
      key: 'assignee',
      width: 100,
      render: (name: string) => name || '-',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: WorkOrderStatus) => (
        <Tag color={STATUS_COLORS[status]}>{STATUS_LABELS[status]}</Tag>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 160,
      render: (date: string) => dayjs(date).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '关闭时间',
      dataIndex: 'closedAt',
      key: 'closedAt',
      width: 160,
      render: (date: string) => date ? dayjs(date).format('YYYY-MM-DD HH:mm') : '-',
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_: any, record: WorkOrder) => (
        <Button
          type="link"
          size="small"
          icon={<EyeOutlined />}
          onClick={() => navigate(`/work-orders/${record.id}`)}
        >
          详情
        </Button>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0 }}>
          维修工单
          {user?.role === Role.MAINTENANCE && (
            <Tag color="blue" style={{ marginLeft: 8 }}>仅显示分配给我的工单</Tag>
          )}
        </h2>
        <Select
          placeholder="工单状态"
          value={status}
          onChange={setStatus}
          style={{ width: 150 }}
          allowClear
        >
          <Option value="PENDING">待处理</Option>
          <Option value="PROCESSING">处理中</Option>
          <Option value="CLOSED">已关闭</Option>
        </Select>
      </div>

      <Table
        columns={columns}
        dataSource={data}
        rowKey="id"
        loading={loading}
        pagination={{
          current: page,
          pageSize,
          total,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total) => `共 ${total} 条`,
          onChange: (p, ps) => {
            setPage(p);
            setPageSize(ps);
          },
        }}
        locale={{ emptyText: <Empty description="暂无维修工单" /> }}
      />
    </div>
  );
};

export default WorkOrderList;
