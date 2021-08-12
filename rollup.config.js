export default {
  input: './build/carouselController.js',
  output: {
    file: './dist/el-carousel.js',
    format: 'iife',
    name: 'CarouselController',
  },
  external: ['tslib'],
}
