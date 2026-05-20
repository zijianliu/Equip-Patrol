import React, { useState, useEffect } from 'react';
import { Card, Descriptions, Tag, Table, Button, Form, Select, Input, message, Divider } from 'antd';
import { ArrowLeftOutlined, UploadOutlined } from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import { inspectionTaskApi } from '../../services/inspectionTask';
import { InspectionTask, TaskStatus, CheckItemResult } from '../../types';
import { STATUS_COLORS, STATUS_LABELS, CHECK_ITEMS } from '../../utils/constants';
import dayjs from 'dayjs';

const { TextArea } = Input;
const { Option } = Select;

const SubmitTask: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [task, setTask] = useState<InspectionTask | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchTask();
  }, [id]);

  const fetchTask = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await inspectionTaskApi.getDetail(parseInt(id));
      if (res.success && res.data) {
        setTask(res.data);
        if (res.data.status !== TaskStatus.PENDING) {
          message.warning('该任务已提交过，无法重复提交');
          navigate(`/inspection-tasks/${id}`);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const onFinish = async (values: any) => {
    setSubmitting(true);
    try {
      const checkItems = CHECK_ITEMS.map((item) => ({
        name: item.key,
        result: values[`result_${item.key}`],
        remark: values[`remark_${item.key}`],
      }));

      const res = await inspectionTaskApi.submit(parseInt(id!), {
        checkItems,
        remark: values.remark,
        images: [],
      });

      if (res.success) {
        message.success('提交成功');
        navigate(`/inspection-tasks/${id}`);
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (!task && !loading) {
    return <div style={{ textAlign: 'center', padding: 50 }}>任务不存在</div>;
  }

  return (
    <div>
      <Button
        icon={<ArrowLeftOutlined />}
        onClick={() => navigate('/inspection-tasks')}
        style={{ marginBottom: 16 }}
      >
        返回列表
      </Button>

      <Card title="提交巡检结果" loading={loading}>
        {task && (
          <div>
            <Descriptions column={2} bordered style={{ marginBottom: 24 }}>
              <Descriptions.Item label="任务编号">{task.code}</Descriptions.Item>
              <Descriptions.Item label="计划名称">{task.plan?.name}</Descriptions.Item>
              <Descriptions.Item label="设备名称">{task.device?.name}</Descriptions.Item>
              <Descriptions.Item label="设备编号">{task.device?.code}</Descriptions.Item>
              <Descriptions.Item label="位置">
                {task.device?.park} {task.device?.building} {task.device?.floor}
              </Descriptions.Item>
              <Descriptions.Item label="计划巡检时间">
                {dayjs(task.scheduledAt).format('YYYY-MM-DD HH:mm')}
              </Descriptions.Item>
            </Descriptions>

            <Divider orientation="left">检查项</Divider>

            <Form
              form={form}
              layout="vertical"
              onFinish={onFinish}
              style={{ maxWidth: 800 }}
            >
              {CHECK_ITEMS.map((item) => (
                <Card key={item.key} style={{ marginBottom: 16 }}>
                <div style={{ fontWeight: 500, marginBottom: 12 }}>{item.label}</div>
                <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                  <Form.Item
                    name={`result_${item.key}`}
                    label="检查结果"
                    rules={[{ required: true, message: '请选择检查结果' }]}
                    style={{ marginBottom: 0, minWidth: 150 }}
                  >
                    <Select placeholder="请选择">
                      <Option value={CheckItemResult.NORMAL}>正常</Option>
                      <Option value={CheckItemResult.ABNORMAL}>异常</Option>
                      <Option value={CheckItemResult.NOT_APPLICABLE}>不适用</Option>
                    </Select>
                  </Form.Item>
                  <Form.Item
                    name={`remark_${item.key}`}
                    label="备注"
                    style={{ marginBottom: 0, flex: 1 }}
                  >
                    <Input placeholder="请输入备注（异常时必填）" />
                  </Form.Item>
                </div>
              </Card>
              ))}

              <Form.Item name="remark" label="整体备注">
                <TextArea rows={4} placeholder="请输入整体备注" />
              </Form.Item>

              <Form.Item>
                <Button type="primary" htmlType="submit" loading={submitting}>
                  提交巡检结果
                </Button>
              </Form.Item>
            </Form>
          </div>
        )}
      </Card>
    </div>
  );
};

export default SubmitTask;
