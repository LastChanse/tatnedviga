import requests
from django.conf import settings
import logging

logger = logging.getLogger(__name__)


def geocode_address(address):
    if not address:
        logger.warning(f"Пустой адрес")
        return None, None

    api_key = settings.YANDEX_API_KEY
    logger.info(f"Использую ключ: {api_key[:8]}...")

    # ВАЖНО: Используйте /v1 версию API
    url = "https://geocode-maps.yandex.ru/v1/"
    params = {
        'apikey': api_key,
        'geocode': address,
        'format': 'json',
        'results': 1
    }
    headers = {
        'Referer': 'http://localhost:8000'
    }
    
    try:
        response = requests.get(url, params=params, headers=headers, timeout=5)
        data = response.json()

        # Проверяем наличие ошибки в ответе
        if 'error' in data:
            logger.error(f"Ошибка в ответе API: {data['error']}")
            return None, None

        geo_objects = data.get('response', {}).get('GeoObjectCollection', {}).get('featureMember', [])
        if geo_objects:
            pos = geo_objects[0]['GeoObject']['Point']['pos']
            lon, lat = map(float, pos.split())
            logger.info(f"Успех: {address} -> {lat}, {lon}")
            return lat, lon
        else:
            logger.warning(f"Адрес не найден: {address}")

    except Exception as e:
        logger.error(f"Geocoding error: {e}")

    return None, None