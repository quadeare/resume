const gulp = require('gulp')
const path = require('path')
const fs = require('fs')
const matter = require('gray-matter')
const yaml = require('js-yaml')
const MarkdownIt = require('markdown-it')
const markdownItAttrs = require('markdown-it-attrs')
const nib = require('nib')
const $ = require('gulp-load-plugins')()
const browserSync = require('browser-sync').create()

const isProd = process.env.NODE_ENV === 'production'

const md = new MarkdownIt({
  html: true,
  breaks: true,
  typographer: true
})
md.use(markdownItAttrs)

const paths = {
  root: path.join(__dirname, '../'),
  src: path.join(__dirname, '../src/'),
  scripts: 'src/scripts/*.js',
  print_styles: 'src/styles/print.styl',
  styles: 'src/styles/main.css',
  assets: path.join(__dirname, '../src/assets'),
}

gulp.task('fonts', () => {
  return gulp.src([
      'node_modules/font-awesome/fonts/fontawesome-webfont.*'])
    .pipe(gulp.dest('dist/fonts/'))
    .pipe($.size())
})

gulp.task('scripts', () => {
  return gulp.src([
    paths.scripts,
      'node_modules/jquery/dist/jquery.min.js',
      'node_modules/velocity-animate/velocity.js',
      'node_modules/bootstrap/dist/js/bootstrap.min.js'
    ])
    .pipe($.uglify())
    .pipe($.concat({ path: 'scripts.js', stat: { mode: 0666} }))
    .pipe(gulp.dest('dist/assets/'))
    .pipe($.size())
})

gulp.task('styles', () => {
  return gulp.src([
      'node_modules/font-awesome/css/font-awesome.min.css',
      'node_modules/bootstrap/dist/css/bootstrap.min.css',
      paths.styles
    ])
    .pipe($.stylus({ use: nib(), compress: true, import: ['nib']}))
    .pipe($.autoprefixer({
			browsers: ['last 2 versions'],
			cascade: false
		}))
    .pipe($.concat({ path: 'styles.css', stat: { mode: 0666} }))
    .pipe(gulp.dest('dist/assets/'))
    .pipe($.size())
})

gulp.task('styles-print', () => {
  return gulp.src([
      'node_modules/font-awesome/css/font-awesome.min.css',
      paths.print_styles
    ])
    .pipe($.stylus({ use: nib(), compress: true, import: ['nib']}))
    .pipe($.autoprefixer({
			browsers: ['last 2 versions'],
			cascade: false
		}))
    .pipe($.concat({ path: 'styles-print.css', stat: { mode: 0666} }))
    .pipe(gulp.dest('dist/assets/'))
    .pipe($.size())
})

gulp.task('html', () => {
  const MarkdownType = new yaml.Type('tag:yaml.org,2002:md', {
    kind: 'scalar',
    construct: function (text) {
      return md.render(text)
    },
  })
  const YAML_SCHEMA = yaml.Schema.create([ MarkdownType ])
  const context = matter(fs.readFileSync('data.yaml', 'utf8'), {schema: YAML_SCHEMA }).data
  return gulp.src(['template/index.html', 'template/print.html'])
    .pipe($.nunjucks.compile(context))
    .pipe($.htmlmin({collapseWhitespace: true}))
    .pipe(gulp.dest('dist'))
    .pipe($.size())
})

gulp.task('default', gulp.series('scripts', 'styles', 'styles-print', 'fonts','html'), () => {
  if (isProd) return
  browserSync.init({
    server: "./dist"
  })
  gulp.watch(paths.scripts, ['scripts'])
  gulp.watch(paths.styles, ['styles'])
  gulp.watch(paths.print_styles, ['styles-print'])
  gulp.watch(['template/*.html', 'data.yaml'], ['html'])
  gulp.watch(["dist/*.html", "dist/assets/*.*"]).on('change', browserSync.reload)
})
