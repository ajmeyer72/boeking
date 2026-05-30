const bcrypt = require('bcryptjs')
const password = '@ndr3wM3y3r#1B03k1ng'
const hash = bcrypt.hashSync(password, 12)
console.log('Hash:', hash)