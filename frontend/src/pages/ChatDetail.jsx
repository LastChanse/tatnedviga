import { useEffect, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { Button, Input, Spin, message } from 'antd';
import { SendOutlined } from '@ant-design/icons';
import { chatService } from '../services/chatService';

const formatMessageTime = (value) => {
  const date = new Date(value);
  const now = new Date();
  const today = now.toDateString() === date.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday = yesterday.toDateString() === date.toDateString();
  const time = date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });

  if (today) return time;
  if (isYesterday) return `вчера, ${time}`;
  return `${date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' })}, ${time}`;
};

const formatMessageDate = (value) => {
  const date = new Date(value);
  const now = new Date();
  if (now.toDateString() === date.toDateString()) return 'Сегодня';
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (yesterday.toDateString() === date.toDateString()) return 'Вчера';
  return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
};

export default function ChatDetail() {
  const { id } = useParams();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const isAuthed = Boolean(localStorage.getItem('access'));

  const loadMessages = async () => {
    try {
      setLoading(true);
      const data = await chatService.getMessages(id);
      setMessages(data);
    } catch (error) {
      console.error(error);
      message.error('Не удалось загрузить сообщения');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthed && id) loadMessages();
  }, [id, isAuthed]);

  const send = async () => {
    const value = text.trim();
    if (!value) return;

    try {
      setSending(true);
      const created = await chatService.sendMessage(id, value);
      setMessages((items) => [...items, created]);
      setText('');
    } catch (error) {
      console.error(error);
      message.error('Не удалось отправить сообщение');
    } finally {
      setSending(false);
    }
  };

  if (!isAuthed) return <Navigate to="/login" />;

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <header className="sticky top-0 z-20 border-b border-gray-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-3 px-4 py-3">
          <Link to="/chats" className="rounded-xl px-3 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-100">
            ← К сообщениям
          </Link>
          <Link to="/" className="font-extrabold tracking-tight text-gray-900">Недвижимость</Link>
        </div>
      </header>

      <main className="mx-auto flex min-h-[calc(100vh-64px)] max-w-4xl flex-col px-4 py-6">
        <div className="mb-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <h1 className="text-xl font-extrabold text-gray-900">Диалог</h1>
          <p className="mt-1 text-sm text-gray-600">Сообщения между клиентом и собственником по объекту.</p>
        </div>

        <div className="flex-1 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          {loading ? (
            <div className="grid h-64 place-items-center"><Spin /></div>
          ) : messages.length === 0 ? (
            <div className="grid h-64 place-items-center text-sm text-gray-500">Сообщений пока нет</div>
          ) : (
            <div className="space-y-3">
              {messages.map((msg, index) => {
                const previous = messages[index - 1];
                const showDate = !previous || new Date(previous.created_at).toDateString() !== new Date(msg.created_at).toDateString();

                return (
                  <div key={msg.id}>
                    {showDate && (
                      <div className="my-4 flex justify-center">
                        <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-bold text-gray-500">
                          {formatMessageDate(msg.created_at)}
                        </span>
                      </div>
                    )}
                    <div className={msg.is_mine ? 'flex justify-end' : 'flex justify-start'}>
                      <div className={msg.is_mine ? 'max-w-[75%] rounded-2xl bg-gray-900 px-4 py-2 text-white shadow-sm' : 'max-w-[75%] rounded-2xl bg-gray-100 px-4 py-2 text-gray-900 shadow-sm'}>
                        <div className={msg.is_mine ? 'mb-1 text-xs font-bold text-gray-300' : 'mb-1 text-xs font-bold text-gray-500'}>{msg.sender_name}</div>
                        <div className="whitespace-pre-wrap text-sm leading-relaxed">{msg.text}</div>
                        <div className={msg.is_mine ? 'mt-1 text-right text-[11px] font-medium text-gray-300' : 'mt-1 text-right text-[11px] font-medium text-gray-500'}>
                          {formatMessageTime(msg.created_at)}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="mt-4 rounded-2xl border border-gray-200 bg-white p-3 shadow-sm">
          <div className="flex gap-2">
            <Input.TextArea
              value={text}
              onChange={(event) => setText(event.target.value)}
              placeholder="Напишите сообщение..."
              autoSize={{ minRows: 1, maxRows: 4 }}
              onPressEnter={(event) => {
                if (!event.shiftKey) {
                  event.preventDefault();
                  send();
                }
              }}
            />
            <Button type="primary" icon={<SendOutlined />} loading={sending} onClick={send}>
              Отправить
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
