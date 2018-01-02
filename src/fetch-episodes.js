const { episodes, formats } = require('./api')

formats().then(data => {
  data.categories.forEach(category => episodes(category.key))
})
