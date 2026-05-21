import React, { useState, useEffect, useCallback } from 'react';
import { Table, Button, Input, Select, Space, Popconfirm, message, Tag, Switch } from 'antd';
import { PlusOutlined, SearchOutlined, EditOutlined, DeleteOutlined, EyeOutlined, ReloadOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { inspectionPlanApi } from '../../services/inspectionPlan';
import { InspectionPlan, PlanStatus, CycleType } from '../../types';
import { STATUS_COLORS, STATUS_LABELS } from '../../utils/constants';
import dayjs from 'dayjs';

const { Search } = Input;
const { Option } = Select;

const InspectionPlanList: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<InspectionPlan[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState<string | undefined>();
  const [searchKeyword, setSearchKeyword] = useState('');
  const [searchStatus, setSearchStatus] = useState<string | undefined>();
  const [togglingId, setTogglingId] = useState<number | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await inspectionPlanApi.getList({
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
      console.error('Fetch plans error:', error);
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

  const handleToggleStatus = async (record: InspectionPlan, checked: boolean) => {
    if (togglingId !== null) {
      message.warning('操作进行中，请稍候...');
      return;
    }
    setTogglingId(record.id);
    try {
      const res = await inspectionPlanApi.toggleStatus(record.id);
      if (res.success) {
        message.success(checked ? '已启用' : '已停用');
        fetchData();
      }
    } catch (error) {
      console.error('Toggle status error:', error);
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const res = await inspectionPlanApi.delete(id);
      if (res.success) {
        message.success('删除成功');
        fetchData();
      }
    } catch (error) {
      console.error('Delete error:', error);
    }
  };

  const columns = [
    {
      title: '计划名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '巡检周期',
      dataIndex: 'cycle',
      key: 'cycle',
      width: 100,
      render: (cycle: CycleType) => STATUS_LABELS[cycle],
    },
    {
      title: '负责人',
      dataIndex: ['owner', 'name'],
      key: 'owner',
      width: 100,
    },
    {
      title: '开始时间',
      dataIndex: 'startTime',
      key: 'startTime',
      width: 160,
      render: (date: string) => dayjs(date).format('YYYY-MM-DD'),
    },
    {
      title: '结束时间',
      dataIndex: 'endTime',
      key: 'endTime',
      width: 160,
      render: (date: string) => dayjs(date).format('YYYY-MM-DD'),
    },
    {
      title: '关联设备',
      key: 'devices',
      width: 100,
      render: (_: any, record: InspectionPlan) => record.devices?.length || 0,
    },
    {
      title: '已生成任务',
      dataIndex: ['_count', 'tasks'],
      key: 'taskCount',
      width: 100,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 140,
      render: (_: any, record: InspectionPlan) => (
        <Space>
          <Tag color={STATUS_COLORS[record.status]}>
            {STATUS_LABELS[record.status]}
          </Tag>
          <Switch
            checked={record.status === PlanStatus.ACTIVE}
            onChange={(checked) => handleToggleStatus(record, checked)}
            size="small"
            loading={togglingId === record.id}
            disabled={togglingId !== null && togglingId !== record.id}
          />
        </Space>
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
      title: '操作',
      key: 'action',
      width: 180,
      render: (_: any, record: InspectionPlan) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => navigate(`/inspection-plans/${record.id}`)}
            disabled={togglingId !== null}
          >
            详情
          </Button>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => navigate(`/inspection-plans/${record.id}/edit`)}
            disabled={togglingId !== null}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定删除该计划吗？"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
            disabled={togglingId !== null}
          >
            <Button type="link" size="small" danger icon={<DeleteOutlined />} disabled={togglingId !== null}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0 }}>巡检计划</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/inspection-plans/new')} disabled={togglingId !== null}>
          新增计划
        </Button>
      </div>

      <div style={{ marginBottom: 16, padding: 16, background: '#fafafa', borderRadius: 8 }}>
        <Space wrap>
          <Search
            placeholder="搜索计划名称"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onSearch={handleSearch}
            style={{ width: 200 }}
            allowClear
          />
          <Select
            placeholder="计划状态"
            value={status}
            onChange={setStatus}
            style={{ width: 120 }}
            allowClear
          >
            <Option value="ACTIVE">启用</Option>
            <Option value="INACTIVE">停用</Option>
          </Select>
          <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch} disabled={togglingId !== null}>
            搜索
          </Button>
          <Button icon={<ReloadOutlined />} onClick={handleReset} disabled={togglingId !== null}>
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
      />
    </div>
  );
};

export default InspectionPlanList;
