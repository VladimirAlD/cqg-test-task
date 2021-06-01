function getRandomColor(pre) {
  let letters = '0123456789ABCDEF'.split('');
  let color = pre;
  for (let i = 0; i < 6; i++) {
    color += letters[Math.round(Math.random() * 15)];
  }
  return color;
}

export {getRandomColor};