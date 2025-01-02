module.exports = (app, context) => {
    app.use('/', (req, res) => res.send('Health Check OK'));
}
