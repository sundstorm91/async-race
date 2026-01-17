import { EngineApi } from './api/engine-api';
import { GarageApi } from './api/garage-api';
import { WinnersApi } from './api/winners-api';
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

async function testEngineApi() {
  const engineApi = new EngineApi('http://localhost:3000');

  console.log('🧪 Тестируем EngineApi...');

  try {
    // 1. Запуск двигателя
    console.log('\n1. 🔥 Запускаем двигатель машины 1...');
    const engine = await engineApi.startEngine(1);
    console.log('   ✅ Двигатель запущен!');
    console.log('   Скорость:', engine.velocity);
    console.log('   Дистанция:', engine.distance);
    console.log('   Время гонки:', engine.distance / engine.velocity, 'ms');

    // 2. Пробуем проехать
    console.log('\n2. 🚗 Пробуем проехать...');
    const driveResult = await engineApi.drive(1);
    console.log('   Результат drive:', driveResult.success ? 'Успех!' : 'Сломалась!');

    // 3. Останавливаем
    console.log('\n3. 🛑 Останавливаем двигатель...');
    await engineApi.stopEngine(1);
    console.log('   ✅ Двигатель остановлен');

    // 4. Тест сломанной машины (если API поддерживает)
    console.log('\n4. 🔧 Тест сломанной машины...');
    try {
      const brokenResult = await engineApi.drive(999); // несуществующая машина
      console.log('   Результат:', brokenResult.success ? 'Успех' : 'Сломалась');
    } catch (error) {
      console.log('   ❌ Ошибка (не 500):', error);
    }

    console.log('\n🎉 EngineApi работает корректно!');

  } catch (error) {
    console.error('❌ Ошибка EngineApi:', error);
  }
}

async function testWinnersApi() {
  const api = new WinnersApi('http://localhost:3000');

  // 1. Сортировка по победам
  const byWins = await api.getWinners(1, 5, 'wins', 'DESC');
  console.log('Победители по победам:', byWins.winners);

  // 2. Сортировка по времени
  const byTime = await api.getWinners(1, 5, 'time', 'ASC');
  console.log('Победители по времени:', byTime.winners);

  // 3. Пагинация
  const page2 = await api.getWinners(2, 3);
  console.log('Страница 2:', page2.winners.length);
}

/* testEngineApi() */

/* main(); */

testWinnersApi();
