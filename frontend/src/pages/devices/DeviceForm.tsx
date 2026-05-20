import React, { useState, useEffect } from 'react';
import { Form, Input, Select, Button, message, Card } from 'antd';
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
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  useEffect(() => {
    if (mode === 'edit' && id) {
      fetchDevice();
    }
  }, [mode, id]);

  const fetchDevice = async () => {
  if (!id) return;
  try {
    const res = await deviceApi.getDetail(parseInt(id));
    if (res.success && res.data) {
      form.setFieldsValue(res.data);
    }
  } catch (error) {
    console.error('Fetch device error:', error);
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
        >
          <Form.Item
            name="code"
            label="设备编号"
            rules={[{ required: true, message: '请输入设备编号' }]}
          >
            <Input placeholder="请输入设备编号" />
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
            initialValue="NORMAL"
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
