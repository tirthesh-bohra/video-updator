module.exports = (app, config) => {
    app.use('/', (req, res) => res.send('Health Check OK'));
}
