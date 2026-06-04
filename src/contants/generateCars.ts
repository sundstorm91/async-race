const brands = ['Tesla', 'Ford', 'BMW', 'Audi', 'Porsche', 'Lamborghini', 'Ferrari', 'Mercedes', 'Toyota', 'Nissan'];
const models = ['Model S', 'Mustang', 'M3', 'R8', '911', 'Aventador', '488', 'AMG', 'Supra', 'GTR'];
const colors = ['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF', '#FFA500', '#800080', '#008000', '#000080'];

const getRandomCar = () => ({
  name: `${brands[Math.floor(Math.random() * brands.length)]} ${models[Math.floor(Math.random() * models.length)]}`,
  color: colors[Math.floor(Math.random() * colors.length)]
});

// Массив из 100
export const generateCars = Array.from({ length: 100 }, getRandomCar);