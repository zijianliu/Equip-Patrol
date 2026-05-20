import React, { useState, useEffect } from 'react';
import { Card, Descriptions, Tag, Table, Button, Empty, Divider, List, Image } from 'antd';
import { ArrowLeftOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import { inspectionTaskApi } from '../../services/inspectionTask';
import { InspectionTask, TaskStatus } from '../../types';
import { STATUS_COLORS, STATUS_LABELS } from '../../utils/constants';
import dayjs from 'dayjs';

const InspectionTaskDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [task, setTask] = useState<InspectionTask | null>(null);

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
      }
    } finally {
      setLoading(false);
    }
  };

  if (!task && !loading) {
    return <Empty description="任务不存在" />;
  }

  const checkItemColumns = [
    {
      title: '检查项',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '检查结果',
      dataIndex: 'result',
      key: 'result',
      render: (result: string) => (
        <Tag color={STATUS_COLORS[result]}>{STATUS_LABELS[result]}</Tag>
      ),
    },
    {
      title: '备注',
      dataIndex: 'remark',
      key: 'remark',
      render: (remark: string) => remark || '-',
    },
  ];

  return (
    <div>
      <Button
        icon={<ArrowLeftOutlined />}
        onClick={() => navigate('/inspection-tasks')}
        style={{ marginBottom: 16 }}
      >
        返回列表
      </Button>
      {task?.status === TaskStatus.PENDING && (
        <Button
          type="primary"
          icon={<CheckCircleOutlined />}
          onClick={() => navigate(`/inspection-tasks/${id}/submit`)}
          style={{ marginLeft: 8, marginBottom: 16 }}
        >
          提交巡检结果
        </Button>
      )}

      <Card title="任务基础信息" loading={loading} style={{ marginBottom: 16 }}>
        {task && (
          <Descriptions column={2} bordered>
            <Descriptions.Item label="任务编号">{task.code}</Descriptions.Item>
            <Descriptions.Item label="状态">
              <Tag color={STATUS_COLORS[task.status]}>{STATUS_LABELS[task.status]}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="计划名称">{task.plan?.name}</Descriptions.Item>
            <Descriptions.Item label="负责人">{task.assignee?.name}</Descriptions.Item>
            <Descriptions.Item label="设备名称">{task.device?.name}</Descriptions.Item>
            <Descriptions.Item label="设备编号">{task.device?.code}</Descriptions.Item>
            <Descriptions.Item label="位置">
              {task.device?.park} {task.device?.building} {task.device?.floor}
            </Descriptions.Item>
            <Descriptions.Item label="设备类型">{task.device?.type}</Descriptions.Item>
            <Descriptions.Item label="计划巡检时间">
              {dayjs(task.scheduledAt).format('YYYY-MM-DD HH:mm')}
            </Descriptions.Item>
            <Descriptions.Item label="实际完成时间">
              {task.completedAt ? dayjs(task.completedAt).format('YYYY-MM-DD HH:mm') : '-'}
            </Descriptions.Item>
            {task.remark && (
              <Descriptions.Item label="整体备注" span={2}>
                {task.remark}
              </Descriptions.Item>
            )}
          </Descriptions>
        )}
      </Card>

      {task?.checkItems && task.checkItems.length > 0 && (
        <Card title="检查项结果" loading={loading} style={{ marginBottom: 16 }}>
          <Table
            columns={checkItemColumns}
            dataSource={task.checkItems}
            rowKey="id"
            pagination={false}
          />
        </Card>
      )}

      {task?.images && task.images.length > 0 && (
        <Card title="巡检图片" loading={loading} style={{ marginBottom: 16 }}>
          <Image.PreviewGroup>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              {task.images.map((img, index) => (
                <Image
                  key={index}
                  width={200}
                  src={img}
                  style={{ borderRadius: 8 }}
                />
              ))}
            </div>
          </Image.PreviewGroup>
        </Card>
      )}

      {task?.workOrder && (
        <Card title="关联维修工单" loading={loading}>
          <List.Item>
            <List.Item.Meta
              title={`工单编号：${task.workOrder.code}`}
              description={
                <div>
                  <div>状态：
                    <Tag color={STATUS_COLORS[task.workOrder.status]}>
                      {STATUS_LABELS[task.workOrder.status]}
                    </Tag>
                  </div>
                  <div>描述：{task.workOrder.description}</div>
                  {task.workOrder.assignee && (
                    <div>负责人：{task.workOrder.assignee.name}</div>
                  )}
                </div>
              }
            />
          </List.Item>
        </Card>
      )}
    </div>
  );
};

export default InspectionTaskDetail;
