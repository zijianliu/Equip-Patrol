import React, { useState, useEffect, useCallback } from 'react';
import { Table, Button, Input, Select, Space, Tag, Empty } from 'antd';
import { EyeOutlined, CheckCircleOutlined, SearchOutlined, ReloadOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { inspectionTaskApi } from '../../services/inspectionTask';
import { InspectionTask, TaskStatus, Role } from '../../types';
import { STATUS_COLORS, STATUS_LABELS } from '../../utils/constants';
import { useAuth } from '../../context/AuthContext';
import dayjs from 'dayjs';

const { Search } = Input;
const { Option } = Select;

const InspectionTaskList: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<InspectionTask[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState<string | undefined>();
  const [searchKeyword, setSearchKeyword] = useState('');
  const [searchStatus, setSearchStatus] = useState<string | undefined>();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await inspectionTaskApi.getList({
        page,
        pageSize,
        keyword: searchKeyword || undefined,
        status: searchStatus,
      });
      if (res.success && res.data) {
        setData(res.data.list);
        setTotal(res.data.total);
      }
    } catch (error) {
      console.error('Fetch tasks error:', error);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, searchKeyword, searchStatus]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSearch = () => {
    setSearchKeyword(keyword);
    setSearchStatus(status);
    setPage(1);
  };

  const handleReset = () => {
    setKeyword('');
    setStatus(undefined);
    setSearchKeyword('');
    setSearchStatus(undefined);
    setPage(1);
    setTimeout(() => fetchData(), 0);
  };

  const columns = [
    {
      title: '任务编号',
      dataIndex: 'code',
      key: 'code',
      width: 160,
    },
    {
      title: '计划名称',
      dataIndex: ['plan', 'name'],
      key: 'planName',
    },
    {
      title: '设备信息',
      key: 'device',
      render: (_: any, record: InspectionTask) => (
        <div>
          <div>{record.device?.name}</div>
          <div style={{ color: '#999', fontSize: 12 }}>{record.device?.code}</div>
        </div>
      ),
    },
    {
      title: '位置',
      key: 'location',
      render: (_: any, record: InspectionTask) => (
        <span>{record.device?.park} {record.device?.building} {record.device?.floor}</span>
      ),
    },
    {
      title: '负责人',
      dataIndex: ['assignee', 'name'],
      key: 'assignee',
      width: 100,
    },
    {
      title: '计划巡检时间',
      dataIndex: 'scheduledAt',
      key: 'scheduledAt',
      width: 160,
      render: (date: string) => dayjs(date).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '实际完成时间',
      dataIndex: 'completedAt',
      key: 'completedAt',
      width: 160,
      render: (date: string) => date ? dayjs(date).format('YYYY-MM-DD HH:mm') : '-',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: TaskStatus) => (
        <Tag color={STATUS_COLORS[status]}>{STATUS_LABELS[status]}</Tag>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (_: any, record: InspectionTask) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => navigate(`/inspection-tasks/${record.id}`)}
          >
            详情
          </Button>
          {record.status === TaskStatus.PENDING && (
            <Button
              type="link"
              size="small"
              icon={<CheckCircleOutlined />}
              onClick={() => navigate(`/inspection-tasks/${record.id}/submit`)}
            >
              提交结果
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0 }}>
          巡检任务
          {user?.role === Role.INSPECTOR && (
            <Tag color="blue" style={{ marginLeft: 8 }}>仅显示分配给我的任务</Tag>
          )}
        </h2>
      </div>

      <div style={{ marginBottom: 16, padding: 16, background: '#fafafa', borderRadius: 8 }}>
        <Space wrap>
          <Search
            placeholder="搜索任务编号/设备名称"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onSearch={handleSearch}
            style={{ width: 220 }}
            allowClear
          />
          <Select
            placeholder="任务状态"
            value={status}
            onChange={setStatus}
            style={{ width: 120 }}
            allowClear
          >
            <Option value="PENDING">待巡检</Option>
            <Option value="COMPLETED">已完成</Option>
            <Option value="ABNORMAL">异常</Option>
          </Select>
          <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
            搜索
          </Button>
          <Button icon={<ReloadOutlined />} onClick={handleReset}>
            重置
          </Button>
        </Space>
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
        locale={{ emptyText: <Empty description="暂无巡检任务" /> }}
      />
    </div>
  );
};

export default InspectionTaskList;
