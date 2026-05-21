import React, { useState, useEffect, useCallback } from 'react';
import { Table, Button, Input, Select, Space, Popconfirm, message, Tag } from 'antd';
import { PlusOutlined, SearchOutlined, EditOutlined, DeleteOutlined, EyeOutlined, ReloadOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { deviceApi } from '../../services/device';
import { Device, DeviceStatus } from '../../types';
import { STATUS_COLORS, STATUS_LABELS } from '../../utils/constants';
import dayjs from 'dayjs';

const { Search } = Input;
const { Option } = Select;

const DeviceList: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<Device[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [keyword, setKeyword] = useState('');
  const [type, setType] = useState<string | undefined>();
  const [status, setStatus] = useState<string | undefined>();
  const [park, setPark] = useState<string | undefined>();
  const [searchKeyword, setSearchKeyword] = useState('');
  const [searchType, setSearchType] = useState<string | undefined>();
  const [searchStatus, setSearchStatus] = useState<string | undefined>();
  const [searchPark, setSearchPark] = useState<string | undefined>();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await deviceApi.getList({
        page,
        pageSize,
        keyword: searchKeyword || undefined,
        type: searchType,
        status: searchStatus,
        park: searchPark,
      });
      if (res.success && res.data) {
        setData(res.data.list);
        setTotal(res.data.total);
      }
    } catch (error) {
      console.error('Fetch devices error:', error);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, searchKeyword, searchType, searchStatus, searchPark]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSearch = () => {
    setSearchKeyword(keyword);
    setSearchType(type);
    setSearchStatus(status);
    setSearchPark(park);
    setPage(1);
  };

  const handleReset = () => {
    setKeyword('');
    setType(undefined);
    setStatus(undefined);
    setPark(undefined);
    setSearchKeyword('');
    setSearchType(undefined);
    setSearchStatus(undefined);
    setSearchPark(undefined);
    setPage(1);
    setTimeout(() => fetchData(), 0);
  };

  const handleDelete = async (id: number) => {
    try {
      const res = await deviceApi.delete(id);
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
      title: '设备编号',
      dataIndex: 'code',
      key: 'code',
      width: 120,
    },
    {
      title: '设备名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '园区',
      dataIndex: 'park',
      key: 'park',
      width: 80,
    },
    {
      title: '楼栋',
      dataIndex: 'building',
      key: 'building',
      width: 80,
    },
    {
      title: '楼层',
      dataIndex: 'floor',
      key: 'floor',
      width: 80,
    },
    {
      title: '设备类型',
      dataIndex: 'type',
      key: 'type',
      width: 120,
    },
    {
      title: '运行状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: DeviceStatus) => (
        <Tag color={STATUS_COLORS[status]}>{STATUS_LABELS[status]}</Tag>
      ),
    },
    {
      title: '最近巡检时间',
      dataIndex: 'lastInspectedAt',
      key: 'lastInspectedAt',
      width: 160,
      render: (date: string) => date ? dayjs(date).format('YYYY-MM-DD HH:mm') : '-',
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
      render: (_: any, record: Device) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => navigate(`/devices/${record.id}`)}
          >
            详情
          </Button>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => navigate(`/devices/${record.id}/edit`)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定删除该设备吗？"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
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
        <h2 style={{ margin: 0 }}>设备管理</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/devices/new')}>
          新增设备
        </Button>
      </div>

      <div style={{ marginBottom: 16, padding: 16, background: '#fafafa', borderRadius: 8 }}>
        <Space wrap>
          <Search
            placeholder="搜索设备编号/名称"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onSearch={handleSearch}
            style={{ width: 200 }}
            allowClear
          />
          <Select
            placeholder="设备类型"
            value={type}
            onChange={setType}
            style={{ width: 120 }}
            allowClear
          >
            <Option value="电气设备">电气设备</Option>
            <Option value="机械设备">机械设备</Option>
            <Option value="仪器仪表">仪器仪表</Option>
          </Select>
          <Select
            placeholder="运行状态"
            value={status}
            onChange={setStatus}
            style={{ width: 120 }}
            allowClear
          >
            <Option value="NORMAL">正常</Option>
            <Option value="FAULT">故障</Option>
            <Option value="MAINTENANCE">维修中</Option>
            <Option value="STOPPED">停用</Option>
          </Select>
          <Select
            placeholder="园区"
            value={park}
            onChange={setPark}
            style={{ width: 120 }}
            allowClear
          >
            <Option value="A园">A园</Option>
            <Option value="B园">B园</Option>
            <Option value="C园">C园</Option>
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
      />
    </div>
  );
};

export default DeviceList;
