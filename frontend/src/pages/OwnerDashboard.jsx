import { getStoredUser } from "../auth";

function OwnerDashboard() {
    const user = getStoredUser();

    return (
        <section className="page-container">
            <h1>Интерфейс владельца</h1>
            <p>Добро пожаловать, {user?.full_name || user?.email}.</p>
            <ul>
                <li>Добавление и редактирование объектов</li>
                <li>Управление заявками арендаторов/покупателей</li>
                <li>Просмотр статистики по вашим объектам</li>
            </ul>
        </section>
    );
}

export default OwnerDashboard;
