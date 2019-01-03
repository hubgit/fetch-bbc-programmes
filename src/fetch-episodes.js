const { episodes, genres } = require('./api')

genres().then(data => {
  data.categories.filter(category => category.narrower).forEach(category => episodes(category.key))
})
