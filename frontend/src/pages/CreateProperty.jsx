import { Form, Input, InputNumber, Select, Button } from "antd";
import axios from "axios";

export default function CreateProperty() {
  const [form] = Form.useForm();

  const onFinish = async (values) => {
    try {
      await axios.post("http://localhost:8000/api/properties/", values, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access")}`,
        },
      });
      alert("Объект создан");
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="max-w-xl mx-auto p-4">
      <h1 className="text-xl font-bold mb-4">Создать недвижимость</h1>

      <Form form={form} layout="vertical" onFinish={onFinish}>
        <Form.Item name="title" label="Название" rules={[{ required: true }]}>
          <Input />
        </Form.Item>

        <Form.Item name="price" label="Цена" rules={[{ required: true }]}>
          <InputNumber className="w-full" />
        </Form.Item>

        <Form.Item name="deal" label="Тип сделки">
          <Select>
            <Select.Option value="rent">Аренда</Select.Option>
            <Select.Option value="buy">Продажа</Select.Option>
          </Select>
        </Form.Item>

        <Form.Item name="property_type" label="Тип недвижимости">
          <Select>
            <Select.Option value="apartment">Квартира</Select.Option>
            <Select.Option value="house">Дом</Select.Option>
          </Select>
        </Form.Item>

        <Form.Item name="district" label="Район">
          <Input />
        </Form.Item>

        <Form.Item name="image" label="URL изображения">
          <Input />
        </Form.Item>

        <Button type="primary" htmlType="submit">
          Создать
        </Button>
      </Form>
    </div>
  );
}