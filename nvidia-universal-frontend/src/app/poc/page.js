"use client";

import React from 'react';
import { Card, Row, Col, Tag, Typography, Space, Badge, Button } from 'antd';
import { RocketOutlined, ApiOutlined, ExperimentOutlined, ThunderboltOutlined, ClockCircleOutlined, UserOutlined, ArrowRightOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import pocData from '@/utils/nvidia_poc_list';
import './PocPage.css';

const { Title, Text, Paragraph } = Typography;

const POCpage = () => {
  const router = useRouter();

  const getStatusColor = (status) => {
    const colors = {
      'Active': '#76b900',
      'Completed': '#52c41a',
      'In Progress': '#faad14',
      'Planning': '#1890ff'
    };
    return colors[status] || '#76b900';
  };

  const getCategoryIcon = (category) => {
    const icons = {
      'LLM': <ApiOutlined />,
      'Computer Vision': <ExperimentOutlined />,
      'Speech AI': <ThunderboltOutlined />,
      'Generative AI': <RocketOutlined />
    };
    return icons[category] || <RocketOutlined />;
  };

  // ✅ Updated handle function to support route_to fallback logic
  const handleViewPOC = (poc) => {
    if (poc.route_to) {
      router.push(poc.route_to);
    } else {
      router.push(`/poc/${poc.id}`);
    }
  };

  return (
    <div className="poc-page-container">
      {/* Header */}
      <header className="poc-header">
        <div className="poc-header-content">
          <div className="company-logo">
            <a href='https://www.genaiprotos.com/' target='blank'><img src="/GP_White LOGO.svg" alt="Company Logo" className="logo-image" /></a>
          </div>
          <div className="nvidia-logo">
            <span className="nvidia-text">Powered by</span>
            <img src="/NVIDIA_Logo.png" alt="Company Logo" className="nvidia-image" />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="poc-content">
        {/* Page Header */}
        <div className="page-header">
          <Title className="page-title">
            <ThunderboltOutlined /> NVIDIA AI POC Gallery
          </Title>
          <Paragraph className="page-subtitle">
            Explore our proof-of-concepts powered by NVIDIA GPU acceleration
          </Paragraph>
        </div>

        {/* POC Cards */}
        <Row gutter={[24, 24]} className="poc-cards-row">
          {pocData.map((poc) => (
            <Col xs={24} sm={12} lg={8} key={poc.id}>
              <Card className="poc-card">
                <div className="card-header">
                  <Space direction="vertical" size={4} style={{ flex: 1 }}>
                    <Title level={3} className="poc-title">
                      {getCategoryIcon(poc.category)} {poc.title}
                    </Title>
                    <Tag className="category-tag">{poc.category}</Tag>
                  </Space>
                  <Badge 
                    status="processing" 
                    text={poc.status}
                    className="status-badge"
                    style={{ color: getStatusColor(poc.status) }}
                  />
                </div>

                <Paragraph className="poc-description">
                  {poc.description}
                </Paragraph>

                <div className="models-container">
                  {poc.models.map((model, idx) => (
                    <span key={idx} className="model-chip">
                      {model}
                    </span>
                  ))}
                </div>

                <div className="poc-meta">
                  <div className="meta-item">
                    <UserOutlined />
                    <Text style={{color:"white"}}>{poc.owner}</Text>
                  </div>
                  <div className="meta-item">
                    <ClockCircleOutlined />
                    <Text style={{color:"white"}}>{poc.lastUpdated}</Text>
                  </div>
                </div>

                <Button 
                  className="view-poc-button"
                  size="large"
                  block
                  onClick={() => handleViewPOC(poc)}   
                  icon={<ArrowRightOutlined />}
                  iconPosition="end"
                  disabled={poc.status==="In Progress"}
                >
                  {poc.status==="In Progress" ? "Coming Soon" : "View POC"}
                </Button>
              </Card>
            </Col>
          ))}
        </Row>
      </div>
    </div>
  );
};

export default POCpage;
