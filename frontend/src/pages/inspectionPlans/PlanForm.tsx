import React, { useState, useEffect } from 'react';
import { Form, Input, Select, DatePicker, Button, Transfer, message, Card, Empty } from 'antd';
import { useNavigate, useParams } from 'react-router-dom';
import dayjs from 'dayjs';
import { inspectionPlanApi } from '../../services/inspectionPlan';
import { deviceApi } from '../../services/device';
import { userApi } from '../../services/user';
import { Device, User, Role, InspectionPlan } from '../../types';

const { Option } = Select;
const { RangePicker } = DatePicker;

interface PlanFormProps {
  mode: 'create' | 'edit';
}

const PlanForm: React.FC<PlanFormProps> = ({ mode }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [devices, setDevices] = useState<Device[]>([]);
  const [inspectors, setInspectors] = useState<User[]>([]);
  const [targetKeys, setTargetKeys] = useState<number[]>([]);
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  useEffect(() => {
    fetchDevices();
    fetchInspectors();
    if (mode === 'edit' && id) {
      fetchPlan();
    }
  }, [mode, id]);

  const fetchDevices = async () => {
    try {
      const res = await deviceApi.getList({ page: 1, pageSize: 1000 });
      if (res.success && res.data) {
        setDevices(res.data.list);
      }
    } catch (error) {
      console.error('Fetch devices error:', error);
    }
  };

  const fetchInspectors = async () => {
    try {
      const res = await userApi.getByRole(Role.INSPECTOR);
      if (res.success && res.data) {
        setInspectors(res.data);
      }
    } catch (error) {
      console.error('Fetch inspectors error:', error);
    }
  };

  const fetchPlan = async () => {
    if (!id) return;
    try {
      const res = await inspectionPlanApi.getDetail(parseInt(id));
      if (res.success && res.data) {
        const plan = res.data;
        form.setFieldsValue({
          ...plan,
          timeRange: [dayjs(plan.startTime), dayjs(plan.endTime)],
        });
        setTargetKeys(plan.devices?.map((d) => d.device.id) || []);
      }
    } catch (error) {
      console.error('Fetch plan error:', error);
    }
  };

  const onFinish = async (values: any) => {
    setLoading(true);
    try {
      const data = {
        name: values.name,
        cycle: values.cycle,
        startTime: values.timeRange[0].toISOString(),
        endTime: values.timeRange[1].toISOString(),
        deviceIds: targetKeys,
        ownerId: values.ownerId,
        status: values.status,
      };

      if (mode === 'create') {
        const res = await inspectionPlanApi.create(data);
        if (res.success) {
          message.success('创建计划成功');
          navigate('/inspection-plans');
        }
      } else {
        const res = await inspectionPlanApi.update(parseInt(id!), data);
        if (res.success) {
          message.success('更新计划成功');
          navigate('/inspection-plans');
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Button onClick={() => navigate('/inspection-plans')} style={{ marginBottom: 16 }}>
        返回列表
      </Button>
      <Card title={mode === 'create' ? '新增巡检计划' : '编辑巡检计划'}>
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          style={{ maxWidth: 800 }}
        >
          <Form.Item
            name="name"
            label="计划名称"
            rules={[{ required: true, message: '请输入计划名称' }]}
          >
            <Input placeholder="请输入计划名称" />
          </Form.Item>

          <Form.Item
            name="cycle"
            label="巡检周期"
            rules={[{ required: true, message: '请选择巡检周期' }]}
          >
            <Select placeholder="请选择巡检周期">
              <Option value="DAILY">每日</Option>
              <Option value="WEEKLY">每周</Option>
              <Option value="MONTHLY">每月</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="timeRange"
            label="计划时间范围"
            rules={[{ required: true, message: '请选择时间范围' }]}
          >
            <RangePicker style={{ width: '100%' }} showTime />
          </Form.Item>

          <Form.Item
            name="ownerId"
            label="负责人"
            rules={[{ required: true, message: '请选择负责人' }]}
          >
            <Select placeholder="请选择负责人">
              {inspectors.map((user) => (
                <Option key={user.id} value={user.id}>
                  {user.name}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="status"
            label="计划状态"
            initialValue="ACTIVE"
          >
            <Select placeholder="请选择状态">
              <Option value="ACTIVE">启用</Option>
              <Option value="INACTIVE">停用</Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="关联设备"
            name="devices"
            required
            tooltip="请选择需要巡检的设备"
          >
            <Transfer
              dataSource={devices.map((d) => ({
                key: d.id,
                title: `${d.code} - ${d.name}`,
                description: `${d.park} ${d.building} ${d.floor}`,
              }))}
              targetKeys={targetKeys}
              onChange={(keys) => setTargetKeys(keys as number[])}
              render={(item) => item.title}
              listStyle={{ width: 300, height: 300 }}
              showSearch
              rowKey={(item) => item.key}
              titles={['可选设备', '已选设备']}
            />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading}>
              {mode === 'create' ? '创建' : '保存'}
            </Button>
            <Button onClick={() => navigate('/inspection-plans')} style={{ marginLeft: 8 }}>
              取消
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default PlanForm;
