const app = require('./api/index');

const port = process.env.PORT;

app.listen(port, () => {
    console.log('app is running on port', port);
});