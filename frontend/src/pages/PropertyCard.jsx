import { Card, Tag, Typography } from 'antd';
import { EnvironmentOutlined, UserOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';

const { Meta } = Card;
const { Text } = Typography;

const PropertyCard = ({ property }) => {
  const formatPrice = (price) => {
    return new Intl.NumberFormat('ru-RU').format(price) + ' ₽';
  };

  const getDealType = (deal) => {
    return deal === 'rent' ? 'Аренда' : 'Продажа';
  };

  const getPropertyType = (type) => {
    const types = {
      'apartment': 'Квартира',
      'house': 'Дом',
      'commercial': 'Коммерческая'
    };
    return types[type] || type;
  };

  return (
    <Link to={`/property/${property.id}`}>
      <Card
        hoverable
        cover={
          <img
            alt={property.title}
            src={property.image || 'https://via.placeholder.com/300x200?text=Нет+фото'}
            style={{ height: 200, objectFit: 'cover' }}
          />
        }
      >
        <Meta
          title={property.title}
          description={
            <>
              <Text strong style={{ fontSize: 18, color: '#1890ff' }}>
                {formatPrice(property.price)}
              </Text>
              <br />
              <Tag color={property.deal === 'rent' ? 'green' : 'blue'}>
                {getDealType(property.deal)}
              </Tag>
              <Tag>{getPropertyType(property.property_type)}</Tag>
              <br />
              <Text type="secondary">
                <EnvironmentOutlined /> {property.district}
              </Text>
            </>
          }
        />
      </Card>
    </Link>
  );
};

export default PropertyCard;