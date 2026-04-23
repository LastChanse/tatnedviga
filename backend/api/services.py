import requests
from django.conf import settings

def geocode_address(address):
    """Получает координаты по адресу через Яндекс.Геокодер"""
    if not address:
        return None, None
    
    url = "https://geocode-maps.yandex.ru/1.x/"
    params = {
        'apikey': settings.YANDEX_API_KEY,
        'geocode': address,
        'format': 'json',
        'results': 1
    }
    
    try:
        response = requests.get(url, params=params, timeout=5)
        data = response.json()
        
        geo_objects = data.get('response', {}).get('GeoObjectCollection', {}).get('featureMember', [])
        if geo_objects:
            pos = geo_objects[0]['GeoObject']['Point']['pos']
            lon, lat = map(float, pos.split())
            return lat, lon
    except Exception as e:
        print(f"Geocoding error: {e}")
    
    return None, None