from django.core.files.base import ContentFile
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from api.models import Property

from concurrent.futures import ThreadPoolExecutor, as_completed
import random
import requests


User = get_user_model()

class Command(BaseCommand):
    help = 'Creates test properties for development'

    def handle(self, *args, **options):
        owner, created = User.objects.get_or_create(
            username='test_owner',
            defaults={
                'role': 'owner',
                'is_active': True
            }
        )
        if created:
            owner.set_password('testpass123')
            owner.save()
            self.stdout.write(self.style.SUCCESS(f'Created owner: test_owner / testpass123'))

        test_properties = [
            {
                'title': 'Уютная 1-комнатная квартира в центре',
                'description': 'Светлая квартира с евроремонтом. Вся необходимая техника. Рядом метро, магазины, парк.',
                'price': 35000,
                'deal': 'rent',
                'property_type': 'apartment',
                'district': 'center',
                'address': 'Казань, улица Баумана, 5',
                'image_url': 'https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Ftse4.mm.bing.net%2Fth%2Fid%2FOIP.1Ehtd6cRsLLtGrkl8PviCQHaE8%3Fpid%3DApi&f=1&ipt=59850e59b9dacddf5a915a6551dd54cee755af28c877052a1f3fd466a0e7bb30&ipo=images'
            },
            {
                'title': 'Просторная 2-комнатная квартира',
                'description': 'Квартира с видом на парк. Два балкона, раздельный санузел, кондиционер.',
                'price': 55000,
                'deal': 'rent',
                'property_type': 'apartment',
                'district': 'north',
                'address': 'Казань, проспект Победы, 100',
                'image_url': 'https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Fremont-f.ru%2Fupload%2Fresize_cache%2Fiblock%2F82f%2Fg1am2xrp9rahk48im902dk90cy2omf2d%2F2400_2000_1c90dcf07c205e9d57687f52ee182d65f%2Fdizayn-interyera-kvartiry-59-kv-m-foto-11-4465.jpg&f=1&nofb=1&ipt=757be14ca2dc671b7ccd20f398ecb58d258ef7245244b4ab3894532f4ae04b94'
            },
            {
                'title': 'Студия с дизайнерским ремонтом',
                'description': 'Современная студия в новом доме. Полностью меблирована. Охраняемая территория.',
                'price': 28000,
                'deal': 'rent',
                'property_type': 'apartment',
                'district': 'south',
                'address': 'Казань, улица Павлюхина, 57',
                'image_url': 'https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Ftse2.mm.bing.net%2Fth%2Fid%2FOIP.zs88eEbxFCiFlfljPWsKzwHaGL%3Fpid%3DApi&f=1&ipt=cb0fc999595af27f7e84db16b6d24daed32ddcc0e0859861fb5d71220542fddf&ipo=images'
            },
            {
                'title': 'Дом 120 м² с участком 6 соток',
                'description': 'Кирпичный дом с гаражом. Баня, беседка, плодовые деревья. Газ, свет, вода круглый год.',
                'price': 8500000,
                'deal': 'buy',
                'property_type': 'house',
                'district': 'north',
                'address': 'Казань, посёлок Залесный, улица Садовая, 12',
                'image_url': 'https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Fi.pinimg.com%2Foriginals%2F4f%2F10%2Fc2%2F4f10c2929d81d4170b17b9d95b9d8a01.jpg&f=1&nofb=1&ipt=1b31115cb5e2fd2a2895d1716bd56596faa4356b827abc1e0143285c4f604c21'
            },
            {
                'title': 'Коттедж 200 м² в элитном поселке',
                'description': 'Двухэтажный коттедж с панорамными окнами. Сауна, камин, тёплые полы, видеонаблюдение.',
                'price': 25000000,
                'deal': 'buy',
                'property_type': 'house',
                'district': 'center',
                'address': 'Казань, посёлок Борисоглебское, улица Лесная, 8',
                'image_url': 'https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Ftse4.mm.bing.net%2Fth%2Fid%2FOIP.qfSWj6Wq5UiguRQbKb9CrQHaE8%3Fpid%3DApi&f=1&ipt=d783e66d3dd3b6e2bee042492ed23555af14fb99a2a9d8bd7ccc1d7ef0e1c74a&ipo=images'
            },
            {
                'title': 'Коммерческое помещение 80 м²',
                'description': 'Помещение свободного назначения. Первая линия, высокий пешеходный трафик, витринные окна.',
                'price': 120000,
                'deal': 'rent',
                'property_type': 'commercial',
                'district': 'center',
                'address': 'Казань, улица Декабристов, 81',
                'image_url': 'https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Ftse1.mm.bing.net%2Fth%2Fid%2FOIP.Pu5_CJ2XQ-0BRHYZfE_jPAHaE8%3Fpid%3DApi&f=1&ipt=ce4fda3cd8398bd8f440d98902721850c4e4dd979fca78a2afc7f9970eb70fdc&ipo=images'
            },
            {
                'title': 'Офис 150 м² в бизнес-центре',
                'description': 'Современный офис с отделкой. Кондиционирование, оптоволокно, охрана, парковка.',
                'price': 180000,
                'deal': 'rent',
                'property_type': 'commercial',
                'district': 'north',
                'address': 'Казань, улица Чистопольская, 20А',
                'image_url': 'https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Ftse1.mm.bing.net%2Fth%2Fid%2FOIP.nJJSs0YOoQfFyMiPr-HgVgHaFk%3Fpid%3DApi&f=1&ipt=e99b8d3394697b4228ba00b8c36f7c917736878ea77b32eb2c01d54047092754&ipo=images'
            },
            {
                'title': '3-комнатная квартира в новостройке',
                'description': 'Просторная квартира с черновой отделкой. Возможна перепланировка. Закрытый двор.',
                'price': 12500000,
                'deal': 'buy',
                'property_type': 'apartment',
                'district': 'south',
                'address': 'Казань, улица Академика Сахарова, 15',
                'image_url': 'https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Ftse4.mm.bing.net%2Fth%2Fid%2FOIP.jdUNZuyiGSOhG-rdarkyqwHaGG%3Fpid%3DApi&f=1&ipt=f3d7d4f2a717bfc5ec735cce2bcd69b4c949c5bc33cdbe07e579efd964932baa&ipo=images'
            },
            {
                'title': 'Таунхаус 150 м² с террасой',
                'description': 'Двухуровневый таунхаус. Индивидуальное отопление, свой вход, парковка на 2 машины.',
                'price': 11000000,
                'deal': 'buy',
                'property_type': 'house',
                'district': 'south',
                'address': 'Казань, улица Минская, 25',
                'image_url': 'https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Ftse1.mm.bing.net%2Fth%2Fid%2FOIP.qJx6OiIEHm_U9xKmQrFgeAHaEK%3Fpid%3DApi&f=1&ipt=fcc5fede7c750532899375719876b6ceee9560621c2aae6ea6c9f2f04f675b7c&ipo=images'
            },
            {
                'title': 'Склад 300 м² с ж/д путями',
                'description': 'Отапливаемый склад. Высота потолков 8м, кран-балка, офисные помещения.',
                'price': 250000,
                'deal': 'rent',
                'property_type': 'commercial',
                'district': 'north',
                'address': 'Казань, улица Аделя Кутуя, 151',
                'image_url': 'https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Ftse4.mm.bing.net%2Fth%2Fid%2FOIP.mZsnDQkxpBcQ_pgrnTZ8iQHaFh%3Fpid%3DApi&f=1&ipt=915350f4458283a42025ae796bb33fe8a4c728d13a5998e377b5ed1a7c236318&ipo=images'
            },
            {
                'title': 'Квартира-студия 25 м²',
                'description': 'Компактная студия со свежим ремонтом. Вся мебель и техника новые. Метро 5 минут.',
                'price': 32000,
                'deal': 'rent',
                'property_type': 'apartment',
                'district': 'center',
                'address': 'Казань, улица Кремлёвская, 15',
                'image_url': 'https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Ftse2.mm.bing.net%2Fth%2Fid%2FOIP.CYfbxDaeYQV4GIajQS8EVgHaFO%3Fpid%3DApi&f=1&ipt=f7e5648dbfe67b73aea7e6dd2c2c10a8a8b6bfb1db3a0d8cf0f1edaa1b817d80&ipo=images'
            },
            {
                'title': 'Дача 60 м²',
                'description': 'Уютный дачный домик. Есть баня, мангальная зона. Участок ухоженный с газоном.',
                'price': 3500000,
                'deal': 'buy',
                'property_type': 'house',
                'district': 'south',
                'address': 'Казань, СНТ Берёзка, улица 3-я Линия, 42',
                'image_url': 'https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Ftse2.mm.bing.net%2Fth%2Fid%2FOIP.r9RuN7n9ZvI6fjCqlrhS1QHaE7%3Fpid%3DApi&f=1&ipt=cad8f4388f92cad82b359e97606a9cd29732e53dbd1f8a6ade2e30b2fb03e0b5&ipo=images'
            },
        ]

        def create_property(prop_data):
            image_url = prop_data.pop('image_url', None)
            address = prop_data.pop('address', '')
            prop_data['status'] = random.choice(['available', 'sold', 'rented'])
            prop_data['owner'] = owner
            
            if address:
                from api.services import geocode_address
                lat, lon = geocode_address(address)
                prop_data['latitude'] = lat
                prop_data['longitude'] = lon
                prop_data['address'] = address
            
            property_obj = Property.objects.create(**prop_data)

            if image_url:
                try:
                    response = requests.get(image_url, timeout=10)
                    if response.status_code == 200:
                        filename = f"property_{property_obj.id}.jpg"
                        property_obj.image.save(filename, ContentFile(response.content), save=True)
                except:
                    pass
            
            return f"✓ {property_obj.title}"

        with ThreadPoolExecutor(max_workers=16) as executor:
            futures = [executor.submit(create_property, prop_data) for prop_data in test_properties]
            for future in as_completed(futures):
                self.stdout.write(future.result())

        self.stdout.write(self.style.SUCCESS(f'Owner credentials: test_owner / testpass123'))