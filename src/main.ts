import { GarageApi } from './api/garage-api';
import './style.css'

async function main() {
  const api = new GarageApi('http://localhost:3000');

  console.log('🧪 Тестируем полную пагинацию с заголовками...');

  try {
    // 1. Первая страница
    const page1 = await api.getCars(1, 2);
    console.log('✅ Страница 1:');
    console.log('   Машин:', page1.cars.length);
    console.log('   Всего (из заголовка):', page1.total);
    console.log('   Машины:', page1.cars.map(c => `${c.name} (ID: ${c.id})`));

    // 2. Вторая страница
    const page2 = await api.getCars(2, 2);
    console.log('\n✅ Страница 2:');
    console.log('   Машин:', page2.cars.length);
    console.log('   Всего (из заголовка):', page2.total);
    console.log('   Машины:', page2.cars.map(c => `${c.name} (ID: ${c.id})`));

    // 3. Проверка консистентности
    if (page1.total === page2.total) {
      console.log('\n🎉 УРА! Пагинация работает с заголовками X-Total-Count!');
      console.log(`Всего машин в гараже: ${page1.total}`);
    } else {
      console.log('\n❌ Ошибка: total разный на разных страницах');
    }

  } catch (error) {
    console.error('❌ Ошибка:', error);
  }
}

main();
