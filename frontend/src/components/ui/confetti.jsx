import confetti from 'canvas-confetti';

// Анимация для нового места
export const triggerNewPlaceConfetti = () => {
  const duration = 1000; // Увеличиваем продолжительность для замедления
  const end = Date.now() + duration;
  const colors = ['#26ccff', '#a25afd', '#ff5e7e', '#88ff5a', '#fcff42', '#ffa62d', '#ff36ff'];

  const frame = () => {
    confetti({
      particleCount: 2, // Уменьшаем количество партиклов
      angle: 60,
      spread: 50, // Уменьшаем разброс
      origin: { x: 0 },
      colors: colors,
      zIndex: 9999,
      gravity: 0.5, // Уменьшаем гравитацию для замедления падения
      drift: 0,
      ticks: 200
    });
    confetti({
      particleCount: 2, // Уменьшаем количество партиклов
      angle: 120,
      spread: 50, // Уменьшаем разброс
      origin: { x: 1 },
      colors: colors,
      zIndex: 9999,
      gravity: 0.5, // Уменьшаем гравитацию для замедления падения
      drift: 0,
      ticks: 200
    });

    if (Date.now() < end) {
      requestAnimationFrame(frame);
    }
  };

  frame();
};

// Анимация для редактирования места
export function triggerEditPlaceConfetti() {
  console.log('Запускаем анимацию конфетти для редактирования места');
  
  function randomInRange(min, max) {
    return Math.random() * (max - min) + min;
  }

  confetti({
    angle: randomInRange(55, 125),
    spread: randomInRange(50, 70),
    particleCount: randomInRange(50, 100),
    origin: { y: 0.6 }
  });
} 