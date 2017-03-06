var express = require('express');
var router = express.Router();

/* POST chat page. */
router.post('/', function(req, res) {
	console.log(req.body.username);
	res.render('chat', {
		title : 'Chat App',
		username : req.body.username
	});
});

module.exports = router;