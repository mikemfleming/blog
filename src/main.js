import './styles.css';

const canvas = document.querySelector('canvas');
if (canvas) {
  const palette = Array.from({ length: 3 }, () => `hsl(${Math.random() * 360} 55% 78%)`);
  const draw = () => {
    const { innerWidth: width, innerHeight: height } = window;
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d');
    const size = Math.max(1, width / 40);
    for (let x = 0; x < width; x += size) for (let y = 0; y < height; y += size) {
      context.fillStyle = palette[Math.floor(Math.random() * palette.length)];
      context.fillRect(x, y, Math.ceil(size), Math.ceil(size));
    }
  };
  draw();
  window.addEventListener('resize', draw);
}

// Preserve previously shared hash links while using real paths for new links.
if (window.location.hash.startsWith('#/')) {
  const route = window.location.hash.slice(2).replace(/\/$/, '');
  const base = document.querySelector('meta[name="site-base"]').content;
  window.location.replace(`${base}${route}${route ? '/' : ''}`);
}
