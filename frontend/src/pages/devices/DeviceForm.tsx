import React, { useState, useEffect } from 'react';
import { Form, Input, Select, Button, message, Card, Spin, Alert } from 'antd';
import { useNavigate, useParams } from 'react-router-dom';
import { deviceApi } from '../../services/device';
import { Device } from '../../types';

const { Option } = Select;

interface DeviceFormProps {
  mode: 'create' | 'edit';
}

const DeviceForm: React.FC<DeviceFormProps> = ({ mode }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [fetchState, setFetchState] = useState<'loading' | 'success' | 'error'>(mode === 'edit' ? 'loading' : 'success');
  const [fetchError, setFetchError] = useState('');
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  useEffect(() => {
    if (mode === 'edit' && id) {
      fetchDevice();
    }
  }, [mode, id]);

  const fetchDevice = async () => {
    if (!id) return;
    setFetchState('loading');
    setFetchError('');
    try {
      const res = await deviceApi.getDetail(parseInt(id));
      if (res.success && res.data) {
        form.setFieldsValue({
          code: res.data.code,
          name: res.data.name,
          park: res.data.park,
          building: res.data.building,
          floor: res.data.floor,
          type: res.data.type,
          status: res.data.status,
        });
        setFetchState('success');
      } else {
        setFetchError('获取设备信息失败：返回数据为空');
        setFetchState('error');
      }
    } catch (error: any) {
      console.error('Fetch device error:', error);
      setFetchError(error.message || '获取设备信息失败');
      setFetchState('error');
    }
  };

  const onFinish = async (values: any) => {
    setLoading(true);
    try {
      if (mode === 'create') {
        const res = await deviceApi.create(values);
        if (res.success) {
          message.success('创建设备成功');
          navigate('/devices');
        }
      } else {
        const res = await deviceApi.update(parseInt(id!), values);
        if (res.success) {
          message.success('更新设备成功');
          navigate('/devices');
        }
      }
    } finally {
      setLoading(false);
    }
  };

  if (fetchState === 'loading') {
    return (
      <div>
        <Button onClick={() => navigate('/devices')} style={{ marginBottom: 16 }}>
          返回列表
        </Button>
        <Card title={mode === 'create' ? '新增设备' : '编辑设备'}>
          <div style={{ textAlign: 'center', padding: 80 }}>
            <Spin size="large" tip="正在加载设备数据，请稍候..." />
          </div>
        </Card>
      </div>
    );
  }

  if (fetchState === 'error') {
    return (
      <div>
        <Button onClick={() => navigate('/devices')} style={{ marginBottom: 16 }}>
          返回列表
        </Button>
        <Card title={mode === 'create' ? '新增设备' : '编辑设备'}>
          <Alert
            message="数据加载失败"
            description={fetchError}
            type="error"
            showIcon
            action={
              <Button size="small" type="primary" onClick={fetchDevice}>
                重试
              </Button>
            }
          />
        </Card>
      </div>
    );
  }

  return (
    <div>
      <Button onClick={() => navigate('/devices')} style={{ marginBottom: 16 }}>
        返回列表
      </Button>
      <Card title={mode === 'create' ? '新增设备' : '编辑设备'}>
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          style={{ maxWidth: 600 }}
          initialValues={{ status: 'NORMAL' }}
        >
          <Form.Item
            name="code"
            label="设备编号"
            rules={[{ required: true, message: '请输入设备编号' }]}
          >
            <Input placeholder="请输入设备编号" disabled={mode === 'edit'} />
          </Form.Item>

          <Form.Item
            name="name"
            label="设备名称"
            rules={[{ required: true, message: '请输入设备名称' }]}
          >
            <Input placeholder="请输入设备名称" />
          </Form.Item>

          <Form.Item
            name="park"
            label="所属园区"
            rules={[{ required: true, message: '请选择所属园区' }]}
          >
            <Select placeholder="请选择园区">
              <Option value="A园">A园</Option>
              <Option value="B园">B园</Option>
              <Option value="C园">C园</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="building"
            label="楼栋"
            rules={[{ required: true, message: '请输入楼栋' }]}
          >
            <Input placeholder="请输入楼栋" />
          </Form.Item>

          <Form.Item
            name="floor"
            label="楼层"
            rules={[{ required: true, message: '请输入楼层' }]}
          >
            <Input placeholder="请输入楼层" />
          </Form.Item>

          <Form.Item
            name="type"
            label="设备类型"
            rules={[{ required: true, message: '请选择设备类型' }]}
          >
            <Select placeholder="请选择设备类型">
              <Option value="电气设备">电气设备</Option>
              <Option value="机械设备">机械设备</Option>
              <Option value="仪器仪表">仪器仪表</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="status"
            label="运行状态"
          >
            <Select placeholder="请选择运行状态">
              <Option value="NORMAL">正常</Option>
              <Option value="FAULT">故障</Option>
              <Option value="MAINTENANCE">维修中</Option>
              <Option value="STOPPED">停用</Option>
            </Select>
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading}>
              {mode === 'create' ? '创建' : '保存'}
            </Button>
            <Button onClick={() => navigate('/devices')} style={{ marginLeft: 8 }}>
              取消
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default DeviceForm;
